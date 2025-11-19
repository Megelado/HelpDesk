import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { z } from "zod";
import { hash } from "bcrypt";
import { Prisma, Client } from "@prisma/client"
import fs from "fs/promises";
import path from "path";

const BASE_URL = process.env.BASE_URL || 'http://localhost:3333';
class ClientsController {

  private formatClientPhotoUrl(client: Client): Omit<Client, 'password'> {
    const { password, ...clientData } = client;
    const photoUrl = client.photoUrl
      ? `${BASE_URL}${client.photoUrl.startsWith('/') ? '' : '/'}${client.photoUrl}`
      : null;

    return { ...clientData, photoUrl };
  }

  async create(request: Request, response: Response) {

    const bodySchema = z.object({
      name: z.string().trim().min(2),
      email: z.string().email(),
      password: z.string().min(6),
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
      data: { name, email, password: hashedPassword },
    });

    const userFormatted = this.formatClientPhotoUrl(user);

    return response.status(201).json(userFormatted);
  }

  async index(request: Request, response: Response) {
    try {
      const clients = await prisma.client.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          photoUrl: true,
          password: true // Necessário para o formatClientPhotoUrl
        }
      });

      const clientsWithFullPhotoUrl = clients.map(client => this.formatClientPhotoUrl(client));

      return response.json(clientsWithFullPhotoUrl);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Erro ao buscar clientes." });
    }
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

    const client = await prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new AppError("Cliente não encontrado!", 404);
    }

    if (email && email !== client.email) {
      const emailInUse =
        (await prisma.admin.findFirst({ where: { email } })) ||
        (await prisma.technician.findFirst({ where: { email } })) ||
        (await prisma.client.findFirst({ where: { email, NOT: { id: client.id } } }));

      if (emailInUse) {
        throw new AppError("Um usuário com esse email já existe!", 409);
      }
    }

    const hashedPassword = password ? await hash(password, 8) : undefined;

    const clientsUpdate = await prisma.client.update({
      where: {
        id,
      },
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        photoUrl: true,
        password: true
      }
    });

    const clientFormatted = this.formatClientPhotoUrl(clientsUpdate);

    return response.status(200).json(clientFormatted);
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
      const client = await prisma.client.findUnique({
        where: { id },
        select: { photoUrl: true }
      });

      if (!client) {
        throw new AppError("Cliente não encontrado!", 404);
      }

      const photoUrl = client.photoUrl;

      // Exclui a foto física ao remover o usuário
      if (photoUrl) {
        const uploadFolder = path.resolve(__dirname, '..', '..', '..', 'uploads');
        const filePath = path.join(uploadFolder, 'clients', photoUrl.split('/').pop() as string);

        try {
          await fs.unlink(filePath);
          console.log(`Foto excluída: ${filePath}`);
        } catch (fileError: any) {
          if (fileError.code !== 'ENOENT') {
            console.error(`Erro ao excluir o arquivo ${filePath}:`, fileError);
          }
        }
      }

      await prisma.client.delete({
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
    const { clientId } = request.params;

    const userId = request.user?.id;
    const userType = request.user?.type;

    if (!userId) {
      return response.status(401).json({ message: "Usuário não autenticado" });
    }

    // Apenas Admin ou o próprio Cliente pode alterar a imagem
    if (userType !== "admin" && (userType !== "client" || userId !== clientId)) {
      return response.status(403).json({ message: "Você não tem permissão para alterar esta imagem" });
    }

    if (!request.file) {
      return response.status(400).json({ message: "Nenhuma imagem enviada" });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return response.status(404).json({ message: "Cliente não encontrado" });
    }

    // LÓGICA DE EXCLUSÃO DA FOTO ANTIGA
    if (client.photoUrl) {
      const uploadFolder = path.resolve(__dirname, '..', '..', '..', 'uploads');
      const oldFileName = client.photoUrl.split('/').pop() as string;
      const oldFilePath = path.join(uploadFolder, 'clients', oldFileName);

      try {
        await fs.unlink(oldFilePath);
        console.log(`Foto antiga excluída: ${oldFilePath}`);
      } catch (fileError: any) {
        if (fileError.code !== 'ENOENT') {
          console.error(`Erro ao excluir a foto antiga ${oldFilePath}:`, fileError);
        }
      }
    }

    const photoUrl = `/uploads/clients/${request.file.filename}`;

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { photoUrl },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        photoUrl: true,
        password: true
      }
    });

    const clientFormatted = this.formatClientPhotoUrl(updated);

    return response.json(clientFormatted);
  }

  async removeProfileImage(request: Request, response: Response) {
    const { clientId } = request.params;
    const userId = request.user?.id;
    const userType = request.user?.type;

    if (!userId) {
      return response.status(401).json({ message: "Usuário não autenticado" });
    }

    // VERIFICAÇÃO DE AUTORIZAÇÃO
    if (userType !== "admin" && (userType !== "client" || userId !== clientId)) {
      return response.status(403).json({ message: "Você não tem permissão para remover esta imagem" });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { photoUrl: true }
    });

    if (!client) {
      return response.status(404).json({ message: "Cliente não encontrado" });
    }

    const photoUrl = client.photoUrl;

    if (photoUrl) {
      // 1. EXCLUI O ARQUIVO FÍSICO
      const uploadFolder = path.resolve(__dirname, '..', '..', '..', 'uploads');
      const fileName = photoUrl.split('/').pop() as string;
      const filePath = path.join(uploadFolder, 'clients', fileName);

      try {
        await fs.unlink(filePath);
        console.log(`Arquivo de foto do cliente excluído: ${filePath}`);
      } catch (fileError: any) {
        if (fileError.code !== 'ENOENT') {
          console.error(`Erro ao excluir o arquivo ${filePath}:`, fileError);
        }
      }

      // 2. ATUALIZA O BANCO DE DADOS
      const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: { photoUrl: null }, // Define como NULL
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          photoUrl: true,
          password: true
        }
      });

      const clientFormatted = this.formatClientPhotoUrl(updatedClient);

      return response.status(200).json({
        message: "Foto de perfil removida com sucesso.",
        client: clientFormatted
      });

    } else {
      return response.status(200).json({ message: "Nenhuma foto de perfil para remover." });
    }
  }
}

export { ClientsController };