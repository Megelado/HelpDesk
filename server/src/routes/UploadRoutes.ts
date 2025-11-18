import { Router } from "express";
import { upload } from "@/configs/Multer";
import { uploadController } from "@/controllers/UploadController";

const uploadRoutes = Router();

uploadRoutes.post("/", upload.single("file"), (req, res) =>
  uploadController.handle(req, res)
);

export { uploadRoutes };
