import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { verify } from "jsonwebtoken";
import { env } from "@/Env";
import { AppError } from "@/utils/AppError";

class AuthController {
  async logout(request: Request, response: Response) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new AppError("Nenhum token informado.", 401);
    }

    const [, token] = authHeader.split(" ");

    try {
      
      verify(token, env.JWT_SECRET);

      const alreadyRevoked = await prisma.revokedToken.findFirst({
        where: { token },
      });

      if (!alreadyRevoked) {
        await prisma.revokedToken.create({ data: { token } });
      }

      return response
        .status(200)
        .json({ message: "Logout realizado com sucesso!" });
    } catch {
      throw new AppError("Token inválido ou expirado.", 401);
    }
  }
}

export { AuthController };
