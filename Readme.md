# 📞 HelpDesk API – Backend (Node + Express + Prisma)

API REST desenvolvida em **Node.js**, **Express**, **Prisma ORM**, **TypeScript** e **Zod**, responsável por gerenciar usuários, técnicos, chamados, autenticação e upload de arquivos para a aplicação HelpDesk.

---

## 🚀 Tecnologias

- **Node.js**
- **Express**
- **Prisma ORM**
- **PostgreSQL ou MySQL**
- **JWT (JSON Web Token)**
- **Zod** (validação)
- **Multer** (upload)
- **TypeScript**
- **Jest + Supertest** (testes)
- **TSX** (execução TS sem build)

---

## 📁 Estrutura do Projeto

src/
controllers/
middlewares/
modules/
routes/
utils/
database/
Prisma.ts
schema.prisma
Env.ts
Server.ts
uploads/
prisma/
seed.ts


---

# ⚙️ **Pré-requisitos**

- Node **>= 18**
- NPM ou Yarn
- Banco de dados:
  - PostgreSQL **ou**
  - MySQL
- Globais recomendados:

npm install -g prisma


---

# 🔧 **Configuração do Ambiente**

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL="sua-connection-string"
JWT_SECRET="sua_chave_ultra_secreta"
PORT=3333

🔍 Validação das variáveis

As variáveis são validadas automaticamente via Zod em src/Env.ts:

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);

Se alguma variável estiver ausente, o servidor NÃO inicia.
🗄️ Configuração do Banco de Dados
1. Ajuste o provider conforme seu banco

schema.prisma:

datasource db {
  provider = "postgresql"   // ou "mysql"
  url      = env("DATABASE_URL")
}

2. Gerar o client Prisma

npx prisma generate

3. Rodar migrations

npx prisma migrate deploy

▶️ Scripts
Comando	Descrição
npm run dev	Inicia o servidor com TSX + dotenv
npm start	Executa migrations e inicia o servidor em produção
npm run build	Compila o TypeScript
npm test:dev	Roda tests em modo watch
npx prisma migrate dev	Cria novas migrations
npx prisma studio	Interface visual para o banco
🖥️ Rodando em Desenvolvimento

npm install
cp .env.example .env
npm run dev

Servidor disponível em:

http://localhost:3333

🌐 Deploy

A API funciona perfeitamente em:
✅ Railway (recomendado)

    Suporte a Node + Prisma

    Fácil configuração de variáveis

Passos:

    Criar projeto

    Deploy direto do GitHub

    Adicionar variáveis em Settings → Variables

    Configurar Service:

        Build command: npm install

        Start command: npm start

🔗 Railway:

https://railway.app/
✅ Render

    New → Web Service

    Conectar GitHub

    Variáveis: DATABASE_URL, JWT_SECRET

    Build:

npm install

Start:

    npm start

🔗 Render:
https://render.com/
❌ Vercel

    Vercel NÃO suporta servidores Express tradicionais (com porta).
    Use para o front-end somente.

📦 Uploads de Arquivos

Uploads ficam em:

/uploads

E são servidos por:

App.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

🔒 Autenticação

A API utiliza:

    JWT

    Bearer Token

    Middleware de validação

O token é enviado no Authorization:

Authorization: Bearer SEU_TOKEN

🧪 Testes

Para rodar testes:

npm run test:dev

Os testes utilizam:

    Jest

    Supertest

    Ambiente isolado

🧰 Ferramentas
Prisma Studio

Interface visual do banco:

npx prisma studio

Gerar Client

npx prisma generate

gerar dados padrões

npx prisma db seed

📬 Contato

Criado por Michael Silva
