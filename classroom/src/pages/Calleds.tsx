import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CircleHelpIcon from "../assets/icons/circle-help.svg";
import ClockIcon from "../assets/icons/clock-2.svg";
import BigCheckIcon from "../assets/icons/circle-check-big.svg";
import PenLine from "../assets/icons/pen-line.svg";
import Eye from "../assets/icons/eye.svg"


export function Calleds() {
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
        let url = "http://localhost:3333/calleds";
        if (userType === "client") url = "http://localhost:3333/calleds/client";
        if (userType === "technician") url = "http://localhost:3333/calleds/technician";

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

  function formatStatus(status: string) {
    return status
      .split("_")
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join(" ");
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
  if (userType === "technician" || userType === "client") {
    return (
      <div className="mt-7 sm:mt-13 ml-6 lg:ml-12">
        <h1 className="text-blue-dark text-xl font-bold mb-6">
          Área exclusiva para admins
        </h1>
        <p className="text-gray-300">somente admins.</p>
        <a onClick={() => navigate("/calleds_technicians")} className="inline-flex items-center justify-center w-20 h-7 text-gray-200 bg-gray-500 rounded-sm hover:text-gray-100 hover:bg-gray-400 cursor-pointer">Técnicos</a>
        <a onClick={() => navigate("/calleds_clients")} className="inline-flex items-center justify-center w-20 h-7 text-gray-200 bg-gray-500 rounded-sm hover:text-gray-100 hover:bg-gray-400 cursor-pointer">Clientes</a>
      </div>
    );
  } else {
    return (
      <div className="mt-7 sm:mt-13 overflow-hidden">
        {
          userType === "admin"
            ? <h1 className="text-blue-dark text-xl font-bold mb-6 ml-6 lg:ml-12">
              Chamados
            </h1>
            : <h1 className="text-blue-dark text-xl font-bold mb-6 ml-6 lg:ml-12">
              Meus chamados
            </h1>

        }
        <div>
          <ul className="max-w-full border border-gray-500 rounded-[10px] pt-3 pb-0 ml-6 lg:ml-12 mr-6 lg:mr-12">




            {/* Cabeçalho */}
            <li className="w-full grid grid-cols-4 sm:grid-cols-8 gap-4 border-b border-gray-500 py-2 px-3 items-center"
            >

              <span className="block text-gray-400  truncate md:whitespace-normal md:truncate-none overflow-hidden whitespace-nowrap">Atualizado em</span>
              <span className="hidden sm:block text-gray-400">Id</span>
              <span className="text-gray-400 inline">Título e Serviço</span>
              <span className="hidden sm:block text-gray-400">Valor total</span>
              <span className="hidden sm:block text-gray-400">Cliente</span>
              <span className="hidden sm:block text-gray-400">Técnico</span>
              <span className="text-gray-400">Status</span>
            </li>

            {/* Linhas de chamados */}
            {calleds.length > 0 ? (
              calleds.map((c, index) => {
                const updatedAt = new Date(c.updatedAt);
                const formattedDate = (
                  <>
                    {String(updatedAt.getDate()).padStart(2, '0')}:
                    {String(updatedAt.getMonth() + 1).padStart(2, '0')}:
                    {updatedAt.getFullYear()}<br className="lg:hidden" />
                    {String(updatedAt.getHours()).padStart(2, '0')}:
                    {String(updatedAt.getMinutes()).padStart(2, '0')}
                  </>
                );

                console.log(c)

                return (
                  <li
                    key={c.id}
                    className="max-w-full grid grid-cols-4  sm:grid-cols-8 gap-4 border-b border-gray-500 py-2 px-3 items-center"

                  >
                    {/* Data/Hora */}
                    <span>{formattedDate}</span>

                    {/* Id */}
                    <div className="hidden sm:block">{String(index + 1).padStart(5, "0")}</div>


                    {/* Título e serviços */}
                    <div className="flex flex-col gap-1 min-w-0">
                      {/* Título */}
                      <span className="font-bold truncate">{c.title}</span>
                      {/* Serviços */}
                      <span className="text-gray-200 text-sm truncate">
                        {c.services
                          .filter((s: { title: string; isDefault: boolean }) => s.isDefault)
                          .map((s: { title: string }) => s.title)
                          .join(", ")}
                      </span>
                    </div>

                    {/* Valor */}
                    <span className="hidden sm:block">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.totalPrice)}
                    </span>

                    {/* Cliente */}
                    <div className="sm:flex items-center gap-2 hidden">
                      {c.client?.photoUrl && (
                        <img
                          src={c.client.photoUrl}
                          alt={c.client?.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <span>{c.client?.name}</span>
                    </div>

                    {/* Técnico */}
                    <div className="sm:flex items-center gap-2 hidden">
                      {c.technician?.photoUrl && (
                        <img
                          src={c.technician?.photoUrl}
                          alt={c.technician?.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <span>{c.technician?.name}</span>
                    </div>

                    {/* Status */}
                    <div className={`
                    inline-flex items-center justify-center text-xs rounded-full w-6 h-6 sm:w-auto sm:h-auto sm:px-2 sm:py-1 sm:gap-1
                    ${statusClasses[c.status]}
                  `}>
                      <img
                        className="rounded-full object-cover h-3 w-3 sm:h-4 sm:w-4"
                        src={statusIcons[c.status] || CircleHelpIcon}
                        alt="ícone"
                      />
                      <span className="hidden sm:block">{formatStatus(c.status)}</span>
                    </div>

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
                            {userType === "client"
                              ? <img src={Eye} alt="Eye" className="w-3.5 h-3.5" />
                              : <img src={PenLine} alt="pen" className="w-3.5 h-3.5" />}
                          </a>
                        );
                      })()}
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
      </div>
    );
  }
}
