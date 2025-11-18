import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ArrowRight from "../assets/icons/arrow-left-gray.svg";
import ArrowHover from "../assets/icons/arrow-left-hover.svg";
import IconX from "../assets/icons/x.svg"


interface Technician {
  id: string;
  name: string;
  email: string;
  password: string;
  photoUrl: string;
  availability: string[];
  createdAt: string;
  updatedAt: string;

}

export function EditTechnician() {
  const navigate = useNavigate();
  const [technician, setTechnician] = useState<Technician | null>(null);

  const [userType] = useState(localStorage.getItem("userType") || "");
  const [isHovered, setIsHovered] = useState(false);
  const { id } = useParams();


  useEffect(() => {
    async function loadTechnicians() {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Você precisa estar logado!");
        return;
      }

      try {
        let url = `http://localhost:3333/technicians/details/${id}`;

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
        setTechnician(data);
      } catch (err: any) {
        alert(err.message);
      }
    }

    loadTechnicians();
  }, [id, userType]);

  useEffect(() => {
    if (technician) {
      console.log("DADOS DO CHAMADO:", technician);
    }
  }, [id, technician]);

  // Função para salvar alterações
  async function handleSave() {
    if (!technician) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Você precisa estar logado!");
        return;
      }

      const response = await fetch(`http://localhost:3333/technicians/${technician.id}/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: technician.name,
          email: technician.email,
          // se quiser atualizar outras coisas, inclua aqui
        }),
      });

      const responseAvailability = await fetch(`http://localhost:3333/technicians/availability/${technician.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          availability: technician.availability
        }),
      })

      if (!response.ok || !responseAvailability.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao atualizar técnico");
      }

      alert("Técnico atualizado com sucesso!");
      navigate(-1); // volta para a página anterior

    } catch (err: any) {
      alert(err.message);
    }
  }

  // ⚠️ Se ainda não carregou, exibe carregando
  if (!technician) {
    return (
      <div className="max-w-[900px] mx-auto px-4">
        <p className="text-gray-400 text-center mt-10">Carregando técnico...</p>
      </div>
    );
  } else {

    return (

      <div className="max-w-[900px] mx-auto px-4">

        {/* BOTÃO VOLTAR */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => navigate(-1)}
          className="group inline-flex items-center justify-center text-xs rounded-[5px] 
                      w-auto h-auto px-2 py-1 gap-1 cursor-pointer 
                      hover:bg-gray-500"
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
            Editar Técnico
          </h1>
          <div className="mt-3 sm:mt-0 flex gap-2">

            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center h-7 bg-gray-500 hover:bg-gray-400 rounded-sm gap-2 px-4 py-2 text-gray-200 hover:text-gray-100"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center h-7 text-gray-600 bg-gray-200 rounded-sm gap-2 px-4 py-2 hover:bg-gray-100"
              onClick={() => { handleSave() }}
            >
              Salvar
            </button>


          </div>

        </div>


        {/* Perfil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* DIV 1 */}
          <div className="grid grid-cols-1 border border-gray-500 p-4 rounded-[10px]">
            <span className="font-bold text-md text-gray-200 mt-0.5 mb-1">
              Dados pessoais
            </span>
            <span className="text-xs text-gray-300">Defina as informações do perfil de técnico</span>
            <span className="flex flex-col mt-6 mb-6">
              <span className="flex items-center gap-2 mt-0.5">
                {technician.photoUrl && (
                  <img
                    src={technician.photoUrl}
                    alt={technician.name[0]}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
              </span>
            </span>

            <div className="flex flex-col mb-4 group">
              <label
                htmlFor="id_change_name"
                className="text-gray-300 text-xxs uppercase mb-1 group-focus-within:text-blue-500"
              >
                Nome
              </label>
              <input
                id="id_change_name"
                name="change_name"
                type="text"
                className="border-b border-b-gray-500 focus:border-blue-500 focus:outline-none"
                value={technician.name} // ← valor vindo do banco
                onChange={(e) =>
                  setTechnician((prev) => prev ? { ...prev, name: e.target.value } : prev)
                }
              />
            </div>

            <div className="flex flex-col mb-4 group">
              <label
                htmlFor="id_change_email"
                className="text-gray-300 text-xxs uppercase mb-1 group-focus-within:text-blue-500"
              >
                E-mail
              </label>
              <input
                id="id_change_email"
                name="change_email"
                type="email"
                className="border-b border-b-gray-500 focus:border-blue-500 focus:outline-none"
                value={technician.email} // ← valor vindo do banco
                onChange={(e) =>
                  setTechnician((prev) => prev ? { ...prev, email: e.target.value } : prev)
                }
              />
            </div>




          </div>
          {/* DIV 2 */}
          {/* Horários */}
          <div className="grid grid-cols-1 border border-gray-500 p-4 rounded-[10px] max-w-[480px] max-h-[305px]">
            <span className="text-gray-200 text-md font-bold">Horários de atendimento</span>
            <span className="text-xs text-gray-300 mb-4">
              Selecione os horários de disponibilidade do técnico para atendimento
            </span>

            {(() => {
              const periods = [
                { name: "Manhã", start: 7, end: 12 },
                { name: "Tarde", start: 13, end: 18 },
                { name: "Noite", start: 19, end: 23 },
              ];

              const allTimes = Array.from({ length: 24 }, (_, i) =>
                i.toString().padStart(2, "0") + ":00"
              );

              return periods.map((period) => {
                const timesInPeriod = allTimes.filter(
                  (time) =>
                    Number(time.split(":")[0]) >= period.start &&
                    Number(time.split(":")[0]) <= period.end
                );

                return (
                  <div key={period.name} className="mb-3">
                    <span className="text-xxs text-gray-300 uppercase">{period.name}</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {timesInPeriod.map((time) => {
                        const isActive = technician.availability.includes(time);

                        // Função para alternar seleção
                        const toggleTime = () => {
                          setTechnician((prev) => {
                            if (!prev) return prev;
                            const availability = prev.availability.includes(time)
                              ? prev.availability.filter((t) => t !== time)
                              : [...prev.availability, time];
                            return { ...prev, availability };
                          });
                        };

                        return (
                          <span
                            key={time}
                            onClick={toggleTime}
                            className={`flex items-center gap-1 px-2 py-1 text-xxs cursor-pointer rounded-full transition-colors
                    ${isActive ? "bg-blue-base text-gray-600 hover:bg-blue-light" : "border border-gray-400 bg-gray-600 text-gray-200 hover:bg-gray-400"}`}
                          >
                            {time}
                            {isActive && (
                              <img className="w-3.5 h-3.5" src={IconX} alt="x" />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>




        </div>
      </div>
    );
  }

}
