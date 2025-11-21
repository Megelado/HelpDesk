import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { z } from "zod";
import { hash } from "bcrypt";
import { Prisma } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

// ===============================
// GET BASE URL (HTTPS em Render)
// ===============================
function getBaseUrl(req: Request) {
  const host = req.get("host");
  if (host?.includes("onrender.com")) return `https://${host}`;
  return `${req.protocol}://${host}`;
}

class AdminsController {

  // ===============================
  // FORMAT PHOTO URL (CORRIGIDO)
  // ===============================
  private formatAdminPhotoUrl(admin: {
    id: string;
    name: string;
    email: string;
    password?: string;
    photoUrl: string | null;
    createdAt: Date;
    updatedAt: Date | null;
  }, req: Request) {

    let fullPhotoUrl = null;

    if (admin.photoUrl) {
      if (admin.photoUrl.startsWith("http")) {
        fullPhotoUrl = admin.photoUrl;
      } else {
        fullPhotoUrl = `${getBaseUrl(req)}${admin.photoUrl}`;
      }
    }

    const { password, ...rest } = admin;
    return { ...rest, photoUrl: fullPhotoUrl };
  }

  // ===============================
  // CREATE
  // ===============================
  async create(req: Request, res: Response) {
    const bodySchema = z.object({
      name: z.string().trim().min(2),
      email: z.string().email(),
      password: z.string().min(6).max(32),
    });

    const { name, email, password } = bodySchema.parse(req.body);

    const emailInUse =
      (await prisma.admin.findFirst({ where: { email } })) ||
      (await prisma.technician.findFirst({ where: { email } })) ||
      (await prisma.client.findFirst({ where: { email } }));

    if (emailInUse) throw new AppError("Um usuário com esse email já existe!", 409);

    const hashedPassword = await hash(password, 8);

    const user = await prisma.admin.create({ data: { name, email, password: hashedPassword } });

    return res.status(201).json(this.formatAdminPhotoUrl(user, req));
  }

  // ===============================
  // INDEX
  // ===============================
  async index(req: Request, res: Response) {
    const admins = await prisma.admin.findMany({
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true, password: true, photoUrl: true }
    });

    return res.json(admins.map(a => this.formatAdminPhotoUrl(a, req)));
  }

  // ===============================
  // UPDATE
  // ===============================
  async update(req: Request, res: Response) {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const bodySchema = z.object({
      name: z.string().trim().min(2).optional(),
      email: z.string().email().optional(),
      password: z.string().min(6).optional(),
    });

    const { id } = paramsSchema.parse(req.params);
    const { name, email, password } = bodySchema.parse(req.body);

    const admin = await prisma.admin.findUnique({ where: { id } });
    if (!admin) throw new AppError("Administrador não encontrado!", 404);

    if (email && email !== admin.email) {
      const emailInUse =
        (await prisma.admin.findFirst({ where: { email, NOT: { id: admin.id } } })) ||
        (await prisma.technician.findFirst({ where: { email } })) ||
        (await prisma.client.findFirst({ where: { email } }));

      if (emailInUse) throw new AppError("Um usuário com esse email já existe!", 409);
    }

    const hashedPassword = password ? await hash(password, 8) : undefined;

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: { name: name ?? admin.name, email: email ?? admin.email, password: hashedPassword ?? admin.password }
    });

    return res.json(this.formatAdminPhotoUrl(updatedAdmin, req));
  }

  // ===============================
  // DELETE ADMIN
  // ===============================
  async remove(req: Request, res: Response) {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(req.params);

    const admin = await prisma.admin.findUnique({ where: { id }, select: { photoUrl: true } });
    if (!admin) throw new AppError("Admin não encontrado!", 404);

    if (admin.photoUrl) {
      const uploadFolder = path.resolve(__dirname, "..", "..", "..", "uploads");
      const fileName = admin.photoUrl.split("/").pop()!;
      const filePath = path.join(uploadFolder, "admins", fileName);
      try { await fs.unlink(filePath); } catch {}
    }

    await prisma.admin.delete({ where: { id } });
    return res.status(200).json({ message: "Usuário removido com sucesso!" });
  }

  // ===============================
  // UPLOAD PROFILE IMAGE
  // ===============================
  uploadProfileImage = async (req: Request, res: Response) => {
    const { id: adminId } = req.params;
    const userId = req.user?.id;
    const userType = req.user?.type;

    if (!userId) return res.status(401).json({ message: "Usuário não autenticado" });
    if (userType !== "admin" || userId !== adminId) return res.status(403).json({ message: "Você não tem permissão" });
    if (!req.file) return res.status(400).json({ message: "Nenhuma imagem enviada" });

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return res.status(404).json({ message: "Admin não encontrado" });

    if (admin.photoUrl) {
      const uploadFolder = path.resolve(__dirname, "..", "..", "..", "uploads");
      const fileName = admin.photoUrl.split("/").pop()!;
      const filePath = path.join(uploadFolder, "admins", fileName);
      try { await fs.unlink(filePath); } catch {}
    }

    const photoUrl = `/uploads/admins/${req.file.filename}`;

    const updated = await prisma.admin.update({ where: { id: adminId }, data: { photoUrl } });

    return res.json(this.formatAdminPhotoUrl(updated, req));
  };

  // ===============================
  // REMOVE PROFILE IMAGE
  // ===============================
  async deleteProfileImage(req: Request, res: Response) {
    const { adminId } = req.params;
    const userId = req.user?.id;
    const userType = req.user?.type;

    if (!userId) return res.status(401).json({ message: "Usuário não autenticado" });
    if (userType !== "admin" || userId !== adminId) return res.status(403).json({ message: "Sem permissão" });

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { photoUrl: true, name: true, email: true, createdAt: true, updatedAt: true, id: true }
    });
    if (!admin) return res.status(404).json({ message: "Admin não encontrado" });

    if (admin.photoUrl) {
      const uploadFolder = path.resolve(__dirname, "..", "..", "..", "uploads");
      const fileName = admin.photoUrl.split("/").pop()!;
      const filePath = path.join(uploadFolder, "admins", fileName);
      try { await fs.unlink(filePath); } catch {}
    }

    const updatedAdmin = await prisma.admin.update({ where: { id: adminId }, data: { photoUrl: null } });

    return res.status(200).json({ message: "Foto de perfil removida com sucesso.", admin: this.formatAdminPhotoUrl(updatedAdmin, req) });
  }
}

export { AdminsController };
