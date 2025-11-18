import { Router } from "express";
import { AuthController } from "@/controllers/AuthController";
import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post("/", ensureAuthenticated, (req, res) =>
  authController.logout(req, res)
);

export { authRoutes };
