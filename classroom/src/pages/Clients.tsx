import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

import PenLine from "../assets/icons/pen-line.svg";
import Trash from "../assets/icons/trash.svg";
import CloseDefault from "../assets/icons/x-default.svg";
import CloseHover from "../assets/icons/icons-hover/x-hover.svg";

interface Client {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const getFullPhotoUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http")) {
    return url;
  }

  const finalUrl = url.startsWith('/') ? url.substring(1) : url;
  return `${API_URL}/${finalUrl}`;
};

export function Clients() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [clients, setClients] = useState<Client[]>([]);
  const navigate = useNavigate();
  const [userType] = useState(localStorage.getItem("userType") || "");

  const [deleteClientModalOpen, setDeleteClientModalOpen] = useState(false);
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [hoverClose, setHoverClose] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Carrega clientes do backend
  useEffect(() => {
    async function loadClients() {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Você precisa estar logado!");
        return;
      }

      try {
        const url = userType === "admin"
          ? `${API_URL}clients`
          : `${API_URL}services`;

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Erro ao buscar clientes");
        }

        const data = await response.json();
        setClients(data ?? []);
      } catch (err: any) {
        alert(err.message);
        console.error(err);
      }
    }

    loadClients();
  }, [userType]);

  // Ao clicar em "Editar"
  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setSelectedClientId(client.id);
    setEditName(client.name);
    setEditEmail(client.email);
    setEditClientModalOpen(true);
  };

  // Salvar alterações
  const saveEditClient = async () => {
    if (!selectedClientId) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Você precisa estar logado!");

      const body = { name: editName, email: editEmail };

      const response = await fetch(`${API_URL}clients/${selectedClientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao editar cliente");
      }

      // Recebe o cliente atualizado (se o backend retornar o objeto com a foto completa)
      const updatedClient = await response.json();

      // Atualiza lista local, usando o objeto retornado do backend
      setClients(prev =>
        prev.map(c => (c.id === selectedClientId ? updatedClient : c))
      );

      // Fecha modal e limpa estados
      setEditClientModalOpen(false);
      setSelectedClient(null);
      setSelectedClientId(null);
      setEditName("");
      setEditEmail("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Excluir cliente
  const deleteClient = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Você precisa estar logado!");

      await fetch(`${API_URL}clients/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      // Atualiza lista local
      setClients(prev => prev.filter(c => c.id !== id));
      setDeleteClientModalOpen(false);
      setSelectedClient(null);
      setSelectedClientId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (userType !== "admin") {
    return (
      <div className="mt-7 sm:mt-13 ml-6 lg:ml-12">
        <h1 className="text-blue-dark text-xl font-bold mb-6">
          Área exclusiva para admins
        </h1>
        <p className="text-gray-300">Apenas admins.</p>
        {userType === "client" ? (
          <button
            onClick={() => navigate("/calleds")}
            className="inline-flex items-center justify-center w-20 h-7 text-gray-200 bg-gray-500 rounded-sm hover:text-gray-100 hover:bg-gray-400"
          >
            Outros
          </button>
        ) : (
          <button
            onClick={() => navigate("/calleds_technicians")}
            className="inline-flex items-center justify-center w-20 h-7 text-gray-200 bg-gray-500 rounded-sm hover:text-gray-100 hover:bg-gray-400"
          >
            Outros
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-6 ml-6 mr-6 lg:ml-12 lg:mr-12">
        <h1 className="text-blue-dark text-xl font-bold">Clientes</h1>
      </div>

      <ul className="max-w-full border border-gray-500 rounded-[10px] pt-3 pb-0 ml-6 lg:ml-12 mr-6 lg:mr-12">
        {/* Cabeçalho */}
        <li className="w-full grid grid-cols-3 gap-2 border-b border-gray-500 py-2 px-3 items-center">
          <span className="text-gray-400">Nome</span>
          <span className="text-gray-400">Email</span>
        </li>

        {/* Linhas de clientes */}
        {clients.length > 0 ? (
          clients.map(c => {
            // 📸 Formata a URL da foto para exibição na lista
            const photoUrlList = getFullPhotoUrl(c.photoUrl);

            return (
              <li key={c.id} className="w-full grid grid-cols-3 gap-4 border-b border-gray-500 py-2 px-3 items-center">
                <div className="flex items-center gap-2">
                  {/* Verifica se photoUrlList não é undefined antes de renderizar */}
                  {photoUrlList && (
                    <img
                      src={photoUrlList} // <-- USANDO A URL FORMATADA (string | undefined)
                      alt={c.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  )}
                  <span className="font-bold truncate">{c.name}</span>
                </div>

                <span className="truncate">{c.email}</span>

                <div className="flex justify-end gap-2">
                  {/* Excluir */}
                  <button
                    onClick={() => {
                      setSelectedClientId(c.id);
                      setSelectedClient(c);
                      setDeleteClientModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center w-7 h-7 bg-gray-500 hover:bg-gray-400 cursor-pointer rounded-sm"
                  >
                    <img src={Trash} alt="trash" className="w-3.5 h-3.5" />
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => handleEditClick(c)}
                    className="inline-flex items-center justify-center w-7 h-7 bg-gray-500 hover:bg-gray-400 cursor-pointer rounded-sm"
                  >
                    <img src={PenLine} alt="pen" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })
        ) : (
          <li className="text-gray-400 italic text-center py-4 border-b border-gray-600">
            Nenhum cliente encontrado.
          </li>
        )}
      </ul>

      {/* Modal Excluir */}
      {deleteClientModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-modal/50 flex items-center justify-center z-50">
          <div className="bg-gray-600 w-[90%] max-w-[440px] shadow-xl rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-500 px-7 py-5">
              <span className="text-gray-200">Excluir cliente</span>
              <button
                onClick={() => setDeleteClientModalOpen(false)}
                onMouseEnter={() => setHoverClose(true)}
                onMouseLeave={() => setHoverClose(false)}
                className="w-6 h-6 rounded-[5px] hover:bg-gray-500 flex items-center justify-center"
              >
                <img src={hoverClose ? CloseHover : CloseDefault} alt="Fechar" className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="px-7 py-5 border-b border-gray-500">
              <span className="text-md text-gray-200 block mb-5">
                Deseja realmente excluir <strong>{selectedClient.name}</strong>?
              </span>
              <p className="text-gray-200 text-md mb-8">
                Ao excluir, todos os chamados deste cliente serão removidos e esta ação não poderá ser desfeita.
              </p>
            </div>
            <div className="m-6 flex gap-2">
              <button
                onClick={() => setDeleteClientModalOpen(false)}
                className="w-full bg-gray-500 hover:bg-gray-400 rounded-[5px] px-3 py-2 text-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => selectedClientId && deleteClient(selectedClientId)}
                className="w-full bg-gray-200 hover:bg-gray-100 rounded-[5px] px-3 py-2 text-gray-600"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editClientModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-modal/50 flex items-center justify-center z-50">
          <div className="bg-gray-600 w-[90%] max-w-[440px] shadow-xl rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-500 px-7 py-5">
              <span className="text-gray-200">Editar Cliente</span>
              <button
                onClick={() => setEditClientModalOpen(false)}
                onMouseEnter={() => setHoverClose(true)}
                onMouseLeave={() => setHoverClose(false)}
                className="w-6 h-6 rounded-[5px] hover:bg-gray-500 flex items-center justify-center"
              >
                <img src={hoverClose ? CloseHover : CloseDefault} alt="Fechar" className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex flex-col px-7 pb-8 pt-7 border-b border-gray-500">
              {/* 📸 Formata a URL da foto para exibição no modal */}
              {/* Verifica se o retorno da função não é undefined antes de renderizar */}
              {getFullPhotoUrl(selectedClient.photoUrl) && (
                <img
                  src={getFullPhotoUrl(selectedClient.photoUrl)} // <-- USANDO A URL FORMATADA (string | undefined)
                  alt="Cliente"
                  className="w-20 h-20 rounded-full object-cover mb-4"
                />
              )}


              <label className="text-gray-300 text-xxs mb-1">Nome</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                type="text"
                className="w-full py-2 mb-4 rounded border-b border-gray-500 text-gray-200 focus:outline-none focus:border-b-blue-dark"
              />

              <label className="text-gray-300 text-xxs mb-1">Email</label>
              <input
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                type="email"
                className="w-full py-2 mb-4 rounded border-b border-gray-500 text-gray-200 focus:outline-none focus:border-b-blue-dark"
              />
            </div>

            <div className="px-6 py-7">
              <button
                onClick={saveEditClient}
                className="w-full py-3 rounded-[5px] bg-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}