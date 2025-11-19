import { Request, Response } from "express";

export class UploadController {
  async handle(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado." });
      }

      const folder = req.baseUrl.includes("clients")
        ? "clients"
        : req.baseUrl.includes("technicians")
        ? "technicians"
        : "admins";

      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${folder}/${req.file.filename}`;

      return res.status(201).json({
        message: "Upload realizado com sucesso!",
        fileUrl,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao processar upload." });
    }
  }
}

export const uploadController = new UploadController();
