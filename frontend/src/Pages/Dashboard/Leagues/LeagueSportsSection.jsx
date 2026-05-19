import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import { clubUrl } from "../../../utils/clubUrl";
import { Loader2, Trophy, ChevronsDown } from "lucide-react";
import { useTranslation } from "../../../context/TranslationContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = d => d
  ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" })
  : "—";

// ─── Disciplinary table ───────────────────────────────────────────────────────

function DisciplinaryTable({ rows, t }) {
  if (!rows?.length) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_discipline", "Sem dados disciplinares.")}</p>
  );
  return (
    <div className="rounded-xl border border-gray-100 overflow-x-auto bg-white shadow-sm">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <th className="py-3 px-3 text-left font-semibold w-10">#</th>
            <th className="py-3 px-3 text-left font-semibold">Clube</th>
            <th className="py-3 px-3 text-center font-semibold">J</th>
            <th className="py-3 px-3 text-center font-semibold">Faltas</th>
            <th className="py-3 px-3 text-center font-semibold">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-3.5 rounded-[2px] inline-block bg-amber-400 shrink-0" />
                Amarelos
              </span>
            </th>
            <th className="py-3 px-3 text-center font-semibold">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-3.5 rounded-[2px] inline-block bg-red-500 shrink-0" />
                Vermelhos
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
              <td className="px-3 py-3 text-center font-semibold text-gray-400">{i + 1}</td>
              <td className="px-3 py-3">
                <Link
                  to={clubUrl(row.id, row.slug)}
                  className="flex items-center gap-2.5 hover:text-violet-700 transition-colors font-semibold text-gray-700"
                >
                  {row.crest ? (
                    <img
                      src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_plus/reduced_reduced_${row.crest}.webp`}
                      alt=""
                      className="w-5 h-5 object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded bg-gray-100 shrink-0" />
                  )}

                  {row.name}
                </Link>
              </td>
              <td className="px-3 py-3 text-center text-gray-500">{row.matches}</td>
              <td className="px-3 py-3 text-center text-gray-600 font-medium">{row.fouls}</td>
              <td className="px-3 py-3 text-center">
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-600">
                  <span className="w-2.5 h-3.5 rounded-[2px] inline-block bg-amber-400 shrink-0" />
                  {row.yellow}
                </span>
              </td>
              <td className="px-3 py-3 text-center">
                <span className="inline-flex items-center gap-1.5 font-bold text-red-600">
                  <span className="w-2.5 h-3.5 rounded-[2px] inline-block bg-red-500 shrink-0" />
                  {row.red}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

function SubTabs({ value, onChange, options }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5 self-start w-fit shrink-0">
      {options.map(({ key, label }) => (
        <button key={key} onClick={() => onChange(key)}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all
            ${value === key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}


// ─── Standings table ──────────────────────────────────────────────────────────

function StandingsTable({ rows, t, seasonConfig, legendContLabel }) {
  if (!rows?.length) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_classification", "Sem dados de classificação.")}</p>
  );

  const n = rows.length;

  // Use per-season config when available; fall back to heuristics
  const continentalSpots = seasonConfig?.continental_spots ?? (n >= 8 ? Math.ceil(n * 0.25) : 0);
  const relegationSpots = seasonConfig?.relegation_spots ?? Math.max(2, Math.ceil(n * 0.15));

  const zoneOf = (pos) => {
    if (pos === 1) return "champion";
    if (continentalSpots > 0 && pos > 1 && pos <= continentalSpots) return "continental";
    if (relegationSpots > 0 && pos > n - relegationSpots) return "relegation";
    return null;
  };

  const zoneBar = (pos) => {
    const z = zoneOf(pos);
    if (z === "champion") return "border-l-2 border-gray-900";
    if (z === "continental") return "border-l-2 border-emerald-400";
    if (z === "relegation") return "border-l-2 border-red-400";
    return "border-l-2 border-transparent";
  };

  return (
    <div className="mb-10 rounded-xl border border-gray-100 overflow-x-auto bg-white shadow-sm">
      <table className="w-full text-sm min-w-[540px]">
        <thead>
          <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <th className="py-3 px-3 text-center font-semibold w-10 sticky left-0 bg-gray-50 z-20">#</th>
            <th className="py-3 px-3 text-left font-semibold sticky left-[40px] bg-gray-50 z-20">Clube</th>
            <th className="py-3 px-2 text-center font-semibold text-violet-500">P</th>
            <th className="py-3 px-2 text-center font-semibold">J</th>
            <th className="py-3 px-2 text-center font-semibold text-emerald-500">V</th>
            <th className="py-3 px-2 text-center font-semibold">E</th>
            <th className="py-3 px-2 text-center font-semibold text-red-400">D</th>
            <th className="py-3 px-2 text-center font-semibold">GP</th>
            <th className="py-3 px-2 text-center font-semibold">GC</th>
            <th className="py-3 px-2 text-center font-semibold">SG</th>
            <th className="py-3 px-2 text-center font-semibold">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pos = row.pos ?? i + 1;
            return (
              <tr key={row.id ?? i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className={`px-3 py-3 sticky left-0 bg-white z-10 ${zoneBar(pos)}`}>
                  <span className={`text-sm font-bold block text-center tabular-nums ${pos === 1 ? "text-gray-900" : "text-gray-400"}`}>
                    {pos}
                  </span>
                </td>

                <td className="px-3 py-3 sticky left-[40px] bg-white z-10">
                  <Link
                    to={clubUrl(row.id, row.slug)}
                    className={`flex items-center gap-2.5 hover:text-violet-700 transition-colors ${pos === 1 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}
                  >
                    {row.slug
                      ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_plus/reduced_reduced_` + row.slug + `.webp`} alt="" className="w-5 h-5 object-contain shrink-0" />
                      : <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />
                    }
                    <span className="truncate">{row.name}</span>
                  </Link>
                </td>
                <td className={`px-2 py-3 text-center font-bold tabular-nums text-base ${pos === 1 ? "text-gray-900" : "text-gray-700"}`}>{row.pts}</td>
                <td className="px-2 py-3 text-center text-gray-500 tabular-nums">{row.j}</td>
                <td className="px-2 py-3 text-center font-semibold text-emerald-600 tabular-nums">{row.v}</td>
                <td className="px-2 py-3 text-center text-gray-500 tabular-nums">{row.e}</td>
                <td className="px-2 py-3 text-center text-red-400 tabular-nums">{row.d}</td>
                <td className="px-2 py-3 text-center text-gray-600 tabular-nums">{row.gp}</td>
                <td className="px-2 py-3 text-center text-gray-600 tabular-nums">{row.gc}</td>
                <td className={`px-2 py-3 text-center font-semibold tabular-nums ${row.sg > 0 ? "text-emerald-600" : row.sg < 0 ? "text-red-500" : "text-gray-400"}`}>
                  {row.sg > 0 ? `+${row.sg}` : row.sg}
                </td>
                <td className="px-2 py-3 text-center text-gray-500 tabular-nums">{row.pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {n >= 6 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-900 shrink-0" />Líder
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />{legendContLabel ?? "Zona continental"}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />Rebaixamento
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Two-group standings (apertura/clausura com grupos A e B) ────────────────

function GroupedStandings({ rows, groupClubs, classificados, t, seasonConfig }) {
  const entries = Object.entries(groupClubs);
  if (!entries.length) return <StandingsTable rows={rows} t={t} seasonConfig={seasonConfig} />;

  return (
    <div className={`grid gap-4 ${entries.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
      {entries.map(([groupKey, clubIds]) => {
        const groupRows = rows
          .filter(r => clubIds.includes(r.id))
          .sort((a, b) => (b.pts - a.pts) || (b.sg - a.sg) || (b.gp - a.gp))
          .map((r, i) => ({ ...r, pos: i + 1 }));
        const groupConfig = {
          continental_spots: classificados ?? 0,
          relegation_spots: 0,
        };
        return (
          <div key={groupKey} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-xs font-bold text-violet-700">{groupKey}</span>
              </div>
              <span className="text-sm font-bold text-gray-700">Grupo {groupKey}</span>
              {classificados > 0 && (
                <span className="text-xs text-gray-400 ml-1">{classificados} avançam</span>
              )}
            </div>
            <StandingsTable rows={groupRows} t={t} seasonConfig={groupConfig} legendContLabel="Avança" />
          </div>
        );
      })}
    </div>
  );
}

// ─── Confronto card ───────────────────────────────────────────────────────────

// Returns the score of `teamId` in a given leg (handles home/away swap)
function legScoreFor(leg, teamId) {
  if (leg.home_goals == null) return null;
  if (leg.home?.id === teamId) return leg.home_goals;
  if (leg.away?.id === teamId) return leg.away_goals;
  return null;
}

function ConfrontoCard({ confronto }) {
  const { team1, team2, legs, agg } = confronto;
  const isDoubleLegged = legs.length === 2;

  const agg1 = agg[team1.id] ?? null;
  const agg2 = agg[team2.id] ?? null;
  const allFinished = legs.every(l => l.home_goals != null);
  const aggDone = allFinished && agg1 !== null && agg2 !== null;
  let winner = null;
  if (aggDone && agg1 !== agg2) winner = agg1 > agg2 ? team1.id : team2.id;

  // ── Double-legged (Ida / Volta / Agr) ──────────────────────────────────────
  if (isDoubleLegged) {
    const [leg1, leg2] = legs;

    const ScoreBox = ({ score, href, dim }) => {
      const box = (
        <div className={`w-9 h-7 flex items-center justify-center rounded text-xs font-bold tabular-nums
          ${score == null
            ? "bg-gray-50 text-gray-200"
            : dim
              ? "bg-gray-50 text-gray-400"
              : "bg-gray-100 text-gray-700"}`}>
          {score ?? "–"}
        </div>
      );
      return href
        ? <Link to={href} className="hover:opacity-70 transition-opacity shrink-0">{box}</Link>
        : <div className="shrink-0">{box}</div>;
    };

    const AggBox = ({ score, isWinner }) => (
      <div className={`w-9 h-7 flex items-center justify-center rounded text-sm font-extrabold tabular-nums shrink-0
        ${score == null
          ? "bg-gray-50 text-gray-200"
          : isWinner
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-400"}`}>
        {score ?? "–"}
      </div>
    );

    const TeamRow = ({ team, isWinner, isLoser }) => {
      const s1 = legScoreFor(leg1, team.id);
      const s2 = legScoreFor(leg2, team.id);
      const aggScore = agg[team.id] ?? null;
      return (
        <div className={`flex items-center gap-1.5 px-3 py-2.5 ${isLoser ? "opacity-100" : ""}`}>
          {team.crest
            ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + team.crest + `.webp`} alt="" className="w-5 h-5 object-contain shrink-0" />
            : <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />}
          <Link to={clubUrl(team.id, team.slug)}
            className={`flex-1 min-w-0 text-sm truncate hover:underline transition-colors
              ${isWinner ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
            {team.name}
          </Link>
          <ScoreBox score={s1} href={`/dashboard/matches/${leg1.id}`} dim={!isWinner} />
          <ScoreBox score={s2} href={`/dashboard/matches/${leg2.id}`} dim={!isWinner} />
          <AggBox score={aggScore} isWinner={isWinner} />
        </div>
      );
    };

    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-colors">
        {/* Column headers */}
        <div className="flex items-center justify-end gap-1.5 px-3 pt-1.5 pb-1 border-b border-gray-50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 w-9 text-center">Ida</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 w-9 text-center">Volta</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 w-9 text-center">Agr</span>
        </div>
        <div className="py-0.5">
          <TeamRow team={team1} isWinner={winner === team1.id} isLoser={winner === team2.id} />
          <div className="mx-3 border-t border-gray-50" />
          <TeamRow team={team2} isWinner={winner === team2.id} isLoser={winner === team1.id} />
        </div>
      </div>
    );
  }

  // ── Single-legged ──────────────────────────────────────────────────────────
  const leg = legs[0];
  const s1 = leg ? legScoreFor(leg, team1.id) : null;
  const s2 = leg ? legScoreFor(leg, team2.id) : null;
  const finished = s1 !== null && s2 !== null;
  let singleWinner = null;
  if (finished && s1 !== s2) singleWinner = s1 > s2 ? team1.id : team2.id;

  const SingleRow = ({ team, score, isWinner, isLoser }) => (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 ${isLoser ? "opacity-35" : ""}`}>
      {team.crest
        ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_plus/reduced_reduced_` + team.crest + `.webp`} alt="" className="w-5 h-5 object-contain shrink-0" />
        : <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />}
      <Link to={clubUrl(team.id, team.slug)}
        className={`flex-1 min-w-0 text-sm truncate hover:underline transition-colors
          ${isWinner ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
        {team.name}
      </Link>
      {score !== null && (
        <span className={`text-base tabular-nums font-extrabold shrink-0
          ${isWinner ? "text-gray-900" : "text-gray-400"}`}>
          {score}
        </span>
      )
      }
    </div >
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-colors">
      {leg && (
        <div className="px-4 pt-2 pb-1.5 border-b border-gray-50">
          <Link to={`/dashboard/matches/${leg.id}`}
            className="text-xs font-semibold text-gray-400 hover:text-violet-600 transition-colors">
            {fmtDate(leg.date)}
          </Link>
        </div>
      )}
      <div className="py-1">
        <SingleRow team={team1} score={s1} isWinner={singleWinner === team1.id} isLoser={singleWinner === team2.id} />
        <div className="mx-4 border-t border-gray-50" />
        <SingleRow team={team2} score={s2} isWinner={singleWinner === team2.id} isLoser={singleWinner === team1.id} />
      </div>
    </div>
  );
}

// ─── Bracket helpers ──────────────────────────────────────────────────────────

// Infer group membership via BFS connected components, then compute standings
function computeGroupStandings(games) {
  if (!games.length) return [];
  const teamOpponents = new Map();
  const teamInfo = new Map();
  for (const g of games) {
    for (const side of [g.home, g.away]) {
      if (!teamOpponents.has(side.id)) teamOpponents.set(side.id, new Set());
      teamInfo.set(side.id, side);
    }
    teamOpponents.get(g.home.id).add(g.away.id);
    teamOpponents.get(g.away.id).add(g.home.id);
  }
  const visited = new Set();
  const groups = [];
  for (const teamId of teamOpponents.keys()) {
    if (visited.has(teamId)) continue;
    const group = [];
    const queue = [teamId];
    visited.add(teamId);
    while (queue.length) {
      const curr = queue.shift();
      group.push(curr);
      for (const opp of (teamOpponents.get(curr) ?? [])) {
        if (!visited.has(opp)) { visited.add(opp); queue.push(opp); }
      }
    }
    groups.push(group);
  }
  groups.sort((a, b) => Math.min(...a) - Math.min(...b));
  return groups.map(groupIds => {
    const idSet = new Set(groupIds);
    const stats = {};
    for (const id of groupIds) {
      const info = teamInfo.get(id);
      stats[id] = { id, name: info?.name ?? "", crest: info?.crest ?? null, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 };
    }
    for (const g of games) {
      if (!idSet.has(g.home.id) || !idSet.has(g.away.id)) continue;
      if (g.home_goals == null || g.away_goals == null) continue;
      const h = stats[g.home.id]; const a = stats[g.away.id];
      h.j++; a.j++;
      h.gp += g.home_goals; h.gc += g.away_goals;
      a.gp += g.away_goals; a.gc += g.home_goals;
      if (g.home_goals > g.away_goals) { h.v++; h.pts += 3; a.d++; }
      else if (g.home_goals < g.away_goals) { a.v++; a.pts += 3; h.d++; }
      else { h.e++; a.e++; h.pts++; a.pts++; }
    }
    const rows = Object.values(stats).map(s => ({ ...s, sg: s.gp - s.gc, pct: s.j ? Math.round((s.pts / (s.j * 3)) * 100) : 0 }));
    rows.sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || b.v - a.v);
    rows.forEach((r, i) => { r.pos = i + 1; });
    return rows;
  });
}

// maxLegs: 1 = turno_unico (cada jogo é confronto independente), 2 = ida_volta
function buildConfrontos(flatMatches, maxLegs = 2) {
  // Ordena por data para que as pernas sejam agrupadas cronologicamente
  const sorted = [...flatMatches].sort((a, b) => new Date(a.date ?? 0) - new Date(b.date ?? 0));

  const pairCount = new Map(); // pairKey → quantos jogos já foram vistos para esse par
  const confrontoMap = new Map(); // confrontoKey → { team1, team2, legs }

  for (const m of sorted) {
    const pairKey = [m.home.id, m.away.id].sort((a, b) => a - b).join("_");
    const seen = pairCount.get(pairKey) ?? 0;
    // Cada maxLegs jogos do mesmo par formam um novo confronto
    const confrontoIdx = Math.floor(seen / maxLegs);
    const confrontoKey = `${pairKey}_${confrontoIdx}`;

    if (!confrontoMap.has(confrontoKey)) {
      confrontoMap.set(confrontoKey, { team1: m.home, team2: m.away, legs: [] });
    }
    confrontoMap.get(confrontoKey).legs.push(m);
    pairCount.set(pairKey, seen + 1);
  }

  return [...confrontoMap.values()].map(({ team1, team2, legs }) => {
    const t1 = legs[0]?.home ?? team1;
    const t2 = legs[0]?.away ?? team2;
    const agg = {};
    for (const leg of legs) {
      if (leg.home_goals == null) continue;
      agg[leg.home.id] = (agg[leg.home.id] ?? 0) + leg.home_goals;
      agg[leg.away.id] = (agg[leg.away.id] ?? 0) + leg.away_goals;
    }
    return { team1: t1, team2: t2, legs, agg, firstDate: legs[0]?.date ?? null };
  });
}

// Group confrontos into temporal windows — gap > gapDays between consecutive firstDates = new phase
function temporalCluster(sorted, gapDays = 14) {
  if (!sorted.length) return [];
  const GAP_MS = gapDays * 24 * 3600 * 1000;
  const clusters = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].firstDate ?? 0).getTime();
    const curr = new Date(sorted[i].firstDate ?? 0).getTime();
    if (curr - prev > GAP_MS) clusters.push([]);
    clusters[clusters.length - 1].push(sorted[i]);
  }
  return clusters;
}

// Within a temporal cluster, a team appearing more than once means there are sub-phases.
// Greedily partition into rounds where each team plays at most once.
function splitIntoRounds(cluster) {
  let remaining = [...cluster];
  const rounds = [];
  while (remaining.length > 0) {
    const round = [];
    const used = new Set();
    const next = [];
    for (const c of remaining) {
      const id1 = c.team1?.id;
      const id2 = c.team2?.id;
      if (id1 != null && id2 != null && !used.has(id1) && !used.has(id2)) {
        round.push(c);
        used.add(id1);
        used.add(id2);
      } else {
        next.push(c);
      }
    }
    if (round.length === 0) { rounds.push(remaining); break; } // safety: no progress
    rounds.push(round);
    remaining = next;
  }
  return rounds;
}

function assignPhases(confrontos, flatGames, structure_json, season, fasesOverride) {
  if (!confrontos.length) return [];

  const sorted = [...confrontos].sort(
    (a, b) => new Date(a.firstDate ?? 0) - new Date(b.firstDate ?? 0)
  );

  const yearData = structure_json?.[String(season)];
  const fases = fasesOverride ?? yearData?.fases ?? [];

  const clusterAndExpand = (arr) => {
    const clusters = temporalCluster(arr, 14);
    const expanded = [];
    for (const cl of clusters) {
      for (const round of splitIntoRounds(cl)) expanded.push(round);
    }
    return expanded;
  };

  const mapExpandedToPhases = (expanded, phaseList) => {
    const N = phaseList.length;
    const result = new Array(N).fill(null).map(() => []);
    const offset = N - expanded.length;
    if (offset >= 0) {
      expanded.forEach((grp, i) => { result[offset + i] = grp; });
    } else {
      result[0] = expanded.slice(0, 1 - offset).flat();
      expanded.slice(1 - offset).forEach((grp, i) => { result[1 + i] = grp; });
    }
    return result;
  };

  if (fases.length > 0) {
    // Count leading mata_mata phases that have an explicit confrontos count
    let explicitPrefixLen = 0;
    for (const f of fases) {
      if (f.tipo === "mata_mata" && (f.confrontos ?? 0) > 0) explicitPrefixLen++;
      else break;
    }

    const phaseResults = new Array(fases.length).fill(null).map(() => []);
    let cursor = 0;

    // Sequential slicing for explicit-count prefix phases
    for (let i = 0; i < explicitPrefixLen; i++) {
      const n = fases[i].confrontos;
      phaseResults[i] = sorted.slice(cursor, cursor + n);
      cursor += n;
    }

    // Temporal clustering for remaining phases
    const remaining = sorted.slice(cursor);
    const unresolvedFases = fases.slice(explicitPrefixLen);
    if (unresolvedFases.length > 0 && remaining.length > 0) {
      const expanded = clusterAndExpand(remaining);
      const subResults = mapExpandedToPhases(expanded, unresolvedFases);
      for (let i = 0; i < unresolvedFases.length; i++) {
        phaseResults[explicitPrefixLen + i] = subResults[i] ?? [];
      }
    }

    return fases.map((f, i) => {
      const phaseConfrontos = phaseResults[i] ?? [];
      let games = [];
      if (f.tipo === "grupo" && phaseConfrontos.length > 0 && flatGames?.length) {
        const dates = phaseConfrontos.flatMap(c => c.legs.map(l => new Date(l.date ?? 0).getTime())).filter(Boolean);
        if (dates.length) {
          const minDate = Math.min(...dates);
          const maxDate = Math.max(...dates);
          games = flatGames.filter(g => {
            const t = new Date(g.date ?? 0).getTime();
            return t >= minDate - 86400000 && t <= maxDate + 86400000;
          });
        }
      }
      return { nome: f.nome ?? `Fase ${i + 1}`, tipo: f.tipo, faseConfig: f, confrontos: phaseConfrontos, games };
    }).filter(p => p.confrontos.length > 0 || p.tipo === "grupo");
  }

  // ── Fallback: no structure configured ────────────────────────────────────────
  const expanded = clusterAndExpand(sorted);

  const BRACKET_NAMES = [
    ["Final"],
    ["Semifinal", "Final"],
    ["Quartas de Final", "Semifinal", "Final"],
    ["Oitavas de Final", "Quartas de Final", "Semifinal", "Final"],
    ["16 avos de Final", "Oitavas de Final", "Quartas de Final", "Semifinal", "Final"],
    ["32 avos de Final", "16 avos de Final", "Oitavas de Final", "Quartas de Final", "Semifinal", "Final"],
  ];

  const n = Math.min(expanded.length, BRACKET_NAMES.length);
  const names = BRACKET_NAMES[n - 1] ?? ["Confrontos"];
  const off = names.length - expanded.length;

  return names
    .map((nome, i) => ({ nome, tipo: "mata_mata", faseConfig: {}, confrontos: expanded[i - off] ?? [], games: [] }))
    .filter(p => p.confrontos.length > 0);
}

// ─── Group phase view ─────────────────────────────────────────────────────────

function GroupPhaseView({ phase, t, adminGroups }) {
  const bfsGroups = useMemo(() => computeGroupStandings(phase.games ?? []), [phase.games]);
  const advanceCount = phase.faseConfig?.classificados_por_grupo ?? 2;

  // Alinha grupos BFS com os rótulos do admin (A, B, ...) quando disponível
  const groups = useMemo(() => {
    if (!adminGroups || !Object.keys(adminGroups).length) {
      return bfsGroups.map((rows, i) => ({ label: String.fromCharCode(65 + i), rows }));
    }
    const adminEntries = Object.entries(adminGroups).sort(([a], [b]) => a.localeCompare(b));
    const used = new Set();
    return adminEntries.map(([label, clubIds]) => {
      const idSet = new Set(clubIds);
      let bestIdx = -1, bestOverlap = -1;
      for (let i = 0; i < bfsGroups.length; i++) {
        if (used.has(i)) continue;
        const overlap = bfsGroups[i].filter(r => idSet.has(r.id)).length;
        if (overlap > bestOverlap) { bestOverlap = overlap; bestIdx = i; }
      }
      if (bestIdx >= 0) used.add(bestIdx);
      return { label, rows: bestIdx >= 0 ? bfsGroups[bestIdx] : [] };
    });
  }, [bfsGroups, adminGroups]);

  if (!groups.length || groups.every(g => !g.rows.length)) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>
  );

  const cols = groups.length <= 2
    ? "grid-cols-1 sm:grid-cols-2"
    : groups.length <= 4
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-2";

  return (
    <div className={`grid gap-4 w-full ${cols}`}>
      {groups.map(({ label, rows }, gi) => (
        <div key={label} className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Grupo {label}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[260px]">
              <thead>
                <tr className="text-gray-400 border-b border-gray-50">
                  <th className="py-1.5 px-2 text-center w-6">#</th>
                  <th className="py-1.5 px-2 text-left">Clube</th>
                  <th className="py-1.5 px-2 text-center font-bold text-violet-500">P</th>
                  <th className="py-1.5 px-2 text-center">J</th>
                  <th className="py-1.5 px-2 text-center text-emerald-500">V</th>
                  <th className="py-1.5 px-2 text-center">E</th>
                  <th className="py-1.5 px-2 text-center text-red-400">D</th>
                  <th className="py-1.5 px-2 text-center">SG</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  const advances = ri < advanceCount;
                  return (
                    <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className={`px-2 py-2 text-center font-bold text-gray-500 ${advances ? "border-l-2 border-emerald-400" : "border-l-2 border-transparent"}`}>
                        {row.pos}
                      </td>
                      <td className="px-2 py-2 max-w-[120px]">
                        <Link to={clubUrl(row.id, row.slug)} className="flex items-center gap-1.5 hover:text-violet-700 transition-colors">
                          {row.crest
                            ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_plus/reduced_reduced_` + row.crest + `.webp`} alt="" className="w-4 h-4 object-contain shrink-0" />
                            : <div className="w-4 h-4 rounded-full bg-gray-100 shrink-0" />}
                          <span className={`truncate ${advances ? "font-semibold text-gray-800" : "font-medium text-gray-600"}`}>
                            {row.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-gray-900 tabular-nums">{row.pts}</td>
                      <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{row.j}</td>
                      <td className="px-2 py-2 text-center font-semibold text-emerald-600 tabular-nums">{row.v}</td>
                      <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{row.e}</td>
                      <td className="px-2 py-2 text-center text-red-400 tabular-nums">{row.d}</td>
                      <td className={`px-2 py-2 text-center font-semibold tabular-nums ${row.sg > 0 ? "text-emerald-600" : row.sg < 0 ? "text-red-500" : "text-gray-400"}`}>
                        {row.sg > 0 ? `+${row.sg}` : row.sg}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {advanceCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-gray-50 bg-gray-50/50">
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                Avança ({advanceCount})
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Torneio panel view (apertura_clausura) ───────────────────────────────────
// Separa jogos de grupos dos jogos de mata-mata usando os grupos do admin,
// computa standings apenas dentro de cada grupo e exibe o bracket da fase K.O.

function TorneioPanelView({ matchesForPhase, adminGroups, activeStandings, grupoFaseConfig, activeTorneioConfig, t }) {
  const flatGames = useMemo(() => matchesForPhase.flatMap(w => w.games), [matchesForPhase]);

  // Índice de info de times (nome + crest) a partir dos standings ou jogos
  const teamInfo = useMemo(() => {
    const info = {};
    for (const r of (activeStandings ?? [])) info[r.id] = { name: r.name, crest: r.crest };
    for (const g of flatGames) {
      if (!info[g.home.id]) info[g.home.id] = { name: g.home.name, crest: g.home.crest };
      if (!info[g.away.id]) info[g.away.id] = { name: g.away.name, crest: g.away.crest };
    }
    return info;
  }, [activeStandings, flatGames]);

  // Separa jogos por fase: grupo vs mata-mata.
  // Usa a rodada (week) como critério primário porque times do mesmo grupo
  // podem se reencontrar nas eliminatórias (ex: duas equipes do Grupo A nas Quartas).
  // - Rodadas 1..maxGroupRound → fase de grupos
  // - Rodadas > maxGroupRound → interzonais/eliminatórias
  // - Rodada 0 (null) sem resultado → jogo agendado → grupo
  // - Rodada 0 (null) com resultado → jogo sem rodada = eliminatória tardia
  const { grupoGames, mataMataGames } = useMemo(() => {
    // maxGroupRound = número de rodadas da fase de grupos (times_por_grupo - 1 para turno_unico)
    const maxGroupRound = (grupoFaseConfig?.times_por_grupo ?? 0) - 1;

    if (maxGroupRound > 0) {
      const grupoIds = new Set();
      const mmIds = new Set();
      for (const { week, games } of matchesForPhase) {
        for (const g of games) {
          if (g.home_goals == null && g.away_goals == null) {
            grupoIds.add(g.id); // agendado → grupo
          } else if (week > 0 && week <= maxGroupRound) {
            grupoIds.add(g.id); // rodada de grupo explícita
          } else {
            mmIds.add(g.id); // rodada além do grupo ou sem rodada com resultado
          }
        }
      }
      return {
        grupoGames: flatGames.filter(g => grupoIds.has(g.id)),
        mataMataGames: flatGames.filter(g => mmIds.has(g.id)),
      };
    }

    // Fallback: usa pertencimento ao grupo (quando times_por_grupo não configurado)
    if (!adminGroups || !Object.keys(adminGroups).length) {
      return { grupoGames: flatGames, mataMataGames: [] };
    }
    const groupSets = Object.fromEntries(
      Object.entries(adminGroups).map(([k, ids]) => [k, new Set(ids)])
    );
    const grupo = [], mm = [];
    for (const g of flatGames) {
      const isGrupo = Object.values(groupSets).some(s => s.has(g.home.id) && s.has(g.away.id));
      (isGrupo ? grupo : mm).push(g);
    }
    return { grupoGames: grupo, mataMataGames: mm };
  }, [flatGames, matchesForPhase, adminGroups, grupoFaseConfig]);

  // Standings por grupo (apenas jogos dentro do grupo)
  const groupStandings = useMemo(() => {
    if (!adminGroups) return null;
    const result = {};
    for (const [gKey, clubIds] of Object.entries(adminGroups)) {
      const idSet = new Set(clubIds);
      const stats = Object.fromEntries(
        clubIds.map(id => [id, {
          id,
          name: teamInfo[id]?.name ?? '',
          crest: teamInfo[id]?.crest ?? null,
          j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0,
        }])
      );
      for (const g of grupoGames) {
        if (!idSet.has(g.home.id) || !idSet.has(g.away.id)) continue;
        if (g.home_goals == null || g.away_goals == null) continue;
        const h = stats[g.home.id]; const a = stats[g.away.id];
        if (!h || !a) continue;
        h.j++; a.j++;
        h.gp += Number(g.home_goals); h.gc += Number(g.away_goals);
        a.gp += Number(g.away_goals); a.gc += Number(g.home_goals);
        if (g.home_goals > g.away_goals) { h.v++; a.d++; }
        else if (g.home_goals < g.away_goals) { a.v++; h.d++; }
        else { h.e++; a.e++; }
      }
      result[gKey] = Object.values(stats)
        .map(c => ({ ...c, pts: c.v * 3 + c.e, sg: c.gp - c.gc }))
        .sort((a, b) => (b.pts - a.pts) || (b.sg - a.sg) || (b.gp - a.gp))
        .map((c, i) => ({ ...c, pos: i + 1 }));
    }
    return result;
  }, [adminGroups, grupoGames, teamInfo]);

  // Mata-mata: reagrupa por rodada para o BracketView
  const mataMataWeeks = useMemo(() => {
    if (!mataMataGames.length) return [];
    const mataMataIds = new Set(mataMataGames.map(g => g.id));
    return matchesForPhase
      .map(({ week, games }) => ({ week, games: games.filter(g => mataMataIds.has(g.id)) }))
      .filter(w => w.games.length > 0);
  }, [matchesForPhase, mataMataGames]);

  const classificados = grupoFaseConfig?.classificados_por_grupo ?? 2;
  const mataMataFases = activeTorneioConfig?.fases?.filter(f => f.tipo === "mata_mata") ?? [];
  const hasGroups = groupStandings && Object.keys(groupStandings).length > 0;
  const hasMataMata = mataMataWeeks.length > 0 && mataMataFases.length > 0;

  // Torneio de pontos corridos: sem grupos nem mata-mata, exibe tabela de classificação direta
  const isPontosCorreidos = !grupoFaseConfig
    && mataMataFases.length === 0
    && (activeTorneioConfig?.fases ?? []).some(f => f.tipo === "pontos_corridos");

  if (isPontosCorreidos) {
    const classificadosPc = activeTorneioConfig?.fases?.find(f => f.tipo === "pontos_corridos")?.classificados_por_grupo ?? 0;
    if (!activeStandings?.length) {
      return <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>;
    }
    return (
      <div className="w-full rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[300px]">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="py-2 px-3 text-center w-8">#</th>
                <th className="py-2 px-3 text-left">Clube</th>
                <th className="py-2 px-3 text-center font-bold text-violet-500">P</th>
                <th className="py-2 px-3 text-center">J</th>
                <th className="py-2 px-3 text-center text-emerald-500">V</th>
                <th className="py-2 px-3 text-center">E</th>
                <th className="py-2 px-3 text-center text-red-400">D</th>
                <th className="py-2 px-3 text-center">GP</th>
                <th className="py-2 px-3 text-center">GC</th>
                <th className="py-2 px-3 text-center">SG</th>
              </tr>
            </thead>
            <tbody>
              {activeStandings.map((row, ri) => {
                const advances = classificadosPc > 0 && ri < classificadosPc;
                return (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className={`px-3 py-2 text-center font-bold text-gray-500 ${advances ? "border-l-2 border-emerald-400" : "border-l-2 border-transparent"}`}>
                      {ri + 1}
                    </td>
                    <td className="px-3 py-2">
                      <Link to={clubUrl(row.id, row.slug)} className="flex items-center gap-1.5 hover:text-violet-700 transition-colors">
                        {row.slug
                          ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + row.slug + `.webp`} alt="" className="w-4 h-4 object-contain shrink-0" />
                          : <div className="w-4 h-4 rounded-full bg-gray-100 shrink-0" />}
                        <span className={`truncate ${advances ? "font-semibold text-gray-800" : "font-medium text-gray-600"}`}>{row.name}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-gray-900 tabular-nums">{row.points ?? row.pts ?? 0}</td>
                    <td className="px-3 py-2 text-center text-gray-500 tabular-nums">{row.played ?? row.j ?? 0}</td>
                    <td className="px-3 py-2 text-center font-semibold text-emerald-600 tabular-nums">{row.won ?? row.v ?? 0}</td>
                    <td className="px-3 py-2 text-center text-gray-500 tabular-nums">{row.drawn ?? row.e ?? 0}</td>
                    <td className="px-3 py-2 text-center text-red-400 tabular-nums">{row.lost ?? row.d ?? 0}</td>
                    <td className="px-3 py-2 text-center text-gray-500 tabular-nums">{row.goals_for ?? row.gp ?? 0}</td>
                    <td className="px-3 py-2 text-center text-gray-500 tabular-nums">{row.goals_against ?? row.gc ?? 0}</td>
                    <td className={`px-3 py-2 text-center font-semibold tabular-nums ${(row.goal_diff ?? row.sg ?? 0) > 0 ? "text-emerald-600" : (row.goal_diff ?? row.sg ?? 0) < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {(row.goal_diff ?? row.sg ?? 0) > 0 ? `+${row.goal_diff ?? row.sg}` : (row.goal_diff ?? row.sg ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {classificadosPc > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-gray-50 bg-gray-50/50">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              Avança ({classificadosPc})
            </span>
          </div>
        )}
      </div>
    );
  }

  if (!hasGroups && !hasMataMata) {
    const hasAnyGames = flatGames.length > 0;
    return (
      <p className="text-sm text-center text-gray-400 py-8">
        {hasAnyGames
          ? "Atribua os times aos grupos no painel de administração para visualizar o torneio."
          : t("sports.no_matches", "Nenhuma partida registrada.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* ── Fase de Grupos ── */}
      {hasGroups && (
        <div className="w-full">
          <div className="flex items-center gap-2.5 mb-4 px-1 justify-center">
            <span className="text-sm lg:text-xl font-bold text-gray-900 uppercase tracking-wide">
              {grupoFaseConfig?.nome ?? "Fase de Grupos"}
            </span>
            <span className="text-xs lg:text-xl text-gray-400">
              · {Object.keys(groupStandings).length} grupos
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(groupStandings).sort().map(([label, rows]) => (
              <div key={label} className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Grupo {label}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[260px]">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-50">
                        <th className="py-1.5 px-2 text-center w-6">#</th>
                        <th className="py-1.5 px-2 text-left">Clube</th>
                        <th className="py-1.5 px-2 text-center font-bold text-violet-500">P</th>
                        <th className="py-1.5 px-2 text-center">J</th>
                        <th className="py-1.5 px-2 text-center text-emerald-500">V</th>
                        <th className="py-1.5 px-2 text-center">E</th>
                        <th className="py-1.5 px-2 text-center text-red-400">D</th>
                        <th className="py-1.5 px-2 text-center">SG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => {
                        const advances = ri < classificados;
                        return (
                          <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                            <td className={`px-2 py-2 text-center font-bold text-gray-500 ${advances ? "border-l-2 border-emerald-400" : "border-l-2 border-transparent"}`}>
                              {row.pos}
                            </td>
                            <td className="px-2 py-2">
                              <Link to={clubUrl(row.id, row.slug)} className="flex items-center gap-1.5 hover:text-violet-700 transition-colors">
                                {row.slug
                                  ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + row.slug + `.webp`} alt="" className="w-4 h-4 object-contain shrink-0" />
                                  : <div className="w-4 h-4 rounded-full bg-gray-100 shrink-0" />}
                                <span className={`truncate ${advances ? "font-semibold text-gray-800" : "font-medium text-gray-600"}`}>
                                  {row.name}
                                </span>
                              </Link>
                            </td>
                            <td className="px-2 py-2 text-center font-bold text-gray-900 tabular-nums">{row.pts}</td>
                            <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{row.j}</td>
                            <td className="px-2 py-2 text-center font-semibold text-emerald-600 tabular-nums">{row.v}</td>
                            <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{row.e}</td>
                            <td className="px-2 py-2 text-center text-red-400 tabular-nums">{row.d}</td>
                            <td className={`px-2 py-2 text-center font-semibold tabular-nums ${row.sg > 0 ? "text-emerald-600" : row.sg < 0 ? "text-red-500" : "text-gray-400"}`}>
                              {row.sg > 0 ? `+${row.sg}` : row.sg}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {classificados > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-gray-50 bg-gray-50/50">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      Avança ({classificados})
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Conector ── */}
      {hasGroups && hasMataMata && (
        <div className="flex flex-col items-center my-6 text-gray-200">
          <div className="w-px h-6 bg-gray-200" />
          <ChevronsDown size={18} />
        </div>
      )}

      {/* ── Fases mata-mata ── */}
      {hasMataMata && (
        <BracketView
          matches={mataMataWeeks}
          structure_json={null}
          season={null}
          t={t}
          fasesOverride={mataMataFases}
        />
      )}
    </div>
  );
}

const phaseColumns = (n) => {
  if (n === 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-2";
  if (n === 3) return "grid-cols-3";
  return "grid-cols-2 sm:grid-cols-4";
};

const phaseMaxWidth = (n) => {
  if (n === 1) return "max-w-[280px]";
  if (n === 2) return "max-w-[560px]";
  if (n <= 4) return "max-w-[80%]";
  return "max-w-full";
};

function BracketView({ matches, structure_json, season, t, fasesOverride, groupClubs }) {
  const flatGames = useMemo(() => matches.flatMap(w => w.games), [matches]);
  // maxLegs: 1 se todas as fases são turno_unico, 2 se alguma é ida_volta
  const maxLegs = useMemo(() => {
    const mataMataFases = (fasesOverride ?? []).filter(f => f.tipo === "mata_mata");
    if (mataMataFases.length === 0) return 2;
    return mataMataFases.some(f => f.formato === "ida_volta") ? 2 : 1;
  }, [fasesOverride]);

  const confrontos = useMemo(() => buildConfrontos(flatGames, maxLegs), [flatGames, maxLegs]);
  const phases = useMemo(() => assignPhases(confrontos, flatGames, structure_json, season, fasesOverride), [confrontos, flatGames, structure_json, season, fasesOverride]);

  if (!confrontos.length) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>
  );

  // Champion is the winner of the last knockout (non-grupo) phase
  const knockoutPhases = phases.filter(p => p.tipo !== "grupo");
  const finalPhase = knockoutPhases[knockoutPhases.length - 1];
  const finalConf = finalPhase?.confrontos[0];
  const champion = finalConf ? (() => {
    const { team1, team2, agg } = finalConf;
    const a1 = agg[team1.id] ?? null;
    const a2 = agg[team2.id] ?? null;
    if (a1 === null || a2 === null) return null;
    if (a1 > a2) return team1;
    if (a2 > a1) return team2;
    return null;
  })() : null;

  return (
    <div className="flex flex-col items-center gap-0 w-full">
      {phases.map((phase, pi) => {
        const isLast = pi === phases.length - 1;

        // ── Group stage ───────────────────────────────────────────────────────
        if (phase.tipo === "grupo") {
          return (
            <div key={phase.nome} className="w-full flex flex-col items-center">
              <div className="justify-center w-full flex items-center gap-2.5 mb-4 px-1">
                <span className="text-sm lg:text-xl font-bold text-gray-900 uppercase tracking-wide">{phase.nome}</span>
                {(phase.faseConfig?.grupos ?? 0) > 0 && (
                  <span className="text-xs lg:text-xl text-gray-400">· {phase.faseConfig.grupos} grupos</span>
                )}
              </div>
              <GroupPhaseView phase={phase} t={t} adminGroups={groupClubs} />
              {!isLast && (
                <div className="flex flex-col items-center my-4 text-gray-200">
                  <div className="w-px h-5 bg-gray-200" />
                  <ChevronsDown size={16} />
                </div>
              )}
            </div>
          );
        }

        // ── Knockout phase ────────────────────────────────────────────────────
        const cols = phaseColumns(phase.confrontos.length);
        const mw = phaseMaxWidth(phase.confrontos.length);

        return (
          <div key={phase.nome} className="w-full flex flex-col items-center">
            {/* Phase header */}
            <div className="justify-center w-full flex items-center gap-2.5 mb-4 px-1">
              <span className="text-sm lg:text-xl font-bold text-gray-900 uppercase tracking-wide">{phase.nome}</span>
              <span className="text-xs lg:text-xl text-gray-400">
                · {phase.confrontos.length} confronto{phase.confrontos.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className={`w-full ${mw} grid ${cols} gap-3`}>
              {phase.confrontos.map((c, i) => <ConfrontoCard key={i} confronto={c} />)}
            </div>

            {!isLast && (
              <div className="flex flex-col items-center my-4 text-gray-200">
                <div className="w-px h-5 bg-gray-200" />
                <ChevronsDown size={16} />
              </div>
            )}
          </div>
        );
      })}

      {/* Champion — clean, no crown, no gradient */}
      {champion && (
        <div className="flex flex-col items-center mt-5 gap-3 w-full max-w-[280px] mb-10">
          <div className="flex flex-col items-center text-gray-200">
            <div className="w-px h-5 bg-gray-200" />
            <ChevronsDown size={16} />
          </div>
          <div className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-1 self-stretch rounded-full bg-gray-900 shrink-0" />
            {champion.crest && (
              <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_plus/reduced_reduced_` + champion.crest + `.webp`} alt="" className="w-10 h-10 object-contain shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Campeão</p>
              <Link to={clubUrl(champion.id, champion.slug)}
                className="text-base font-bold text-gray-900 hover:text-violet-700 transition-colors truncate block">
                {champion.name}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ m }) {
  const finished = m.home_goals != null && m.away_goals != null;
  return (
    <Link to={`/dashboard/matches/${m.id}`}
      className="flex items-center gap-2 py-3 px-4 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-sm font-medium text-gray-700 truncate group-hover:text-violet-700 transition-colors">{m.home.name}</span>
        {m.home.slug && <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + m.home.slug + `.webp`} alt="" className="w-5 h-5 object-contain shrink-0" />}
      </div>
      <div className="flex flex-col items-center shrink-0 min-w-[64px]">
        {finished
          ? <span className="text-base font-extrabold text-gray-900 tabular-nums">{m.home_goals} – {m.away_goals}</span>
          : <span className="text-sm font-semibold text-gray-400">{fmtDate(m.date)}</span>
        }
        {finished && m.home_goals_ht != null && (
          <span className="text-xs text-gray-400 tabular-nums">
            <span className="font-semibold text-gray-300 mr-0.5">1T</span>{m.home_goals_ht}–{m.away_goals_ht}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {m.away.slug && <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + m.away.slug + `.webp`} alt="" className="w-5 h-5 object-contain shrink-0" />}
        <span className="text-sm font-medium text-gray-700 truncate group-hover:text-violet-700 transition-colors">{m.away.name}</span>
      </div>
    </Link>
  );
}

function RoundRobinMatches({ matches, t }) {
  const [openWeeks, setOpenWeeks] = useState({});
  useEffect(() => {
    if (matches?.length) setOpenWeeks({ [matches[0].week]: true });
  }, [matches]);
  const toggle = w => setOpenWeeks(p => ({ ...p, [w]: !p[w] }));

  if (!matches?.length) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>
  );
  return (
    <>
      {matches.map(({ week, games }) => (
        <div key={week} className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm mb-2">
          <button onClick={() => toggle(week)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors">
            <span className="text-sm font-semibold text-gray-700">
              {week > 0 ? `${t("sports.round", "Rodada")} ${week}` : t("sports.no_round", "Sem rodada")}
            </span>
            <span className="text-xs text-gray-400">{games.length} {t("sports.games_suffix", "jogos")}</span>
          </button>
          {openWeeks[week] && (
            <div className="divide-y divide-gray-50">
              {games.map(m => <MatchCard key={m.id} m={m} />)}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// ─── Format labels ────────────────────────────────────────────────────────────

const FORMAT_LABELS = {
  pontos_corridos: "Pontos corridos",
  mata_mata: "Mata-mata",
  grupos: "Fase de grupos",
  grupos_mata_mata: "Grupos + Mata-mata",
  misto: "Misto",
  apertura_clausura: "Apertura/Clausura",
  personalizado: "Personalizado",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LeagueSportsSection({ leagueId }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(null);
  const [mainTab, setMainTab] = useState(null);
  const [split, setSplit] = useState("total");

  useEffect(() => { load(season); }, [leagueId, season]);

  async function load(s) {
    setLoading(true);
    try {
      const params = s ? `?season=${s}` : "";
      const { data: res } = await api.get(`/dashboard/leagues/${leagueId}/sports${params}`);
      setData(res);
      if (!season && res.season) setSeason(res.season);
      if (mainTab === null) {
        const resSeason = s ?? res.season;
        const resCfg = res.league?.structure_json?.[String(resSeason)];
        const resFmt = resCfg?.tipo || res.league?.format || "pontos_corridos";
        const isKo = resFmt !== "pontos_corridos" && resFmt !== "pontos_corridos_turno_unico" && resFmt !== "grupos" && resFmt !== "apertura_clausura";
        setMainTab(isKo ? "chaveamento" : "classificacao");
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading && !data) return (
    <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
      <Loader2 className="animate-spin w-5 h-5" />
      <span className="text-sm">{t("ui.loading", "Carregando...")}</span>
    </div>
  );
  if (!data) return null;

  const { league, seasons, standings, matches, discipline, groupClubs } = data;
  const seasonConfig = league.structure_json?.[String(season)] ?? null;
  const fmt = seasonConfig?.tipo || league.format || "pontos_corridos";
  const isKnockout = fmt !== "pontos_corridos" && fmt !== "pontos_corridos_turno_unico" && fmt !== "grupos" && fmt !== "apertura_clausura";
  const isAperturaClausura = fmt === "apertura_clausura";
  const totalRounds = matches?.length ?? 0;

  // Para apertura_clausura: deriva as sub-tabs dos torneios configurados (novo formato)
  const acTorneios = seasonConfig?.torneios ?? null;
  const acSplitOptions = isAperturaClausura
    ? (acTorneios
      ? acTorneios.map(t => ({ key: t.key, label: t.nome }))
      : [{ key: "apertura", label: "Apertura" }, { key: "clausura", label: "Clausura" }])
    : [
      { key: "total", label: t("sports.total", "Total") },
      { key: "home", label: t("sports.home", "Casa") },
      { key: "away", label: t("sports.away", "Fora") },
    ];

  const splitKeys = acSplitOptions.map(o => o.key);
  const activeSplit = splitKeys.includes(split) ? split : splitKeys[0];

  // Partidas filtradas pela fase ativa (apertura_clausura)
  // Filtra também os jogos dentro de cada rodada para não misturar apertura/clausura
  const matchesForPhase = isAperturaClausura
    ? (matches ?? [])
      .map(w => ({ ...w, games: w.games.filter(g => g.phase === activeSplit) }))
      .filter(w => w.games.length > 0)
    : (matches ?? []);

  // Líder da fase ativa
  const activeStandings = standings?.[activeSplit] ?? [];
  const leader = activeStandings[0] ?? null;

  // Grupos do torneio ativo (apertura_clausura com fase de grupos)
  const activeTorneioConfig = acTorneios?.find(t => t.key === activeSplit) ?? null;
  const grupoFaseConfig = activeTorneioConfig?.fases?.find(f => f.tipo === "grupo") ?? null;
  const grupoPhaseKey = grupoFaseConfig
    ? `${activeSplit}_${grupoFaseConfig.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`
    : null;
  const activeGroupClubs = grupoPhaseKey ? (groupClubs?.[grupoPhaseKey] ?? null) : null;

  const hasGrupoPhase = !!grupoFaseConfig;

  const tabs = [];
  if (isAperturaClausura) {
    tabs.push({ key: "torneio", label: "Torneio" });
  } else if (isKnockout) {
    tabs.push({ key: "chaveamento", label: "Chaveamento" });
  } else {
    tabs.push({ key: "classificacao", label: "Classificação" });
  }
  if (!isKnockout) tabs.push({ key: "partidas", label: "Rodadas", badge: totalRounds });
  tabs.push({ key: "disciplinar", label: "Disciplinar" });

  const activeTab = (mainTab && tabs.some(t => t.key === mainTab)) ? mainTab : tabs[0]?.key;

  return (
    <div className="space-y-4">

      {/* Unified toolbar: main tabs + season selector */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between">
          {/* Main tabs */}
          <div className="flex items-center overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setMainTab(tab.key)}
                className={`relative px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap shrink-0
                  ${activeTab === tab.key
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
                {tab.label}
                {tab.badge > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold
                    ${activeTab === tab.key ? "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-400"}`}>
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t" />
                )}
              </button>
            ))}
          </div>
          {/* Season selector */}
          {(seasons ?? []).length > 0 && (
            <div className="flex items-center gap-0.5 px-2 border-l border-gray-100 shrink-0">
              {(seasons ?? []).map(y => (
                <button key={y} onClick={() => { setSeason(y); setMainTab(null); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all
                    ${season === y
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}>
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── TORNEIO (apertura_clausura) — grupos + eliminatórias numa só view ── */}
      {activeTab === "torneio" && (
        <>
          <div className="flex items-center justify-end gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <SubTabs value={activeSplit} onChange={val => setSplit(val)} options={acSplitOptions} />
          </div>
          {loading
            ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
            : <TorneioPanelView
              matchesForPhase={matchesForPhase}
              adminGroups={activeGroupClubs}
              activeStandings={activeStandings}
              grupoFaseConfig={grupoFaseConfig}
              activeTorneioConfig={activeTorneioConfig}
              t={t}
            />
          }
        </>
      )}

      {/* ── CLASSIFICAÇÃO (outros formatos) ── */}
      {activeTab === "classificacao" && (
        <>
          <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            {!loading && leader ? (
              <Link to={clubUrl(leader.id, leader.slug)}
                className="flex items-center gap-2 min-w-0 group">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 hidden lg:block">CAMPEÃO</span>
                {leader.slug
                  ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + leader.slug + `.webp`} alt="" className="w-5 h-5 object-contain shrink-0" />
                  : <Trophy size={16} className="text-gray-300 shrink-0" />
                }
                <span className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors truncate">
                  {leader.name}
                </span>
                <span className="text-sm font-extrabold tabular-nums text-gray-900 shrink-0">{leader.pts}</span>
                <span className="text-xs text-gray-400 shrink-0">pts</span>
              </Link>
            ) : <div />}
            <SubTabs value={split} onChange={val => setSplit(val)} options={acSplitOptions} />
          </div>
          {loading
            ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
            : <StandingsTable rows={activeStandings} t={t} seasonConfig={seasonConfig} />
          }
        </>
      )}

      {/* ── CHAVEAMENTO (mata-mata puro) ── */}
      {activeTab === "chaveamento" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <BracketView matches={matches ?? []} structure_json={league.structure_json} season={season} t={t} />
      )}

      {/* ── PARTIDAS ── */}
      {activeTab === "partidas" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <RoundRobinMatches matches={matchesForPhase} t={t} />
      )}

      {/* ── DISCIPLINAR ── */}
      {activeTab === "disciplinar" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <DisciplinaryTable rows={discipline ?? []} t={t} />
      )}
    </div>
  );
}
