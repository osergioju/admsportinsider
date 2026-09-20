import multer from "multer";
import path from "path";
import { ALLOWED_EXTENSIONS, ALLOWED_MIMETYPES, MEDIA_MAX_BYTES } from "../config/media.js";

// ÚNICO middleware de upload de imagem do sistema. Fica em memória (nada vai pro disco
// aqui) e recusa já na porta qualquer arquivo cuja extensão/mimetype não seja
// jpeg/jpg/png/gif/webp — esses arquivos nem chegam ao controller. A validação
// definitiva (conteúdo real do arquivo) é feita em services/media.service.js.
// O multer/busboy lê o nome do arquivo como latin1, mas o navegador envia UTF-8: "São Paulo.png"
// chega como "SaÌo Paulo.png" (e viraria "sai-o-paulo"). Reinterpreta os bytes como UTF-8; se não for
// UTF-8 válido, mantém o nome como veio. Nomes só com ASCII passam inalterados.
export function fixFilenameEncoding(name) {
  const decoded = Buffer.from(String(name ?? ""), "latin1").toString("utf8");
  return decoded.includes("\uFFFD") ? name : decoded;
}

export const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MEDIA_MAX_BYTES, files: 1, fields: 10 },
  fileFilter: (req, file, cb) => {
    file.originalname = fixFilenameEncoding(file.originalname);
    const ext = path.extname(file.originalname || "").slice(1).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIMETYPES.includes(file.mimetype)) return cb(null, true);
    const err = new Error("Formato não permitido. Envie apenas jpeg, jpg, png, gif, webp ou svg.");
    err.code = "MEDIA_INVALID_TYPE";
    cb(err);
  },
}).single("file");
