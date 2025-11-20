import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { z } from "zod";
import { hash } from "bcrypt";
import { Prisma } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { getBaseUrl } from "@/utils/getBaseUrl";

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
  }) {

    let fullPhotoUrl = null;

    if (admin.photoUrl) {
      // Se já for URL absoluta (http/https), não altera
      if (admin.photoUrl.startsWith("http")) {
        fullPhotoUrl = admin.photoUrl;
      } else {
        // URL relativa → prefixa com BASE_URL
        fullPhotoUrl = `${getBaseUrl()}${admin.photoUrl}`;
      }
    }

    const { password, ...rest } = admin;

    return {
      ...rest,
      photoUrl: fullPhotoUrl,
    };
  }

  // ===============================
  // CREATE
  // ===============================
  async create(request: Request, response: Response) {

    const bodySchema = z.object({
      name: z.string().trim().min(2),
      email: z.string().email(),
      password: z.string().min(6).max(32),
    });

    const { name, email, password } = bodySchema.parse(request.body);

    const emailInUse =
      (await prisma.admin.findFirst({ where: { email } })) ||
      (await prisma.technician.findFirst({ where: { email } })) ||
      (await prisma.client.findFirst({ where: { email } }));

    if (emailInUse) {
      throw new AppError("Um usuário com esse email já existe!", 409);
    }

    const hashedPassword = await hash(password, 8);

    const user = await prisma.admin.create({
      data: { name, email, password: hashedPassword },
    });

    return response.status(201).json(this.formatAdminPhotoUrl(user));
  }

  // ===============================
  // INDEX
  // ===============================
  async index(request: Request, response: Response) {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        password: true,
        photoUrl: true
      }
    });

    return response.json(admins.map(a => this.formatAdminPhotoUrl(a)));
  }
  // ===============================
  // UPDATE
  // ===============================
  async update(request: Request, response: Response) {

    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      name: z.string().trim().min(2).optional(),
      email: z.string().email().optional(),
      password: z.string().min(6).optional(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { name, email, password } = bodySchema.parse(request.body);

    const admin = await prisma.admin.findUnique({ where: { id } });

    if (!admin) {
      throw new AppError("Administrador não encontrado!", 404);
    }

    if (email && email !== admin.email) {
      const emailInUse =
        (await prisma.admin.findFirst({ where: { email, NOT: { id: admin.id } } })) ||
        (await prisma.technician.findFirst({ where: { email } })) ||
        (await prisma.client.findFirst({ where: { email } }));

      if (emailInUse) {
        throw new AppError("Um usuário com esse email já existe!", 409);
      }
    }

    const hashedPassword = password ? await hash(password, 8) : undefined;

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: {
        name: name ?? admin.name,
        email: email ?? admin.email,
        password: hashedPassword ?? admin.password,
      },
    });

    return response.json(this.formatAdminPhotoUrl(updatedAdmin));
  }

  // ===============================
  // DELETE ADMIN
  // ===============================
  async remove(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    try {
      const admin = await prisma.admin.findUnique({
        where: { id },
        select: { photoUrl: true }
      });

      if (!admin) throw new AppError("Admin não encontrado!", 404);

      if (admin.photoUrl) {
        const uploadFolder = path.resolve(__dirname, "..", "..", "..", "uploads");
        const fileName = admin.photoUrl.split("/").pop()!;
        const filePath = path.join(uploadFolder, "admins", fileName);

        try {
          await fs.unlink(filePath);
        } catch (err: any) {
          if (err.code !== "ENOENT") console.error("Erro ao apagar arquivo:", err);
        }
      }

      await prisma.admin.delete({ where: { id } });

      return response.status(200).json({ message: "Usuário removido com sucesso!" });

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError("Usuário não encontrado ou já removido!", 404);
      }
      throw error;
    }
  }

  // ===============================
  // UPLOAD PROFILE IMAGE
  // ===============================
  uploadProfileImage = async (request: Request, response: Response) => {
    const { id: adminId } = request.params;

    const userId = request.user?.id;
    const userType = request.user?.type;

    if (!userId) return response.status(401).json({ message: "Usuário não autenticado" });

    if (userType !== "admin" || userId !== adminId)
      return response.status(403).json({ message: "Você não tem permissão" });

    if (!request.file)
      return response.status(400).json({ message: "Nenhuma imagem enviada" });

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });

    if (!admin)
      return response.status(404).json({ message: "Admin não encontrado" });

    // remover foto antiga
    if (admin.photoUrl) {
      const uploadFolder = path.resolve(__dirname, "..", "..", "..", "uploads");
      const fileName = admin.photoUrl.split("/").pop()!;
      const filePath = path.join(uploadFolder, "admins", fileName);

      try {
        await fs.unlink(filePath);
      } catch (err: any) {
        if (err.code !== "ENOENT") console.error("Erro ao excluir imagem antiga:", err);
      }
    }

    // sempre salvar URL RELATIVA
    const photoUrl = `/uploads/admins/${request.file.filename}`;

    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: { photoUrl },
    });

    return response.json(this.formatAdminPhotoUrl(updated));
  };

  // ===============================
  // REMOVE PROFILE IMAGE
  // ===============================
  async deleteProfileImage(request: Request, response: Response) {
    const { adminId } = request.params;

    const userId = request.user?.id;
    const userType = request.user?.type;

    if (!userId) return response.status(401).json({ message: "Usuário não autenticado" });

    if (userType !== "admin" || userId !== adminId)
      return response.status(403).json({ message: "Sem permissão" });

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { photoUrl: true, name: true, email: true, createdAt: true, updatedAt: true, id: true }
    });

    if (!admin)
      return response.status(404).json({ message: "Admin não encontrado" });

    if (admin.photoUrl) {
      const uploadFolder = path.resolve(__dirname, "..", "..", "..", "uploads");
      const fileName = admin.photoUrl.split("/").pop()!;
      const filePath = path.join(uploadFolder, "admins", fileName);

      try {
        await fs.unlink(filePath);
      } catch (err: any) {
        if (err.code !== "ENOENT") console.error("Erro ao excluir imagem:", err);
      }
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: { photoUrl: null }
    });

    return response.status(200).json({
      message: "Foto de perfil removida com sucesso.",
      admin: this.formatAdminPhotoUrl(updatedAdmin)
    });
  }
}

export { AdminsController };
