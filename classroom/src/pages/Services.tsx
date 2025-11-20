import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PenLine from "../assets/icons/pen-line.svg";
import BanIcon from "../assets/icons/ban.svg";
import BanIconHover from "../assets/icons/ban-hover.svg";
import Plus from "../assets/icons/plus.svg";
import CheckIcon from "../assets/icons/circle-check.svg";
import CheckIconHover from "../assets/icons/circle-check-hover.svg";
import BigCheckIcon from "../assets/icons/circle-check-big.svg";
import BanRed from "../assets/icons/ban-red.svg";
import CloseDefault from "../assets/icons/x-default.svg";
import CloseHover from "../assets/icons/icons-hover/x-hover.svg";
import TrashRed from "../assets/icons/trash.svg";


export function Services() {
  const API_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  const [calleds, setCalleds] = useState<any[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [userType] = useState(localStorage.getItem("userType") || "");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  // Para criar novo serviço
  const [desc, setDesc] = useState("");
  const [value, setValue] = useState("");

  // Para editar serviço
  const [editDesc, setEditDesc] = useState("");
  const [editValue, setEditValue] = useState("");
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editServiceModalOpen, setEditServiceModalOpen] = useState(false);

  const [hoverClose, setHoverClose] = useState(false);


  // useEffect para carregar a lista de serviços
  useEffect(() => {
    async function loadCalleds() {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Você precisa estar logado!");
        navigate("/login"); // Adicionando navegação para login se não houver token
        return;
      }

      try {
        const url = `${API_URL}/services`;

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Erro ao buscar serviços");
        }

        const data = await response.json();
        setCalleds(data ?? []);
      } catch (err: any) {
        alert(err.message);
        console.error(err);
      }
    }

    loadCalleds();
  }, [userType, navigate]);


  async function changeStatus(id: string | number, newStatus: boolean) {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Você precisa estar logado!");

      const idStr = String(id);
      let url = "";
      let method: "DELETE" | "PATCH" = "DELETE";

      if (newStatus === false) {
        // DESATIVAR
        url = `${API_URL}/services/${idStr}`;
        method = "DELETE";
      } else {
        // REATIVAR
        url = `${API_URL}/services/${idStr}/reactivate`;
        method = "PATCH";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // tenta ler mensagem do backend se houver
        let errMsg = "Erro ao atualizar status";
        try {
          const errData = await response.json();
          if (errData?.message) errMsg = errData.message;
        } catch (e) { }
        throw new Error(errMsg);
      }

      // Se o backend retornar o serviço atualizado com `active`, usa ele.
      // Se não, faz apenas um toggle local com base no newStatus.
      let updatedActive: boolean | null = null;
      try {
        const json = await response.json();
        if (typeof json?.active === "boolean") updatedActive = json.active;
      } catch (e) {
        updatedActive = null;
      }

      setCalleds(prev =>
        prev.map(item =>
          String(item.id) === idStr
            ? { ...item, active: updatedActive === null ? newStatus : updatedActive }
            : item
        )
      );
    } catch (err: any) {
      alert(err.message || "Erro desconhecido");
      console.error(err);
    }
  }

  async function createService() {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Você precisa estar logado!");

      // Corpo da requisição: descrição, valor etc.
      const body = {
        title: desc,
        price: Number(value),
        isDefault: true
      };

      const response = await fetch(`${API_URL}/services/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao adicionar serviço");
      }
      
      const newService = await response.json();

      // Atualiza a lista com o novo serviço
      setCalleds(prev => [...prev, newService]);

      // Fecha o modal e limpa inputs
      setServiceModalOpen(false);
      setDesc("");
      setValue("");

    } catch (err: any) {
      alert(err.message);
      console.error(err);
    }
  }

  // FUNÇÃO CORRIGIDA: Deleta serviço do backend e do estado local
  async function deleteService(id: string) {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Você precisa estar logado!");
      
      const response = await fetch(`${API_URL}/services/${id}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errMsg = "Erro ao deletar serviço";
        try {
          const errData = await response.json();
          if (errData?.message) errMsg = errData.message;
        } catch (e) { }
        throw new Error(errMsg);
      }
      
      // Se a exclusão no backend for bem-sucedida, remove do estado local
      setCalleds(prev => prev.filter(service => service.id !== id));
      
    } catch (err: any) {
      alert(err.message || "Erro desconhecido ao deletar o serviço.");
      console.error(err);
    }
  }

  function openEditModal(service: any) {
    setEditingServiceId(service.id);
    setEditDesc(service.title);
    setEditValue(service.price.toString());
    setEditServiceModalOpen(true);
  }


  async function saveEditService() {
    if (!editingServiceId) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Você precisa estar logado!");

      const body = {
        title: editDesc,
        price: Number(editValue),
      };



      const response = await fetch(`${API_URL}/services/${editingServiceId}`, {
        method: "PATCH", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao editar serviço");
      }
      
      const updatedService = await response.json();

      // Atualiza a lista local com os dados atualizados
      setCalleds(prev => prev.map(s => s.id === editingServiceId ? { ...s, ...updatedService } : s));

      setEditServiceModalOpen(false);
      setEditingServiceId(null);
      setEditDesc("");
      setEditValue("");
    } catch (err: any) {
      alert(err.message);
      console.error(err);
    }
  }


  if (userType !== "admin") {
    return (
      <div className="mt-7 sm:mt-13 ml-6 lg:ml-12">
        <h1 className="text-blue-dark text-xl font-bold mb-6">
          Área exclusiva para admins
        </h1>
        <p className="text-gray-300">Apenas admins.</p>
        {
          userType === "client" ?
            <a onClick={() => navigate("/calleds")} className="inline-flex items-center justify-center w-20 h-7 text-gray-200 bg-gray-500 rounded-sm hover:text-gray-100 hover:bg-gray-400 cursor-pointer">Outros</a>
            :
            <a onClick={() => navigate("/calleds_technicians")} className="inline-flex items-center justify-center w-20 h-7 text-gray-200 bg-gray-500 rounded-sm hover:text-gray-100 hover:bg-gray-400 cursor-pointer">Outros</a>
        }
      </div>
    );
  } else {
    return (
      <div>
        <div className="flex justify-between  mb-6 ml-6 mr-6 lg:ml-12 lg:mr-12">
          <h1 className="text-blue-dark text-xl font-bold">
            Serviços
          </h1>
          <a
            onClick={() => {
              setServiceModalOpen(true);   // abre o novo modal
            }}
            className="inline-flex items-center justify-center px-2 h-7 text-gray-600 bg-gray-200 hover:bg-gray-100 cursor-pointer rounded-sm gap-1"
          >
            <img src={Plus} className="w-3.5 h-3.5" />
            <span>Novo</span>
          </a>
        </div>
        <ul className="max-w-full border border-gray-500 rounded-[10px] pt-3 pb-0 ml-6 lg:ml-12 mr-6 lg:mr-12">




          {/* Cabeçalho */}
          <li className="w-full grid grid-cols-6 gap-2 border-b border-gray-500 py-2 px-3 items-center">


            <span className="text-gray-400">Título</span>
            <span className="text-gray-400">Valor</span>
            <span className="text-gray-400">Status</span>
            {/* Coluna de ação (ativar/desativar) */}
            <span className="text-gray-400 text-center hidden sm:block">Ação</span>

            {/* Coluna de editar */}
            <span className="text-gray-400 text-center hidden sm:block">Editar</span>
            {/* Coluna de excluir */}
            <span className="text-gray-400 text-center hidden sm:block">Excluir</span>
          </li>

          {/* Linhas de chamados */}
          {calleds.length > 0 ? (
            calleds.map((c) => {
              // console.log(c)
              return (
                <li key={c.id} className="w-full grid grid-cols-6 gap-2 border-b border-gray-500 py-2 px-3 items-center">



                  {/* Título e serviços */}
                  <div className="max-w-[120px] md:max-w-none col-span-1">
                    <span className="font-bold truncate md:whitespace-normal md:truncate-none overflow-hidden whitespace-nowrap block">
                      {c.title}
                    </span>
                  </div>


                  {/* Valor */}
                  <span className="truncate md:whitespace-normal md:truncate-none overflow-hidden whitespace-nowrap block col-span-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.price)}
                  </span>


                  {/* Status */}
                  <div className="
  inline-flex text-xs rounded-full w-6 h-6 ml-4 md:ml-0 sm:w-auto sm:h-auto col-span-1
">
                    <div
                      className={`sm:hidden inline-flex items-center justify-center rounded-full h-6 w-6
    ${c.active ? "bg-feedback-done/20" : "bg-feedback-danger/20"}`}
                    >
                      <img
                        className="h-3 w-3 object-cover"
                        src={c.active ? BigCheckIcon : BanRed}
                        alt="ícone"
                      />
                    </div>
                    <span className={`hidden sm:inline-flex items-center justify-center text-xs ${c.active === true ? "text-feedback-done bg-feedback-done/20" : "text-feedback-danger bg-feedback-danger/20"} rounded-full px-3 py-[5.5px] w-auto h-auto `}>{c.active === true ? "Ativo" : "Inativo"}</span>
                  </div>

                  {/* Botão de mudar active */}
                  {c.active === true ? (
                    <div
                      onMouseEnter={() => setHoveredId(c.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => changeStatus(c.id, false)}
                      className="group min-w-6 inline-flex items-center justify-center text-xs rounded-full w-6 h-6 sm:w-auto sm:h-auto sm:px-2 sm:py-1 sm:gap-1 cursor-pointer col-span-1"
                    >
                      <img
                        className="rounded-full object-cover h-3 w-3"
                        src={hoveredId === c.id ? BanIconHover : BanIcon}
                        alt="ícone"
                      />
                      <span className="hidden sm:block text-gray-300 group-hover:text-gray-100">
                        Desativar
                      </span>
                    </div>


                  ) : (
                    <div
                      onMouseEnter={() => setHoveredId(c.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => changeStatus(c.id, true)}
                      className="group min-w-6 inline-flex items-center justify-center text-xs rounded-full 
             w-6 h-6 sm:w-auto sm:h-auto sm:px-2 sm:py-1 sm:gap-1 cursor-pointer col-span-1"
                    >
                      <img
                        className="rounded-full object-cover h-3 w-3"
                        src={hoveredId === c.id ? CheckIconHover : CheckIcon}
                        alt="ícone"
                      />
                      <span className="hidden sm:block text-gray-300 group-hover:text-gray-100">
                        Reativar
                      </span>
                    </div>

                  )}




                  {/* Botão editar */}
                  <div className="flex justify-center col-span-1">
                    <a
                      onClick={() => openEditModal(c)}
                      className="inline-flex items-center justify-center w-7 h-7 bg-gray-500 hover:bg-gray-400 cursor-pointer rounded-sm"
                    >
                      <img src={PenLine} alt="pen" className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Botão excluir */}
                  <div className="flex justify-center col-span-1">
                    <a
                      onClick={() => deleteService(c.id)}
                      className="inline-flex items-center justify-center w-7 h-7 bg-gray-500 hover:bg-gray-400 cursor-pointer rounded-sm"
                    >
                      <img src={TrashRed} alt="trash" className="w-3.5 h-3.5" />
                    </a>
                  </div>


                </li>
              );
            })
          ) : (
            <li className="text-gray-400 italic text-center py-4 border-b border-gray-600">
              Nenhum serviço encontrado.
            </li>
          )}

          {serviceModalOpen && (
            <div className="fixed inset-0 bg-modal/50 bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-gray-600 w-[90%] max-w-[440px] shadow-xl rounded-[10px] overflow-hidden">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between border-b border-gray-500 px-7 py-5">
                  <span className="text-md text-gray-200 font-semibold">Cadastro de serviço</span>
                  <button
                    onClick={() => setServiceModalOpen(false)}
                    onMouseEnter={() => setHoverClose(true)}
                    onMouseLeave={() => setHoverClose(false)}
                    className="w-6 h-6 rounded-[5px] hover:bg-gray-500 flex items-center justify-center"
                  >
                    <img
                      src={hoverClose ? CloseHover : CloseDefault}
                      className="w-4.5 h-4.5"
                      alt="Fechar"
                    />
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="px-7 py-8 flex flex-col gap-5 border-b border-gray-500">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="id_desc" className="text-xxs text-gray-300 uppercase">Descrição</label>
                    <input
                      type="text"
                      id="id_desc"
                      placeholder="Nome do serviço"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full py-2 rounded border-b border-b-gray-500 text-gray-200 focus:border-b-blue-dark focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300">R$</span>
                    <input
                      type="text"
                      id="id_price"
                      placeholder="0,00"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full pl-7 px-3 py-2 rounded border-b border-b-gray-500 text-gray-200 focus:border-b-blue-dark focus:outline-none"
                    />
                  </div>


                  {/* Botão Salvar */}
                  <button
                    onClick={createService}
                    className="w-full py-3 rounded-[5px] bg-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center mt-6"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}

          {editServiceModalOpen && (
            <div className="fixed inset-0 bg-modal/50 bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-gray-600 w-[90%] max-w-[440px] shadow-xl rounded-[10px] overflow-hidden">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between border-b border-gray-500 px-7 py-5">
                  <span className="text-md text-gray-200 font-semibold">Editar serviço</span>
                  <button
                    onClick={() => setEditServiceModalOpen(false)}
                    onMouseEnter={() => setHoverClose(true)}
                    onMouseLeave={() => setHoverClose(false)}
                    className="w-6 h-6 rounded-[5px] hover:bg-gray-500 flex items-center justify-center"
                  >
                    <img
                      src={hoverClose ? CloseHover : CloseDefault}
                      className="w-4.5 h-4.5"
                      alt="Fechar"
                    />
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="px-7 py-8 flex flex-col gap-5 border-b border-gray-500">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="edit_desc" className="text-xxs text-gray-300 uppercase">Descrição</label>
                    <input
                      type="text"
                      id="edit_desc"
                      placeholder="Nome do serviço"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded border-b border-b-gray-500 text-gray-200 focus:border-b-blue-dark focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">R$</span>
                    <input
                      type="text"
                      id="edit_price"
                      placeholder="0,00"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full pl-10 px-3 py-2 rounded border-b border-b-gray-500 text-gray-200 focus:border-b-blue-dark focus:outline-none"
                    />
                  </div>

                  {/* Botão Salvar */}
                  <button
                    onClick={saveEditService}
                    className="w-full py-3 rounded-[5px] bg-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center mt-6"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )
          }

        </ul >
      </div >

    )
  }
}