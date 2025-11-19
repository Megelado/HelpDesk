import express from "express";
import "express-async-errors";
import cors from "cors";
import path from "path";
import { routes } from "./routes/Index";
import { errorHandling } from "./middlewares/ErrorHandling";

const App = express();

// Permite JSON no body
App.use(express.json());

// Configuração CORS
App.use(
  cors({
    origin: [
      "http://localhost:5173", // frontend dev
      "https://help-desk-rust.vercel.app/", 
      "https://help-desk-4yre8xwo4-michael-silvas-projects-fe86af8d.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Rotas estáticas de uploads
App.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Rotas da aplicação
App.use(routes);

// Middleware de tratamento de erros
App.use(errorHandling);

export { App };
