import { Link, useLocation } from "react-router-dom";
import { useState, useRef } from "react";

import ClipboardList from "../assets/icons/clipboard-list-default.svg";
import Users from "../assets/icons/users-default.svg";
import Briefcase from "../assets/icons/briefcase-business-default.svg";
import Wrench from "../assets/icons/wrench-default.svg";
import Plus from "../assets/icons/plus-default.svg";
import Logo from "../assets/icon-dark.svg";

import ClipboardListHover from "../assets/icons/icons-hover/clipboard-list-hover.svg";
import UsersHover from "../assets/icons/icons-hover/users-hover.svg";
import BriefcaseHover from "../assets/icons/icons-hover/briefcase-business-hover.svg";
import WrenchHover from "../assets/icons/icons-hover/wrench-hover.svg";
import PlusHover from "../assets/icons/icons-hover/plus-hover.svg";

import ClipboardListActive from "../assets/icons/icons-active/clipboard-list-active.svg";
import UsersActive from "../assets/icons/icons-active/users-active.svg";
import BriefcaseActive from "../assets/icons/icons-active/briefcase-business-active.svg";
import WrenchActive from "../assets/icons/icons-active/wrench-active.svg";
import PlusActive from "../assets/icons/icons-active/plus-active.svg";

import CircleUser from "../assets/icons/circle-user-white.svg";
import CircleUserHover from "../assets/icons/icons-hover/circle-user-hover.svg";

import Logout from "../assets/icons/log-out-red.svg";

import MenuIcon from "../assets/icons/menu.svg";
import CloseIcon from "../assets/icons/x.svg";
import CloseDefault from "../assets/icons/x-default.svg";
import CloseHover from "../assets/icons/icons-hover/x-hover.svg";

import uploadIcon from "../assets/icons/upload.svg";
import hoverUpload from "../assets/icons/icons-hover/upload-hover.svg";
import TrashRed from "../assets/icons/trash.svg";

export function Navbar() {
  const location = useLocation();
  const [userType] = useState(localStorage.getItem("userType") || "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const availability = JSON.parse(localStorage.getItem("availability") || "[]");


  const [hoverClose, setHoverClose] = useState(false);
  const [uploadHover, setUploadHover] = useState(false);
  const [deletePhoto, setDeletePhoto] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);



  // REFERÊNCIA DO INPUT DE IMAGEM
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userPhoto = localStorage.getItem("userPhoto") || undefined;
  const userName = localStorage.getItem("userName") || "Usuário";
  const userEmail = localStorage.getItem("userEmail") || "";
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);



  const API_URL = import.meta.env.VITE_API_URL;

  const defaultAvatar = "/assets/Avatar.png"; // pasta public do frontend
  const avatarToShow = userPhoto
    ? (userPhoto.startsWith("http") ? userPhoto : `${API_URL}${userPhoto}`)
    : defaultAvatar;



  type NavItem = {
    icon: string;
    iconHover: string;
    iconActive: string;
    name: string;
    path: string;
  };

  let navItems: NavItem[] = [];

  if (userType === "admin") {
    navItems = [
      { icon: ClipboardList, iconHover: ClipboardListHover, iconActive: ClipboardListActive, name: "Chamados", path: "/calleds" },
      { icon: Users, iconHover: UsersHover, iconActive: UsersActive, name: "Técnicos", path: "/technicians" },
      { icon: Briefcase, iconHover: BriefcaseHover, iconActive: BriefcaseActive, name: "Clientes", path: "/clients" },
      { icon: Wrench, iconHover: WrenchHover, iconActive: WrenchActive, name: "Serviços", path: "/services" },
    ];
  }

  if (userType === "technician") {
    navItems = [
      { icon: ClipboardList, iconHover: ClipboardListHover, iconActive: ClipboardListActive, name: "Meus chamados", path: "/calleds_technicians" },
    ];
  }

  if (userType === "client") {
    navItems = [
      { icon: ClipboardList, iconHover: ClipboardListHover, iconActive: ClipboardListActive, name: "Meus chamados", path: "/calleds_clients" },
      { icon: Plus, iconHover: PlusHover, iconActive: PlusActive, name: "Criar chamado", path: "/calleds_create" },
    ];
  }

  function HoverableUserItem() {
    const [hover, setHover] = useState(false);

    function handleClick() {
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        setModalOpen(false);
      }

      setProfileModalOpen(true);
    }

    return (
      <div
        className="flex items-center gap-2 py-2 rounded hover:bg-gray-200 cursor-pointer group mt-4"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={handleClick}
      >
        <img src={hover ? CircleUserHover : CircleUser} className="w-5 h-5" />
        <span className="text-md text-gray-500 group-hover:text-gray-400">Perfil</span>
      </div>
    );
  }

  function handleProfileToggle() {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      setModalOpen(true);
      setTimeout(() => setModalOpen(false), 150);
    } else {
      setModalOpen(prev => !prev);
    }
  }

  async function handleSaveProfile() {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const localUserType = localStorage.getItem("userType");

    if (!userId || !token) {
      alert("Usuário não autenticado");
      return;
    }

    let uploadUrl = "";
    let deleteUrl = "";

    if (localUserType === "client") {
      uploadUrl = `${API_URL}/clients/${userId}/photo/upload`;
      deleteUrl = `${API_URL}/clients/${userId}/photo/remove`;
    }

    if (localUserType === "technician") {
      uploadUrl = `${API_URL}/technicians/${userId}/photo/upload`;
      deleteUrl = `${API_URL}/technicians/${userId}/photo/remove`;
    }

    if (localUserType === "admin") {
      uploadUrl = `${API_URL}/admins/${userId}/photo/upload`;
      deleteUrl = `${API_URL}/admins/${userId}/photo/remove`;
    }

    // === DELETAR FOTO
    if (deletePhoto) {
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        alert("Erro ao remover imagem");
        return;
      }

      localStorage.removeItem("userPhoto");
    }

    // === ENVIAR NOVA FOTO
    if (newPhotoFile) {
      const formData = new FormData();
      formData.append("photo", newPhotoFile);

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        alert("Erro ao enviar imagem");
        return;
      }

      const data = await response.json();
      localStorage.setItem("userPhoto", data.photoUrl);
    }

    setDeletePhoto(false);
    setNewPhotoFile(null);
    setProfileModalOpen(false);
    window.location.reload();
  }


  async function handleChangePassword() {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");

    if (!userId || !token) {
      alert("Usuário não autenticado");
      return;
    }

    const url = `${API_URL}/${userType}s/${userId}/password`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        userType: localStorage.getItem("userType")
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Erro ao alterar senha");
      return;
    }

    alert("Senha alterada com sucesso!");
    setPasswordModalOpen(false);
  }

  return (
    <nav className="bg-gray-100 w-full h-full flex flex-col relative">

      {/* HEADER */}
      <div className="px-4 md:px-3 lg:px-4 py-3 md:py-6 flex items-center justify-between w-full">

        <button
          className="md:hidden p-2.5 bg-gray-200 cursor-pointer rounded-[5px]"
          onClick={() => setMobileOpen(prev => !prev)}
        >
          <img src={mobileOpen ? CloseIcon : MenuIcon} className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <img className="w-11 h-11" src={Logo} />
          <div>
            <h1 className="text-lg font-bold text-gray-600">HelpDesk</h1>
            <span className="text-blue-light text-xxs uppercase">
              {userType === "client"
                ? "cliente"
                : userType === "technician"
                  ? "técnico"
                  : "admin"}
            </span>
          </div>
        </div>

        <img
          src={avatarToShow}
          className="w-10 h-10 rounded-full object-cover md:hidden cursor-pointer"
          onClick={() => setModalOpen(!modalOpen)}
        />
      </div>

      {/* MENU */}
      <div className={`md:block ${mobileOpen ? "block" : "hidden"} border-t border-gray-200 md:border-none flex-1`}>
        <ul className="flex flex-col gap-1 p-4 md:p-0">
          {navItems.map((item) => {
            const [hover, setHover] = useState(false);
            const isActive = location.pathname === item.path;
            const iconToShow = isActive ? item.iconActive : hover ? item.iconHover : item.icon;

            return (
              <li key={item.path} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <Link
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-[5px] transition-colors duration-200 ${isActive
                    ? "text-gray-600 bg-blue-dark"
                    : "text-gray-400 hover:text-gray-500 bg-gray-100 hover:bg-gray-200"
                    }`}
                >
                  <img src={iconToShow} className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* FOOTER DESKTOP */}
      <div
        className="hidden md:flex items-center gap-3 p-4 mt-auto border-t border-gray-300 cursor-pointer"
        onClick={handleProfileToggle}
      >
        <img src={avatarToShow} className="w-12 h-12 rounded-full object-cover" />
        <div className="flex flex-col max-w-[140px]">
          {/* Nome: truncar se for longo */}
          <span className="text-gray-600 text-sm truncate">{userName}</span>

          {/* E-mail: quebrar linha normalmente */}
          <span className="text-gray-400 lg:text-xxs text-xs wrap-break-words">{userEmail}</span>
        </div>

      </div>

      {/* MODAL DROPDOWN */}
      {modalOpen && (
        <div
          className="absolute bg-gray-100 shadow-lg px-4 py-5 z-50 md:left-full md:top-111 md:mt-4 md:ml-2 top-full mt-2 w-full md:w-[200px] rounded-[10px]"
        >
          <span className="text-xxs text-gray-400 uppercase">Opções</span>

          <HoverableUserItem />

          <button
            className="flex gap-2 mt-2 text-feedback-danger rounded hover:bg-gray-200 py-2.5 w-full"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
          >
            <img className="w-5 h-5" src={Logout} />
            Sair
          </button>
        </div>
      )}

      {/* MODAL CENTRAL PERFIL */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-modal/50 bg-opacity-40 flex items-center justify-center z-999">
          <div className="bg-gray-600 w-[90%] max-w-[358px] shadow-xl">

            <div className="flex items-center justify-between border-b border-b-gray-500 px-7 py-5">
              <span className="text-md text-gray-200">Perfil</span>

              <button
                className="w-6 h-6 rounded-[5px] hover:bg-gray-500 flex items-center justify-center"
                onClick={() => setProfileModalOpen(false)}
                onMouseEnter={() => setHoverClose(true)}
                onMouseLeave={() => setHoverClose(false)}
              >
                <img src={hoverClose ? CloseHover : CloseDefault} className="w-4.5 h-4.5" />
              </button>
            </div>
            <div>
              <div className="p-7 flex items-center gap-4">

                {/* Foto */}
                <img className="w-12 h-12 rounded-full object-cover" src={avatarToShow} />

                {/* div dos botões */}

                <div className="flex gap-2">

                  {/* INPUT INVISÍVEL */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setNewPhotoFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {/* BOTÃO NOVA IMAGEM */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    onMouseEnter={() => setUploadHover(true)}
                    onMouseLeave={() => setUploadHover(false)}
                    className="group flex items-center gap-2 bg-gray-500 hover:bg-gray-400 p-2 rounded-[5px] cursor-pointer h-7"
                  >
                    <img src={uploadHover ? hoverUpload : uploadIcon} className="w-3.5 h-3.5" />
                    <span className="text-gray-200 text-xs group-hover:text-gray-100">
                      Nova imagem
                    </span>
                  </button>

                  {/* BOTÃO EXCLUIR */}
                  <button
                    onClick={() => {
                      setDeletePhoto(true);  // marca para apagar
                      setNewPhotoFile(null); // descarta alguma imagem escolhida
                    }}
                    className="w-7 h-7 rounded-[5px] bg-gray-500 hover:bg-gray-400 flex items-center justify-center cursor-pointer"
                  >
                    <img src={TrashRed} />
                  </button>



                </div>
              </div>

              <div className="grid grid-cols-1 px-7 ">

                <div className="grid grid-cols-1  border-b border-b-gray-500 my-4">
                  <span className="text-xxs text-gray-300 uppercase">Nome</span>
                  <span className=" pt-2 pb-3">{userName}</span>
                </div>
                <div className="grid grid-cols-1 border-b border-b-gray-500 my-4">

                  <span className="text-xxs text-gray-300 uppercase">e-mail</span>
                  <span className=" py-2">{userEmail}</span>

                </div>
                <span className="text-xxs text-gray-300 uppercase">senha</span>

                <div className="flex justify-between pt-2 pb-3  border-b border-b-gray-500 mb-6">
                  <span className="">••••••••</span>

                  <button
                    onClick={() => {
                      setProfileModalOpen(false);   // fecha o modal atual
                      setPasswordModalOpen(true);   // abre o novo modal
                    }}
                    className="group flex items-center gap-2 bg-gray-500 hover:bg-gray-400 p-2 rounded-[5px] cursor-pointer h-7"
                  >
                    <span className="text-gray-200 text-xs group-hover:text-gray-100">
                      Alterar
                    </span>
                  </button>

                </div>


                {userType === "technician" && (
                  <div>
                    <div className="mb-3">
                      <span className="text-sm text-gray-200">Disponibilidade</span>
                      <p className="text-xs text-gray-300">Horários de atendimento definidos pelo admin</p>
                    </div>

                    <ul className="flex gap-2 mt-2 flex-wrap">
                      {availability.length === 0 ? (
                        <span className="text-gray-400 text-xs">Nenhum horário definido</span>
                      ) : (
                        availability.map((hour: string) => (
                          <li
                            key={hour}
                            className=" text-gray-400 border border-gray-500 px-3 py-1 w-fit text-xs rounded-full cursor-not-allowed"
                          >
                            {hour}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}


                <button
                  onClick={handleSaveProfile}
                  className="group inline-flex items-center justify-center text-xs rounded-[5px] w-auto h-auto py-2.5 gap-1 bg-gray-200 cursor-pointer text-gray-600 hover:bg-gray-100 my-6"
                >
                  <span className="text-sm text-gray-600">Salvar</span>
                </button>


              </div>


            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTERAR SENHA */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-modal/50 bg-opacity-40 flex items-center justify-center z-999">
          <div className="bg-gray-600 w-[90%] max-w-[440px] shadow-xl rounded-[10px]">

            <div className="flex items-center justify-between border-b border-b-gray-500 px-7 py-5">
              <span className="text-md text-gray-200">Alterar senha</span>

              <button
                onClick={() => setPasswordModalOpen(false)}
                className="w-6 h-6 rounded-[5px] hover:bg-gray-500 flex items-center justify-center"
              >
                <img src={hoverClose ? CloseHover : CloseDefault} className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-7 flex flex-col gap-4">

              <div className="flex flex-col group">
                <label htmlFor="id_current_password" className="text-xxs text-gray-300 uppercase group-focus-within:text-blue-dark">Senha atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  name="current_password"
                  id="id_current_password"
                  className="w-full mt-2 py-2 rounded text-gray-200   border-b border-b-gray-500 focus:border-b-blue-dark focus:outline-none"
                />
              </div>

              <div className="group">
                <label htmlFor="id_new_password" className="text-xxs text-gray-300 uppercase group-focus-within:text-blue-dark">Nova senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  name="new_password"
                  id="id_new_password"
                  placeholder="Digite sua nova senha"
                  className="w-full mt-2 p-2 rounded border-b border-b-gray-500 text-gray-200 outline-none focus:border-b-blue-dark focus:outline-none"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="group inline-flex items-center justify-center text-xs rounded-[5px] w-auto h-auto py-2.5 gap-1 bg-gray-200 cursor-pointer text-gray-600 hover:bg-gray-100 mt-2"
              >
                <span className="text-sm text-gray-600">Salvar</span>
              </button>


            </div>
          </div>
        </div>
      )}

    </nav>
  );
}
