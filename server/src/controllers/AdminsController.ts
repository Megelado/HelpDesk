import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { z } from "zod";
import { hash } from "bcrypt";
import { Prisma, Admin } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const BASE_URL = process.env.BASE_URL || 'http://localhost:3333';
class AdminsController {

  private formatClientPhotoUrl(admin: Admin): Omit<Admin, 'password'> {
      const { password, ...clientData } = admin;
      const photoUrl = admin.photoUrl
        ? `${BASE_URL}${admin.photoUrl.startsWith('/') ? '' : '/'}${admin.photoUrl}`
        : null;
  
      return { ...clientData, photoUrl };
    }
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

    const { password: _, ...userWithoutPassword } = user;

    return response.status(201).json(userWithoutPassword);
  }

  async index(request: Request, response: Response) {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      }

    })
    
    return response.json(admins);
  }

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

    const { password: _, ...adminWithoutPassword } = updatedAdmin;

    return response.json(adminWithoutPassword);
  }
  
  async remove(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    if (!id) {
      throw new AppError("Insira um id a ser removido!", 400);
    }

    try {
      const admin = await prisma.admin.findUnique({
        where: { id },
        select: { photoUrl: true }
      });

      if (!admin) {
        throw new AppError("admin não encontrado!", 404);
      }

      const photoUrl = admin.photoUrl;

      if (photoUrl) {
        // Exclui o arquivo físico
        const uploadFolder = path.resolve(__dirname, '..', '..', '..', 'uploads');
        const filePath = path.join(uploadFolder, 'admins', photoUrl.split('/').pop() as string);

        try {
          await fs.unlink(filePath);
          console.log(`Foto excluída: ${filePath}`);
        } catch (fileError: any) {
          if (fileError.code !== 'ENOENT') {
            console.error(`Erro ao excluir o arquivo ${filePath}:`, fileError);
          }
        }
      }

      await prisma.admin.delete({
        where: { id },
      });

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError("Usuário não encontrada ou já removida!", 404);
      }
      throw error;
    }

    return response.status(200).json({ message: "Usuário removido com sucesso!" });
  }

  async uploadProfileImage(request: Request, response: Response) {
    const { id: adminId } = request.params; 

    const userId = request.user?.id;
    const userType = request.user?.type;

    if (!userId) {
      return response.status(401).json({ message: "Usuário não autenticado" });
    }

    if (userType !== "admin" || userId !== adminId) {
      return response.status(403).json({ message: "Você não tem permissão para alterar esta imagem" });
    }

    if (!request.file) {
      return response.status(400).json({ message: "Nenhuma imagem enviada" });
    }

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      return response.status(404).json({ message: "Admin não encontrado" });
    }

    // Lógica para deletar a foto anterior (se existir)
    if (admin.photoUrl) {
      const uploadFolder = path.resolve(__dirname, '..', '..', '..', 'uploads');
      const oldFilePath = path.join(uploadFolder, 'admins', admin.photoUrl.split('/').pop() as string);
      
      try {
        await fs.unlink(oldFilePath);
      } catch (fileError: any) {
        if (fileError.code !== 'ENOENT') {
          console.error(`Erro ao excluir a foto antiga ${oldFilePath}:`, fileError);
        }
      }
    }

    const photoUrl = `/uploads/admins/${request.file.filename}`;

    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: { photoUrl },
    });

    const { password: _, ...adminWithoutPassword } = updated;

    return response.json(adminWithoutPassword);
  }

  // NOVO MÉTODO: DELETE Profile Image
  async deleteProfileImage(request: Request, response: Response) {
    const { id: adminId } = request.params;

    const userId = request.user?.id;
    const userType = request.user?.type;

    if (!userId) {
      return response.status(401).json({ message: "Usuário não autenticado" });
    }

    // Verifica se o usuário é o próprio admin logado
    if (userType !== "admin" || userId !== adminId) {
      return response.status(403).json({ message: "Você não tem permissão para remover esta imagem" });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { photoUrl: true }
    });

    if (!admin) {
      return response.status(404).json({ message: "Admin não encontrado" });
    }

    const photoUrl = admin.photoUrl;

    if (photoUrl) {
      // 1. Exclui o arquivo físico
      const uploadFolder = path.resolve(__dirname, '..', '..', '..', 'uploads');
      const fileName = photoUrl.split('/').pop() as string;
      const filePath = path.join(uploadFolder, 'admins', fileName);

      try {
        await fs.unlink(filePath);
        console.log(`Arquivo de foto do admin excluído: ${filePath}`);
      } catch (fileError: any) {
        // Ignora erro se o arquivo não for encontrado (já foi excluído ou o caminho estava errado)
        if (fileError.code !== 'ENOENT') {
          console.error(`Erro ao excluir o arquivo ${filePath}:`, fileError);
          // Opcional: retornar erro, mas geralmente ignoramos a falha na exclusão do arquivo para não bloquear o DB
        }
      }

      // 2. Remove a referência no banco de dados
      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: { photoUrl: null }, // Define como NULL no banco de dados
        select: {
          id: true, name: true, email: true, createdAt: true, updatedAt: true,
        }
      });
      
      return response.status(200).json({ 
        message: "Foto de perfil removida com sucesso.", 
        admin: updatedAdmin 
      });

    } else {
      return response.status(200).json({ message: "Nenhuma foto de perfil para remover." });
    }
  }

}

export { AdminsController };