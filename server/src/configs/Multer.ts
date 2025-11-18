import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsFolder = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder, { recursive: true });
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const folder = path.join(
        uploadsFolder,
        req.baseUrl.includes("clients")
          ? "clients"
          : req.baseUrl.includes("technicians")
          ? "technicians"
          : req.baseUrl.includes("admins")
          ? "admins"
          : "others"
      );

      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
});
