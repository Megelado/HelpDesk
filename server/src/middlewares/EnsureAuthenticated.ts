import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { env } from "@/Env";
import { AppError } from "@/utils/AppError";
import { prisma } from "@/database/Prisma";

interface TokenPayload {
  sub: string;
  type: "admin" | "client" | "technician";
}

export async function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError("JWT token não encontrado", 401);
  }

  const [, token] = authHeader.split(" ");

  try {
    const revoked = await prisma.revokedToken.findUnique({
      where: { token },
    });

    if (revoked) {
      throw new AppError("Token inválido ou expirado.", 401);
    }

    const { sub: user_id, type } = verify(token, env.JWT_SECRET) as TokenPayload;

    request.user = {
      id: user_id,
      type,
    };

    return next();
  } catch (err) {
    throw new AppError("JWT token inválido ou expirado.", 401);
  }
}
