import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { env } from "@/Env";
import { prisma } from "@/database/Prisma";

export async function ensureGuestOnly(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const [, token] = authHeader.split(" ");

  try {
    const payload = verify(token, env.JWT_SECRET) as { sub: string };

    const revoked = await prisma.revokedToken.findFirst({
      where: { token },
    });

    if (revoked) {
      return next();
    }

    return response
      .status(403)
      .json({ message: "Usuário já autenticado. Faça logout antes de criar outra conta." });
  } catch {
    return next();
  }
}
