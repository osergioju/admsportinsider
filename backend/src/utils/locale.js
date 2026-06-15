import db from "../config/db.js";

// Mapeia o idioma do usuário (regions.code: "pt-BR" / "en-US" / "ES") para o
// código curto usado em league_translations ('pt' / 'en' / 'es').
// Visitante (sem login) ou erro → 'pt'.
export async function resolveLocale(req) {
  const uid = req.user?.id;
  if (!uid) return "pt";
  try {
    const r = await db.query(
      `SELECT r.code FROM user_preferences up
       JOIN regions r ON r.id = up.region_id
       WHERE up.user_id = $1 LIMIT 1`,
      [uid]
    );
    return (r.rows[0]?.code || "pt-BR").slice(0, 2).toLowerCase();
  } catch {
    return "pt";
  }
}
