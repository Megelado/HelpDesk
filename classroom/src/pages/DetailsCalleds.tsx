import { useEffect, useState } from "react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";

import ArrowRight from "../assets/icons/arrow-left-gray.svg";
import ArrowHover from "../assets/icons/arrow-left-hover.svg";
import ClockIcon from "../assets/icons/clock-2.svg"
import Clock from "../assets/icons/clock-2-gray-200.svg"
import ClockHover from "../assets/icons/clock-2-gray-100.svg"
import CircleHelpIcon from "../assets/icons/circle-help.svg"
import BigCheckIcon from "../assets/icons/circle-check-big.svg"
import BigCheck from "../assets/icons/circle-check-big-gray-200.svg"
import BigCheckHover from "../assets/icons/circle-check-big-gray-100.svg"
import Plus from "../assets/icons/plus.svg"
import Trash from "../assets/icons/trash.svg"
import CloseDefault from "../assets/icons/x-default.svg";
import CloseHover from "../assets/icons/icons-hover/x-hover.svg";

interface Called {
  id: string;
  status: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
  client?: {
    name: string;
    photoUrl: string;
  };
  technician?: {
    name: string;
    photoUrl: string;
    email: string;
  }
  services?: {
    id: string;
    title: string;
    price: number;
    isDefault: boolean;
  }[];
}




export function DetailsCalleds() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [called, setCalled] = useState<Called | null>(null);

  const [userType] = useState(localStorage.getItem("userType") || "");
  const [isHovered, setIsHovered] = useState(false);
  const [additionalServiceModalOpen, setAdditionalServiceModalOpen] = useState(false)
  const [hoverClose, setHoverClose] = useState(false);
  const [desc, setDesc] = useState("");
  const [value, setValue] = useState("");

  const { id } = useParams();

  const location = useLocation();
  const displayId = location.state?.displayId;

  console.log("ID VISUAL RECEBIDO:", displayId);

  useEffect(() => {
    async function loadCalleds() {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Você precisa estar logado!");
        return;
      }

      try {
        let url = `${API_URL}/calleds/details/${id}`;

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Erro ao buscar chamados");
        }

        const data = await response.json();
        setCalled(data);
      } catch (err: any) {
        alert(err.message);
      }
    }

    loadCalleds();
  }, [id, userType]);

  useEffect(() => {
    if (called) {
      console.log("DADOS DO CHAMADO:", called);
    }
  }, [called]);

  function formatStatus(status: string) {
    return status
      .split("_")
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();

    const horas = String(date.getHours()).padStart(2, "0");
    const minutos = String(date.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
  }

  async function deleteService(id: string) {
    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_URL}/services/${id}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      // 🔥 Atualiza os serviços dentro do chamado
      setCalled(prev => {
        if (!prev) return prev;

        const newServices = prev.services?.filter(s => s.id !== id) || [];
        const newTotal = newServices.reduce((sum, s) => sum + Number(s.price), 0);

        return {
          ...prev,
          services: newServices,
          totalPrice: newTotal,
        };
      });
    } catch (err: any) {
      alert(err.message);
    }
  }



  const statusClasses: Record<string, string> = {
    aberto: "text-feedback-open bg-feedback-open/20",
    em_atendimento: "text-feedback-progress bg-feedback-progress/20",
    encerrado: "text-feedback-done bg-feedback-done/20",
  };

  const statusIcons: Record<string, string> = {
    aberto: CircleHelpIcon,
    em_atendimento: ClockIcon,
    encerrado: BigCheckIcon,
  };

  async function changeStatus(id: string, newStatus: string) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/calleds/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      const updated = await response.json();

      // Atualiza a lista localmente sem recarregar tudo

      setCalled(prev => {
        if (!prev) return prev;

        const newTotal =
          prev.services?.reduce((sum, s) => sum + Number(s.price), 0) ?? 0;

        return {
          ...prev,
          status: updated.status,
          totalPrice: newTotal, // sempre number
        };
      });


    } catch (err: any) {
      alert(err.message);
    }
  }

  async function addAdditionalService() {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Você precisa estar logado!");

      // Corpo da requisição: descrição, valor etc.
      const body = {
        title: desc,
        price: Number(value),
        isDefault: false
      };

      const response = await fetch(`${API_URL}/services/additional_service/${called?.id}`, {
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

      const newService = await response.json(); // serviço criado pelo backend

      // Atualiza o chamado localmente
      setCalled(prev => {
        if (!prev) return prev;

        const updatedServices = [...(prev.services || []), newService];
        const updatedTotal = updatedServices.reduce((sum, s) => sum + Number(s.price), 0);

        return {
          ...prev,
          services: updatedServices,
          totalPrice: updatedTotal
        };
      });

      // Fecha o modal e limpa inputs
      setAdditionalServiceModalOpen(false);
      setDesc("");
      setValue("");

    } catch (err: any) {
      alert(err.message);
    }
  }


  // ⚠️ Se ainda não carregou, exibe carregando
  if (!called) {
    return (
      <div className="max-w-[900px] mx-auto px-4">
        <p className="text-gray-400 text-center mt-10">Carregando chamado...</p>
      </div>
    );
  } else {
    const adicionais = called.services?.filter(s => !s.isDefault) || [];
    const totalAdicionais = adicionais.reduce((sum, s) => sum + Number(s.price), 0);

    return (
      <div className="max-w-[900px] mx-auto px-4">

        {/* BOTÃO VOLTAR */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => navigate(-1)}
          className="group inline-flex items-center justify-center text-xs rounded-[5px] w-auto h-auto px-2 py-1 gap-1 cursor-pointer hover:bg-gray-500"
        >
          <img
            className="rounded-full object-cover h-3 w-3"
            src={isHovered ? ArrowHover : ArrowRight}
            alt="ícone voltar"
          />
          <span className="text-xs text-gray-300 group-hover:text-gray-100 group-hover:font-bold">
            Voltar
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">

          <h1 className="text-blue-dark text-xl font-bold">
            Chamado detalhado
          </h1>

          {(userType === "technician" || userType === "admin") && (
            <div className="mt-3 sm:mt-0">
              {called.status === "em_atendimento" ? (

                <button
                  onClick={() => changeStatus(called.id, "encerrado")}
                  className="group w-full inline-flex items-center justify-center h-7 bg-gray-500 hover:bg-gray-400 rounded-sm gap-1 px-4 py-2.5"
                >
                  {/* Ícone normal */}
                  <img src={BigCheck} className="w-3.5 h-3.5 block group-hover:hidden" />

                  {/* Ícone hover */}
                  <img src={BigCheckHover} className="w-3.5 h-3.5 hidden group-hover:block" />
                  <span className="text-gray-300 group-hover:text-gray-100">Encerrar</span>
                </button>

              ) : called.status === "aberto" ? (
                <div className="flex gap-2 ">

                  <button
                    onClick={() => changeStatus(called.id, "em_atendimento")}
                    className="w-full group inline-flex items-center justify-center h-7 bg-gray-500 hover:bg-gray-400 rounded-sm gap-1 px-4 py-2.5"
                  >
                    {/* Ícone normal */}
                    <img src={Clock} className="w-3.5 h-3.5 block group-hover:hidden" />

                    {/* Ícone hover */}
                    <img src={ClockHover} className="w-3.5 h-3.5 hidden group-hover:block" />
                    <span className="text-gray-300 group-hover:text-gray-100">Iniciar</span>
                  </button>
                  <button
                    onClick={() => changeStatus(called.id, "encerrado")}
                    className="w-full group inline-flex items-center justify-center h-7 bg-gray-500 hover:bg-gray-400 rounded-sm gap-1 px-4 py-2.5"
                  >
                    {/* Ícone normal */}
                    <img src={BigCheck} className="w-3.5 h-3.5 block group-hover:hidden" />

                    {/* Ícone hover */}
                    <img src={BigCheckHover} className="w-3.5 h-3.5 hidden group-hover:block" />
                    <span className="text-gray-300 group-hover:text-gray-100">Encerrar</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Exibição do chamado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* DIV 1 */}
          <div className="grid grid-cols-2 border border-gray-500 p-4 rounded-[10px]">

            {/* ID */}
            <span className="text-xs text-gray-300">{displayId}</span>

            {/* Status */}
            <div className={`
    inline-flex items-center justify-center text-xs rounded-full w-auto h-auto gap-1
    ${statusClasses[called.status]}
  `}>
              <img
                className="rounded-full object-cover h-3 w-3 sm:h-4 sm:w-4"
                src={statusIcons[called.status] || CircleHelpIcon}
                alt="ícone"
              />
              <span>{formatStatus(called.status)}</span>
            </div>

            {/* Título — 2px depois do status */}
            <span className="font-bold text-md text-gray-200 mt-0.5">
              {called.title}
            </span>
            <span></span>

            {/* Label Descrição — 20px abaixo do título */}
            <span className="text-gray-400 text-xs mt-5">Descrição</span>
            <span></span>

            {/* Texto da descrição — 2px abaixo do label */}
            <span className="col-span-2 text-sm text-gray-200 mt-0.5">
              {called.description}
            </span>

            {/* Label Categoria — 20px abaixo da descrição */}
            <span className="text-gray-400 text-xs mt-5">Categoria</span>
            <span></span>

            {/* Valor da categoria — 2px abaixo do label */}
            <span className="text-sm text-gray-200 mt-0.5">
              {called.category}
            </span>
            <span></span>

            {/* Criado em — 20px abaixo da categoria */}
            <span className="flex flex-col mt-5">
              <span className="text-gray-400 text-xs">Criado em</span>
              <span className="text-xs text-gray-200 mt-0.5">{formatDate(called.createdAt)}</span>
            </span>

            <span className="flex flex-col mt-5">
              <span className="text-gray-400 text-xs">Atualizado em</span>
              <span className="text-xs text-gray-200 mt-0.5">{formatDate(called.updatedAt)}</span>
            </span>

            {/* Cliente */}
            {userType !== "client" && (
              <span className="flex flex-col mt-5">
                <span className="text-gray-400 text-xs">Cliente</span>
                <span className="flex items-center gap-2 mt-0.5">
                  {called.client?.photoUrl && (
                    <img
                      src={called.client.photoUrl}
                      alt={called.client.name[0]}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  <span className="text-sm text-gray-200">{called.client?.name}</span>
                </span>
              </span>
            )}

          </div>
          {/* DIV 2 */}
          <div className="border grid grid-cols-2 justify-between border-gray-500 p-4 rounded-[10px] max-w-[296px] max-h-[309px]">
            <span className="flex flex-col mb-8 mt-2">
              <span className="text-gray-400 text-xs">Técnico responsável</span>
              <span className="flex items-center gap-2 mt-0.5">
                {called.technician?.photoUrl && (
                  <img
                    src={called.technician.photoUrl}
                    alt={called.technician.name[0]}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="flex flex-col">
                  <span className="text-sm text-gray-200">{called.technician?.name}</span>
                  <span className="text-xs text-gray-300">{called.technician?.email}</span>
                </span>
              </span>
            </span>
            <span></span>
            <span className="text-sm text-gray-400">Valores</span>
            <span></span>
            <div className="col-span-2 grid grid-cols-2 gap-y-1">

              {/* Preço base */}
              <span className="text-xs text-gray-200">Preço base</span>
              <span className="text-xs text-gray-200 text-right mb-4">
                R$ {called.services?.[0]?.price.toFixed(2)}
              </span>

              {/* Se NÃO for técnico → lista normal */}
              {(userType === "admin" || userType === "client") && (
                <>
                  <span className="text-xs text-gray-400 mb-2">Adicionais</span>
                  <span></span>

                  {adicionais.map(s => (
                    <React.Fragment key={s.id}>
                      <span className="text-gray-200 text-xs">{s.title}</span>
                      <span className="text-gray-200 text-xs text-right">R$ {s.price.toFixed(2)}</span>
                    </React.Fragment>
                  ))}
                </>
              )}

              {/* Se for técnico → apenas total dos adicionais */}
              {userType === "technician" && (
                <>
                  <span className="text-xs text-gray-200">Adicionais</span>
                  <span className="text-xs text-gray-200 text-right">
                    R$ {totalAdicionais.toFixed(2)}
                  </span>
                </>
              )}

              {/* Total */}
              <span className="font-bold mt-4">Total</span>
              <span className="font-bold text-gray-100 mt-4 text-right">
                R$ {called.totalPrice?.toFixed(2)}
              </span>
            </div>

          </div>

          {/* DIV 3 */}
          {userType === "technician" && (
            <div className="border border-gray-500 rounded-[10px] mt-4 p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-xs">Serviços adicionais</span>

                {/* Só mostra o botão + se NÃO estiver encerrado */}
                {called.status !== "encerrado" && (
                  <button
                    onClick={() => {
                      setAdditionalServiceModalOpen(true);
                    }}
                    className="grid items-center justify-center w-7 h-7 rounded-[5px] bg-gray-200 hover:bg-gray-100 cursor-pointer"
                  >
                    <img className="w-3.5 h-3.5" src={Plus} alt="" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {adicionais.map(s => (
                  <div key={s.id} className="flex justify-between items-center">

                    <span className="text-gray-200 text-xs">{s.title}</span>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 text-xs">R$ {s.price.toFixed(2)}</span>

                      {/* ⚠️ Só permite deletar se NÃO estiver encerrado */}
                      {called.status !== "encerrado" && (
                        <button
                          onClick={() => deleteService(s.id)}
                          className="w-7 h-7 flex items-center justify-center text-gray-200 bg-gray-500 rounded-sm hover:text-gray-100 hover:bg-gray-400"
                        >
                          <img src={Trash} alt="trash" />
                        </button>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {additionalServiceModalOpen && (
            <div className="fixed inset-0 bg-modal/50 bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-gray-600 w-[90%] max-w-[440px] shadow-xl rounded-[10px] overflow-hidden">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between border-b border-gray-500 px-7 py-5">
                  <span className="text-md text-gray-200 font-semibold">Serviço adicional</span>
                  <button
                    onClick={() => setAdditionalServiceModalOpen(false)}
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
                      placeholder="Descrição do serviço"
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
                    onClick={addAdditionalService}
                    className="w-full py-3 rounded-[5px] bg-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center mt-6"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}




        </div>
      </div>
    );
  }

}
