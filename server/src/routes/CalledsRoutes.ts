import { Router } from "express";
import { CalledsController } from "@/controllers/CalledsController";

import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/VerifyUserAuthorization";

const calledsRoutes = Router();
const calledsController = new CalledsController();

calledsRoutes.use(ensureAuthenticated);
calledsRoutes.get("/details/:id", calledsController.details)
calledsRoutes.post("/", verifyUserAuthorization(["client"]), calledsController.create);
calledsRoutes.get("/client", verifyUserAuthorization(["client"]), calledsController.index);
calledsRoutes.get("/technician", verifyUserAuthorization(["technician"]), calledsController.indexByTechnician);
calledsRoutes.get("/", verifyUserAuthorization(["admin"]), calledsController.indexByAdmin);
calledsRoutes.put("/:id", verifyUserAuthorization(["technician"]), calledsController.updateServices);
calledsRoutes.put("/:id/status", verifyUserAuthorization(["admin", "technician"]), calledsController.updateStatus);

export { calledsRoutes }