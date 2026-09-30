// Resolve torneio/fase de uma partida a partir das datas configuradas em
// leagues.structure_json[ano].torneios / .fases — usado tanto no IMPORT
// (para gravar matches.phase_key na hora do insert) quanto em sports.controller.js
// (para exibição), garantindo que os dois lados concordem sobre onde cada
// partida cai, sem depender de inferência por cluster de datas.
//
// Algoritmo (mesmo em ambos os níveis): entre os itens que têm `startDate`
// ("YYYY-MM-DD"), ordena por data e atribui a partida ao ÚLTIMO cujo
// startDate seja <= a data da partida. Generaliza para N itens (não assume
// exatamente 2, ao contrário da lógica antiga de Apertura/Clausura).

function slugifyName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// items: [{ key, startDate }] (torneios) — retorna a `key` do item resolvido, ou null
// se nenhum item tiver startDate configurado (deixa pro fallback de inferência existente).
function resolveByStartDate(items, matchDateMs) {
  if (!Array.isArray(items) || !matchDateMs) return null;
  const comData = items.filter(t => t.startDate);
  if (!comData.length) return null;

  const sorted = [...comData].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Item(ns) sem data = recebe(m) tudo ANTES da primeira data configurada (é o inicial).
  const noDateKey = items.find(t => !t.startDate)?.key ?? sorted[0].key;

  let assigned = noDateKey;
  for (const t of sorted) {
    if (matchDateMs >= new Date(t.startDate).getTime()) assigned = t.key;
  }
  return assigned;
}

/**
 * @param {Array} torneios - seasonConfig.torneios, ex: [{ key, nome, startDate, fases }]
 * @param {number|null} matchDateMs - timestamp em ms da partida
 * @returns {string|null} key do torneio resolvido, ou null se não configurado
 */
export function resolveTorneioKey(torneios, matchDateMs) {
  return resolveByStartDate(torneios, matchDateMs);
}

/**
 * @param {Array} fases - lista de fases (do torneio resolvido, ou top-level da temporada)
 * @param {number|null} matchDateMs
 * @returns {string|null} slug da fase resolvida (a partir de fase.nome), ou null
 */
export function resolveFaseKey(fases, matchDateMs) {
  if (!Array.isArray(fases) || !fases.length) return null;
  const withKey = fases.map(f => ({ ...f, key: slugifyName(f.nome) }));
  return resolveByStartDate(withKey, matchDateMs);
}

/**
 * Monta o phase_key final de uma partida combinando torneio + fase, no mesmo
 * formato que sports.controller.js já espera (prefixo do torneio, ex:
 * "apertura_fase_de_grupos"), a partir da estrutura configurada para a temporada.
 *
 * @param {object|null} seasonConfig - leagues.structure_json?.[String(seasonYear)]
 * @param {Date|number|null} matchDate
 * @returns {{ phaseKey: string|null, torneioKey: string|null, faseTipo: string|null }}
 */
export function resolvePhaseForMatch(seasonConfig, matchDate) {
  if (!seasonConfig || !matchDate) return { phaseKey: null, torneioKey: null, faseTipo: null };
  const matchDateMs = matchDate instanceof Date ? matchDate.getTime() : Number(matchDate);
  if (!matchDateMs || Number.isNaN(matchDateMs)) return { phaseKey: null, torneioKey: null, faseTipo: null };

  const torneios = seasonConfig.torneios ?? null;
  let torneioKey = null;
  let fasesDoNivel = seasonConfig.fases ?? [];

  if (Array.isArray(torneios) && torneios.length) {
    torneioKey = resolveTorneioKey(torneios, matchDateMs);
    if (torneioKey) {
      const torneio = torneios.find(t => t.key === torneioKey);
      fasesDoNivel = torneio?.fases ?? [];
    }
  }

  const faseKey = resolveFaseKey(fasesDoNivel, matchDateMs);
  const faseObj = faseKey
    ? fasesDoNivel.find(f => slugifyName(f.nome) === faseKey)
    : null;

  let phaseKey = null;
  if (torneioKey && faseKey) phaseKey = `${torneioKey}_${faseKey}`;
  else if (torneioKey) phaseKey = torneioKey;
  else if (faseKey) phaseKey = faseKey;

  return { phaseKey, torneioKey, faseTipo: faseObj?.tipo ?? null };
}
