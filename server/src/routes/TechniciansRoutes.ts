import { Router } from "express";
import { TechniciansController } from "@/controllers/TechniciansController";
import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/VerifyUserAuthorization";
import { upload } from "@/configs/Multer";

const techniciansRoutes = Router();
const techniciansController = new TechniciansController();

techniciansRoutes.use(ensureAuthenticated);

// ==============================
// FOTO DO TÉCNICO
// ==============================

// Upload da foto
techniciansRoutes.put(
  "/:technicianId/photo/upload",
  verifyUserAuthorization(["admin", "technician"]),
  upload.single("photo"),
  techniciansController.uploadProfileImage.bind(techniciansController)
);

// Remover foto
techniciansRoutes.delete(
  "/:technicianId/photo/remove",
  verifyUserAuthorization(["admin", "technician"]),
  techniciansController.deleteProfileImage.bind(techniciansController)
);

// ==============================
// OUTRAS ROTAS
// ==============================

techniciansRoutes.put(
  "/availability/:id",
  verifyUserAuthorization(["admin", "technician"]),
  techniciansController.toggleAvailability.bind(techniciansController)
);

techniciansRoutes.patch(
  "/:id/update",
  verifyUserAuthorization(["admin", "technician"]),
  techniciansController.update.bind(techniciansController)
);

techniciansRoutes.delete(
  "/:id/delete",
  verifyUserAuthorization(["admin", "technician"]),
  techniciansController.remove.bind(techniciansController)
);

techniciansRoutes.post(
  "/",
  verifyUserAuthorization(["admin"]),
  techniciansController.create.bind(techniciansController)
);

techniciansRoutes.get(
  "/",
  verifyUserAuthorization(["admin"]),
  techniciansController.index.bind(techniciansController)
);

techniciansRoutes.get(
  "/details/:id",
  verifyUserAuthorization(["admin"]),
  techniciansController.details.bind(techniciansController)
);

export { techniciansRoutes };
