import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { compare, hash } from "bcrypt";

export class PasswordController {
  async update(request: Request, response: Response) {
    const { id } = request.params;
    const { currentPassword, newPassword, userType } = request.body;
    let user;

    if (userType === "admin")
      user = await prisma.admin.findUnique({ where: { id } });
    if (userType === "client")
      user = await prisma.client.findUnique({ where: { id } });
    if (userType === "technician")
      user = await prisma.technician.findUnique({ where: { id } });

    if (!user) {
      return response.status(404).json({ message: "Usuário não encontrado" });
    }

    const passwordMatch = await compare(currentPassword, user.password);

    if (!passwordMatch) {
      return response
        .status(401)
        .json({ message: "Senha atual incorreta" });
    }

    const hashedPassword = await hash(newPassword, 10);

    // Atualiza no banco
    if (userType === "admin")
      await prisma.admin.update({
        where: { id },
        data: { password: hashedPassword },
      });

    if (userType === "client")
      await prisma.client.update({
        where: { id },
        data: { password: hashedPassword },
      });

    if (userType === "technician")
      await prisma.technician.update({
        where: { id },
        data: { password: hashedPassword },
      });

    return response.json({ message: "Senha alterada com sucesso" });
  }
}
