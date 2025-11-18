import { Router } from "express";
import { prisma } from "@/database/Prisma";
import { ClientsController } from "@/controllers/ClientsController";
import { ensureGuestOnly } from "@/middlewares/EnsureGuestOnly";

import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/VerifyUserAuthorization";

import { upload } from "@/configs/Multer";

const clientsRoutes = Router();
const clientsController = new ClientsController();

clientsRoutes.post("/", ensureGuestOnly, (req, res) =>
  clientsController.create(req, res)
);
clientsRoutes.get("/", (req, res) => clientsController.index(req, res));
clientsRoutes.use(ensureAuthenticated);
clientsRoutes.use(verifyUserAuthorization(["admin", "client"]));
clientsRoutes.patch("/:id", (req, res) => clientsController.update(req, res));
clientsRoutes.put("/:clientId/photo/upload", upload.single("photo"), (req, res) => clientsController.uploadProfileImage(req, res));
clientsRoutes.delete("/:id", (req, res) => clientsController.remove(req, res));
clientsRoutes.delete("/:id/photo/remove", async (req, res) => {
  const { id } = req.params;

  // zere o campo no banco
  await prisma.client.update({
    where: { id },
    data: { photoUrl: null }
  });

  return res.json({ message: "Foto removida", photoUrl: null });
});
export { clientsRoutes };
