import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { compare, hash } from "bcrypt";

export class PasswordController {
  async update(request: Request, response: Response) {
    const { id } = request.params;
    const { currentPassword, newPassword } = request.body;

    // ✔ Garante que o middleware passou user
    if (!request.user) {
      return response.status(401).json({ message: "Usuário não autenticado." });
    }

    const userType = request.user.type;
    const userIdFromToken = request.user.id;

    // ✔ Apenas admin pode trocar senha de outros
    if (userType !== "admin" && userIdFromToken !== id) {
      return response.status(403).json({ message: "Acesso negado." });
    }

    // ✔ Garantir que as senhas vieram
    if (!currentPassword || !newPassword) {
      return response.status(400).json({ message: "Senha antiga incorreta." });
    }

    let user;

    switch (userType) {
      case "admin":
        user = await prisma.admin.findUnique({ where: { id } });
        break;
      case "client":
        user = await prisma.client.findUnique({ where: { id } });
        break;
      case "technician":
        user = await prisma.technician.findUnique({ where: { id } });
        break;
      default:
        return response.status(400).json({ message: "Tipo de usuário inválido." });
    }

    if (!user) {
      return response.status(404).json({ message: "Usuário não encontrado." });
    }

    const passwordMatch = await compare(currentPassword, user.password);

    if (!passwordMatch) {
      return response.status(400).json({ message: "Senha antiga incorreta." });
    }

    const hashedPassword = await hash(newPassword, 10);

    // atualizar
    if (userType === "admin")
      await prisma.admin.update({ where: { id }, data: { password: hashedPassword } });

    if (userType === "client")
      await prisma.client.update({ where: { id }, data: { password: hashedPassword } });

    if (userType === "technician")
      await prisma.technician.update({ where: { id }, data: { password: hashedPassword } });

    return response.status(200).json({ message: "Senha alterada com sucesso." });
  }

}
