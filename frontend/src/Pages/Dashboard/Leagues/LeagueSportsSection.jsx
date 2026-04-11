import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import { Loader2, Trophy, ChevronsDown, Crown } from "lucide-react";
import { useTranslation } from "../../../context/TranslationContext";

const fmtDate = d => d
  ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" })
  : "—";

// ─── Sub-tabs ────────────────────────────────────────────────────────────────

function SubTabs({ value, onChange, options }) {
  return (
    <div className="flex gap-1 mb-4">
      {options.map(({ key, label }) => (
        <button key={key} onClick={() => onChange(key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
            ${value === key ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-violet-300"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Standings table ─────────────────────────────────────────────────────────

function StandingsTable({ rows, t }) {
  if (!rows?.length) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_classification", "Sem dados de classificação.")}</p>
  );
  return (
    <div className="rounded-xl border border-gray-100 overflow-x-auto">
      <table className="w-full text-xs min-w-[540px]">
        <thead>
          <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
            {["#", "Clube", "P", "J", "V", "E", "D", "GP", "GC", "SG", "%"].map(h => (
              <th key={h} className={`py-2.5 px-2 font-semibold ${h === "Clube" ? "text-left" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
              <td className="px-2 py-2.5 text-center font-bold text-gray-400">{row.pos ?? i + 1}</td>
              <td className="px-2 py-2.5">
                <Link to={`/dashboard/clubs/${row.id}`} className="flex items-center gap-2 hover:text-violet-700 transition-colors font-semibold text-gray-700">
                  {row.crest ? <img src={row.crest} alt="" className="w-4 h-4 object-contain shrink-0" /> : <div className="w-4 h-4" />}
                  {row.name}
                </Link>
              </td>
              <td className="px-2 py-2.5 text-center font-bold text-gray-800">{row.pts}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{row.j}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{row.v}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{row.e}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{row.d}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{row.gp}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{row.gc}</td>
              <td className={`px-2 py-2.5 text-center font-semibold ${row.sg > 0 ? "text-emerald-600" : row.sg < 0 ? "text-red-500" : "text-gray-400"}`}>
                {row.sg > 0 ? `+${row.sg}` : row.sg}
              </td>
              <td className="px-2 py-2.5 text-center text-gray-500">{row.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Match row (inside confronto) ────────────────────────────────────────────

// ─── Confronto card (compacto, sem collapse) ─────────────────────────────────

function ConfrontoCard({ confronto }) {
  const { team1, team2, legs, agg } = confronto;

  const allFinished = legs.every(l => l.home_goals != null);
  const agg1 = agg[team1.id] ?? null;
  const agg2 = agg[team2.id] ?? null;
  const aggDone = allFinished && agg1 !== null && agg2 !== null;

  let winner = null;
  if (aggDone && agg1 !== agg2) winner = agg1 > agg2 ? team1.id : team2.id;

  const TeamRow = ({ team, score, isWinner, isLoser }) => (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 ${isLoser ? "opacity-40" : ""}`}>
      {team.crest
        ? <img src={team.crest} alt="" className="w-6 h-6 object-contain shrink-0" />
        : <div className="w-6 h-6 rounded-full bg-gray-100 shrink-0" />
      }
      <Link
        to={`/dashboard/clubs/${team.id}`}
        className={`flex-1 text-xs truncate hover:underline
          ${isWinner ? "text-violet-700 font-bold" : "text-gray-700 font-semibold"}`}
      >
        {team.name}
      </Link>
      {score !== null && (
        <span className={`text-sm tabular-nums font-extrabold shrink-0
          ${isWinner ? "text-violet-700" : "text-gray-400"}`}>
          {score}
        </span>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-violet-200 transition-colors">
      {/* Legs mini-links */}
      {legs.length > 0 && (
        <div className="px-4 pt-2.5 pb-0 flex gap-3">
          {legs.map((leg, i) => {
            const fin = leg.home_goals != null;
            const label = legs.length === 2 ? (i === 0 ? "Ida" : "Volta") : `Jogo ${i + 1}`;
            return (
              <Link key={leg.id} to={`/dashboard/matches/${leg.id}`}
                className={`text-[9px] font-bold uppercase tracking-wider hover:text-violet-400 transition-colors
                  ${fin ? "text-gray-400" : "text-gray-200"}`}>
                {label}{fin ? ` ${leg.home_goals}–${leg.away_goals}` : ` ${fmtDate(leg.date)}`}
              </Link>
            );
          })}
        </div>
      )}

      <div className="pt-1.5">
        <TeamRow
          team={team1}
          score={agg1}
          isWinner={winner === team1.id}
          isLoser={winner === team2.id}
        />
        <div className="mx-4 border-t border-dashed border-gray-100" />
        <TeamRow
          team={team2}
          score={agg2}
          isWinner={winner === team2.id}
          isLoser={winner === team1.id}
        />
      </div>
      <div className="pb-1" />
    </div>
  );
}

// ─── Bracket helpers ──────────────────────────────────────────────────────────

/** Group flat matches into confrontos (pair of clubs) */
function buildConfrontos(flatMatches) {
  const map = new Map();
  for (const m of flatMatches) {
    const key = [m.home.id, m.away.id].sort((a, b) => a - b).join("_");
    if (!map.has(key)) {
      map.set(key, { team1: m.home, team2: m.away, legs: [] });
    }
    map.get(key).legs.push(m);
  }
  return [...map.values()].map(({ team1, team2, legs }) => {
    legs.sort((a, b) => new Date(a.date ?? 0) - new Date(b.date ?? 0));
    // Use club from first leg as canonical display order
    const t1 = legs[0]?.home ?? team1;
    const t2 = legs[0]?.away ?? team2;
    // Aggregate goals keyed by club id
    const agg = {};
    for (const leg of legs) {
      if (leg.home_goals == null) continue;
      agg[leg.home.id] = (agg[leg.home.id] ?? 0) + leg.home_goals;
      agg[leg.away.id] = (agg[leg.away.id] ?? 0) + leg.away_goals;
    }
    return { team1: t1, team2: t2, legs, agg, firstDate: legs[0]?.date ?? null };
  });
}

/**
 * Assign confrontos to phases.
 * If structure_json has fases for this season: use their names + standard knockout counts.
 * Otherwise: auto-detect from total confronto count (powers of 2).
 */
function assignPhases(confrontos, structure_json, season) {
  if (!confrontos.length) return [];

  const sorted = [...confrontos].sort((a, b) => new Date(a.firstDate ?? 0) - new Date(b.firstDate ?? 0));
  const total  = sorted.length;

  // --- Phase names from structure_json ---
  const yearData = structure_json?.[String(season)];
  const fases    = yearData?.fases ?? [];

  if (fases.length > 0) {
    // Standard knockout bracket: last phase = 1, each previous = 2×
    // e.g. 4 phases → counts [8, 4, 2, 1]
    const n = fases.length;
    const counts = fases.map((_, i) => Math.pow(2, n - 1 - i));

    let idx = 0;
    const phases = fases.map((fase, i) => ({
      nome: fase.nome ?? `Fase ${i + 1}`,
      confrontos: sorted.slice(idx, idx += counts[i]),
    })).filter(p => p.confrontos.length > 0);

    // If there are leftover confrontos not covered (CSV has more rounds), add them as first phase
    if (idx < total) {
      phases.unshift({
        nome: "Fases anteriores",
        confrontos: sorted.slice(0, total - idx < 0 ? 0 : 0).concat(
          sorted.slice(idx)
        ),
      });
    }
    return phases;
  }

  // --- Auto-detect from total confronto count ---
  // Find the smallest bracket that fits: 1, 3, 7, 15, 31, 63...
  const BRACKET_PHASES = [
    ["Final"],
    ["Semifinal", "Final"],
    ["Quartas de Final", "Semifinal", "Final"],
    ["Oitavas de Final", "Quartas de Final", "Semifinal", "Final"],
    ["16 avos de Final", "Oitavas de Final", "Quartas de Final", "Semifinal", "Final"],
    ["32 avos de Final", "16 avos de Final", "Oitavas de Final", "Quartas de Final", "Semifinal", "Final"],
  ];

  // Total confrontos per bracket size: 1, 3, 7, 15, 31, 63
  const bracketTotals = BRACKET_PHASES.map(p => Math.pow(2, p.length) - 1);
  const fit = bracketTotals.findIndex(bt => bt >= total);

  if (fit >= 0) {
    const names  = BRACKET_PHASES[fit];
    const n      = names.length;
    const counts = names.map((_, i) => Math.pow(2, n - 1 - i));
    // If total < bracketTotal, the earliest phases may have fewer confrontos
    // Just assign starting from the end (final = last confronto)
    const reversed = [...sorted].reverse();
    let idx = 0;
    const phases = [...names].reverse().map((nome, i) => ({
      nome,
      confrontos: reversed.slice(idx, idx += counts[n - 1 - i]).reverse(),
    })).reverse().filter(p => p.confrontos.length > 0);
    return phases;
  }

  // Fallback: one big phase
  return [{ nome: "Confrontos", confrontos: sorted }];
}

// ─── Bracket view ─────────────────────────────────────────────────────────────

// Columns per phase: 1→1, 2→2, 4→2 or 4, 8→4, 16→4 or 8
const phaseColumns = (n) => {
  if (n === 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-2";
  if (n <= 4)  return "grid-cols-2 sm:grid-cols-4";
  return "grid-cols-2 sm:grid-cols-4";
};

const phaseMaxWidth = (n) => {
  if (n === 1) return "max-w-[220px]";
  if (n === 2) return "max-w-[460px]";
  if (n <= 4)  return "max-w-[700px]";
  return "max-w-full";
};

// Phase accent colours (last = final, second-to-last = semi, ...)
const phaseAccent = (idx, total) => {
  const rev = total - 1 - idx;
  if (rev === 0) return { dot: "bg-amber-400", label: "text-amber-600", bar: "from-amber-100" };
  if (rev === 1) return { dot: "bg-violet-500", label: "text-violet-600", bar: "from-violet-50" };
  return { dot: "bg-gray-300", label: "text-gray-500", bar: "from-gray-50" };
};

function BracketView({ matches, structure_json, season, t }) {
  const confrontos = useMemo(
    () => buildConfrontos(matches.flatMap(w => w.games)),
    [matches]
  );
  const phases = useMemo(
    () => assignPhases(confrontos, structure_json, season),
    [confrontos, structure_json, season]
  );

  if (!confrontos.length) return (
    <p className="text-sm text-center text-gray-400 py-8">
      {t("sports.no_matches", "Nenhuma partida registrada.")}
    </p>
  );

  // Detect champion from the last phase (final)
  const finalPhase  = phases[phases.length - 1];
  const finalConf   = finalPhase?.confrontos[0];
  const champion    = finalConf ? (() => {
    const { team1, team2, agg } = finalConf;
    const a1 = agg[team1.id] ?? null;
    const a2 = agg[team2.id] ?? null;
    if (a1 === null || a2 === null) return null;
    if (a1 > a2) return team1;
    if (a2 > a1) return team2;
    return null; // draw / not yet played
  })() : null;

  return (
    <div className="flex flex-col items-center gap-0 w-full">
      {phases.map((phase, pi) => {
        const acc    = phaseAccent(pi, phases.length);
        const cols   = phaseColumns(phase.confrontos.length);
        const mw     = phaseMaxWidth(phase.confrontos.length);
        const isLast = pi === phases.length - 1;

        return (
          <div key={phase.nome} className="w-full flex flex-col items-center">
            {/* Phase header */}
            <div className={`w-full bg-gradient-to-r ${acc.bar} to-transparent rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${acc.dot}`} />
              <span className={`text-xs font-extrabold uppercase tracking-widest ${acc.label}`}>
                {phase.nome}
              </span>
              <span className="text-[10px] text-gray-400 ml-1">
                {phase.confrontos.length} confronto{phase.confrontos.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Cards grid — centered and narrowing */}
            <div className={`w-full ${mw} grid ${cols} gap-3`}>
              {phase.confrontos.map((c, i) => (
                <ConfrontoCard key={i} confronto={c} />
              ))}
            </div>

            {/* Connector arrow */}
            {!isLast && (
              <div className="flex flex-col items-center my-4 text-gray-200">
                <div className="w-px h-5 bg-gray-200" />
                <ChevronsDown size={16} />
              </div>
            )}
          </div>
        );
      })}

      {/* Champion */}
      {champion && (
        <div className="flex flex-col items-center mt-5 gap-3">
          <div className="flex flex-col items-center my-1 text-amber-300">
            <div className="w-px h-5 bg-amber-200" />
            <ChevronsDown size={16} />
          </div>
          <div className="flex flex-col items-center gap-2 bg-gradient-to-b from-amber-50 to-white border border-amber-200 rounded-2xl px-8 py-5 shadow-sm">
            <Crown size={18} className="text-amber-400" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">Campeão</span>
            {champion.crest && (
              <img src={champion.crest} alt="" className="w-12 h-12 object-contain" />
            )}
            <Link
              to={`/dashboard/clubs/${champion.id}`}
              className="text-sm font-extrabold text-gray-800 hover:text-violet-700 transition-colors text-center"
            >
              {champion.name}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Round-robin matches ──────────────────────────────────────────────────────

function MatchCard({ m }) {
  const finished = m.home_goals != null && m.away_goals != null;
  return (
    <Link to={`/dashboard/matches/${m.id}`}
      className="flex items-center gap-2 py-2.5 px-4 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-xs font-semibold text-gray-700 truncate group-hover:text-violet-700 transition-colors">{m.home.name}</span>
        {m.home.crest && <img src={m.home.crest} alt="" className="w-5 h-5 object-contain shrink-0" />}
      </div>
      <div className="flex flex-col items-center shrink-0 min-w-[56px]">
        {finished
          ? <span className="text-sm font-extrabold text-gray-900">{m.home_goals} – {m.away_goals}</span>
          : <span className="text-xs font-semibold text-violet-500">{fmtDate(m.date)}</span>
        }
        {finished && m.home_goals_ht != null && (
          <span className="text-[9px] text-gray-400">({m.home_goals_ht}–{m.away_goals_ht})</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {m.away.crest && <img src={m.away.crest} alt="" className="w-5 h-5 object-contain shrink-0" />}
        <span className="text-xs font-semibold text-gray-700 truncate group-hover:text-violet-700 transition-colors">{m.away.name}</span>
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
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
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

// ─── Format badge label ───────────────────────────────────────────────────────

const FORMAT_LABELS = {
  pontos_corridos:   "Pontos corridos",
  mata_mata:         "Mata-mata",
  grupos:            "Fase de grupos",
  grupos_mata_mata:  "Grupos + Mata-mata",
  misto:             "Misto",
  apertura_clausura: "Apertura/Clausura",
  personalizado:     "Personalizado",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LeagueSportsSection({ leagueId }) {
  const { t } = useTranslation();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason]   = useState(null);
  const [mainTab, setMainTab] = useState(null);
  const [split, setSplit]     = useState("total");

  useEffect(() => { load(season); }, [leagueId, season]);

  async function load(s) {
    setLoading(true);
    try {
      const params = s ? `?season=${s}` : "";
      const { data: res } = await api.get(`/dashboard/leagues/${leagueId}/sports${params}`);
      setData(res);
      if (!season && res.season) setSeason(res.season);
      if (mainTab === null) {
        const isKo = res.league?.format && res.league.format !== "pontos_corridos";
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

  const { league, seasons, standings, matches } = data;
  const fmt        = league.format ?? "pontos_corridos";
  const isKnockout = fmt !== "pontos_corridos" && fmt !== "grupos";
  const totalMatches = matches?.reduce((s, w) => s + w.games.length, 0) ?? 0;

  const tabs = [];
  if (!isKnockout) tabs.push({ key: "classificacao", label: "Classificação" });
  if (isKnockout)  tabs.push({ key: "chaveamento",   label: "Chaveamento" });
  tabs.push({ key: "partidas", label: "Partidas", badge: totalMatches });

  const activeTab = mainTab ?? tabs[0]?.key;

  return (
    <div className="space-y-5">
      {/* League hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
          {league.logo_url
            ? <img src={league.logo_url} alt="" className="w-full h-full object-contain p-1" />
            : <Trophy size={24} className="text-gray-300" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 truncate">{league.name}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            {league.country_name && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                {league.flag_url && <img src={league.flag_url} alt="" className="w-4 h-3 object-cover rounded-sm" />}
                {league.country_name}
              </span>
            )}
            {league.format && (
              <span className="text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md">
                {FORMAT_LABELS[league.format] ?? league.format}
              </span>
            )}
            {league.organizer && <span className="text-xs text-gray-500">{league.organizer}</span>}
          </div>
        </div>
      </div>

      {/* Season selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-500">{t("sports.season", "Temporada")}</span>
        <div className="flex gap-1 flex-wrap">
          {(seasons ?? []).map(y => (
            <button key={y} onClick={() => setSeason(y)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                ${season === y ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-violet-300"}`}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setMainTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all
              ${activeTab === tab.key ? "bg-violet-600 border-violet-600 text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-violet-200"}`}>
            {tab.label}
            {tab.badge > 0 && (
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${activeTab === tab.key ? "bg-violet-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CLASSIFICAÇÃO ── */}
      {activeTab === "classificacao" && (
        <>
          <SubTabs value={split} onChange={setSplit} options={[
            { key: "total", label: t("sports.total", "Total") },
            { key: "home",  label: t("sports.home", "Casa") },
            { key: "away",  label: t("sports.away", "Fora") },
          ]} />
          {loading
            ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
            : <StandingsTable rows={standings?.[split] ?? []} t={t} />
          }
        </>
      )}

      {/* ── CHAVEAMENTO ── */}
      {activeTab === "chaveamento" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <BracketView
              matches={matches ?? []}
              structure_json={league.structure_json}
              season={season}
              t={t}
            />
      )}

      {/* ── PARTIDAS ── */}
      {activeTab === "partidas" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <RoundRobinMatches matches={matches ?? []} t={t} />
      )}
    </div>
  );
}
