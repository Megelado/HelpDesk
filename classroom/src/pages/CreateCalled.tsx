import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ArrowRight from "../assets/icons/arrow-left-gray.svg";
import ArrowHover from "../assets/icons/arrow-left-hover.svg";
import Check from "../assets/icons/check-blue.svg"
import ArrowDown from "../assets/icons/chevron-down.svg"
import ArrowUp from "../assets/icons/chevron-up.svg"

interface Service {
  id: string;
  title: string;
  price: number;
}

export function CreateCalled() {
  const navigate = useNavigate();

  // Dados do chamado
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  // Serviços
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");

  const [open, setOpen] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);





  // Erros
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    serviceIds?: string;
  }>({});

  const [isHovered, setIsHovered] = useState(false);

  // Carregar serviços
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchServices = async () => {
      try {
        const res = await fetch("http://localhost:3333/services", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // FILTRO FINAL ✔️
        setServices(
          data.filter((s: any) => s.isDefault === true && s.active === true)
        );
      } catch (err) {
        console.error("Erro ao carregar serviços:", err);
      }
    };

    fetchServices();
  }, []);


  const handleCreate = async () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "O título é obrigatório.";
    if (!description.trim()) newErrors.description = "A descrição é obrigatória.";
    if (!serviceId) newErrors.serviceIds = "Selecione um serviço.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Você precisa estar logado!");

      const clientId = localStorage.getItem("userId");
      if (!clientId) throw new Error("Usuário não encontrado!");

      const body = {
        title,
        description,
        category: category || undefined,
        serviceIds: [serviceId],
        clientId,
      };

      const response = await fetch("http://localhost:3333/calleds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Falha ao enviar dados");
      }

      const data = await response.json();
      console.log("Chamado criado com sucesso:", data);
      navigate("/calleds_clients");
    } catch (err: any) {
      alert(err.message);
    }
  };
  const selectedService = services.find(s => s.id === serviceId);
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 mt-4">
        <h1 className="text-blue-dark text-xl font-bold">Criar Chamado</h1>

      </div>

      {/* Dados do chamado */}
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="grid grid-cols-1 border border-gray-500 p-5 sm:p-8 rounded-[10px] sm:mr-6 mb-4 sm:mb-0">
          <span className="font-bold text-md text-gray-200 mb-2">Informações</span>
          <p className="text-gray-300 mb-5 sm:mb-6 text-xs">Configure os dias e horários em que você está disponível para atender chamados
          </p>

          <div className="flex flex-col mb-4">
            <label
              className={`text-xxs mb-2 uppercase transition-colors duration-200
    ${titleFocused ? "text-blue-base" : "text-gray-300"}`}
            >Título</label>
            <input placeholder="Digite um título para o chamado"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
              className="border-b border-b-gray-500 focus:border-blue-500 focus:outline-none text-gray-200"
            />
            {errors.title && <span className="text-red-500 text-xxs">{errors.title}</span>}
          </div>

          <div className="flex flex-col mb-6">
            <label
              className={`text-xxs mb-2 uppercase transition-colors duration-200
    ${descFocused ? "text-blue-base" : "text-gray-300"}`}
            >Descrição</label>
            <textarea placeholder="Descreva o que está acontecendo"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
              className="resize-none border-b border-b-gray-400 pt-1 pb-1 focus:border-blue-base 
             focus:outline-none text-gray-200 h-[140px]"
            />
            {errors.description && <span className="text-red-500 text-xxs">{errors.description}</span>}
          </div>

          <div className="flex flex-col">
            <label
              className={`text-xxs mb-2 uppercase transition-colors duration-200
      ${open ? "text-blue-base" : "text-gray-300"}`}
            >
              Categoria de serviço
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="border-b border-b-gray-500 focus:border-blue-base focus:outline-none h-8 w-full text-left
        flex items-center justify-between text-gray-200"
              >
                <span className={serviceId === "" ? "text-gray-400" : "text-gray-200"}>
                  {serviceId === ""
                    ? "Selecione a categoria de atendimento"
                    : services.find(s => s.id === serviceId)?.title}
                </span>

                <img
                  className="w-5 h-5"
                  src={open ? ArrowUp : ArrowDown}
                  alt=""
                />
              </button>

              {open && (
                <ul className="absolute left-0 mt-1 w-full border border-gray-500 rounded-[10px] z-10 max-h-48 overflow-auto text-gray-400">
                  {services.map(service => (
                    <li
                      key={service.id}
                      onClick={() => {
                        setServiceId(service.id);
                        setOpen(false); // fecha → label volta à cor normal
                      }}
                      className="px-3 py-2 cursor-pointer hover:text-gray-200 flex items-center justify-between"
                    >
                      <span>{service.title}</span>

                      {serviceId === service.id && (
                        <img
                          src={Check}
                          alt="selecionado"
                          className="w-4 h-4"
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {errors.serviceIds && (
              <span className="text-red-500 text-xxs">{errors.serviceIds}</span>
            )}
          </div>


        </div>
        <div className="grid grid-cols-1 border border-gray-500 p-5 sm:p-6 rounded-[10px] max-w-[342px] md:w-[296px] max-h-[339px]">
          <span className="text-md text-gray-200 mb-1">Resumo</span>
          <p className="text-xs text-gray-300 mb-5">valores e detalhes</p>
          <span className="text-xs text-gray-400 mb-2">Categoria de serviço</span>
          <p className="text-sm text-gray-200 mb-4">
            {selectedService ? selectedService.title : "Nenhum serviço selecionado"}
          </p>
          <span className="text-xs text-gray-400 mb-0.5">Custo inicial</span>
          <p className="text-lg text-gray-200 font-bold mb-5">
            {selectedService ? `R$ ${selectedService.price}` : "—"}
          </p>
          <p className="text-xs text-gray-300 mb-5">O chamado será automaticamente atribuído a um técnico disponível</p>
          <button
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center h-7 text-gray-600 bg-gray-200 rounded-sm gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={handleCreate}
          >
            Criar chamado
          </button>

        </div>
      </div>

    </div>
  );
}
