import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pasta raiz dos uploads no disco.
//
// Em produção o nginx serve a rota /uploads via `alias /var/www/uploads/`, então o Node
// PRECISA gravar exatamente nessa mesma pasta — senão o upload "dá certo" mas a imagem
// dá 404 (gravou num diretório que o nginx não serve). Configurável por env:
//
//   UPLOADS_DIR=/var/www/uploads   (definir no backend/.env de produção)
//
// Sem a env (dev local), cai em backend/uploads, que o próprio express.static serve.
export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "..", "..", "uploads");
