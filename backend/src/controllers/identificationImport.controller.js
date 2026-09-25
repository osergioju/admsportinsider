// ---------------------------------------------------------------------------
// Upload independente das abas de apoio da planilha "Identificação.xlsx":
// Países, Cidades, Federações e Estádios (Clubes e Competições têm importers
// próprios em admin.controller.js).
//
// Cada entidade tem duas etapas, no mesmo endpoint base:
//   POST /admin/identification/:entity/preview  → sem sheetName lista as abas;
//                                                 com sheetName faz dry-run
//   POST /admin/identification/:entity/import   → grava
// As duas usam a MESMA função `plan` (só o `apply` grava), então o que o
// preview promete é exatamente o que o import faz.
//
// Tudo se liga por slug (nunca por nome). Única exceção: países já cadastrados
// sem slug são "adotados" por nome, pra não duplicar o que já existe.
// ---------------------------------------------------------------------------
import XLSX from "xlsx";
import db from "../config/db.js";
import { findHeaderRowIndex, buildHeaderMap, toStrCell, normalizeHex } from "./admin.controller.js";

const MAX_LISTED = 100; // erros/avisos devolvidos por resposta

// ── Helpers ────────────────────────────────────────────────────────────────

const norm = (s) =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const pad = (n, w = 2) => String(n).padStart(w, "0");
const toDateString = (y, m, d) => `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
const isYes = (v) => norm(v) === "sim";

/** Datas da planilha: data completa = número de série do Excel (época
 *  1899-12-30); ano isolado = texto/número "0000" (marcado em "Só ano?");
 *  pré-1900 = texto dd-mm-aaaa. Devolve strings (nunca Date — o pg reformata
 *  Date pelo fuso local e a data volta 1 dia atrás).
 *  → { date, year, invalid }  (year-only: date=null, year=ano) */
function parseSheetDate(raw, yearOnlyFlag) {
  if (raw == null || raw === "") return { date: null, year: null, invalid: false };

  if (typeof raw === "number") {
    if (yearOnlyFlag) {
      return raw >= 1000 && raw <= 2200
        ? { date: null, year: Math.trunc(raw), invalid: false }
        : { date: null, year: null, invalid: true };
    }
    if (raw > 0 && raw < 3_000_000) {
      const d = new Date(Date.UTC(1899, 11, 30) + raw * 86_400_000);
      return { date: toDateString(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()), year: d.getUTCFullYear(), invalid: false };
    }
    return { date: null, year: null, invalid: true };
  }

  const str = String(raw).trim();
  if (/^\d{4}$/.test(str)) return { date: null, year: Number(str), invalid: false };
  let m = str.match(/^(\d{2})-(\d{2})-(\d{4})$/); // pré-1900
  if (m) return { date: toDateString(+m[3], +m[2], +m[1]), year: +m[3], invalid: false };
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})/); // ISO
  if (m) return { date: toDateString(+m[1], +m[2], +m[3]), year: +m[1], invalid: false };
  return { date: null, year: null, invalid: true };
}

/** "lat, lng" (aceita ; ou espaço como separador e ponto decimal). */
function parseCoordinates(raw) {
  const str = toStrCell(raw);
  if (!str) return { lat: null, lng: null, invalid: false };
  const nums = str.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length !== 2) return { lat: null, lng: null, invalid: true };
  const [lat, lng] = nums.map(Number);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return { lat: null, lng: null, invalid: true };
  return { lat, lng, invalid: false };
}

const parseIntCell = (raw) => {
  if (raw == null || raw === "") return { value: null, invalid: false };
  const n = typeof raw === "number" ? Math.trunc(raw) : Number(String(raw).replace(/[.\s]/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? { value: Math.trunc(n), invalid: false } : { value: null, invalid: true };
};

/** Prefixo de país num slug de cidade/estádio/federação: "afghanistan_farah" → "afghanistan". */
const slugCountryPrefix = (slug) => (slug.includes("_") ? slug.split("_")[0] : null);

/** Coletor de erros/avisos: guarda os primeiros MAX_LISTED e conta o resto por motivo. */
function makeReport() {
  const build = () => {
    const list = [], counts = {};
    return {
      add(row, reason, detail) {
        counts[reason] = (counts[reason] || 0) + 1;
        if (list.length < MAX_LISTED) list.push({ row, reason, ...(detail ? { detail } : {}) });
      },
      list, counts,
      get total() { return Object.values(counts).reduce((a, b) => a + b, 0); },
    };
  };
  return { errors: build(), warnings: build() };
}

/** Insert em lotes com ON CONFLICT (slug). `updateCols` vazio = DO NOTHING
 *  (linhas já existentes são puladas). `keepIfNull`: colunas que só são
 *  sobrescritas se a planilha trouxe valor (não apaga dado com célula vazia).
 *  Devolve [{ slug, inserted }] das linhas efetivamente gravadas. */
async function batchUpsert(client, { table, cols, rows, updateCols = [], keepIfNull = [] }) {
  const out = [];
  const size = Math.max(1, Math.min(500, Math.floor(60000 / cols.length)));
  const slugIdx = cols.indexOf("slug");
  const onConflict = updateCols.length
    ? `ON CONFLICT (slug) DO UPDATE SET ${updateCols
        .map((c) => (keepIfNull.includes(c) ? `${c} = COALESCE(EXCLUDED.${c}, ${table}.${c})` : `${c} = EXCLUDED.${c}`))
        .join(", ")}`
    : `ON CONFLICT (slug) DO NOTHING`;

  for (let off = 0; off < rows.length; off += size) {
    const batch = rows.slice(off, off + size);
    const flat = [], phs = [];
    let i = 1;
    for (const r of batch) {
      phs.push(`(${cols.map(() => `$${i++}`).join(",")})`);
      flat.push(...r);
    }
    const { rows: ret } = await client.query(
      `INSERT INTO ${table} (${cols.join(",")}) VALUES ${phs.join(",")} ${onConflict}
       RETURNING slug, (xmax = 0) AS inserted`,
      flat
    );
    out.push(...ret);
  }
  return out;
}

/** Planilha → { rows (dados), headerMap, dataStart (nº da linha 1-based do 1º dado) }. */
function readSheet(buffer, sheetName, requiredHeaders) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw Object.assign(new Error(`Aba "${sheetName}" não encontrada`), { status: 400 });
  const all = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  if (!all.length) throw Object.assign(new Error("Aba vazia"), { status: 400 });
  const headerIdx = findHeaderRowIndex(all);
  const headerMap = buildHeaderMap(all[headerIdx]);
  const missing = requiredHeaders.filter((h) => !(h in headerMap));
  if (missing.length) {
    throw Object.assign(
      new Error(`A aba "${sheetName}" não tem as colunas: ${missing.join(", ")}. É a aba certa?`),
      { status: 400 }
    );
  }
  return { rows: all.slice(headerIdx + 1), headerMap, dataStart: headerIdx + 2 };
}

const getter = (headers, headerMap, row) => (key) => row[headerMap[headers[key]]];

// ── PAÍSES ─────────────────────────────────────────────────────────────────

const COUNTRY_H = {
  slug: "Slug do país", name: "Nome do país", nameEn: "Nome do país (EN)",
  namePt: "Nome do país (PT)", nameEs: "Nome do país (ES)", continent: "Continente",
};

const countries = {
  sheet: "Países",
  required: [COUNTRY_H.slug, COUNTRY_H.namePt],

  async loadCtx() {
    const [{ rows: cs }, { rows: ct }] = await Promise.all([
      db.query(`SELECT id_country, name, slug FROM countries`),
      db.query(`SELECT id_continent, name FROM continents`),
    ]);
    return {
      bySlug: new Map(cs.filter((c) => c.slug).map((c) => [c.slug, c])),
      unslugged: new Map(cs.filter((c) => !c.slug).map((c) => [norm(c.name), c])),
      continents: new Map(ct.map((c) => [norm(c.name), c.id_continent])),
    };
  },

  plan({ rows, headerMap, dataStart }, ctx, opts) {
    const rep = makeReport();
    const items = [], seen = new Set(), claimed = new Set();
    let toInsert = 0, toAdopt = 0, toUpdate = 0;

    rows.forEach((row, i) => {
      const n = dataStart + i;
      const get = getter(COUNTRY_H, headerMap, row);
      const slug = toStrCell(get("slug"));
      const namePt = toStrCell(get("namePt")) || toStrCell(get("nameEn")) || toStrCell(get("name"));
      if (!slug && !namePt) return; // linha em branco
      if (!slug || !namePt) return rep.errors.add(n, "slug_ou_nome_vazio");
      if (seen.has(slug)) return rep.errors.add(n, "slug_duplicado", slug);
      seen.add(slug);

      const continentName = toStrCell(get("continent"));
      const idContinent = continentName ? ctx.continents.get(norm(continentName)) ?? null : null;
      if (continentName && idContinent == null) rep.warnings.add(n, "continente_nao_encontrado", continentName);

      let action, existing = ctx.bySlug.get(slug);
      if (existing) { action = "existing"; toUpdate++; }
      else {
        const byName = ctx.unslugged.get(norm(namePt)) || ctx.unslugged.get(norm(toStrCell(get("nameEn"))));
        if (byName && !claimed.has(byName.id_country)) { existing = byName; claimed.add(byName.id_country); action = "adopt"; toAdopt++; }
        else { action = "insert"; toInsert++; }
      }
      items.push({
        n, slug, action, id: existing?.id_country ?? null, namePt, idContinent,
        nameEn: toStrCell(get("nameEn")) || null, nameEs: toStrCell(get("nameEs")) || null,
      });
    });

    return {
      items, rep,
      stats: { total: items.length, toInsert, toAdopt, toUpdate },
      sample: items.slice(0, 8).map(({ slug, namePt, action, idContinent }) => ({ slug, name: namePt, action, idContinent })),
    };
  },

  async apply(client, plan, opts) {
    let inserted = 0, updated = 0, skipped = 0;
    for (const it of plan.items) {
      let id = it.id;
      if (it.action === "insert") {
        const { rows } = await client.query(
          `INSERT INTO countries (name, slug, id_continent) VALUES ($1,$2,$3) RETURNING id_country`,
          [it.namePt, it.slug, it.idContinent]
        );
        id = rows[0].id_country; inserted++;
      } else if (it.action === "adopt") {
        await client.query(
          `UPDATE countries SET slug = $1, id_continent = COALESCE($2, id_continent) WHERE id_country = $3`,
          [it.slug, it.idContinent, id]
        );
        updated++;
      } else if (opts.updateExisting) {
        await client.query(
          `UPDATE countries SET name = $1, id_continent = COALESCE($2, id_continent) WHERE id_country = $3`,
          [it.namePt, it.idContinent, id]
        );
        updated++;
      } else skipped++;

      // Só grava tradução em país novo/adotado (ou com updateExisting) — quem já existia fica como está.
      if (it.action !== "existing" || opts.updateExisting) {
        for (const [locale, name] of [["en", it.nameEn], ["es", it.nameEs]]) {
          if (!name) continue;
          await client.query(
            `INSERT INTO country_translations (id_country, locale, name) VALUES ($1,$2,$3)
             ON CONFLICT (id_country, locale) DO ${opts.updateExisting ? "UPDATE SET name = EXCLUDED.name" : "NOTHING"}`,
            [id, locale, name]
          );
        }
      }
    }
    return { inserted, updated, skipped };
  },
};

// ── CIDADES ────────────────────────────────────────────────────────────────

const CITY_H = {
  slug: "Slug da cidade", name: "Nome da cidade", nameEn: "Nome da cidade (EN)",
  namePt: "Nome da cidade (PT)", nameEs: "Nome da cidade (ES)", countryName: "País",
};

/** País de uma linha: prefixo do slug ("afghanistan_farah") ou, na falta, a coluna "País" (PT). */
function resolveCountryId(slug, countryName, ctx) {
  const prefix = slugCountryPrefix(slug);
  if (prefix && ctx.countrySlugs.has(prefix)) return ctx.countrySlugs.get(prefix);
  if (countryName && ctx.countryNames.has(norm(countryName))) return ctx.countryNames.get(norm(countryName));
  return null;
}

async function loadCountryMaps() {
  const { rows } = await db.query(`SELECT id_country, name, slug FROM countries`);
  return {
    countrySlugs: new Map(rows.filter((c) => c.slug).map((c) => [c.slug, c.id_country])),
    countryNames: new Map(rows.map((c) => [norm(c.name), c.id_country])),
  };
}

const cities = {
  sheet: "Cidades",
  required: [CITY_H.slug],

  async loadCtx() {
    const [maps, { rows }] = await Promise.all([loadCountryMaps(), db.query(`SELECT slug FROM cities`)]);
    return { ...maps, existing: new Set(rows.map((r) => r.slug)) };
  },

  plan({ rows, headerMap, dataStart }, ctx) {
    const rep = makeReport();
    const items = [], seen = new Set();
    let toInsert = 0, toUpdate = 0;

    rows.forEach((row, i) => {
      const n = dataStart + i;
      const get = getter(CITY_H, headerMap, row);
      const slug = toStrCell(get("slug"));
      const namePt = toStrCell(get("namePt")), nameEn = toStrCell(get("nameEn"));
      const name = toStrCell(get("name")) || namePt || nameEn;
      if (!slug && !name) return;
      if (!slug || !name) return rep.errors.add(n, "slug_ou_nome_vazio");
      if (seen.has(slug)) return rep.errors.add(n, "slug_duplicado", slug);
      seen.add(slug);

      const idCountry = resolveCountryId(slug, toStrCell(get("countryName")), ctx);
      if (idCountry == null) return rep.errors.add(n, "pais_nao_encontrado", slugCountryPrefix(slug) || toStrCell(get("countryName")) || slug);

      ctx.existing.has(slug) ? toUpdate++ : toInsert++;
      items.push({ n, slug, name, nameEn: nameEn || null, namePt: namePt || null, nameEs: toStrCell(get("nameEs")) || null, idCountry });
    });

    return {
      items, rep,
      stats: { total: items.length, toInsert, toUpdate },
      sample: items.slice(0, 8).map(({ slug, name, idCountry }) => ({ slug, name, idCountry })),
    };
  },

  async apply(client, plan, opts) {
    const rows = plan.items.map((c) => [c.slug, c.name, c.nameEn, c.namePt, c.nameEs, c.idCountry]);
    const res = await batchUpsert(client, {
      table: "cities",
      cols: ["slug", "name", "name_en", "name_pt", "name_es", "id_country"],
      rows,
      updateCols: opts.updateExisting ? ["name", "name_en", "name_pt", "name_es", "id_country"] : [],
      keepIfNull: ["name_en", "name_pt", "name_es"],
    });
    const inserted = res.filter((r) => r.inserted).length;
    return { inserted, updated: res.length - inserted, skipped: plan.items.length - res.length };
  },
};

// ── FEDERAÇÕES ─────────────────────────────────────────────────────────────

const FED_H = {
  slug: "Slug da federação", acronym: "Sigla", fullName: "Nome da entidade", parent: "Filiação",
  continent: "Continente", countrySlug: "Slug do país", citySlug: "Slug da cidade",
  founded: "Data de fundação", yearOnly: "Só ano?",
  primary: "Código primário", secondary: "Código secundário", tertiary: "Código terciário",
};

const federations = {
  sheet: "Federações",
  required: [FED_H.slug, FED_H.acronym],

  async loadCtx() {
    const [maps, { rows: ci }, { rows: fe }] = await Promise.all([
      loadCountryMaps(),
      db.query(`SELECT slug, id_city, COALESCE(name_pt, name) AS name FROM cities`),
      db.query(`SELECT id_federation, slug, acronym, id_country FROM federations`),
    ]);
    return {
      ...maps,
      cities: new Map(ci.map((c) => [c.slug, c])),
      existing: new Set(fe.map((f) => f.slug).filter(Boolean)),
      // Filiação aponta pra global/continental (sem país): resolvida por sigla.
      dbParents: new Map(fe.filter((f) => !f.id_country).map((f) => [norm(f.acronym), f.id_federation])),
    };
  },

  plan({ rows, headerMap, dataStart }, ctx) {
    const rep = makeReport();
    const items = [], seen = new Set();
    let toInsert = 0, toUpdate = 0;

    rows.forEach((row, i) => {
      const n = dataStart + i;
      const get = getter(FED_H, headerMap, row);
      const slug = toStrCell(get("slug"));
      const acronym = toStrCell(get("acronym"));
      if (!slug && !acronym) return;
      if (!slug || !acronym) return rep.errors.add(n, "slug_ou_sigla_vazio");
      if (seen.has(slug)) return rep.errors.add(n, "slug_duplicado", slug);
      seen.add(slug);

      const countrySlug = toStrCell(get("countrySlug"));
      let idCountry = null;
      if (countrySlug) {
        idCountry = ctx.countrySlugs.get(countrySlug) ?? null;
        if (idCountry == null) return rep.errors.add(n, "pais_nao_encontrado", countrySlug);
      }

      const citySlug = toStrCell(get("citySlug"));
      const city = citySlug ? ctx.cities.get(citySlug) : null;
      if (citySlug && !city) rep.warnings.add(n, "cidade_nao_encontrada", citySlug);

      const founded = parseSheetDate(get("founded"), isYes(get("yearOnly")));
      if (founded.invalid) rep.warnings.add(n, "data_invalida", String(get("founded")));

      // Esfera: sem país → Mundo = global, senão continental; com país = nacional.
      const continent = toStrCell(get("continent"));
      const sphere = countrySlug ? "nacional" : norm(continent) === "mundo" ? "global" : "continental";

      ctx.existing.has(slug) ? toUpdate++ : toInsert++;
      items.push({
        n, slug, acronym, sphere, idCountry,
        fullName: toStrCell(get("fullName")) || null,
        parentAcronym: toStrCell(get("parent")) || null,
        idCity: city?.id_city ?? null, cityName: city?.name ?? null,
        // federations só tem founded_at (DATE): ano isolado vira 1º de janeiro.
        foundedAt: founded.date || (founded.year ? toDateString(founded.year, 1, 1) : null),
        primary: normalizeHex(get("primary")), secondary: normalizeHex(get("secondary")), tertiary: normalizeHex(get("tertiary")),
      });
    });

    return {
      items, rep,
      stats: { total: items.length, toInsert, toUpdate },
      sample: items.slice(0, 8).map(({ slug, acronym, sphere, parentAcronym }) => ({ slug, acronym, sphere, parent: parentAcronym })),
    };
  },

  async apply(client, plan, opts, ctx) {
    // name segue a convenção já existente: nacional = nome do país (PT), demais = sigla.
    const { rows: cn } = await client.query(`SELECT id_country, name FROM countries`);
    const countryName = new Map(cn.map((c) => [c.id_country, c.name]));

    const res = await batchUpsert(client, {
      table: "federations",
      cols: ["slug", "name", "acronym", "full_name", "sphere", "id_country", "id_city", "city_name",
             "founded_at", "primary_color", "secondary_color", "tertiary_color"],
      rows: plan.items.map((f) => [
        f.slug, f.idCountry ? countryName.get(f.idCountry) || f.acronym : f.acronym, f.acronym, f.fullName,
        f.sphere, f.idCountry, f.idCity, f.cityName, f.foundedAt, f.primary, f.secondary, f.tertiary,
      ]),
      updateCols: opts.updateExisting
        ? ["name", "acronym", "full_name", "sphere", "id_country", "id_city", "city_name", "founded_at",
           "primary_color", "secondary_color", "tertiary_color"]
        : [],
      keepIfNull: ["full_name", "id_country", "id_city", "city_name", "founded_at", "primary_color", "secondary_color", "tertiary_color"],
    });
    const written = new Set(res.map((r) => r.slug));

    // 2ª passada: Filiação (id_parent_federation) — o pai pode estar na própria planilha.
    const { rows: ids } = await client.query(
      `SELECT id_federation, slug, acronym, id_country FROM federations WHERE slug = ANY($1::text[])`,
      [plan.items.map((f) => f.slug)]
    );
    const parents = new Map(ctx.dbParents);
    ids.filter((f) => !f.id_country).forEach((f) => parents.set(norm(f.acronym), f.id_federation));
    const idBySlug = new Map(ids.map((f) => [f.slug, f.id_federation]));

    const childIds = [], parentIds = [];
    for (const f of plan.items) {
      if (!f.parentAcronym || !written.has(f.slug)) continue;
      const pid = parents.get(norm(f.parentAcronym));
      if (pid == null) { plan.rep.warnings.add(f.n, "filiacao_nao_encontrada", f.parentAcronym); continue; }
      childIds.push(idBySlug.get(f.slug)); parentIds.push(pid);
    }
    if (childIds.length) {
      await client.query(
        `UPDATE federations f SET id_parent_federation = v.pid
         FROM unnest($1::int[], $2::int[]) AS v(cid, pid) WHERE f.id_federation = v.cid`,
        [childIds, parentIds]
      );
    }

    const inserted = res.filter((r) => r.inserted).length;
    return { inserted, updated: res.length - inserted, skipped: plan.items.length - res.length };
  },
};

// ── ESTÁDIOS ───────────────────────────────────────────────────────────────

const STADIUM_H = {
  slug: "Slug do estádio", name: "Nome do estádio", formal: "Nome formal", popular: "Nome popular",
  commercial: "Nome comercial", countrySlug: "Slug do país", citySlug: "Slug da cidade",
  address: "Endereço", coordinates: "Coordenadas", built: "Data de construção", renovated: "Data de reforma",
  yearOnly: "Só ano?", capacity: "Capacidade", capacitySource: "Fonte (capacidade)",
  owner: "Proprietário", ownerSource: "Fonte (propriedade)",
};

const stadiums = {
  sheet: "Estádios",
  required: [STADIUM_H.slug],

  async loadCtx() {
    const [maps, { rows: ci }, { rows: st }] = await Promise.all([
      loadCountryMaps(),
      db.query(`SELECT slug, id_city FROM cities`),
      db.query(`SELECT slug FROM stadiums`),
    ]);
    return { ...maps, cities: new Map(ci.map((c) => [c.slug, c.id_city])), existing: new Set(st.map((r) => r.slug)) };
  },

  plan({ rows, headerMap, dataStart }, ctx) {
    const rep = makeReport();
    const items = [], seen = new Set();
    let toInsert = 0, toUpdate = 0;

    rows.forEach((row, i) => {
      const n = dataStart + i;
      const get = getter(STADIUM_H, headerMap, row);
      const slug = toStrCell(get("slug"));
      const formal = toStrCell(get("formal")), popular = toStrCell(get("popular")), commercial = toStrCell(get("commercial"));
      // "Nome do estádio" é derivado na planilha; se vier vazio, cai pro melhor nome disponível.
      const name = toStrCell(get("name")) || popular || commercial || formal;
      if (!slug && !name) return;
      if (!slug || !name) return rep.errors.add(n, "slug_ou_nome_vazio");
      if (seen.has(slug)) return rep.errors.add(n, "slug_duplicado", slug);
      seen.add(slug);

      const countrySlug = toStrCell(get("countrySlug"));
      let idCountry = countrySlug ? ctx.countrySlugs.get(countrySlug) ?? null : resolveCountryId(slug, "", ctx);
      if (idCountry == null) return rep.errors.add(n, "pais_nao_encontrado", countrySlug || slugCountryPrefix(slug) || slug);

      const citySlug = toStrCell(get("citySlug"));
      const idCity = citySlug ? ctx.cities.get(citySlug) ?? null : null;
      if (citySlug && idCity == null) rep.warnings.add(n, "cidade_nao_encontrada", citySlug);

      const coords = parseCoordinates(get("coordinates"));
      if (coords.invalid) rep.warnings.add(n, "coordenadas_invalidas", String(get("coordinates")));

      // A planilha tem um único par Pré-1900/Só ano? pras duas datas — vale pra ambas.
      const yearOnly = isYes(get("yearOnly"));
      const built = parseSheetDate(get("built"), yearOnly);
      const renovated = parseSheetDate(get("renovated"), yearOnly);
      if (built.invalid) rep.warnings.add(n, "data_construcao_invalida", String(get("built")));
      if (renovated.invalid) rep.warnings.add(n, "data_reforma_invalida", String(get("renovated")));

      const capacity = parseIntCell(get("capacity"));
      if (capacity.invalid) rep.warnings.add(n, "capacidade_invalida", String(get("capacity")));

      ctx.existing.has(slug) ? toUpdate++ : toInsert++;
      items.push({
        n, slug, name, formal: formal || null, popular: popular || null, commercial: commercial || null,
        idCountry, idCity, address: toStrCell(get("address")) || null, lat: coords.lat, lng: coords.lng,
        builtAt: built.date, builtYear: built.year, renovatedAt: renovated.date, renovatedYear: renovated.year,
        capacity: capacity.value, capacitySource: toStrCell(get("capacitySource")) || null,
        owner: toStrCell(get("owner")) || null, ownerSource: toStrCell(get("ownerSource")) || null,
      });
    });

    return {
      items, rep,
      stats: { total: items.length, toInsert, toUpdate },
      sample: items.slice(0, 8).map(({ slug, name, capacity, idCity }) => ({ slug, name, capacity, idCity })),
    };
  },

  async apply(client, plan, opts) {
    const cols = ["slug", "name", "formal_name", "popular_name", "commercial_name", "id_country", "id_city", "address",
                  "latitude", "longitude", "built_at", "built_year", "renovated_at", "renovated_year",
                  "capacity", "capacity_source", "owner", "owner_source"];
    const res = await batchUpsert(client, {
      table: "stadiums", cols,
      rows: plan.items.map((s) => [
        s.slug, s.name, s.formal, s.popular, s.commercial, s.idCountry, s.idCity, s.address,
        s.lat, s.lng, s.builtAt, s.builtYear, s.renovatedAt, s.renovatedYear,
        s.capacity, s.capacitySource, s.owner, s.ownerSource,
      ]),
      updateCols: opts.updateExisting ? cols.filter((c) => c !== "slug") : [],
      keepIfNull: cols.filter((c) => !["slug", "name", "id_country"].includes(c)),
    });
    const inserted = res.filter((r) => r.inserted).length;
    return { inserted, updated: res.length - inserted, skipped: plan.items.length - res.length };
  },
};

// ── Handlers ───────────────────────────────────────────────────────────────

const ENTITIES = { countries, cities, federations, stadiums };

const summarize = (rep) => ({
  errors: { total: rep.errors.total, counts: rep.errors.counts, list: rep.errors.list },
  warnings: { total: rep.warnings.total, counts: rep.warnings.counts, list: rep.warnings.list },
});

const parseOptions = (raw) => {
  try { return { updateExisting: false, ...(raw ? JSON.parse(raw) : {}) }; }
  catch { return { updateExisting: false }; }
};

function resolveRequest(req, res) {
  const entity = ENTITIES[req.params.entity];
  if (!entity) { res.status(404).json({ error: "Entidade inválida. Use: countries, cities, federations ou stadiums" }); return null; }
  if (!req.file) { res.status(400).json({ error: "Arquivo não enviado" }); return null; }
  return entity;
}

// POST /admin/identification/:entity/preview   (multipart: file, sheetName?)
export async function previewIdentification(req, res) {
  const entity = resolveRequest(req, res);
  if (!entity) return;
  try {
    const sheetName = req.body.sheetName;
    if (!sheetName) {
      const wb = XLSX.read(req.file.buffer, { type: "buffer", bookSheets: true });
      return res.json({ sheets: wb.SheetNames, defaultSheet: entity.sheet });
    }
    const sheet = readSheet(req.file.buffer, sheetName, entity.required);
    const ctx = await entity.loadCtx();
    const plan = entity.plan(sheet, ctx, parseOptions(req.body.options));
    return res.json({ sheet: sheetName, stats: plan.stats, sample: plan.sample, ...summarize(plan.rep) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("[previewIdentification]", err);
    return res.status(500).json({ error: "Erro ao processar preview", detail: err.message });
  }
}

// POST /admin/identification/:entity/import   (multipart: file, sheetName, options?)
export async function importIdentification(req, res) {
  const entity = resolveRequest(req, res);
  if (!entity) return;
  const { sheetName } = req.body;
  if (!sheetName) return res.status(400).json({ error: "Aba não informada" });

  let plan, ctx;
  const opts = parseOptions(req.body.options);
  try {
    const sheet = readSheet(req.file.buffer, sheetName, entity.required);
    ctx = await entity.loadCtx();
    plan = entity.plan(sheet, ctx, opts);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("[importIdentification:plan]", err);
    return res.status(500).json({ error: "Erro ao ler a planilha", detail: err.message });
  }

  if (!plan.items.length) {
    return res.json({ message: "Nenhuma linha válida.", inserted: 0, updated: 0, skipped: 0, ...summarize(plan.rep) });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await entity.apply(client, plan, opts, ctx);
    await client.query("COMMIT");
    return res.json({ message: "Importação concluída", ...result, ...summarize(plan.rep) });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[importIdentification]", err);
    return res.status(500).json({ error: "Erro ao importar", detail: err.message });
  } finally {
    client.release();
  }
}
