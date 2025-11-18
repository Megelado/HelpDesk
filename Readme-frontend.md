📌 HelpDesk — Frontend

Este é o frontend do projeto HelpDesk, desenvolvido em React + TypeScript utilizando Vite.
O objetivo do sistema é permitir o gerenciamento de chamados, clientes, técnicos e serviços, com fluxos separados por tipo de usuário.

🚀 Tecnologias utilizadas

React

TypeScript

Vite

React Router DOM

Axios

TailwindCSS

Shadcn/UI (opcional)

Zustand ou Context API (se estiver usando)

ESLint + Prettier

📂 Estrutura de pastas

src/
├── assets/              # Imagens, ícones e SVGs
├── components/          # Componentes reutilizáveis
├── contexts/            # Contextos globais (auth, etc.)
├── hooks/               # Hooks personalizados
├── layouts/             # Layouts gerais (Navbar, AdminLayout, etc.)
├── pages/               # Páginas principais do sistema
├── routes/              # Rotas públicas, privadas e por userType
├── services/            # Configuração do axios e chamadas HTTP
├── utils/               # Funções utilitárias (formatadores, validações)
└── main.tsx             # Entry point da aplicação

🔧 Instalação e execução
1️⃣ Clonar o repositório

git clone https://github.com/SEU_USUARIO/helpdesk-frontend.git
cd helpdesk-frontend

2️⃣ Instalar dependências

npm install

3️⃣ Variáveis de ambiente

Crie um arquivo .env na raiz:

VITE_API_URL=http://localhost:3333

No deploy (Vercel), configure:

    VITE_API_URL → URL do backend em produção

4️⃣ Rodar aplicação

npm run dev

Acesse em:

http://localhost:5173

🔐 Autenticação & Rotas

O frontend possui controle de autenticação via token JWT armazenado em localStorage.
🔸 Rotas públicas

    /login

    /register

    /reset

🔸 Rotas privadas (usuário autenticado)

    /calleds

    /services

    /technicians

    /clients

O Navbar aparece automaticamente nas rotas privadas, e é ocultado nas rotas públicas.
🧩 Features principais
✔ Login e Registro

Fluxo completo com validação, erros e feedback visual.
✔ CRUD de Chamados

    Criar

    Editar

    Excluir

    Listar por tipo de usuário

✔ Gerenciamento de Clientes

    Modal de edição

    Modal de exclusão

    Upload e exibição de imagem

✔ Gerenciamento de Técnicos

    Listagem

    Atribuição de chamados

✔ Gerenciamento de Serviços

    Preço com prefixo R$

    Filtros e ordenação

✔ Sistema de Permissões

Navbar, rotas e páginas adaptadas conforme o userType:

    admin

    client

    technician

🏗 Build para produção

npm run build

Os arquivos finais ficarão em:

dist/

🌐 Deploy na Vercel

    Suba o frontend no GitHub

    Na Vercel, importe o repositório

    Configure as variáveis de ambiente

    Deploy automático a cada push no branch selecionado

🧪 Tratamento de erros (AppError)

Todos os erros vindos do backend são tratados por:

    Interceptor do Axios

    Componente de notificação (toast)

    Tipagem baseada na classe AppError

👨‍💻 Autor

Michael Santos Silva Rodrigues
