import { Router } from "express";
import { ServicesController } from "@/controllers/ServicesController";

import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/VerifyUserAuthorization";

const servicesRoutes = Router();
const servicesController = new ServicesController();

servicesRoutes.use(ensureAuthenticated);
servicesRoutes.post("/additional_service/:id", verifyUserAuthorization(["technician"]), servicesController.createAdditionalService)

// ROTAS ESPECÍFICAS PRIMEIRO
servicesRoutes.patch("/:id/reactivate", verifyUserAuthorization(["admin"]), servicesController.reactivate);
servicesRoutes.delete("/:id/delete", verifyUserAuthorization(["admin", "technician"]), servicesController.deleteService);

// ROTAS GENÉRICAS DEPOIS
servicesRoutes.post("/", servicesController.create);
servicesRoutes.get("/", servicesController.index);
servicesRoutes.patch("/:id", servicesController.update);
servicesRoutes.delete("/:id", servicesController.delete);
export { servicesRoutes }
