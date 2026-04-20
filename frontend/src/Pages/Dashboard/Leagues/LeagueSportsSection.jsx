import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
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
                <Link to={`/dashboard/clubs/${row.id}`} className="flex items-center gap-2.5 hover:text-violet-700 transition-colors font-semibold text-gray-700">
                  {row.crest ? <img src={row.crest} alt="" className="w-5 h-5 object-contain shrink-0" /> : <div className="w-5 h-5 rounded bg-gray-100 shrink-0" />}
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

function StandingsTable({ rows, t, seasonConfig }) {
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
            <th className="py-3 px-3 text-center font-semibold w-10">#</th>
            <th className="py-3 px-3 text-left font-semibold">Clube</th>
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
                <td className={`px-3 py-3 ${zoneBar(pos)}`}>
                  <span className={`text-sm font-bold block text-center tabular-nums ${pos === 1 ? "text-gray-900" : "text-gray-400"}`}>
                    {pos}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <Link to={`/dashboard/clubs/${row.id}`}
                    className={`flex items-center gap-2.5 hover:text-violet-700 transition-colors ${pos === 1 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                    {row.crest
                      ? <img src={row.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
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
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />Zona continental
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />Rebaixamento
          </span>
        </div>
      )}
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
            ? <img src={team.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
            : <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />}
          <Link to={`/dashboard/clubs/${team.id}`}
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
        ? <img src={team.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
        : <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />}
      <Link to={`/dashboard/clubs/${team.id}`}
        className={`flex-1 min-w-0 text-sm truncate hover:underline transition-colors
          ${isWinner ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
        {team.name}
      </Link>
      {score !== null && (
        <span className={`text-base tabular-nums font-extrabold shrink-0
          ${isWinner ? "text-gray-900" : "text-gray-400"}`}>
          {score}
        </span>
      )}
    </div>
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

function buildConfrontos(flatMatches) {
  const map = new Map();
  for (const m of flatMatches) {
    const key = [m.home.id, m.away.id].sort((a, b) => a - b).join("_");
    if (!map.has(key)) map.set(key, { team1: m.home, team2: m.away, legs: [] });
    map.get(key).legs.push(m);
  }
  return [...map.values()].map(({ team1, team2, legs }) => {
    legs.sort((a, b) => new Date(a.date ?? 0) - new Date(b.date ?? 0));
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

function assignPhases(confrontos, structure_json, season) {
  if (!confrontos.length) return [];

  const sorted = [...confrontos].sort(
    (a, b) => new Date(a.firstDate ?? 0) - new Date(b.firstDate ?? 0)
  );

  const yearData = structure_json?.[String(season)];
  const fases = yearData?.fases ?? [];

  // 1. Broad temporal separation (months apart = different phase blocks)
  const clusters = temporalCluster(sorted, 14);

  // 2. Within each cluster, split into rounds where no team plays twice.
  //    This handles: multiple early rounds in the same month, and Semis+Final
  //    in the same December window (finalists appear in both rounds).
  const expanded = [];
  for (const cl of clusters) {
    for (const round of splitIntoRounds(cl)) expanded.push(round);
  }

  if (fases.length > 0) {
    const N = fases.length;
    const result = new Array(N).fill(null).map(() => []);
    const offset = N - expanded.length;

    if (offset >= 0) {
      // Fewer rounds than phases: early phases have no data (hidden by filter below)
      expanded.forEach((grp, i) => { result[offset + i] = grp; });
    } else {
      // More rounds than phases: collapse surplus early rounds into phase 0
      result[0] = expanded.slice(0, 1 - offset).flat();
      expanded.slice(1 - offset).forEach((grp, i) => { result[1 + i] = grp; });
    }

    return fases
      .map((f, i) => ({ nome: f.nome ?? `Fase ${i + 1}`, confrontos: result[i] }))
      .filter(p => p.confrontos.length > 0);
  }

  // ── Fallback: no structure configured ────────────────────────────────────────
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
    .map((nome, i) => ({ nome, confrontos: expanded[i - off] ?? [] }))
    .filter(p => p.confrontos.length > 0);
}

const phaseColumns = (n) => {
  if (n === 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-2";
  return "grid-cols-2 sm:grid-cols-4";
};

const phaseMaxWidth = (n) => {
  if (n === 1) return "max-w-[280px]";
  if (n === 2) return "max-w-[560px]";
  if (n <= 4) return "max-w-[80%]";
  return "max-w-full";
};

function BracketView({ matches, structure_json, season, t }) {
  const confrontos = useMemo(() => buildConfrontos(matches.flatMap(w => w.games)), [matches]);
  const phases = useMemo(() => assignPhases(confrontos, structure_json, season), [confrontos, structure_json, season]);

  if (!confrontos.length) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>
  );

  const finalPhase = phases[phases.length - 1];
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
        const cols = phaseColumns(phase.confrontos.length);
        const mw = phaseMaxWidth(phase.confrontos.length);

        return (
          <div key={phase.nome} className="w-full flex flex-col items-center">
            {/* Phase header — sober, no gradient */}
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
              <img src={champion.crest} alt="" className="w-10 h-10 object-contain shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Campeão</p>
              <Link to={`/dashboard/clubs/${champion.id}`}
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
        {m.home.crest && <img src={m.home.crest} alt="" className="w-5 h-5 object-contain shrink-0" />}
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
        {m.away.crest && <img src={m.away.crest} alt="" className="w-5 h-5 object-contain shrink-0" />}
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
        const isKo = resFmt !== "pontos_corridos" && resFmt !== "pontos_corridos_turno_unico" && resFmt !== "grupos";
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

  const { league, seasons, standings, matches, discipline } = data;
  const seasonConfig = league.structure_json?.[String(season)] ?? null;
  const fmt = seasonConfig?.tipo || league.format || "pontos_corridos";
  const isKnockout = fmt !== "pontos_corridos" && fmt !== "pontos_corridos_turno_unico" && fmt !== "grupos" && fmt !== "apertura_clausura";
  const isAperturaClausura = fmt === "apertura_clausura";
  const totalRounds = matches?.length ?? 0;

  // Para apertura_clausura, split controla "clausura" | "apertura"; senão "total" | "home" | "away"
  const splitOptions = isAperturaClausura ? ["clausura", "apertura"] : ["total", "home", "away"];
  const activeSplit = splitOptions.includes(split) ? split : splitOptions[0];

  // Partidas filtradas pela fase ativa (apertura_clausura)
  const matchesForPhase = isAperturaClausura
    ? (matches ?? []).filter(w => w.games.some(g => g.phase === activeSplit))
    : (matches ?? []);

  // Líder da fase ativa
  const activeStandings = standings?.[activeSplit] ?? [];
  const leader = activeStandings[0] ?? null;

  const tabs = [];
  if (!isKnockout) tabs.push({ key: "classificacao", label: "Classificação" });
  if (isKnockout) tabs.push({ key: "chaveamento", label: "Chaveamento" });
  if (!isKnockout) tabs.push({ key: "partidas", label: "Rodadas", badge: totalRounds });
  tabs.push({ key: "disciplinar", label: "Disciplinar" });

  const activeTab = mainTab ?? tabs[0]?.key;

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

      {/* ── CLASSIFICAÇÃO ── */}
      {activeTab === "classificacao" && (
        <>
          {/* Leader + split selector — unified strip */}
          <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            {!loading && leader ? (
              <Link to={`/dashboard/clubs/${leader.id}`}
                className="flex items-center gap-2 min-w-0 group">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">CAMPEÃO</span>
                {leader.crest
                  ? <img src={leader.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
                  : <Trophy size={16} className="text-gray-300 shrink-0" />
                }
                <span className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors truncate">
                  {leader.name}
                </span>
                <span className="text-sm font-extrabold tabular-nums text-gray-900 shrink-0">{leader.pts}</span>
                <span className="text-xs text-gray-400 shrink-0">pts</span>
              </Link>
            ) : <div />}
            <SubTabs
              value={activeSplit}
              onChange={val => setSplit(val)}
              options={isAperturaClausura
                ? [{ key: "clausura", label: "Clausura" }, { key: "apertura", label: "Apertura" }]
                : [
                  { key: "total", label: t("sports.total", "Total") },
                  { key: "home", label: t("sports.home", "Casa") },
                  { key: "away", label: t("sports.away", "Fora") },
                ]
              }
            />
          </div>
          {loading
            ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
            : <StandingsTable rows={activeStandings} t={t} seasonConfig={seasonConfig} />
          }
        </>
      )}

      {/* ── CHAVEAMENTO ── */}
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
