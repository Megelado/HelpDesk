import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ArrowRight from "../assets/icons/arrow-left-gray.svg";
import ArrowHover from "../assets/icons/arrow-left-hover.svg";
import IconX from "../assets/icons/x.svg";

export function CreateTechnician() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [availability, setAvailability] = useState<string[]>([]); // ⚠️ array de horários
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; availability?: string }>({});

  const [isHovered, setIsHovered] = useState(false);

  const periods = [
    { name: "Manhã", start: 7, end: 12 },
    { name: "Tarde", start: 13, end: 18 },
    { name: "Noite", start: 19, end: 23 },
  ];

  const allTimes = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0") + ":00"
  );

  // Alterna seleção de horário
  const toggleTime = (time: string) => {
    setAvailability((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  // Cria técnico
  const handleCreate = async () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "O nome é obrigatório.";
    if (!email.trim()) newErrors.email = "O e-mail é obrigatório.";
    if (!password.trim()) newErrors.password = "A senha é obrigatória.";
    if (availability.length === 0) newErrors.availability = "Selecione ao menos um horário.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Você precisa estar logado!");

      const response = await fetch(`${API_URL}/technicians`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password, availability }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Falha ao enviar dados");
      }

      const data = await response.json();
      console.log("Cadastro bem-sucedido:", data);
      navigate("/technicians");
    } catch (err: any) {
      alert(err.message);
    }
  };


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
        <h1 className="text-blue-dark text-xl font-bold">Perfil de técnico</h1>
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
            onClick={handleCreate}
          >
            Salvar
          </button>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* DIV 1 */}
        <div className="grid grid-cols-1 border border-gray-500 p-4 rounded-[10px]">
          <span className="font-bold text-md text-gray-200 mt-0.5 mb-1">Dados pessoais</span>
          <span className="text-xs text-gray-300 mb-6">Defina as informações do perfil de técnico</span>

          <div className="flex flex-col mb-4 group">
            <label htmlFor="id_change_name" className="text-gray-300 text-xxs uppercase mb-1 group-focus-within:text-blue-dark">
              Nome
            </label>
            <input
              placeholder="Nome completo"
              id="id_change_name"
              name="change_name"
              type="text"
              className="border-b border-b-gray-500 focus:border-blue-dark focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <span className="text-red-500 text-xxs">{errors.name}</span>}
          </div>

          <div className="flex flex-col mb-4 group">
            <label htmlFor="id_change_email" className="text-gray-300 text-xxs uppercase mb-2 group-focus-within:text-blue-500">
              E-mail
            </label>
            <input
              placeholder="exemplo@mail.com"
              id="id_change_email"
              name="change_email"
              type="email"
              className="border-b border-b-gray-500 focus:border-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span className="text-red-500 text-xxs">{errors.email}</span>}
          </div>

          <div className="flex flex-col mb-4 group">
            <label htmlFor="id_change_password" className="text-gray-300 text-xxs uppercase mb-2 group-focus-within:text-blue-500">
              Senha
            </label>
            <input
              placeholder="Defina a senha de acesso"
              id="id_change_password"
              name="change_password"
              type="password"
              className="border-b border-b-gray-500 focus:border-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <span className="text-red-500 text-xxs">{errors.password}</span>}
          </div>
        </div>
        {/* DIV 2 */}
        {/* Horários */}
        <div className="grid grid-cols-1 border border-gray-500 p-4 rounded-[10px]">
          <span className="text-gray-200 text-md font-bold">Horários de atendimento</span>
          <span className="text-xs text-gray-300 mb-4">Selecione os horários de disponibilidade do técnico para atendimento</span>

          {periods.map((period) => {
            const timesInPeriod = allTimes.filter(
              (time) => Number(time.split(":")[0]) >= period.start && Number(time.split(":")[0]) <= period.end
            );

            return (
              <div key={period.name} className="mb-3">
                <span className="text-xxs text-gray-300 uppercase">{period.name}</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {timesInPeriod.map((time) => {
                    const isActive = availability.includes(time);

                    return (
                      <span
                        key={time}
                        onClick={() => toggleTime(time)}
                        className={`flex items-center gap-1 px-2 py-1 text-xxs cursor-pointer rounded-full transition-colors
                          ${isActive ? "bg-blue-base text-gray-600 hover:bg-blue-light" : "border border-gray-400 bg-gray-600 text-gray-200 hover:bg-gray-400"}`}
                      >
                        {time}
                        {isActive && <img className="w-3.5 h-3.5" src={IconX} alt="x" />}
                      </span>
                    );
                  })}
                </div>
                {errors.availability && <span className="text-red-500 text-xxs">{errors.availability}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
