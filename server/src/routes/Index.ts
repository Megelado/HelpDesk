import { Router } from "express";

import { PasswordController } from "@/controllers/PasswordController";

import { loginRoutes } from "./LoginRoutes";
import { authRoutes } from "./AuthRoutes";

import { clientsRoutes } from "./ClientsRoutes";
import { techniciansRoutes } from "./TechniciansRoutes";
import { adminsRoutes } from "./AdminRoutes";
import { uploadRoutes } from "./UploadRoutes";

import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";

import path from "path";
import fs from "fs";
import express from "express";
import { servicesRoutes } from "./ServicesRoutes";
import { calledsRoutes } from "./CalledsRoutes";


const routes = Router();
routes.get("/upload/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;

  const allowedFolders = ["clients", "technicians", "admins"];
  if (!allowedFolders.includes(folder)) {
    return res.status(403).json({ message: "Acesso negado a esta pasta." });
  }

  const filePath = path.resolve(__dirname, "../../uploads", folder, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Arquivo não encontrado." });
  }

  return res.sendFile(filePath);
});
routes.use("/login", loginRoutes);
routes.use("/logout", authRoutes);
routes.use("/clients", clientsRoutes)
routes.use("/technicians", techniciansRoutes)
routes.use("/admins", adminsRoutes)
routes.use("/upload", uploadRoutes);
routes.use("/services", servicesRoutes)
routes.use("/calleds", calledsRoutes);

const passwordController = new PasswordController();

routes.put("/admins/:id/password", ensureAuthenticated, passwordController.update)
routes.put("/clients/:id/password", ensureAuthenticated, passwordController.update)
routes.put("/technicians/:id/password", ensureAuthenticated, passwordController.update)



export { routes };
