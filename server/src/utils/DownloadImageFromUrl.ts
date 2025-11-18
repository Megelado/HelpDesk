import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { v4 as uuid } from "uuid";

export async function downloadImageFromUrl(url: string, folder: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Não foi possível baixar a imagem da URL");
  }

  const contentType = response.headers.get("content-type") || "";
  const ext = contentType.split("/")[1] || "jpg";

  const fileName = `${uuid()}.${ext}`;
  const uploadPath = path.resolve(__dirname, "../../uploads", folder, fileName);

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(uploadPath, buffer);

  return `/uploads/${folder}/${fileName}`;
}
