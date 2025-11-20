import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { z } from "zod";
import { hash } from "bcrypt";
import { Prisma, Client } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { getBaseUrl } from "@/utils/getBaseUrl";

class ClientsController {

  // 🔥 FORMATA UMA URL DE FOTO CONSISTENTE
  private formatClientPhotoUrl(client: Client): Omit<Client, "password"> {
    const { password, ...clientData } = client;
    const photoUrl = client.photoUrl
      ? `${getBaseUrl()}${client.photoUrl.startsWith("/") ? "" : "/"}${client.photoUrl}`
      : null;

    return { ...clientData, photoUrl };
  }

  // 🔥 CREATE
  create = async (request: Request, response: Response) => {

    const bodySchema = z.object({
      name: z.string().trim().min(2),
      email: z.string().email(),
      password: z.string().min(6).max(32)
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

    const user = await prisma.client.create({
      data: { name, email, password: hashedPassword }
    });

    return response.status(201).json(this.formatClientPhotoUrl(user));
  };

  // 🔥 LISTAR
  index = async (_req: Request, res: Response) => {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
        password: true
      }
    });

    return res.json(clients.map(c => this.formatClientPhotoUrl(c)));
  };

  // 🔥 UPDATE
  update = async (request: Request, response: Response) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const bodySchema = z.object({
      name: z.string().trim().min(2).optional(),
      email: z.string().email().optional(),
      password: z.string().min(6).optional()
    });

    const { id } = paramsSchema.parse(request.params);
    const { name, email, password } = bodySchema.parse(request.body);

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) throw new AppError("Cliente não encontrado!", 404);

    if (email && email !== client.email) {
      const emailInUse =
        (await prisma.admin.findFirst({ where: { email } })) ||
        (await prisma.technician.findFirst({ where: { email } })) ||
        (await prisma.client.findFirst({ where: { email, NOT: { id } } }));

      if (emailInUse) {
        throw new AppError("Email já está em uso!", 409);
      }
    }

    const hashedPassword = password ? await hash(password, 8) : undefined;

    const updated = await prisma.client.update({
      where: { id },
      data: {
        name: name ?? client.name,
        email: email ?? client.email,
        password: hashedPassword ?? client.password
      },
      select: {
        id: true, name: true, email: true,
        createdAt: true, updatedAt: true,
        photoUrl: true, password: true
      }
    });

    return response.json(this.formatClientPhotoUrl(updated));
  };

  // 🔥 DELETE
  remove = async (req: Request, res: Response) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(req.params);

    const client = await prisma.client.findUnique({
      where: { id },
      select: { photoUrl: true }
    });

    if (!client) throw new AppError("Cliente não encontrado!", 404);

    // exclui a foto física
    if (client.photoUrl) {
      const uploadFolder = path.resolve(__dirname, "..", "..", "..", "uploads");
      const file = client.photoUrl.split("/").pop()!;
      const filePath = path.join(uploadFolder, "clients", file);

      try {
        await fs.unlink(filePath);
      } catch (err: any) {
        if (err.code !== "ENOENT") console.error("Erro ao excluir imagem:", err);
      }
    }

    await prisma.client.delete({ where: { id } });

    return res.json({ message: "Usuário removido com sucesso!" });
  };

  // 🔥 UPLOAD FOTO
  uploadProfileImage = async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const userId = req.user?.id;
    const userType = req.user?.type;

    if (!userId) return res.status(401).json({ message: "Usuário não autenticado" });

    if (userType !== "admin" && (userType !== "client" || userId !== clientId)) {
      return res.status(403).json({ message: "Sem permissão" });
    }

    if (!req.file) return res.status(400).json({ message: "Nenhuma imagem enviada" });

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ message: "Cliente não encontrado" });

    // apaga foto antiga
    if (client.photoUrl) {
      const uploadFolder = path.resolve(__dirname, "..", "..", "..", "uploads");
      const fileName = client.photoUrl.split("/").pop()!;
      const filePath = path.join(uploadFolder, "clients", fileName);

      try {
        await fs.unlink(filePath);
      } catch {}
    }

    // SALVA APENAS URL RELATIVA
    const photoUrl = `/uploads/clients/${req.file.filename}`;

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { photoUrl },
      select: {
        id: true, name: true, email: true,
        createdAt: true, updatedAt: true,
        photoUrl: true, password: true
      }
    });

    return res.json(this.formatClientPhotoUrl(updated));
  };

  // 🔥 REMOVE FOTO
  removeProfileImage = async (req: Request, res: Response) => {
    const { clientId } = req.params;

    const userId = req.user?.id;
    const userType = req.user?.type;

    if (!userId) return res.status(401).json({ message: "Usuário não autenticado" });

    if (userType !== "admin" && (userType !== "client" || userId !== clientId)) {
      return res.status(403).json({ message: "Sem permissão" });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { photoUrl: true }
    });

    if (!client) return res.status(404).json({ message: "Cliente não encontrado" });

    if (client.photoUrl) {
      const uploadFolder = path.resolve(__dirname, "..", "..", "..", "uploads");
      const fileName = client.photoUrl.split("/").pop()!;
      const filePath = path.join(uploadFolder, "clients", fileName);

      try {
        await fs.unlink(filePath);
      } catch {}
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { photoUrl: null },
      select: {
        id: true, name: true, email: true,
        createdAt: true, updatedAt: true,
        photoUrl: true, password: true
      }
    });

    return res.json({
      message: "Foto removida com sucesso.",
      client: this.formatClientPhotoUrl(updatedClient)
    });
  };
}

export { ClientsController };
