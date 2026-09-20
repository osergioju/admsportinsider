import db from "../config/db.js";
import { processImage, deleteMediaFiles, mediaUrls, MediaError } from "../services/media.service.js";

const COLUMNS = `id, file_name, original_name, ext, mime_type, size_bytes, width, height,
                 sizes, title, alt_text, uploaded_by, created_at`;

function serialize(row) {
  const { club_id, club_name, ...media } = row;
  return {
    ...media,
    url: mediaUrls(media).original,
    urls: mediaUrls(media),
    used_by: club_id ? { type: "club", id: club_id, name: club_name } : null,
  };
}

// Mesmas colunas + qual clube usa a imagem como escudo (LEFT JOIN).
const SELECT_WITH_USAGE = `SELECT ${COLUMNS.split(",").map((c) => `m.${c.trim()}`).join(", ")},
                                  c.id_club AS club_id, c.name AS club_name
                           FROM media m LEFT JOIN clubs c ON c.crest_media_id = m.id`;

export function sendError(res, err, logLabel) {
  if (err instanceof MediaError) return res.status(err.status).json({ message: err.message });
  console.error(logLabel, err);
  return res.status(500).json({ message: "Erro interno no upload." });
}

// Processa o arquivo recebido pelo multer e registra na biblioteca. Único caminho de
// gravação de imagens do sistema — usado pela aba Mídias e por todos os uploads do admin.
export async function saveUploadedImage(req, nameHint = "") {
  if (!req.file) throw new MediaError("Nenhum arquivo enviado.", 400);

  // Nome livre = nem no disco nem no banco (file_name é UNIQUE, seja qual for a extensão).
  const isNameTaken = async (base) => (await db.query("SELECT 1 FROM media WHERE file_name = $1", [base])).rowCount > 0;

  // Duas requisições simultâneas podem escolher o mesmo nome entre a checagem e o INSERT:
  // se o banco recusar por duplicidade, refaz com o próximo nome livre.
  for (let attempt = 1; ; attempt++) {
    const data = await processImage(req.file.buffer, { originalName: req.file.originalname, nameHint, isNameTaken });
    try {
      const { rows } = await db.query(
        `INSERT INTO media (file_name, original_name, ext, mime_type, size_bytes, width, height, sizes, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING ${COLUMNS}`,
        [data.file_name, data.original_name, data.ext, data.mime_type, data.size_bytes, data.width, data.height,
         JSON.stringify(data.sizes), req.user?.id ?? null]
      );
      return serialize(rows[0]);
    } catch (err) {
      deleteMediaFiles(data); // sem registro no banco não pode sobrar arquivo no disco
      if (err.code === "23505" && attempt < 3) continue;
      throw err;
    }
  }
}

// GET /admin/media?q=&page=&limit=
export async function listMedia(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 40, 1), 100);
    const q = String(req.query.q || "").trim();

    const params = [];
    let where = "";
    if (q) {
      params.push(`%${q.replace(/[\\%_]/g, "\\$&")}%`);
      where = "WHERE m.file_name ILIKE $1 OR m.original_name ILIKE $1 OR m.title ILIKE $1 OR m.alt_text ILIKE $1 OR c.name ILIKE $1 OR c.slug ILIKE $1";
    }

    const total = (await db.query(`SELECT COUNT(*)::int AS n FROM media m LEFT JOIN clubs c ON c.crest_media_id = m.id ${where}`, params)).rows[0].n;
    const { rows } = await db.query(
      `${SELECT_WITH_USAGE} ${where}
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params
    );

    return res.json({ items: rows.map(serialize), total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (err) {
    console.error("Erro ao listar mídias:", err);
    return res.status(500).json({ message: "Erro ao listar mídias." });
  }
}

// POST /admin/media  (multipart, campo "file")
export async function uploadMediaFile(req, res) {
  try {
    const item = await saveUploadedImage(req);
    return res.status(201).json(item);
  } catch (err) {
    return sendError(res, err, "Erro no upload de mídia:");
  }
}

// PATCH /admin/media/:id  { title, alt_text }
export async function updateMedia(req, res) {
  try {
    const { title, alt_text } = req.body || {};
    const { rows } = await db.query(
      `UPDATE media SET title = $1, alt_text = $2 WHERE id = $3 RETURNING ${COLUMNS}`,
      [String(title ?? "").trim().slice(0, 255) || null, String(alt_text ?? "").trim().slice(0, 500) || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Mídia não encontrada." });
    return res.json(serialize(rows[0]));
  } catch (err) {
    console.error("Erro ao atualizar mídia:", err);
    return res.status(500).json({ message: "Erro ao atualizar mídia." });
  }
}

// DELETE /admin/media/:id
export async function deleteMedia(req, res) {
  try {
    // Se a imagem é o escudo de algum clube, o crest_url dele deixaria de apontar p/ um arquivo real.
    await db.query("UPDATE clubs SET crest_url = NULL WHERE crest_media_id = $1", [req.params.id]);
    const { rows } = await db.query(`DELETE FROM media WHERE id = $1 RETURNING ${COLUMNS}`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Mídia não encontrada." });
    deleteMediaFiles(rows[0]);
    return res.json({ message: "Mídia removida." });
  } catch (err) {
    console.error("Erro ao remover mídia:", err);
    return res.status(500).json({ message: "Erro ao remover mídia." });
  }
}

// Fábrica dos endpoints de upload dos formulários (clube, liga, federação, edição, banner).
// Todos passam pelo MESMO pipeline da aba Mídias; só mudam o nome-base sugerido e qual
// versão vira o `url` devolvido ao formulário (o objeto `media` traz todas).
//   slug/name  → nome-base do arquivo (normalizado; se já existir ganha sufixo -1, -2…)
//   variant    → ex.: "negative" (escudo alternativo)
export function entityImageUpload({ size = "medium", requireSlug = false, requireSlugMessage } = {}) {
  return async (req, res) => {
    try {
      const slug = String(req.body?.slug || "").trim();
      if (requireSlug && !slug) {
        return res.status(400).json({ message: requireSlugMessage || "Slug é obrigatório." });
      }
      const variant = String(req.body?.variant || "").trim();
      const hint = [slug || String(req.body?.name || "").trim(), variant].filter(Boolean).join(" ");

      const media = await saveUploadedImage(req, hint);
      return res.status(200).json({ message: "Upload realizado com sucesso!", url: media.urls[size], media });
    } catch (err) {
      return sendError(res, err, "Erro no upload de imagem:");
    }
  };
}
