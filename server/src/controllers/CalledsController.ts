import { prisma } from "@/database/Prisma";
import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { z } from "zod";

class CalledsController {
  // ======================
  // CRIAR CHAMADO
  // ======================
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      title: z.string().trim().min(5),
      description: z.string().trim(),
      category: z.string().trim().optional(),
      clientId: z.string().uuid(),
      serviceIds: z.array(z.string().uuid()).min(1, "Envie pelo menos um serviço."),
    });

    const { title, description, category, clientId, serviceIds } =
      bodySchema.parse(request.body);

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, active: true },
    });

    if (services.length === 0) {
      throw new AppError("Nenhum serviço válido encontrado.", 404);
    }

    const technicians = await prisma.technician.findMany({
      include: {
        calleds: {
          where: { status: { in: ["aberto", "em_atendimento"] } },
          select: { id: true },
        },
      },
    });

    if (technicians.length === 0) {
      throw new AppError("Nenhum técnico cadastrado no sistema.", 404);
    }

    const availableTechnicians = technicians.filter(
      (tech) => Array.isArray(tech.availability) && tech.availability.length > 0
    );

    if (availableTechnicians.length === 0) {
      throw new AppError("Nenhum técnico disponível no momento.", 404);
    }

    availableTechnicians.sort((a, b) => a.calleds.length - b.calleds.length);
    const assignedTechnician = availableTechnicians[0];

    const finalCategory = category ?? services[0].title;

    const called = await prisma.called.create({
      data: {
        title,
        description,
        category: finalCategory,
        clientId,
        technicianId: assignedTechnician.id,
        services: {
          connect: services.map((s) => ({ id: s.id })),
        },
      },
      include: {
        services: true,
        technician: {
          select: { id: true, name: true, photoUrl: true },
        },
      },
    });

    const formattedCalled = {
      ...called,
      technician: called.technician
        ? {
          ...called.technician,
          photoUrl: called.technician.photoUrl
            ? `http://localhost:3333${called.technician.photoUrl}`
            : null,
        }
        : null,
    };

    return response.status(201).json(formattedCalled);
  }

  // ======================
  // LISTAR CHAMADOS POR USUÁRIO
  // ======================
  async index(request: Request, response: Response) {
    try {
      const user = request.user;

      if (!user) {
        return response.status(401).json({ message: "Usuário não autenticado." });
      }

      const where =
        user.type === "client" ? { clientId: user.id } : {};

      const calleds = await prisma.called.findMany({
        where,
        include: {
          services: true,
          technician: {
            select: { name: true, photoUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const calledsWithTotal = calleds.map((called) => ({
        ...called,
        totalPrice: called.services.reduce(
          (sum, service) => sum + Number(service.price),
          0
        ),
        technician: {
          ...called.technician,
          photoUrl: called.technician?.photoUrl
            ? `http://localhost:3333${called.technician.photoUrl}`
            : null,
        },
      }));

      return response.json(calledsWithTotal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({ errors: error.errors });
      }
      throw error;
    }
  }

  // ======================
  // LISTAR CHAMADOS DO TÉCNICO
  // ======================
  async indexByTechnician(request: Request, response: Response) {
    try {
      const user = request.user;

      if (!user) {
        return response.status(401).json({ message: "Usuário não autenticado." });
      }

      const where =
        user.type === "technician" ? { technicianId: user.id } : {};

      const calleds = await prisma.called.findMany({
        where,
        include: {
          services: true,
          client: {
            select: { name: true, photoUrl: true },
          },
          technician: {
            select: { name: true, photoUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const calledsWithTotal = calleds.map((called) => ({
        ...called,
        totalPrice: called.services.reduce(
          (sum, service) => sum + Number(service.price),
          0
        ),
        client: {
          ...called.client,
          photoUrl: called.client?.photoUrl
            ? `http://localhost:3333${called.client.photoUrl}`
            : null,
        },
        technician: {
          ...called.technician,
          photoUrl: called.technician?.photoUrl
            ? `http://localhost:3333${called.technician.photoUrl}`
            : null,
        },
      }));

      return response.json(calledsWithTotal);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Erro ao listar chamados." });
    }
  }

  // ======================
  // LISTAR CHAMADOS PARA ADMIN
  // ======================
  async indexByAdmin(request: Request, response: Response) {
    try {
      const calleds = await prisma.called.findMany({
        include: {
          services: true,
          client: {
            select: { name: true, photoUrl: true },
          },
          technician: {
            select: { name: true, photoUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const calledsWithTotal = calleds.map((called) => ({
        ...called,
        totalPrice: called.services.reduce(
          (sum, service) => sum + Number(service.price),
          0
        ),
        client: {
          ...called.client,
          photoUrl: called.client?.photoUrl
            ? `http://localhost:3333${called.client.photoUrl}`
            : null,
        },
        technician: {
          ...called.technician,
          photoUrl: called.technician?.photoUrl
            ? `http://localhost:3333${called.technician.photoUrl}`
            : null,
        },
      }));

      return response.json(calledsWithTotal);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Erro ao listar chamados." });
    }
  }

  // ======================
  // DETALHES DO CHAMADO
  // ======================
  async details(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const called = await prisma.called.findUnique({
      where: { id },
      include: {
        services: true,
        client: {
          select: { name: true, photoUrl: true },
        },
        technician: {
          select: { email: true, name: true, photoUrl: true },
        },
      },
    });

    if (!called) {
      throw new AppError("Chamado não encontrado.", 404);
    }

    // 🔥 CRIA A BASE CORRETA AUTOMATICAMENTE
    const baseUrl = `${request.protocol}://${request.get("host")}`;

    const totalPrice = called.services.reduce(
      (sum, service) => sum + Number(service.price),
      0
    );

    const formattedCalled = {
      ...called,
      totalPrice,
      client: called.client
        ? {
          ...called.client,
          photoUrl: called.client.photoUrl
            ? `${baseUrl}${called.client.photoUrl}`
            : null,
        }
        : null,
      technician: called.technician
        ? {
          ...called.technician,
          photoUrl: called.technician.photoUrl
            ? `${baseUrl}${called.technician.photoUrl}`
            : null,
        }
        : null,
    };

    return response.status(200).json(formattedCalled);
  }


  // ======================
  // ATUALIZAR SERVIÇOS DO CHAMADO
  // ======================
  async updateServices(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      serviceIds: z.array(z.string().uuid()).min(1, "Envie pelo menos um serviço."),
    });

    const { id } = paramsSchema.parse(request.params);
    const { serviceIds } = bodySchema.parse(request.body);

    const called = await prisma.called.findUnique({
      where: { id },
      include: { services: true },
    });

    if (!called) {
      throw new AppError("Chamado não encontrado.", 404);
    }

    const validServices = await prisma.service.findMany({
      where: { id: { in: serviceIds }, active: true },
    });

    if (validServices.length === 0) {
      throw new AppError("Nenhum serviço encontrado ou ativo.", 404);
    }

    const existingServiceIds = called.services.map((s) => s.id);
    const newServiceIds = validServices.map((s) => s.id);

    const idsToConnect = newServiceIds.filter(
      (id) => !existingServiceIds.includes(id)
    );

    if (idsToConnect.length === 0) {
      throw new AppError(
        "Todos os serviços informados já estão vinculados a este chamado.",
        400
      );
    }

    const updatedCalled = await prisma.called.update({
      where: { id },
      data: {
        services: {
          connect: idsToConnect.map((serviceId) => ({ id: serviceId })),
        },
      },
      include: { services: true },
    });

    return response.status(200).json(updatedCalled);
  }

  // ======================
  // ATUALIZAR STATUS DO CHAMADO
  // ======================
  async updateStatus(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      status: z.enum(["aberto", "em_atendimento", "encerrado"]),
    });

    const { id } = paramsSchema.parse(request.params);
    const { status } = bodySchema.parse(request.body);

    const called = await prisma.called.findUnique({
      where: { id },
    });

    if (!called) {
      throw new AppError("Chamado não encontrado.", 404);
    }

    const updatedCalled = await prisma.called.update({
      where: { id },
      data: { status },
      include: { services: true },
    });

    return response.json(updatedCalled);
  }
}

export { CalledsController };
