import { Request, Response } from "express";
import { prisma } from "@/database/Prisma";
import { z } from "zod";
import { AppError } from "@/utils/AppError";
import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { env } from "@/Env";

function getBaseUrl(req: Request) {
  // Se rodando no Render → sempre usar HTTPS
  const host = req.get("host");

  if (host?.includes("onrender.com")) {
    return `https://${host}`;
  }

  // Ambiente local → usa o protocolo real
  return `${req.protocol}://${host}`;
}

const JWT_EXPIRES_IN = "1d";

type UserType = "admin" | "client" | "technician";

type BaseUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date | null;
  photoUrl?: string | null; // <= ADICIONADO
};

async function findUserByEmail(email: string): Promise<{
  user: BaseUser;   // TS aceita todos os campos do Prisma
  type: UserType;
} | null> {

  const admin = await prisma.admin.findFirst({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      photoUrl: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (admin) return { user: admin, type: "admin" as UserType };

  const client = await prisma.client.findFirst({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      createdAt: true,
      updatedAt: true,
      photoUrl: true, // <= AQUI
    }
  });

  if (client) return { user: client, type: "client" as UserType };

  const technician = await prisma.technician.findFirst({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      createdAt: true,
      updatedAt: true,
      photoUrl: true, // <= AQUI
      availability: true
    }
  });

  if (technician) return { user: technician, type: "technician" as UserType };

  return null;
}

class LoginController {
  async handle(request: Request, response: Response) {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const { email, password } = bodySchema.parse(request.body);

    const result = await findUserByEmail(email);
    if (!result) {
      throw new AppError("E-mail ou senha inválidos!", 401);
    }

    const { user, type } = result;

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      throw new AppError("E-mail ou senha inválidos!", 401);
    }

    const token = sign(
      { type },
      env.JWT_SECRET,
      {
        subject: user.id,
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    const { password: _, ...userWithoutPassword } = user;

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // FORMATAÇÃO DO AVATAR/PHOTOURL
    const formattedUser = {
      ...userWithoutPassword,
      type,
      photoUrl: user.photoUrl
        ? (user.photoUrl.startsWith("http")
          ? user.photoUrl
          : `${getBaseUrl(request)}${user.photoUrl.startsWith("/") ? "" : "/"}${user.photoUrl}`
        )
        : null,

    };

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return response.status(200).json({
      user: formattedUser,
      token,
    });
  }
}


export { LoginController };
