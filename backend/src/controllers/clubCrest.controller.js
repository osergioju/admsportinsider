import db from "../config/db.js";
import { normalizeFileName, stripExtension, deleteMediaFiles } from "../services/media.service.js";
import { ALLOWED_EXTENSIONS } from "../config/media.js";
import { saveUploadedImage, sendError } from "./media.controller.js";

// Estado do escudo de um clube:
//   none   → sem escudo
//   legacy → tem crest_url (slug nu / URL antiga / externa) mas não veio da biblioteca
//   media  → vinculado a uma mídia da biblioteca (crest_media_id)
function crestState(club) {
  if (club.crest_media_id) return "media";
  return club.crest_url && String(club.crest_url).trim() ? "legacy" : "none";
}

// Qual estado pode ser sobrescrito em cada modo escolhido na tela.
const REPLACE_MODES = {
  none:   ["none"],
  legacy: ["none", "legacy"],
  all:    ["none", "legacy", "media"],
};

// POST /admin/clubs/crests/match   { names: ["turkey_balikesirspor.png", ...] }  (até 1000 por chamada)
// Só leitura: cruza o NOME de cada arquivo com o slug dos clubes (comparando os dois normalizados,
// então "turkey_x", "Turkey-X" e "turkey x" caem no mesmo clube).
export async function matchClubCrests(req, res) {
  try {
    const names = Array.isArray(req.body?.names) ? req.body.names : null;
    if (!names || names.length > 1000) {
      return res.status(400).json({ message: "Envie { names: [...] } com até 1000 nomes por chamada." });
    }

    const { rows } = await db.query("SELECT id_club, name, slug, crest_url, crest_media_id FROM clubs WHERE slug IS NOT NULL");
    const bySlug = new Map(rows.map((c) => [normalizeFileName(c.slug, ""), c]));

    const results = names.map((raw) => {
      const name = String(raw ?? "");
      const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
      if (!ALLOWED_EXTENSIONS.includes(ext)) return { name, status: "invalid_format" };

      const club = bySlug.get(normalizeFileName(stripExtension(name), ""));
      if (!club) return { name, status: "no_club" };
      return { name, status: "match", id_club: club.id_club, club_name: club.name, slug: club.slug, crest_state: crestState(club) };
    });

    return res.json({ results });
  } catch (err) {
    console.error("Erro ao cruzar escudos:", err);
    return res.status(500).json({ message: "Erro ao cruzar os arquivos com os clubes." });
  }
}

// POST /admin/clubs/:id/crest   (multipart: file, replace = none|legacy|all)
// Passa pelo MESMO pipeline da aba Mídias (validação, normalização, versões) e vincula ao clube.
export async function uploadClubCrest(req, res) {
  try {
    const mode = REPLACE_MODES[req.body?.replace] ? req.body.replace : "none";

    const { rows } = await db.query("SELECT id_club, name, slug, crest_url, crest_media_id FROM clubs WHERE id_club = $1", [req.params.id]);
    const club = rows[0];
    if (!club) return res.status(404).json({ message: "Clube não encontrado." });

    // Decide ANTES de processar: se o clube não pode ser sobrescrito, nada é gravado.
    const state = crestState(club);
    if (!REPLACE_MODES[mode].includes(state)) {
      return res.status(409).json({ message: "O clube já tem escudo e o modo escolhido não permite substituir.", crest_state: state });
    }

    // Nome-base = slug do clube (normalizado pelo pipeline). Se já existir, ganha -1, -2… (URL nova = sem cache velho).
    const media = await saveUploadedImage(req, club.slug || club.name);

    let updated;
    try {
      updated = await db.query(
        "UPDATE clubs SET crest_url = $1, crest_media_id = $2 WHERE id_club = $3 RETURNING id_club, crest_url, crest_media_id",
        [media.urls.medium, media.id, club.id_club]
      );
    } catch (err) {
      // Sem vínculo no clube não pode sobrar mídia solta: desfaz o que acabou de criar.
      await db.query("DELETE FROM media WHERE id = $1", [media.id]).catch(() => {});
      deleteMediaFiles(media);
      throw err;
    }

    // Só depois de tudo certo remove a mídia anterior deste clube (se veio da biblioteca).
    if (club.crest_media_id && club.crest_media_id !== media.id) {
      const old = await db.query("DELETE FROM media WHERE id = $1 RETURNING file_name, ext", [club.crest_media_id]);
      if (old.rows[0]) deleteMediaFiles(old.rows[0]);
    }

    return res.status(200).json({ id_club: club.id_club, crest_url: updated.rows[0].crest_url, media });
  } catch (err) {
    return sendError(res, err, "Erro no upload de escudo:");
  }
}
