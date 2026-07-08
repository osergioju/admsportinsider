import db from "../config/db.js";

// ─────────────────────────────────────────────────────────────────────────────
// Integração com a API externa de dados esportivos (FootyStats / football-data-api).
// Por enquanto: salvar/testar o token. Depois evolui para puxar dados públicos.
// O token fica em app_settings (chave/valor), não em env, para o admin gerenciar
// pela tela sem deploy.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "footystats_api_token";
const FOOTYSTATS_BASE = "https://api.football-data-api.com";

async function getSetting(key) {
  const r = await db.query("SELECT value FROM app_settings WHERE key = $1", [key]);
  return r.rows[0]?.value ?? null;
}

async function setSetting(key, value) {
  await db.query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}

// Mostra só os últimos 4 caracteres para conferência, sem expor o segredo inteiro
function maskToken(token) {
  if (!token) return null;
  if (token.length <= 8) return `••••${token.slice(-2)}`;
  return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
}

// GET /admin/api-integration — estado atual (se há token salvo, mascarado, quando)
export async function getApiSettings(req, res) {
  try {
    const r = await db.query(
      "SELECT value, updated_at FROM app_settings WHERE key = $1",
      [TOKEN_KEY]
    );
    const row = r.rows[0];
    return res.json({
      provider: "footystats",
      hasToken: !!row?.value,
      tokenMasked: maskToken(row?.value),
      updatedAt: row?.updated_at ?? null,
    });
  } catch (err) {
    console.error("[getApiSettings]", err);
    res.status(500).json({ message: "Erro ao carregar configurações da API" });
  }
}

// PUT /admin/api-integration/token  { token }
export async function saveApiToken(req, res) {
  const token = (req.body?.token ?? "").trim();
  if (!token) {
    return res.status(400).json({ message: "Informe o token da API." });
  }
  try {
    await setSetting(TOKEN_KEY, token);
    return res.json({
      success: true,
      hasToken: true,
      tokenMasked: maskToken(token),
    });
  } catch (err) {
    console.error("[saveApiToken]", err);
    res.status(500).json({ message: "Erro ao salvar o token." });
  }
}

// DELETE /admin/api-integration/token — remove o token salvo
export async function deleteApiToken(req, res) {
  try {
    await db.query("DELETE FROM app_settings WHERE key = $1", [TOKEN_KEY]);
    return res.json({ success: true });
  } catch (err) {
    console.error("[deleteApiToken]", err);
    res.status(500).json({ message: "Erro ao remover o token." });
  }
}

// FootyStats usa ano simples (2016) ou temporada cruzada de 8 dígitos (20252026).
// Formata o cruzado como "2025/26" para leitura.
function formatSeasonYear(y) {
  if (y == null) return null;
  const s = String(y);
  if (s.length === 8) return `${s.slice(0, 4)}/${s.slice(6, 8)}`;
  return s;
}

// Normaliza um item de /league-list para exibição no painel de teste
function parseLeague(item) {
  const seasons = Array.isArray(item?.season) ? item.season : [];
  const years = seasons.map(s => Number(s?.year)).filter(Boolean);
  return {
    name: item?.league_name || item?.name || "—",
    country: item?.country || "—",
    seasonsCount: seasons.length,
    latestSeason: years.length ? formatSeasonYear(Math.max(...years)) : null,
    seasonIds: seasons.map(s => s?.id).filter(v => v != null),
  };
}

// GET /admin/api-integration/competitions?chosenOnly=true
// Lista as competições da key com suas temporadas (id+ano) para popular seletores.
export async function getApiCompetitions(req, res) {
  try {
    const token = await getSetting(TOKEN_KEY);
    if (!token) return res.status(400).json({ message: "Nenhum token salvo." });
    const chosenOnly = req.query.chosenOnly !== "false";
    const url = `${FOOTYSTATS_BASE}/league-list?key=${encodeURIComponent(token)}${chosenOnly ? "&chosen_leagues_only=true" : ""}`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const body = await resp.json().catch(() => null);
    if (!resp.ok || body?.success === false) {
      return res.status(200).json({ ok: false, message: body?.message || `A API retornou erro (HTTP ${resp.status}).` });
    }
    const data = Array.isArray(body?.data) ? body.data : [];
    const competitions = data.map((item, i) => ({
      id: i, // índice estável só para chave no front
      name: item?.league_name || item?.name || "—",
      country: item?.country || "—",
      seasons: (Array.isArray(item?.season) ? item.season : [])
        .map(s => ({ id: s?.id, year: Number(s?.year), yearLabel: formatSeasonYear(s?.year) }))
        .filter(s => s.id != null)
        .sort((a, b) => b.year - a.year),
    })).sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

    return res.json({ ok: true, count: competitions.length, competitions });
  } catch (err) {
    console.error("[getApiCompetitions]", err);
    res.status(500).json({ message: "Erro ao listar competições." });
  }
}

// Normaliza um jogo de /league-matches
function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
// FootyStats devolve imagem ora absoluta, ora relativa (ex: "teams/brazil.png")
function imgUrl(p) {
  if (!p) return null;
  return /^https?:\/\//.test(p) ? p : `https://cdn.footystats.org/img/${p}`;
}
function parseMatch(m) {
  return {
    id: m?.id,
    week: m?.game_week ?? null,
    date: m?.date_unix ? new Date(m.date_unix * 1000).toISOString() : null,
    status: m?.status ?? null,
    finished: m?.status === "complete",
    home: { name: m?.home_name || "—", image: imgUrl(m?.home_image), goals: numOrNull(m?.homeGoalCount) },
    away: { name: m?.away_name || "—", image: imgUrl(m?.away_image), goals: numOrNull(m?.awayGoalCount) },
    stadium: m?.stadium_name || null,
    xg: { home: numOrNull(m?.team_a_xg), away: numOrNull(m?.team_b_xg) },
    pens: { home: numOrNull(m?.team_a_penalty_goals), away: numOrNull(m?.team_b_penalty_goals) },
  };
}

// GET /admin/api-integration/matches?season_id=X
// Partidas de uma temporada agrupadas por rodada (game_week). Uso de teste.
export async function getApiMatches(req, res) {
  try {
    const seasonId = Number(req.query.season_id);
    if (!seasonId) return res.status(400).json({ message: "Informe season_id." });
    const token = await getSetting(TOKEN_KEY);
    if (!token) return res.status(400).json({ message: "Nenhum token salvo." });

    const url = `${FOOTYSTATS_BASE}/league-matches?key=${encodeURIComponent(token)}&season_id=${seasonId}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const body = await resp.json().catch(() => null);
    if (!resp.ok || body?.success === false) {
      return res.status(200).json({ ok: false, message: body?.message || `A API retornou erro (HTTP ${resp.status}).` });
    }

    const data = Array.isArray(body?.data) ? body.data : [];
    const parsed = data.map(parseMatch);
    const finishedCount = parsed.filter(m => m.finished).length;

    // Agrupa por rodada e ordena cronologicamente
    const byWeek = new Map();
    for (const m of parsed) {
      const w = m.week ?? 0;
      if (!byWeek.has(w)) byWeek.set(w, []);
      byWeek.get(w).push(m);
    }
    const rounds = [...byWeek.entries()]
      .map(([week, matches]) => ({
        week,
        label: week > 0 ? `Rodada ${week}` : "Sem rodada",
        matches: matches.sort((a, b) => new Date(a.date ?? 0) - new Date(b.date ?? 0)),
      }))
      .sort((a, b) => a.week - b.week);

    return res.json({ ok: true, total: parsed.length, finished: finishedCount, rounds });
  } catch (err) {
    console.error("[getApiMatches]", err);
    res.status(500).json({ message: "Erro ao buscar partidas." });
  }
}

// POST /admin/api-integration/test  { token?, chosenOnly? }
// Testa o token chamando /league-list e devolve as competições liberadas para a key.
// Aceita um token avulso no body (para testar antes de salvar); senão usa o salvo.
export async function testApiToken(req, res) {
  try {
    const bodyToken = (req.body?.token ?? "").trim();
    const token = bodyToken || (await getSetting(TOKEN_KEY));
    if (!token) {
      return res.status(400).json({ ok: false, message: "Nenhum token salvo. Cole e salve um token, ou envie um para teste." });
    }

    // chosen_leagues_only=true → só as competições que a conta selecionou no FootyStats
    const chosenOnly = req.body?.chosenOnly !== false; // default true
    const url = `${FOOTYSTATS_BASE}/league-list?key=${encodeURIComponent(token)}${chosenOnly ? "&chosen_leagues_only=true" : ""}`;

    let resp, body;
    try {
      resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
      body = await resp.json().catch(() => null);
    } catch (netErr) {
      console.error("[testApiToken] fetch error:", netErr);
      return res.status(502).json({ ok: false, message: "Não foi possível contatar a API do FootyStats. Tente novamente." });
    }

    // FootyStats sinaliza erro por success:false e/ou status != 200
    if (!resp.ok || (body && body.success === false)) {
      const message = body?.message || body?.error ||
        (resp.status === 417 || resp.status === 403
          ? "Token inválido ou sem permissão."
          : `A API retornou erro (HTTP ${resp.status}).`);
      return res.status(200).json({ ok: false, status: resp.status, message });
    }

    const data = Array.isArray(body?.data) ? body.data : [];
    const competitions = data.map(parseLeague)
      .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

    return res.json({
      ok: true,
      message: `Token válido — ${competitions.length} competição(ões) disponível(is).`,
      count: competitions.length,
      chosenOnly,
      competitions,
    });
  } catch (err) {
    console.error("[testApiToken]", err);
    res.status(500).json({ ok: false, message: "Erro ao testar o token." });
  }
}
