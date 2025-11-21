import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CircleHelpIcon from "../assets/icons/circle-help.svg";
import ClockIcon from "../assets/icons/clock-2.svg";
import BigCheckIcon from "../assets/icons/circle-check-big.svg";
import PenLine from "../assets/icons/pen-line.svg";
import ClockWhite from "../assets/icons/clock-2-white.svg"
import BigCheckWhite from "../assets/icons/circle-check-big-white.svg"

export function CalledsTechnicians() {
  const API_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  const navigate = useNavigate();
  const [calleds, setCalleds] = useState<any[]>([]);
  const [userType] = useState(localStorage.getItem("userType") || "");

  useEffect(() => {
    async function loadCalleds() {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Você precisa estar logado!");
        return;
      }

      try {
        let url = `${API_URL}/calleds`;
        if (userType === "technician") url = `${API_URL}/calleds/technician`;

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
        setCalleds(data ?? []);
      } catch (err: any) {
        alert(err.message);
        console.error(err);
      }
    }

    loadCalleds();
  }, [userType]);

  const emAtendimento = calleds.filter(c => c.status === "em_atendimento");
  const abertos = calleds.filter(c => c.status === "aberto");
  const encerrados = calleds.filter(c => c.status === "encerrado");

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
      setCalleds(prev =>
        prev.map(c => (c.id === id ? { ...c, status: updated.status } : c))
      );
    } catch (err: any) {
      alert(err.message);
    }
  }


  function Lista({ itens }: { itens: any[] }) {
    const navigate = useNavigate();
    const calleds = itens;
    return (
      <div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 lg:px-12   /* corrigido — padding ao invés de margem */">


          {calleds.length > 0 ? (
            calleds.map((c, index) => {
              const updatedAt = new Date(c.updatedAt);
              const formattedDate = (
                <>
                  {String(updatedAt.getDate()).padStart(2, '0')}:
                  {String(updatedAt.getMonth() + 1).padStart(2, '0')}:
                  {updatedAt.getFullYear()}
                  {String(updatedAt.getHours()).padStart(2, '0')}:
                  {String(updatedAt.getMinutes()).padStart(2, '0')}
                </>
              );

              return (
                <li
                  key={c.id}
                  className="w-full border rounded-[10px] border-gray-500 py-3 px-3 grid gap-3 mb-4"
                >

                  {/* ========================= */}
                  {/* 1️⃣ LINHA 1 – ID + BOTÕES */}
                  {/* ========================= */}
                  <div className="flex items-center justify-between gap-4">

                    {/* ID */}
                    <div className="font-mono text-gray-300">
                      {String(index + 1).padStart(5, "0")}
                    </div>

                    <div className="flex items-center gap-3">

                      {/* Botão editar */}
                      <div className="flex justify-end gap-2">

                        {(() => {
                          const displayId = String(index + 1).padStart(5, "0");

                          return (
                            <a
                              onClick={() =>
                                navigate(`/calleds/details/${c.id}`, {
                                  state: {
                                    displayId,   // <--- key visual enviada para a página detalhes
                                  }
                                })
                              }
                              className="inline-flex items-center justify-center w-7 h-7 bg-gray-500 hover:bg-gray-400 cursor-pointer rounded-sm"
                            >
                              <img src={PenLine} alt="pen" className="w-3.5 h-3.5" />
                            </a>
                          );
                        })()}
                      </div>

                      {/* Botão mudar status */}
                      {c.status === "em_atendimento" ? (
                        <a
                          onClick={() => changeStatus(c.id, "encerrado")}
                          className="inline-flex items-center justify-center px-2 h-7 text-gray-600 bg-gray-200 hover:bg-gray-100 cursor-pointer rounded-sm gap-1"
                        >
                          <img src={BigCheckWhite} className="w-3.5 h-3.5" />
                          <span>Encerrar</span>
                        </a>

                      ) : c.status === "aberto" ? (
                        <a
                          onClick={() => changeStatus(c.id, "em_atendimento")}
                          className="inline-flex items-center justify-center px-2 h-7 text-gray-600 bg-gray-200 hover:bg-gray-100 cursor-pointer rounded-sm gap-1"
                        >
                          <img src={ClockWhite} className="w-3.5 h-3.5" />
                          <span>Iniciar</span>
                        </a>

                      ) : null}
                    </div>

                  </div>

                  {/* ====================== */}
                  {/* 2️⃣ LINHA 2 – TÍTULO    */}
                  {/* ====================== */}
                  <div className="flex flex-col">
                    <span className="font-bold">{c.title}</span>
                    <span className="text-gray-300 text-sm">
                      {c.services
                        .filter((s: { title: string; isDefault: boolean }) => s.isDefault)
                        .map((s: { title: string }) => s.title)
                        .join(", ")}
                    </span>
                  </div>

                  {/* ====================== */}
                  {/* 3️⃣ LINHA 3 – DATA E VALOR */}
                  {/* ====================== */}
                  <div className="flex justify-between text-sm text-gray-200">
                    <span>{formattedDate}</span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(c.totalPrice)}
                    </span>
                  </div>

                  {/* ====================== */}
                  {/* 4️⃣ LINHA 4 – CLIENTE E STATUS */}
                  {/* ====================== */}
                  <div className="flex justify-between items-center">

                    {/* CLIENTE */}
                    <div className="flex items-center gap-2">
                      {c.client?.photoUrl && (
                        <img
                          src={c.client.photoUrl}
                          alt={"cliente"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <span>{shortenName(c.client?.name || "")}</span>
                    </div>

                    {/* STATUS */}
                    <div
                      className={`
        inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
        ${statusClasses[c.status]}
      `}
                    >
                      <img src={statusIcons[c.status]} className="w-3 h-3" />

                    </div>

                  </div>

                </li>

              );
            })
          ) : (
            <li className="text-gray-400 italic text-center py-4 border-b border-gray-600">
              Nenhum chamado encontrado.
            </li>
          )}
        </ul>
      </div>
    );
  }

  function shortenName(name: string, maxLength = 7) {
    if (!name) return "";
    const firstName = name.split(" ")[0];
    return firstName.length > maxLength ? firstName.slice(0, maxLength) + "..." : firstName;
  }


  if (userType !== "technician") {
    return (
      <div className="mt-7 sm:mt-13 ml-6 lg:ml-12">
        <h1 className="text-blue-dark text-xl font-bold mb-6">
          Área exclusiva para técnicos
        </h1>
        <p className="text-gray-300">Apenas técnicos.</p>
        <a onClick={() => navigate("/calleds")} className="inline-flex items-center justify-center w-20 h-7 text-gray-200 bg-gray-500 rounded-sm hover:text-gray-100 hover:bg-gray-400 cursor-pointer">Admins</a>
        <a onClick={() => navigate("/calleds_clients")} className="inline-flex items-center justify-center w-20 h-7 text-gray-200 bg-gray-500 rounded-sm hover:text-gray-100 hover:bg-gray-400 cursor-pointer">Clientes</a>
      </div>
    );
  } else {
    return (
      <div className="mt-7 sm:mt-13 overflow-hidden">
        <h1 className="text-blue-dark text-xl font-bold mb-6 ml-6 lg:ml-12">
          Meus chamados
        </h1>
        {/* EM ATENDIMENTO */}
        <span className="inline-flex items-center justify-center text-xs rounded-full w-auto h-auto px-2 py-1 gap-1 bg-feedback-progress/20 mb-4 mt-4 ml-6 lg:ml-12">
          <img className="w-4 h-4" src={ClockIcon} />
          <span className="text-feedback-progress">Em atendimento</span>
        </span>
        <Lista itens={emAtendimento} />

        {/* ABERTOS */}
        <span className="inline-flex items-center justify-center text-xs rounded-full w-auto h-auto px-2 py-1 gap-1 bg-feedback-open/20 mb-4 ml-6 lg:ml-12">
          <img className="w-4 h-4" src={CircleHelpIcon} />
          <span className="text-feedback-open">Aberto</span>
        </span>
        <Lista itens={abertos} />

        {/* ENCERRADOS */}
        <span className="inline-flex items-center justify-center text-xs rounded-full w-auto h-auto px-2 py-1 gap-1 bg-feedback-done/20 mb-4 ml-6 lg:ml-12">
          <img className="w-4 h-4" src={BigCheckIcon} />
          <span className="text-feedback-done">Encerrado</span>
        </span>
        <Lista itens={encerrados} />
      </div>
    );

  }
}