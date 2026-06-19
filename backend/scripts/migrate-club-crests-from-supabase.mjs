/**
 * Migra os escudos de clube que ainda estão no Supabase para uploads/clubes,
 * no MESMO padrão do uploadClubLogo: salva o original em uploads/clubes/{slug}.{ext}
 * e gera a versão reduzida (webp 512x512) em uploads/clubes/reduced/reduced_{slug}.webp.
 * Depois atualiza clubs.crest_url para a URL da reduzida.
 *
 * - Idempotente: só pega clubes cujo crest_url ainda aponta p/ supabase. Rodar de novo
 *   não reprocessa os já migrados (a URL deixa de casar com '%supabase%').
 * - Os arquivos originais no Supabase NÃO são apagados (rollback fácil).
 * - Backup do crest_url antigo é salvo em backend/ antes de qualquer UPDATE.
 *
 * Uso (no SERVIDOR de produção, onde UPLOADS_DIR=/var/www/uploads):
 *   node scripts/migrate-club-crests-from-supabase.mjs            # executa
 *   node scripts/migrate-club-crests-from-supabase.mjs --dry-run  # só mostra, não grava
 *   node scripts/migrate-club-crests-from-supabase.mjs --base-url=https://pro.sportinsider.com.br
 */
import fs from "fs";
import path from "path";
import pool from "../src/config/db.js";
import { UPLOADS_DIR } from "../src/config/paths.js";

const sharp = (await import("sharp")).default;

const DRY = process.argv.includes("--dry-run");
const baseUrlArg = process.argv.find((a) => a.startsWith("--base-url="))?.split("=")[1];

// A URL gravada no banco PRECISA ser a de produção (end users). Se o env estiver
// vazio ou apontando p/ localhost, cai no domínio de produção p/ evitar gravar
// URLs quebradas no banco. Pode forçar com --base-url=...
let baseUrl = baseUrlArg || process.env.UPLOADS_BASE_URL || "https://pro.sportinsider.com.br";
if (/localhost|127\.0\.0\.1/.test(baseUrl)) {
  console.warn(`[aviso] UPLOADS_BASE_URL='${baseUrl}' parece local — usando https://pro.sportinsider.com.br p/ o crest_url.`);
  baseUrl = "https://pro.sportinsider.com.br";
}

function slugFromName(s) {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function extFromUrl(url) {
  const m = String(url).split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
  const e = m ? `.${m[1].toLowerCase()}` : ".png";
  return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(e) ? e : ".png";
}

const dest = path.join(UPLOADS_DIR, "clubes");
const reducedDir = path.join(dest, "reduced");

async function main() {
  console.log(`UPLOADS_DIR = ${UPLOADS_DIR}`);
  console.log(`baseUrl     = ${baseUrl}`);
  console.log(`modo        = ${DRY ? "DRY-RUN (não grava)" : "EXECUÇÃO"}\n`);

  const { rows } = await pool.query(
    `SELECT id_club, slug, name, crest_url
     FROM clubs
     WHERE crest_url ILIKE '%supabase%'
     ORDER BY id_club`
  );
  console.log(`Clubes com escudo no Supabase: ${rows.length}\n`);
  if (!rows.length) { await pool.end(); return; }

  // Backup do estado atual
  if (!DRY) {
    const backupFile = path.resolve(process.cwd(), `backup_club_crests_supabase_${new Date().toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2));
    console.log(`Backup do crest_url antigo: ${backupFile}\n`);
    fs.mkdirSync(reducedDir, { recursive: true });
  }

  let ok = 0, fail = 0;
  const failures = [];

  for (const c of rows) {
    const base = slugFromName(c.slug) || slugFromName(c.name) || `club-${c.id_club}`;
    try {
      const resp = await fetch(c.crest_url, { redirect: "follow" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buf = Buffer.from(await resp.arrayBuffer());

      const ext = extFromUrl(c.crest_url);
      const finalName = `${base}${ext}`;
      const reducedName = `reduced_${base}.webp`;
      const newUrl = `${baseUrl}/uploads/clubes/reduced/${reducedName}?v=${Date.now()}`;

      if (DRY) {
        console.log(`  [dry] id=${c.id_club} ${c.name} → uploads/clubes/${finalName} (+reduced) | ${buf.length} bytes`);
      } else {
        fs.writeFileSync(path.join(dest, finalName), buf);
        await sharp(buf)
          .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 90 })
          .toFile(path.join(reducedDir, reducedName));
        await pool.query(`UPDATE clubs SET crest_url = $1 WHERE id_club = $2`, [newUrl, c.id_club]);
        console.log(`  ✓ id=${c.id_club} ${c.name} → ${reducedName}`);
      }
      ok++;
    } catch (err) {
      fail++;
      failures.push({ id_club: c.id_club, name: c.name, crest_url: c.crest_url, error: err.message });
      console.log(`  ✗ id=${c.id_club} ${c.name} — ${err.message}`);
    }
  }

  console.log(`\nResumo: ${ok} ok, ${fail} falhas${DRY ? " (dry-run)" : ""}.`);
  if (failures.length) console.log("Falhas:", JSON.stringify(failures, null, 2));
  await pool.end();
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
