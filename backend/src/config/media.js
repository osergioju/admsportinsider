import path from "path";
import { UPLOADS_DIR } from "./paths.js";

// Única pasta de imagens do sistema (nginx serve /uploads → UPLOADS_DIR).
// Original + todas as versões reduzidas ficam juntos, sem subpastas.
export const MEDIA_DIR = path.join(UPLOADS_DIR, "media");
export const MEDIA_URL_PATH = "/uploads/media";

// Formatos aceitos. A chave é o "format" que o sharp detecta pelo CONTEÚDO do arquivo
// (não pela extensão/mimetype enviados pelo cliente); o valor é a extensão gravada.
// svg é vetorial: guarda só o original (sem versões) e passa por validação estrita (services/svg.js).
export const ALLOWED_FORMATS = { jpeg: "jpg", png: "png", gif: "gif", webp: "webp", svg: "svg" };
export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
export const ALLOWED_MIMETYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

// Lado MAIOR de cada versão (fit "inside": não corta e não amplia). Sempre webp.
export const MEDIA_SIZES = {
  large: 1024,
  medium: 512,
  small: 256,
  xsmall: 96,
};

export const MEDIA_MAX_BYTES = 3 * 1024 * 1024;
// Proteção contra "decompression bomb" (imagem pequena em bytes, gigante em pixels).
export const MEDIA_MAX_PIXELS = 50_000_000;
export const MEDIA_NAME_MAX = 80;

export function uploadsBaseUrl() {
  return (process.env.UPLOADS_BASE_URL || "https://pro.sportinsider.com.br").replace(/\/+$/, "");
}
