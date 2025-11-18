import { prisma } from "@/database/Prisma";
import { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "@/utils/AppError";

class ServicesController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      title: z.string().trim().min(5),
      price: z.number().min(0),
      active: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    });

    const { title, price, active, isDefault } = bodySchema.parse(request.body);

    const service = await prisma.service.create({
      data: {
        title,
        price,
        active: active ?? true,
        isDefault: isDefault ?? true
      },
    });

    return response.status(201).json(service);
  }

  async createAdditionalService(request: Request, response: Response) {
    const { id } = request.params

    const bodySchema = z.object({
      title: z.string().trim().min(5),
      price: z.number().min(1),
      active: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    });

    const { title, price, active, isDefault } = bodySchema.parse(request.body);


    if (!price || Number(price) <= 0) {
      throw new AppError("O valor do serviço adicional deve ser maior que zero.", 400);
    }

    const service = await prisma.service.create({
      data: {
        title,
        price,
        active: active ?? true,
        isDefault: isDefault ?? false,

      },
    });

    await prisma.called.update({
      where: { id },
      data: {
        services: {
          connect: { id: service.id }
        }
      }
    })

    return response.status(201).json(service);
  }

  async index(request: Request, response: Response) {
    const services = await prisma.service.findMany();

    return response.json(services);
  }

  async update(request: Request, response: Response) {
    const { id } = request.params;

    const bodySchema = z.object({
      title: z.string().trim().min(5).optional(),
      price: z.number().min(0).optional(),
      active: z.boolean().optional(),
    });

    const data = bodySchema.parse(request.body);

    const service = await prisma.service.update({
      where: { id },
      data,
    });

    return response.json(service);
  }

  async delete(request: Request, response: Response) {
    const { id } = request.params;

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return response.status(404).json({ message: "Serviço não encontrado." });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: { active: false },
    });

    return response.status(200).json(updated);
  }

  async deleteService(request: Request, response: Response) {
    const { id } = request.params;

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return response.status(404).json({ message: "Serviço não encontrado." });
    }

    const updated = await prisma.service.delete({
      where: { id }
    });

    return response.status(200).json(updated);
  }

  async reactivate(request: Request, response: Response) {
    const { id } = request.params;

    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
      return response.status(404).json({ message: "Serviço não encontrado." });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: { active: true },
    });

    return response.status(200).json(updated);
  }

}

export { ServicesController };
