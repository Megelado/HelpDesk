import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { z } from "zod";
import { hash } from "bcrypt";
import { Prisma, Technician } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

// Função utilitária
function getBaseUrl(req: Request) {
  const host = req.get("host");
  if (host?.includes("onrender.com")) {
    return `https://${host}`;
  }
  return `${req.protocol}://${host}`;
}

class TechniciansController {

  private formatTechnicianPhotoUrl(technician: Technician, req: Request): Omit<Technician, 'password'> {
    const { password, ...technicianData } = technician;
    const photoUrl = technician.photoUrl
      ? `${getBaseUrl(req)}${technician.photoUrl.startsWith('/') ? '' : '/'}${technician.photoUrl}`
      : null;

    return {
      ...technicianData,
      photoUrl,
    };
  }

  create = async (req: Request, res: Response) => {
    const bodySchema = z.object({
      name: z.string().trim().min(2),
      email: z.string().email(),
      password: z.string().min(6).max(32),
      availability: z.array(z.string()).nonempty("O array de disponibilidade não pode estar vazio."),
    });

    const { name, email, password, availability } = bodySchema.parse(req.body);

    const emailInUse =
      (await prisma.admin.findFirst({ where: { email } })) ||
      (await prisma.technician.findFirst({ where: { email } })) ||
      (await prisma.client.findFirst({ where: { email } }));

    if (emailInUse) throw new AppError("Um usuário com esse email já existe!", 409);

    const hashedPassword = await hash(password, 8);

    const technician = await prisma.technician.create({
      data: { name, email, password: hashedPassword, availability },
    });

    return res.status(201).json(this.formatTechnicianPhotoUrl(technician, req));
  }

  index = async (req: Request, res: Response) => {
    const technicians = await prisma.technician.findMany({
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true, photoUrl: true, availability: true, password: true }
    });

    const formatted = technicians.map(t => this.formatTechnicianPhotoUrl(t, req));
    return res.json(formatted);
  }

  details = async (req: Request, res: Response) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(req.params);

    const technician = await prisma.technician.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true, photoUrl: true, availability: true, password: true }
    });

    if (!technician) throw new AppError("Técnico não encontrado.", 404);

    return res.json(this.formatTechnicianPhotoUrl(technician, req));
  }

  update = async (req: Request, res: Response) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const bodySchema = z.object({ name: z.string().trim().min(2).optional(), email: z.string().email().optional() });

    const { id } = paramsSchema.parse(req.params);
    const { name, email } = bodySchema.parse(req.body);

    const technician = await prisma.technician.findUnique({ where: { id } });
    if (!technician) throw new AppError("Técnico não encontrado!", 404);

    if (email && email !== technician.email) {
      const emailInUse =
        (await prisma.admin.findFirst({ where: { email } })) ||
        (await prisma.technician.findFirst({ where: { email, NOT: { id: technician.id } } })) ||
        (await prisma.client.findFirst({ where: { email } }));

      if (emailInUse) throw new AppError("Um usuário com esse email já existe!", 409);
    }

    const updated = await prisma.technician.update({
      where: { id },
      data: { name, email },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true, photoUrl: true, availability: true, password: true }
    });

    return res.json(this.formatTechnicianPhotoUrl(updated, req));
  }

  uploadProfileImage = async (req: Request, res: Response) => {
    const { technicianId } = req.params;
    const userId = req.user?.id;
    const userType = req.user?.type;

    if (!userId) return res.status(401).json({ message: "Usuário não autenticado" });
    if (userType !== "admin" && !(userType === "technician" && userId === technicianId)) {
      return res.status(403).json({ message: "Você não tem permissão para alterar esta imagem" });
    }

    if (!req.file) return res.status(400).json({ message: "Nenhuma imagem enviada" });

    const technician = await prisma.technician.findUnique({ where: { id: technicianId } });
    if (!technician) return res.status(404).json({ message: "Técnico não encontrado" });

    // Deletar foto antiga
    const uploadFolder = path.resolve("uploads", "technicians");
    if (technician.photoUrl) {
      const oldFile = path.join(uploadFolder, technician.photoUrl.split("/").pop()!);
      try { await fs.unlink(oldFile); } catch (err: any) { if (err.code !== "ENOENT") console.error(err); }
    }

    const newPhotoUrl = `/uploads/technicians/${req.file.filename}`;
    const updated = await prisma.technician.update({ where: { id: technicianId }, data: { photoUrl: newPhotoUrl } });

    return res.json(this.formatTechnicianPhotoUrl(updated, req));
  }

  deleteProfileImage = async (req: Request, res: Response) => {
    const { technicianId } = req.params;
    const userId = req.user?.id;
    const userType = req.user?.type;

    if (!userId) return res.status(401).json({ message: "Usuário não autenticado" });
    if (userType !== "admin" && !(userType === "technician" && userId === technicianId)) {
      return res.status(403).json({ message: "Você não tem permissão para excluir esta imagem" });
    }

    const technician = await prisma.technician.findUnique({ where: { id: technicianId } });
    if (!technician) return res.status(404).json({ message: "Técnico não encontrado" });
    if (!technician.photoUrl) return res.status(400).json({ message: "Este técnico não possui foto" });

    const uploadFolder = path.resolve("uploads", "technicians");
    const filePath = path.join(uploadFolder, technician.photoUrl.split("/").pop()!);
    try { await fs.unlink(filePath); } catch (err: any) { if (err.code !== "ENOENT") console.error(err); }

    await prisma.technician.update({ where: { id: technicianId }, data: { photoUrl: null } });
    return res.status(204).send();
  }

  toggleAvailability = async (req: Request, res: Response) => {
    const bodySchema = z.object({
      availability: z.array(z.string()).nonempty("O array de disponibilidade não pode estar vazio."),
    });

    const { id } = req.params;
    const { availability } = bodySchema.parse(req.body);

    if (req.user?.type !== "admin" && !(req.user?.type === "technician" && req.user.id === id)) {
      return res.status(403).json({ message: "Você não tem permissão para alterar esta disponibilidade." });
    }

    const technician = await prisma.technician.findUnique({ where: { id } });
    if (!technician) return res.status(404).json({ message: "Técnico não encontrado." });

    const updated = await prisma.technician.update({ where: { id }, data: { availability }, select: { id: true, name: true, email: true, createdAt: true, updatedAt: true, photoUrl: true, availability: true, password: true } });

    return res.status(200).json({ message: "Disponibilidade atualizada com sucesso.", technician: this.formatTechnicianPhotoUrl(updated, req) });
  }

  remove = async (req: Request, res: Response) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(req.params);

    const technician = await prisma.technician.findUnique({ where: { id }, select: { photoUrl: true } });
    if (!technician) throw new AppError("Técnico não encontrado!", 404);

    const hasCalleds = await prisma.called.findFirst({ where: { technicianId: id } });
    if (hasCalleds) throw new AppError("Este técnico possui chamados vinculados e não pode ser excluído.", 409);

    if (technician.photoUrl) {
      const uploadFolder = path.resolve("uploads", "technicians");
      const filePath = path.join(uploadFolder, technician.photoUrl.split("/").pop()!);
      try { await fs.unlink(filePath); } catch (err: any) { if (err.code !== "ENOENT") console.error(err); }
    }

    await prisma.technician.delete({ where: { id } });
    return res.status(200).json({ message: "Usuário removido com sucesso!" });
  }

}

export { TechniciansController };
