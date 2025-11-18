import { Routes, Route } from "react-router-dom";

import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { MainLayout } from "../components/MainLayout";

import { Clients } from "../pages/Clients";
import { Technicians } from "../pages/Technicians";
import { Services } from "../pages/Services";

import { Calleds } from "../pages/Calleds";
import { CalledsTechnicians } from "../pages/CalledsTechnicians";
import { CalledsClients } from "../pages/CalledsClients";
import { CreateCalled } from "../pages/CreateCalled";
import { DetailsCalleds } from "../pages/DetailsCalleds";

import { EditTechnician } from "../pages/EditTechnician";
import { CreateTechnician } from "../pages/CreateTechnician";


export function AppRoutes() {
  return (
    <Routes>

      {/* Rotas SEM navbar */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rotas COM layout (Navbar + Conteúdo) */}

      <Route element={<MainLayout />}>
        <Route path="/clients" element={<Clients />} />
        <Route path="/technicians" element={<Technicians />} />
        <Route path="/services" element={<Services />} />

        <Route path="/calleds" element={<Calleds />} />
        <Route path="/calleds_technicians" element={<CalledsTechnicians />} />
        <Route path="/calleds_clients" element={<CalledsClients />} />
        <Route path="/calleds/details/:id" element={<DetailsCalleds />} />

        <Route path="/edit_technician/:id" element={<EditTechnician />} />
        <Route path="/technicians_create" element={<CreateTechnician />} />
        <Route path="/calleds_create" element={<CreateCalled />} />

      </Route>

    </Routes>
  );
}
