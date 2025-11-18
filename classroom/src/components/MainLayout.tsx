import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./NavBar";

export function MainLayout() {
  const location = useLocation();

  const noNavbarRoutes = ["/login", "/register", "/reset", "/404"];
  const hideNavbar = noNavbarRoutes.includes(location.pathname);

  return (
    <div
      className="
        h-screen w-full bg-white
        flex flex-col        /* MOBILE: navbar em cima */
        md:flex-row          /* DESKTOP: navbar à esquerda */
      "
    >
      {/* NAVBAR */}
      {!hideNavbar && (
        <div
          className="
            w-full               /* MOBILE: ocupa 100% da largura */
            md:w-1/3             /* DESKTOP: sidebar */
            lg:w-1/6
            md:h-screen          /* DESKTOP: ocupa toda a altura */
            md:border-r border-gray-200
            bg-gray-50
          "
        >
          <Navbar />
        </div>
      )}

      {/* CONTEÚDO */}
      <div
        className={`
          ${hideNavbar ? "w-full" : "w-full md:w-5/6"}
          flex-1 p-6 overflow-y-auto
        `}
      >
        <Outlet />
      </div>
    </div>
  );
}
