import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IconDark from "../assets/icon-dark.svg";

export function Login() {
  const API_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "O e-mail é obrigatório.";
    if (!password.trim()) newErrors.password = "A senha é obrigatória.";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Falha ao enviar login");
      }

      const data = await response.json();
      console.log("Login bem-sucedido:", data);

      localStorage.setItem("token", data.token);
      localStorage.setItem("userType", data.user.type); // "client", "technician" ou "admin"
      localStorage.setItem("userId", data.user.id); // se precisar
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      // Foto do usuário
      const rawPhoto = data.user.photoUrl;
      const normalizedPhoto = rawPhoto
        ? (rawPhoto.startsWith("http")
          ? rawPhoto
          : `${API_URL}${rawPhoto.startsWith("/") ? "" : "/"}${rawPhoto}`)
        : "";

      localStorage.setItem("userPhoto", normalizedPhoto);

      if (Array.isArray(data.user.availability)) {
        localStorage.setItem("availability", JSON.stringify(data.user.availability));
      } else {
        localStorage.removeItem("availability");
      }



      alert("Login realizado com sucesso!");

      if (data.user.type === "technician") {
        navigate("/calleds_technicians");
      } else if (data.user.type === "client") {
        navigate("/calleds_clients")
      } else {
        navigate("/calleds");
      }
    } catch (err: any) {
      alert(err.message);
      console.error(err);
    }
  }

  return (
    <div
      className="min-h-screen bg-[url('/src/assets/Login_Background.png')] bg-cover bg-center bg-no-repeat 
      flex flex-col items-center justify-start text-gray-200 px-6 py-12 sm:py-16 relative"
    >
      {/* camada de leve escurecimento para contraste */}
      <div className="absolute inset-0 bg-black/40"></div>

      <main className="relative z-10 w-full max-w-sm sm:max-w-md bg-gray-600 border border-gray-500 rounded-[10px] p-6 sm:p-7 shadow-lg flex flex-col gap-6 mt-8 sm:mt-12">
        {/* HEADER */}
        <header className="flex items-center justify-center gap-3 mb-2">
          <img src={IconDark} alt="Logo do HelpDesk" className="w-8 sm:w-10" />
          <h1 className="text-lg sm:text-xl text-blue-dark font-bold">Helpdesk</h1>
        </header>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <h2 className="text-gray-200 sm:text-lg font-bold">Acesse o portal</h2>
            <p className="text-xs sm:text-sm text-gray-300 pb-8 sm:pb-10">
              Entre usando seu e-mail e senha cadastrados
            </p>
          </div>

          {/* E-MAIL */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="idEmail"
              className={`uppercase text-xs transition-colors ${errors.email ? "text-feedback-danger" : "text-gray-300"
                }`}
            >
              E-mail
            </label>
            <input
              id="idEmail"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full py-2 bg-gray-600 text-gray-200 border-b focus:outline-none transition-colors placeholder:text-gray-400 text-sm sm:text-base ${errors.email
                ? "border-b-feedback-danger"
                : "border-b-gray-500 focus:border-b-blue-base"
                }`}
              placeholder="exemplo@mail.com"
            />
            {errors.email && (
              <span className="text-feedback-danger text-xs">{errors.email}</span>
            )}
          </div>

          {/* SENHA */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="idPassword"
              className={`uppercase text-xs transition-colors ${errors.password ? "text-feedback-danger" : "text-gray-300"
                }`}
            >
              Senha
            </label>
            <input
              id="idPassword"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full py-2 bg-gray-600 text-gray-200 border-b focus:outline-none transition-colors placeholder:text-gray-400 text-sm sm:text-base ${errors.password
                ? "border-b-feedback-danger"
                : "border-b-gray-500 focus:border-b-blue-base"
                }`}
              placeholder="Digite sua senha"
            />
            {errors.password && (
              <span className="text-feedback-danger text-xs">
                {errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 px-4 py-2 rounded-[10px] bg-gray-200 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
          >
            Entrar
          </button>
        </form>
      </main>

      {/* BLOCO SEPARADO: CRIAR CONTA */}
      <div className="relative z-10 bg-gray-600 border border-gray-500 rounded-[10px] w-full max-w-sm sm:max-w-md p-6 sm:p-7 mt-6 shadow-lg">
        <h3 className="text-gray-200 sm:text-md font-bold">
          Ainda não tem uma conta?
        </h3>
        <p className="text-gray-300 text-xs pb-5 sm:pb-6">
          Cadastre agora mesmo
        </p>
        <button
          className="w-full mt-2 px-4 py-2 rounded-[10px] bg-gray-500 text-gray-200 text-sm hover:bg-gray-400 hover:text-gray-100 transition-colors"
          type="button"
          onClick={() => navigate("/register")}
        >
          Criar conta
        </button>
      </div>
    </div>
  );
}
