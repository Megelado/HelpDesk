import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { z } from "zod";
import { hash } from "bcrypt";
import { Prisma, Technician } from "@prisma/client"
import fs from "fs/promises";
import path from "path";
import {getBaseUrl} from "@/utils/getBaseUrl"

class TechniciansController {

  private formatTechnicianPhotoUrl(technician: Technician): Omit<Technician, 'password'> {
    // Garante que a senha seja removida do objeto retornado
    const { password, ...technicianData } = technician;

    // Constrói a URL completa da foto
    const photoUrl = technician.photoUrl
      ? `${getBaseUrl()}${technician.photoUrl.startsWith('/') ? '' : '/'}${technician.photoUrl}`
      : null;

    return {
      ...technicianData,
      photoUrl,
    };
  }

  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z.string().trim().min(2),
      email: z.string().email(),
      password: z.string().min(6).max(32),
      availability: z
        .array(z.string(), { required_error: "Disponibilidade é obrigatória." })
        .nonempty("O array de disponibilidade não pode estar vazio."),
    });


    const { name, email, password, availability } = bodySchema.parse(request.body);

    const emailInUse =
      (await prisma.admin.findFirst({ where: { email } })) ||
      (await prisma.technician.findFirst({ where: { email } })) ||
      (await prisma.client.findFirst({ where: { email } }));

    if (emailInUse) {
      throw new AppError("Um usuário com esse email já existe!", 409);
    }

    const hashedPassword = await hash(password, 8);

    const user = await prisma.technician.create({
      data: {
        name,
        email,
        password: hashedPassword,
        availability
      }
    });

    const userFormatted = this.formatTechnicianPhotoUrl(user);

    return response.status(201).json(userFormatted);
  }

  async index(request: Request, response: Response) {
    const technicians = await prisma.technician.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        photoUrl: true,
        availability: true,
        password: true // Necessário para o formatTechnicianPhotoUrl remover antes de retornar
      }
    })

    const techniciansWithFullPhotoUrl = technicians.map(technician => this.formatTechnicianPhotoUrl(technician));

    return response.json(techniciansWithFullPhotoUrl);
    // const adminsFormatted = admins.map(admin => this.formatAdminPhotoUrl(admin));
    // return response.json(adminsFormatted);
  }

  async details(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const technician = await prisma.technician.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, createdAt: true, updatedAt: true, photoUrl: true, availability: true, password: true
      }
    });

    if (!technician) {
      throw new AppError("Técnico não encontrado.", 404);
    }

    const formattedTechnician = this.formatTechnicianPhotoUrl(technician);

    return response.status(200).json(formattedTechnician);
  }


  async update(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      name: z.string().trim().min(2).optional(),
      email: z.string().email().optional()
    });

    const { id } = paramsSchema.parse(request.params);
    const { name, email } = bodySchema.parse(request.body);

    const technician = await prisma.technician.findUnique({ where: { id } });

    if (!technician) {
      throw new AppError("Técnico não encontrado!", 404);
    }

    if (email && email !== technician.email) {
      const emailInUse =
        (await prisma.admin.findFirst({ where: { email } })) ||
        (await prisma.technician.findFirst({ where: { email, NOT: { id: technician.id } } })) ||
        (await prisma.client.findFirst({ where: { email } }));

      if (emailInUse) {
        throw new AppError("Um usuário com esse email já existe!", 409);
      }
    }

    const techniciansUpdate = await prisma.technician.update({
      where: {
        id,
      },
      data: {
        name,
        email
      },
      select: {
        id: true, name: true, email: true, createdAt: true, updatedAt: true, photoUrl: true, availability: true, password: true
      }
    });

    const formattedTechnician = this.formatTechnicianPhotoUrl(techniciansUpdate);

    return response.status(200).json(formattedTechnician);

  }

  async uploadProfileImage(request: Request, response: Response) {
    const { technicianId } = request.params;

    const userId = request.user?.id;
    const userType = request.user?.type;

    if (!userId) {
      return response.status(401).json({ message: "Usuário não autenticado" });
    }

    // Permissões
    if (
      userType !== "admin" &&
      !(userType === "technician" && userId === technicianId)
    ) {
      return response
        .status(403)
        .json({ message: "Você não tem permissão para alterar esta imagem" });
    }

    if (!request.file) {
      return response.status(400).json({ message: "Nenhuma imagem enviada" });
    }

    const technician = await prisma.technician.findUnique({
      where: { id: technicianId }
    });

    if (!technician) {
      return response.status(404).json({ message: "Técnico não encontrado" });
    }

    // Deletar foto antiga
    const uploadFolder = path.resolve("uploads", "technicians");
    if (technician.photoUrl) {
      const oldFile = path.join(uploadFolder, technician.photoUrl.split("/").pop()!);
      try {
        await fs.unlink(oldFile);
      } catch (err: any) {
        if (err.code !== "ENOENT") console.error("Erro ao deletar foto antiga:", err);
      }
    }

    const newPhotoUrl = `/uploads/technicians/${request.file.filename}`;

    const updated = await prisma.technician.update({
      where: { id: technicianId },
      data: { photoUrl: newPhotoUrl }
    });

    return response.json(this.formatTechnicianPhotoUrl(updated));
  }


  // NOVO MÉTODO: DELETE Profile Image
  async deleteProfileImage(request: Request, response: Response) {
    const { technicianId } = request.params;

    const userId = request.user?.id;
    const userType = request.user?.type;

    if (!userId) {
      return response.status(401).json({ message: "Usuário não autenticado" });
    }

    if (
      userType !== "admin" &&
      !(userType === "technician" && userId === technicianId)
    ) {
      return response
        .status(403)
        .json({ message: "Você não tem permissão para excluir esta imagem" });
    }

    const technician = await prisma.technician.findUnique({
      where: { id: technicianId }
    });

    if (!technician) {
      return response.status(404).json({ message: "Técnico não encontrado" });
    }

    if (!technician.photoUrl) {
      return response.status(400).json({ message: "Este técnico não possui foto" });
    }

    const uploadFolder = path.resolve("uploads", "technicians");
    const filePath = path.join(uploadFolder, technician.photoUrl.split("/").pop()!);

    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") console.error("Erro ao deletar foto:", err);
    }

    await prisma.technician.update({
      where: { id: technicianId },
      data: { photoUrl: null }
    });

    return response.status(204).send();
  }



  async toggleAvailability(req: Request, res: Response) {
    const bodySchema = z.object({
      availability: z
        .array(z.string(), { required_error: "Disponibilidade é obrigatória." })
        .nonempty("O array de disponibilidade não pode estar vazio."),
    });

    const { id } = req.params;

    try {
      const { availability } = bodySchema.parse(req.body);

      if (req.user?.type !== "admin" && (req.user?.type !== "technician" || req.user?.id !== id)) {
        return res.status(403).json({ message: "Você não tem permissão para alterar esta disponibilidade." });
      }


      const technician = await prisma.technician.findUnique({ where: { id } });
      if (!technician) {
        return res.status(404).json({ message: "Técnico não encontrado." });
      }


      const updatedTechnician = await prisma.technician.update({
        where: { id },
        data: { availability },
        select: {
          id: true, name: true, email: true, createdAt: true, updatedAt: true, photoUrl: true, availability: true, password: true
        }
      });

      const formattedTechnician = this.formatTechnicianPhotoUrl(updatedTechnician);

      return res.status(200).json({
        message: "Disponibilidade atualizada com sucesso.",
        technician: formattedTechnician,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Erro de validação.",
          errors: error.errors.map(e => e.message),
        });
      }

      console.error(error);
      return res.status(500).json({ message: "Erro ao atualizar a disponibilidade." });
    }
  }

  async remove(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    if (!id) {
      throw new AppError("Insira um id a ser removido!", 400);
    }

    // 1️⃣ Verifica se o técnico existe
    const technician = await prisma.technician.findUnique({
      where: { id },
      select: { photoUrl: true }
    });

    if (!technician) {
      throw new AppError("Técnico não encontrado!", 404);
    }

    // 2️⃣ Verifica se existe chamado vinculado ao técnico
    const calleds = await prisma.called.findFirst({
      where: { technicianId: id },
    });

    if (calleds) {
      throw new AppError(
        "Este técnico possui chamados vinculados e não pode ser excluído.",
        409
      );
    }

    // 3️⃣ Remove a foto se existir
    if (technician.photoUrl) {
      const uploadFolder = path.resolve(__dirname, "..", "..", "..", "uploads");
      const filePath = path.join(
        uploadFolder,
        "technicians",
        technician.photoUrl.split("/").pop() as string
      );

      try {
        await fs.unlink(filePath);
      } catch (fileError: any) {
        if (fileError.code !== "ENOENT") {
          console.error(`Erro ao excluir o arquivo ${filePath}:`, fileError);
        }
      }
    }

    // 4️⃣ Deleta o técnico
    try {
      await prisma.technician.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new AppError("Usuário não encontrada ou já removida!", 404);
      }
      throw error;
    }

    return response.status(200).json({ message: "Usuário removido com sucesso!" });
  }


}

export { TechniciansController };