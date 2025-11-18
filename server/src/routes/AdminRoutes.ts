import { Router } from "express";
import { prisma } from "@/database/Prisma";
import { AdminsController } from "@/controllers/AdminsController";
import { verifyUserAuthorization } from "@/middlewares/VerifyUserAuthorization";
import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";

const adminsRoutes = Router();
const adminsController = new AdminsController();

import { upload } from "@/configs/Multer";

adminsRoutes.use(ensureAuthenticated);
adminsRoutes.use(verifyUserAuthorization(["admin"]));
adminsRoutes.post("/", (req, res) => adminsController.create(req, res));
adminsRoutes.get("/", (req, res) => adminsController.index(req, res));
adminsRoutes.patch("/:id", (req, res) => adminsController.update(req, res));
adminsRoutes.delete("/:id", (req, res) => adminsController.remove(req, res));
adminsRoutes.put("/:id/photo/upload", upload.single("photo"), adminsController.uploadProfileImage)
adminsRoutes.delete("/:id/photo/remove", async (req, res) => {
  const { id } = req.params;

  await prisma.admin.update({
    where: { id },
    data: { photoUrl: null }
  });

  return res.json({ message: "Foto removida", photoUrl: null });
});

export { adminsRoutes };
