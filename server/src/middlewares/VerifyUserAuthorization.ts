import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError";

function verifyUserAuthorization(roles: ("admin" | "client" | "technician")[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const { type } = request.user;

    if (!roles.includes(type)) {
      throw new AppError("Acesso negado: usuário sem permissão para esta ação.", 403);
    }

    return next();
  };
}

export { verifyUserAuthorization };
