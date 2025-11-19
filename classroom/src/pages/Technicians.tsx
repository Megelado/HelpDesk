import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PenLine from "../assets/icons/pen-line.svg";
import Plus from "../assets/icons/plus.svg";
import Trash from "../assets/icons/trash.svg"
import CloseDefault from "../assets/icons/x-default.svg"
import CloseHover from "../assets/icons/icons-hover/x-hover.svg"

interface Technician {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  availability: string[]
  createdAt: string;
  updatedAt: string;
}

export function Technicians() {
  const API_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  const [calleds, setCalleds] = useState<any[]>([]); 
  
  const navigate = useNavigate();
  const location = useLocation();
  const [userType] = useState(localStorage.getItem("userType") || "");

  const [deleteTechModalOpen, setDeleteTechModalOpen] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [selectedTechName, setSelectedTechName] = useState<string | null>(null);
  const [hoverClose, setHoverClose] = useState(false);

  // Efeito 1: Carrega a lista de técnicos
  useEffect(() => {
    async function loadTechnicians() {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Você precisa estar logado!");
        navigate("/login");
        return;
      }

      try {
        const url = `${API_URL}/technicians`;

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          console.error(data.message || "Erro ao buscar técnicos");
          return;
        }

        const data = await response.json();
        setCalleds(data ?? []);
      } catch (err) {
        console.error("Erro ao carregar técnicos:", err);
      }
    }

    loadTechnicians();
  },  [userType, navigate, location.state?.refresh]);

  function Availability({ list }: { list: string[] }) {
    const [maxVisible, setMaxVisible] = useState(3);

    useEffect(() => {
      const updateMax = () => {
        const w = window.innerWidth;

        if (w < 640) return setMaxVisible(1);
        if (w < 1024) return setMaxVisible(2);   
        return setMaxVisible(5);                 
      };

      updateMax();
      window.addEventListener("resize", updateMax);
      return () => window.removeEventListener("resize", updateMax);
    }, []);

    if (!list || list.length === 0) {
      return <span className="text-gray-400 italic text-xs">Sem disp.</span>;
    }

    const visible = list.slice(0, maxVisible);
    const hiddenCount = list.length - visible.length;

    return (
      <div className="flex flex-wrap gap-1 items-center max-w-[140px] sm:max-w-[200px] md:max-w-full">
        {visible.map((day, index) => (
          <span
            key={index}
            className="text-gray-300 border border-gray-500 rounded-full px-2 py-1 text-xs whitespace-nowrap"
          >
            {day}
          </span>
        ))}

        {hiddenCount > 0 && (
          <span className="text-gray-300 border border-gray-500 rounded-full px-2 py-1 text-xs">
            +{hiddenCount}
          </span>
        )}
      </div>
    );
  }

  const openDeleteModal = (tech: Technician) => {
    setSelectedTechId(tech.id);
    setSelectedTechName(tech.name);
    setDeleteTechModalOpen(true);
  };

  const deleteTechnician = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Você precisa estar logado!");

      const response = await fetch(`${API_URL}/technicians/${id}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        console.error(data.message || "Erro ao deletar técnico.");
        return;
      }

      setCalleds(prev => prev.filter(t => t.id !== id));

      setDeleteTechModalOpen(false);
      setSelectedTechId(null);
      setSelectedTechName(null);

    } catch (err) {
      console.error("Erro desconhecido ao deletar o técnico.", err);
    }
  };

  if (userType !== "admin") {
    return (
      <div className="mt-7 sm:mt-13 ml-6 lg:ml-12">
        <h1 className="text-blue-dark text-xl font-bold mb-6">
          Área exclusiva para admins
        </h1>
        <p className="text-gray-300 mb-4">Apenas admins.</p>

        <a
          onClick={() =>
            navigate(userType === "client" ? "/calleds" : "/calleds_technicians")
          }
          className="inline-flex items-center justify-center w-20 h-7 text-gray-200 bg-gray-500 rounded-sm hover:bg-gray-400 cursor-pointer"
        >
          Outros
        </a>
      </div>
    );
  }

  // 🟢 ÁREA DE ADMINS
  return (
    <div>
      <div className="flex justify-between mb-6 ml-6 mr-6 lg:ml-12 lg:mr-12">
        <h1 className="text-blue-dark text-xl font-bold">Técnicos</h1>

        <a onClick={() => navigate("/technicians_create")} className="inline-flex items-center justify-center px-2 h-7 text-gray-600 bg-gray-200 hover:bg-gray-100 cursor-pointer rounded-sm gap-1">
          
          <img src={Plus} className="w-3.5 h-3.5" />
          <span>Novo</span>
        </a>
      </div>

      <ul className="max-w-full border border-gray-500 rounded-[10px] pt-3 pb-0 ml-6 lg:ml-12 mr-6 lg:mr-12">
        
        <li className="w-full grid grid-cols-4 md:grid-cols-5 gap-2 border-b border-gray-500 py-2 px-3 items-center">
          <span className="text-gray-400">Nome</span>
          <span className="text-gray-400 hidden md:block">Email</span>
          <span className="text-gray-400">Disp.</span>
          <span className="text-gray-400 text-center">Editar</span>
          <span className="text-gray-400 text-center">Excluir</span>
        </li>

        {/* Linhas */}
        {calleds.length > 0 ? (
          calleds.map((c) => (
            <li
              key={c.id}
              className="w-full grid grid-cols-4 md:grid-cols-5 gap-2 border-b border-gray-500 py-2 px-3 items-center"
            >
              {/* Nome + foto */}
              <div className="flex items-center gap-2 col-span-1">
                {c.photoUrl && (
                  <img
                    src={c.photoUrl} // Simplificado o uso do URL da foto
                    alt={c.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                )}
                <span className="font-bold truncate">{c.name}</span>
              </div>

              {/* Email */}
              <span className="hidden md:block truncate col-span-1">{c.email}</span>

              {/* Disponibilidade */}
              <div className="col-span-1">
                <Availability list={c.availability} />
              </div>

              {/* Botão editar */}
              <div className="flex justify-center col-span-1">
                <button
                  onClick={() => navigate(`/edit_technician/${c.id}`)}
                  className="inline-flex items-center justify-center w-7 h-7 bg-gray-500 hover:bg-gray-400 rounded-sm"
                >
                  {/* Usando o ícone Pencil do Lucide */}
                  <img src={PenLine} className="w-3.5 h-3.5 text-gray-200" />
                </button>
              </div>

              {/* Botão excluir (chamando openDeleteModal) */}
              <div className="flex justify-center col-span-1">
                <button
                  onClick={() => openDeleteModal(c)}
                  className="inline-flex items-center justify-center w-7 h-7 bg-gray-500 hover:bg-feedback-danger/50 rounded-sm"
                >
                  {/* Usando o ícone Trash2 do Lucide */}
                  <img src={Trash} className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>

            </li>
          ))
        ) : (
          <li className="text-gray-400 italic text-center py-4 border-b border-gray-600">
            Nenhum técnico encontrado.
          </li>
        )}
      </ul>

      {/* Modal de Confirmação de Exclusão de Técnico */}
      {deleteTechModalOpen && selectedTechId && selectedTechName && (
        <div className="fixed inset-0 bg-modal/50 flex items-center justify-center z-50">
          <div className="bg-gray-600 w-[90%] max-w-[440px] shadow-xl rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-500 px-7 py-5">
              <span className="text-gray-200">Excluir cliente</span>
              <button
                onClick={() => setDeleteTechModalOpen(false)}
                onMouseEnter={() => setHoverClose(true)}
                onMouseLeave={() => setHoverClose(false)}
                className="w-6 h-6 rounded-[5px] hover:bg-gray-500 flex items-center justify-center"
              >
                <img src={hoverClose ? CloseHover : CloseDefault} alt="Fechar" className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="px-7 py-5 border-b border-gray-500">
              <span className="text-md text-gray-200 block mb-5">
                Deseja realmente excluir <strong>{selectedTechName}</strong>?
              </span>
              <p className="text-gray-200 text-md mb-8">
                Ao excluir, todos os chamados deste técnico serão removidos e esta ação não poderá ser desfeita.
              </p>
            </div>
            <div className="m-6 flex gap-2">
              <button
                onClick={() => setDeleteTechModalOpen(false)}
                className="w-full bg-gray-500 hover:bg-gray-400 rounded-[5px] px-3 py-2 text-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => selectedTechId && deleteTechnician(selectedTechId)}
                className="w-full bg-gray-200 hover:bg-gray-100 rounded-[5px] px-3 py-2 text-gray-600"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}