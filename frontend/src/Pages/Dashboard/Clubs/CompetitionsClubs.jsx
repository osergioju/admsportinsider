import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../../services/api";
import { Loader2, ChevronDown, Trophy, ChevronsDown } from "lucide-react";
import { useTranslation } from "../../../context/TranslationContext";

/* ── helpers ── */
const fmt = (v, d = 1) => v != null ? Number(v).toFixed(d) : "—";
const fmtI = v => v != null ? Number(v) : "—";
const fmtPct = v => v != null ? `${Number(v).toFixed(0)}%` : "—";
const fmtDate = d => d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" }) : "—";

/* ── bracket helpers ── */

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

  if (isDoubleLegged) {
    const [leg1, leg2] = legs;
    const ScoreBox = ({ score, href, dim }) => {
      const box = (
        <div className={`w-9 h-7 flex items-center justify-center rounded text-xs font-bold tabular-nums ${score == null ? "bg-gray-50 text-gray-200" : dim ? "bg-gray-50 text-gray-400" : "bg-gray-100 text-gray-700"}`}>
          {score ?? "–"}
        </div>
      );
      return href ? <Link to={href} className="hover:opacity-70 transition-opacity shrink-0">{box}</Link> : <div className="shrink-0">{box}</div>;
    };
    const AggBox = ({ score, isWinner }) => (
      <div className={`w-9 h-7 flex items-center justify-center rounded text-sm font-extrabold tabular-nums shrink-0 ${score == null ? "bg-gray-50 text-gray-200" : isWinner ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}>
        {score ?? "–"}
      </div>
    );
    const TeamRow = ({ team, isWinner, isLoser }) => {
      const s1 = legScoreFor(leg1, team.id);
      const s2 = legScoreFor(leg2, team.id);
      const aggScore = agg[team.id] ?? null;
      return (
        <div className={`flex items-center gap-1.5 px-3 py-2.5`}>
          {team.crest ? <img src={team.crest} alt="" className="w-5 h-5 object-contain shrink-0" /> : <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />}
          <Link to={`/dashboard/clubs/${team.id}`} className={`flex-1 min-w-0 text-sm truncate hover:underline transition-colors ${isWinner ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>{team.name}</Link>
          <ScoreBox score={s1} href={`/dashboard/matches/${leg1.id}`} dim={!isWinner} />
          <ScoreBox score={s2} href={`/dashboard/matches/${leg2.id}`} dim={!isWinner} />
          <AggBox score={aggScore} isWinner={isWinner} />
        </div>
      );
    };
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-colors">
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

  const leg = legs[0];
  const s1 = leg ? legScoreFor(leg, team1.id) : null;
  const s2 = leg ? legScoreFor(leg, team2.id) : null;
  const finished = s1 !== null && s2 !== null;
  let singleWinner = null;
  if (finished && s1 !== s2) singleWinner = s1 > s2 ? team1.id : team2.id;
  const SingleRow = ({ team, score, isWinner, isLoser }) => (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 ${isLoser ? "opacity-35" : ""}`}>
      {team.crest ? <img src={team.crest} alt="" className="w-5 h-5 object-contain shrink-0" /> : <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />}
      <Link to={`/dashboard/clubs/${team.id}`} className={`flex-1 min-w-0 text-sm truncate hover:underline transition-colors ${isWinner ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>{team.name}</Link>
      {score !== null && <span className={`text-base tabular-nums font-extrabold shrink-0 ${isWinner ? "text-gray-900" : "text-gray-400"}`}>{score}</span>}
    </div>
  );
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-colors">
      {leg && (
        <div className="px-4 pt-2 pb-1.5 border-b border-gray-50">
          <Link to={`/dashboard/matches/${leg.id}`} className="text-xs font-semibold text-gray-400 hover:text-violet-600 transition-colors">{fmtDate(leg.date)}</Link>
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
    if (round.length === 0) { rounds.push(remaining); break; }
    rounds.push(round);
    remaining = next;
  }
  return rounds;
}

function assignPhases(confrontos, structure_json, season) {
  if (!confrontos.length) return [];
  const sorted = [...confrontos].sort((a, b) => new Date(a.firstDate ?? 0) - new Date(b.firstDate ?? 0));
  const yearData = structure_json?.[String(season)];
  const fases = yearData?.fases ?? [];
  const clusters = temporalCluster(sorted, 14);
  const expanded = [];
  for (const cl of clusters) {
    for (const round of splitIntoRounds(cl)) expanded.push(round);
  }
  if (fases.length > 0) {
    const N = fases.length;
    const result = new Array(N).fill(null).map(() => []);
    const offset = N - expanded.length;
    if (offset >= 0) {
      expanded.forEach((grp, i) => { result[offset + i] = grp; });
    } else {
      result[0] = expanded.slice(0, 1 - offset).flat();
      expanded.slice(1 - offset).forEach((grp, i) => { result[1 + i] = grp; });
    }
    return fases.map((f, i) => ({ nome: f.nome ?? `Fase ${i + 1}`, confrontos: result[i] })).filter(p => p.confrontos.length > 0);
  }
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
  return names.map((nome, i) => ({ nome, confrontos: expanded[i - off] ?? [] })).filter(p => p.confrontos.length > 0);
}

const phaseColumns = (n) => n === 1 ? "grid-cols-1" : n === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4";
const phaseMaxWidth = (n) => n === 1 ? "max-w-[280px]" : n === 2 ? "max-w-[560px]" : n <= 4 ? "max-w-[80%]" : "max-w-full";

function assignPhasesForClub(confrontos, structure_json, season) {
  if (!confrontos.length) return [];
  const fases = structure_json?.[String(season)]?.fases ?? [];
  const sorted = [...confrontos].sort((a, b) => new Date(a.firstDate ?? 0) - new Date(b.firstDate ?? 0));

  if (!fases.length) {
    return sorted.map((c, i) => ({ nome: `Confronto ${i + 1}`, confrontos: [c] }));
  }

  // Separate confrontos with known game_week from those without
  const known = new Map(); // phaseIdx → confronto[]
  const unknown = [];
  for (const c of sorted) {
    const maxWeek = Math.max(0, ...c.legs.map(l => l.game_week ?? 0));
    if (maxWeek > 0 && maxWeek <= fases.length) {
      const idx = maxWeek - 1;
      if (!known.has(idx)) known.set(idx, []);
      known.get(idx).push(c);
    } else {
      unknown.push(c);
    }
  }

  // Anchor unknown confrontos chronologically before the lowest known phase
  const knownIndices = [...known.keys()].sort((a, b) => a - b);
  const anchor = knownIndices.length > 0 ? knownIndices[0] : fases.length;
  const startIdx = anchor - unknown.length;
  unknown.forEach((c, i) => {
    const idx = Math.max(0, startIdx + i);
    if (!known.has(idx)) known.set(idx, []);
    known.get(idx).push(c);
  });

  return [...known.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([idx, cs]) => ({ nome: fases[idx]?.nome ?? `Fase ${idx + 1}`, confrontos: cs }))
    .filter(p => p.confrontos.length > 0);
}

function ClubBracketView({ matches, structure_json, season, t, clubId }) {
  // Attach game_week to each leg so phase detection works
  const flatMatches = useMemo(() =>
    matches.flatMap(w => w.games.map(g => ({ ...g, game_week: w.week }))),
    [matches]
  );
  const confrontos = useMemo(() => buildConfrontos(flatMatches), [flatMatches]);
  const phases = useMemo(() => assignPhasesForClub(confrontos, structure_json, season), [confrontos, structure_json, season]);

  if (!confrontos.length) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>
  );

  // Detect if club was eliminated in the last confronto
  const lastPhase = phases[phases.length - 1];
  const lastConfronto = lastPhase?.confrontos[lastPhase.confrontos.length - 1];
  let wasEliminated = false;
  if (lastConfronto) {
    const myAgg = lastConfronto.agg[clubId] ?? null;
    const opponentEntry = Object.entries(lastConfronto.agg).find(([id]) => Number(id) !== clubId);
    const oppAgg = opponentEntry?.[1] ?? null;
    if (myAgg !== null && oppAgg !== null && myAgg < oppAgg) wasEliminated = true;
  }

  return (
    <div className="flex flex-col items-center gap-0 w-full">
      {phases.map((phase, pi) => {
        const isLast = pi === phases.length - 1;
        const cols = phaseColumns(phase.confrontos.length);
        const mw = phaseMaxWidth(phase.confrontos.length);
        return (
          <div key={phase.nome} className="w-full flex flex-col items-center">
            <div className="justify-center w-full flex items-center gap-2.5 mb-4 px-1">
              <span className="text-sm lg:text-xl font-bold text-gray-900 uppercase tracking-wide">{phase.nome}</span>
              <span className="text-xs lg:text-xl text-gray-400">· {phase.confrontos.length} confronto{phase.confrontos.length !== 1 ? "s" : ""}</span>
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
      {wasEliminated && (
        <div className="flex flex-col items-center mt-4 gap-2 w-full max-w-[280px] mb-6">
          <div className="w-px h-5 bg-gray-100" />
          <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Eliminado nas {lastPhase?.nome}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── sub-components ── */

function BigNum({ value, label, highlight }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl p-4 border ${highlight ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-100"}`}>
      <span className={`text-2xl font-extrabold leading-none ${highlight ? "text-white" : "text-gray-900"}`}>{value ?? "—"}</span>
      <span className={`text-[10px] font-semibold uppercase tracking-wide mt-1 text-center leading-tight ${highlight ? "text-violet-200" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}

function SubTabs({ value, onChange, t }) {
  return (
    <div className="flex gap-1 mb-4">
      {["total", "home", "away"].map((k, i) => (
        <button key={k} onClick={() => onChange(k)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${value === k ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-violet-300"}`}>
          {[t("sports.total", "Total"), t("sports.home", "Casa"), t("sports.away", "Fora")][i]}
        </button>
      ))}
    </div>
  );
}

function StandingsTable({ rows, clubId }) {
  const visible = rows;

  return (
    <div className="rounded-xl border border-gray-100 overflow-x-auto">
      <table className="w-full text-xs min-w-[520px]">
        <thead>
          <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
            {["#", "Clube", "P", "J", "V", "E", "D", "GP", "GC", "SG", "%"].map(h => (
              <th key={h} className={`py-2.5 px-2 font-semibold ${h === "Clube" ? "text-left" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((t, i) => (
            <tr key={t.id ?? i} className={`border-t border-gray-50 ${t.isMain ? "bg-violet-50 font-bold" : "hover:bg-gray-50/60"}`}>
              <td className={`px-2 py-2.5 text-center font-bold ${t.isMain ? "text-violet-600" : "text-gray-400"}`}>{t.pos ?? i + 1}</td>
              <td className={`px-2 py-2.5 flex items-center gap-2 ${t.isMain ? "text-violet-700" : "text-gray-700"}`}>
                {t.crest ? <img src={t.crest} alt="" className="w-4 h-4 object-contain" /> : <div className="w-4 h-4" />}
                {t.name}
              </td>
              <td className={`px-2 py-2.5 text-center font-bold ${t.isMain ? "text-violet-700" : "text-gray-800"}`}>{t.pts}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.j}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.v}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.e}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.d}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.gp}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.gc}</td>
              <td className={`px-2 py-2.5 text-center font-semibold ${t.sg > 0 ? "text-emerald-600" : t.sg < 0 ? "text-red-500" : "text-gray-400"}`}>{t.sg > 0 ? `+${t.sg}` : t.sg}</td>
              <td className="px-2 py-2.5 text-center text-gray-500">{t.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatRow({ label, value, sub }) {
  return (
    <tr className="border-t border-gray-50 hover:bg-gray-50/60">
      <td className="px-4 py-2.5 text-xs text-gray-600">{label}</td>
      <td className="px-4 py-2.5 text-right text-xs font-bold text-violet-700">{value ?? "—"}</td>
      {sub !== undefined && <td className="px-4 py-2.5 text-right text-xs text-gray-400">{sub}</td>}
    </tr>
  );
}

function MatchRow({ m, clubId }) {
  const isHome = m.home.id === clubId;
  const finished = m.home_goals != null && m.away_goals != null;
  const result = finished
    ? (isHome ? (m.home_goals > m.away_goals ? "V" : m.home_goals < m.away_goals ? "D" : "E")
      : (m.away_goals > m.home_goals ? "V" : m.away_goals < m.home_goals ? "D" : "E"))
    : null;
  const rc = { V: "bg-emerald-500", E: "bg-gray-400", D: "bg-red-500" };

  return (
    <Link to={`/dashboard/matches/${m.id}`} className="flex items-center gap-3 py-2.5 px-4 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {m.home.crest && <img src={m.home.crest} alt="" className="w-5 h-5 object-contain shrink-0" />}
        <span className={`text-xs font-semibold truncate ${m.home.id === clubId ? "text-violet-700" : "text-gray-700"}`}>{m.home.name}</span>
      </div>
      <div className="flex flex-col items-center shrink-0 min-w-[52px]">
        {finished
          ? <span className="text-sm font-extrabold text-gray-900">{m.home_goals} – {m.away_goals}</span>
          : <span className="text-xs font-semibold text-gray-400">{fmtDate(m.date)}</span>
        }
        {finished && m.home_goals_ht != null && (
          <span className="text-[9px] text-gray-400">({m.home_goals_ht}–{m.away_goals_ht})</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className={`text-xs font-semibold truncate ${m.away.id === clubId ? "text-violet-700" : "text-gray-700"}`}>{m.away.name}</span>
        {m.away.crest && <img src={m.away.crest} alt="" className="w-5 h-5 object-contain shrink-0" />}
      </div>
      {result && (
        <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white shrink-0 ${rc[result]}`}>{result}</span>
      )}
    </Link>
  );
}

/* ── Main component ── */
export default function CompetitionsClubs() {
  const { t } = useTranslation();
  const { id } = useParams();
  const clubId = Number(id);
  const [season, setSeason] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [mainTab, setMainTab] = useState({});     // compId → tab
  const [splitTab, setSplitTab] = useState({});   // compId → split
  const [countryFilter, setCountryFilter] = useState(null);

  useEffect(() => { load(); }, [id, season]);

  async function load() {
    setLoading(true);
    try {
      const params = season ? `?season=${season}` : "";
      const { data: res } = await api.get(`/dashboard/clubs/${id}/sports/competitions${params}`);
      setData(res);
      if (!season && res.season) setSeason(res.season);
      // auto-expand first
      const exp = {};
      res.competitions.forEach((c, i) => { exp[c.id] = i === 0; });
      setExpanded(exp);
      const currentSeason = season || res.season;
      const mt = {}, st = {};
      res.competitions.forEach(c => {
        const seasonFmt = c.structure_json?.[String(currentSeason)]?.tipo;
        const fmt = seasonFmt || c.format;
        const isKo = fmt && fmt !== "pontos_corridos" && fmt !== "pontos_corridos_turno_unico" && fmt !== "grupos";
        mt[c.id] = isKo ? "chaveamento" : "classificacao";
        st[c.id] = "total";
      });
      setMainTab(mt);
      setSplitTab(st);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const toggle = id => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const setMT = (id, v) => setMainTab(p => ({ ...p, [id]: v }));
  const setST = (id, v) => setSplitTab(p => ({ ...p, [id]: v }));

  // Países únicos para o filtro
  const countries = useMemo(() => {
    if (!data?.competitions) return [];
    const map = new Map();
    for (const c of data.competitions) {
      if (c.country?.id && !map.has(c.country.id)) map.set(c.country.id, c.country);
    }
    return [...map.values()];
  }, [data]);

  const filteredComps = useMemo(() => {
    if (!data?.competitions) return [];
    if (!countryFilter) return data.competitions;
    return data.competitions.filter(c => c.country?.id === countryFilter);
  }, [data, countryFilter]);

  const getCompTabs = (comp) => {
    const seasonFmt = comp.structure_json?.[String(season)]?.tipo;
    const compFmt = seasonFmt || comp.format;
    const isKo = compFmt && compFmt !== "pontos_corridos" && compFmt !== "pontos_corridos_turno_unico" && compFmt !== "grupos";
    const tabs = [];
    if (isKo) tabs.push({ key: "chaveamento", label: t("sports.bracket", "Chaveamento") });
    else tabs.push({ key: "classificacao", label: t("sports.classification", "Classificação") });
    tabs.push({ key: "esportivo", label: t("sports.tab", "Esportivo") });
    tabs.push({ key: "intervalo", label: t("sports.interval_tab", "Intervalo") });
    tabs.push({ key: "disciplinar", label: t("player.tab.disciplinary", "Disciplinar") });
    tabs.push({ key: "partidas", label: t("sports.matches", "Partidas") });
    return tabs;
  };

  return (
    <div className="w-full space-y-4 pb-10">

      {/* Season selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-500">{t("sports.season", "Temporada")}</span>
        <div className="flex gap-1 flex-wrap">
          {(data?.availableSeasons ?? [2025, 2024, 2023, 2022, 2021]).map(y => (
            <button key={y} onClick={() => setSeason(y)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${season === y ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-violet-300"}`}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por país */}
      {!loading && countries.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-400">{t("ui.country", "País")}:</span>
          <button onClick={() => setCountryFilter(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${!countryFilter ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-violet-300"}`}>
            {t("ui.all", "Todos")}
          </button>
          {countries.map(c => (
            <button key={c.id} onClick={() => setCountryFilter(countryFilter === c.id ? null : c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${countryFilter === c.id ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-violet-300"}`}>
              {c.flag && <img src={c.flag} alt="" className="w-3.5 h-2.5 object-cover rounded-sm shrink-0" />}
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="animate-spin w-5 h-5" />
          <span className="text-sm">{t("ui.loading", "Carregando...")}</span>
        </div>
      )}

      {!loading && (!filteredComps?.length) && (
        <div className="py-16 text-center text-gray-400 text-sm">{t("sports.no_data_season", "Nenhum dado para a temporada")} {season}.</div>
      )}

      {!loading && filteredComps.map(comp => {
        const isOpen = expanded[comp.id];
        const mt = mainTab[comp.id] ?? "classificacao";
        const st = splitTab[comp.id] ?? "total";
        const sp = comp.esportivo?.[st] ?? {};
        const ht = comp.halfTime?.[st] ?? {};
        const di = comp.discipline?.[st] ?? {};
        const s = comp.summary ?? {};
        const mp = sp.matches || s.matches || 1;

        return (
          <div key={comp.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">

            {/* Accordion header */}
            <button onClick={() => toggle(comp.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                {comp.logo_url
                  ? <img src={comp.logo_url} alt="" className="w-7 h-7 lg:w-12 lg:h-12 object-contain rounded-sm" />
                  : <div className="w-7 h-7 lg:w-12 lg:h-12 rounded-lg bg-gray-100 flex items-center justify-center"><Trophy size={14} className="text-gray-400" /></div>
                }
                <span className="text-sm font-bold text-gray-900">{comp.name}</span>
                {s.pos && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">{s.pos}{t("sports.place_suffix", "º lugar")}</span>}
              </div>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">

                {/* Big numbers summary */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 px-5 py-4 border-b border-gray-100">
                  <BigNum value={s.pos} label={t("sports.position", "Posição")} highlight />
                  <BigNum value={s.pts} label={t("sports.points", "Pontos")} />
                  <BigNum value={s.wins} label={t("sports.wins", "Vitórias")} />
                  <BigNum value={s.draws} label={t("sports.draws", "Empates")} />
                  <BigNum value={s.losses} label={t("sports.losses", "Derrotas")} />
                  <BigNum value={s.gp} label={t("sports.goals_for", "Gols pró")} />
                  <BigNum value={s.gc} label={t("sports.goals_against", "Gols contra")} />
                </div>

                {/* Main tabs */}
                <div className="flex gap-1 px-5 pt-4 pb-1 overflow-x-auto">
                  {getCompTabs(comp).map(tab => (
                    <button key={tab.key} onClick={() => setMT(comp.id, tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap transition-all ${mt === tab.key ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-violet-300"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="px-5 pb-6 pt-3 space-y-4">

                  {/* ── CHAVEAMENTO ── */}
                  {mt === "chaveamento" && (
                    <ClubBracketView
                      matches={comp.matches ?? []}
                      structure_json={comp.structure_json}
                      season={season}
                      t={t}
                      clubId={clubId}
                    />
                  )}

                  {/* ── CLASSIFICAÇÃO ── */}
                  {mt === "classificacao" && (
                    <>
                      <SubTabs value={st} onChange={v => setST(comp.id, v)} t={t} />
                      <StandingsTable rows={comp.standings?.[st] ?? []} clubId={clubId} />
                      <p className="text-xs text-gray-400 text-right">{comp.standings?.total?.length ?? 0} {t("sports.clubs_around", "clubes · exibindo posições ao redor do seu clube")}</p>
                    </>
                  )}

                  {/* ── ESPORTIVO ── */}
                  {mt === "esportivo" && (
                    <>
                      <SubTabs value={st} onChange={v => setST(comp.id, v)} t={t} />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        <BigNum value={fmtI(sp.gp)} label={t("sports.goals_scored", "Gols marcados")} />
                        <BigNum value={fmtI(sp.gc)} label={t("sports.goals_conceded", "Gols sofridos")} />
                        <BigNum value={fmtI(sp.shots)} label={t("sports.shots", "Chutes")} />
                        <BigNum value={fmtPct(sp.possession)} label={t("sports.avg_possession", "Posse média")} />
                      </div>
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
                            <th className="text-left px-4 py-2.5 font-semibold">{t("sports.stat_label", "Estatística")}</th>
                            <th className="text-right px-4 py-2.5 font-semibold">{t("ui.value", "Valor")}</th>
                          </tr></thead>
                          <tbody>
                            <StatRow label={t("sports.shots", "Chutes")} value={fmtI(sp.shots)} />
                            <StatRow label={t("sports.shots_on_target", "Chutes a gol")} value={fmtI(sp.shots_ot)} />
                            <StatRow label={t("sports.possession", "Posse de bola")} value={fmtPct(sp.possession)} />
                            <StatRow label={t("sports.clean_sheets", "Jogos sem sofrer gols")} value={fmtI(sp.clean_sheets)} />
                            <StatRow label={t("sports.corners", "Escanteios")} value={fmtI(sp.corners)} />
                            <StatRow label={t("sports.goals_per_game", "Gols marcados por jogo")} value={fmt(comp.esportivo?.total?.gp / mp, 2)} />
                            <StatRow label={t("sports.goals_conceded_pg", "Gols sofridos por jogo")} value={fmt(comp.esportivo?.total?.gc / mp, 2)} />
                            <StatRow label={t("sports.xg_avg_pro", "xG médio (pró)")} value={fmt(comp.esportivo?.total?.xg_for, 2)} />
                            <StatRow label={t("sports.xg_avg_against", "xG médio (contra)")} value={fmt(comp.esportivo?.total?.xg_against, 2)} />
                            <StatRow label={t("sports.btts_pct", "Ambos marcam %")} value={fmtPct(comp.esportivo?.total?.btts_pct)} />
                            <StatRow label={t("sports.over25_pct", "Acima de 2.5 gols %")} value={fmtPct(comp.esportivo?.total?.over25_pct)} />
                            <StatRow label={t("sports.clean_sheet_pct", "Clean sheet %")} value={fmtPct(comp.esportivo?.total?.cs_pct)} />
                            <StatRow label={t("sports.points_per_game", "Pontos por jogo")} value={fmt(comp.esportivo?.total?.ppg, 2)} />
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* ── INTERVALO ── */}
                  {mt === "intervalo" && (
                    <>
                      <SubTabs value={st} onChange={v => setST(comp.id, v)} t={t} />
                      {ht.winning == null
                        ? <p className="text-sm text-gray-400 text-center py-8">Dados de intervalo não disponíveis para esta temporada.</p>
                        : (
                          <>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <BigNum value={fmtI(ht.winning)} label={t("sports.winning_ht", "Vencendo no intervalo")} />
                              <BigNum value={fmtI(ht.drawing)} label={t("sports.drawing_ht", "Empatando")} />
                              <BigNum value={fmtI(ht.losing)} label={t("sports.losing_ht", "Perdendo")} />
                            </div>
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead><tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
                                  <th className="text-left px-4 py-2.5 font-semibold">{t("ui.item", "Item")}</th>
                                  <th className="text-right px-4 py-2.5 font-semibold">{t("ui.value", "Valor")}</th>
                                </tr></thead>
                                <tbody>
                                  <StatRow label={t("sports.winning_ht", "Vencendo no intervalo")} value={fmtI(ht.winning)} />
                                  <StatRow label={t("sports.drawing_interval", "Empatando no intervalo")} value={fmtI(ht.drawing)} />
                                  <StatRow label={t("sports.losing_interval", "Perdendo no intervalo")} value={fmtI(ht.losing)} />
                                  <StatRow label={t("sports.goals_scored_1h", "Gols marcados (1º tempo)")} value={fmtI(ht.gs)} />
                                  <StatRow label={t("sports.goals_conceded_1h", "Gols sofridos (1º tempo)")} value={fmtI(ht.gc)} />
                                </tbody>
                              </table>
                            </div>
                          </>
                        )
                      }
                    </>
                  )}

                  {/* ── DISCIPLINAR ── */}
                  {mt === "disciplinar" && (
                    <>
                      <SubTabs value={st} onChange={v => setST(comp.id, v)} t={t} />
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <BigNum value={fmtI(di.yellow)} label={t("sports.yellow_cards", "Cartões amarelos")} />
                        <BigNum value={fmtI(di.red)} label={t("sports.red_cards", "Cartões vermelhos")} />
                        <BigNum value={fmtI(di.fouls)} label={t("sports.fouls", "Faltas")} />
                      </div>
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
                            <th className="text-left px-4 py-2.5 font-semibold">{t("ui.item", "Item")}</th>
                            <th className="text-right px-4 py-2.5 font-semibold">{t("ui.value", "Valor")}</th>
                          </tr></thead>
                          <tbody>
                            <StatRow label={t("sports.fouls_committed", "Faltas cometidas")} value={fmtI(di.fouls)} />
                            <StatRow label={t("sports.fouls_per_game", "Faltas por jogo")} value={fmt(di.fouls / mp)} />
                            <StatRow label={t("sports.yellow_cards", "Cartões amarelos")} value={fmtI(di.yellow)} />
                            <StatRow label={t("sports.red_cards", "Cartões vermelhos")} value={fmtI(di.red)} />
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* ── PARTIDAS ── */}
                  {mt === "partidas" && (() => {
                    const isKo = getCompTabs(comp)[0]?.key === "chaveamento";
                    if (!comp.matches?.length) return (
                      <p className="text-sm text-gray-400 text-center py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>
                    );
                    if (isKo) {
                      // Group by opponent pair for knockout
                      const flatWithWeek = comp.matches.flatMap(w => w.games.map(g => ({ ...g, game_week: w.week })));
                      const confrontos = buildConfrontos(flatWithWeek)
                        .sort((a, b) => new Date(a.firstDate ?? 0) - new Date(b.firstDate ?? 0));
                      const phases = assignPhasesForClub(confrontos, comp.structure_json, season);
                      return phases.map(phase => (
                        <div key={phase.nome} className="rounded-xl border border-gray-100 overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            {phase.nome}
                          </div>
                          <div className="divide-y divide-gray-50">
                            {phase.confrontos.flatMap(c => c.legs).map(m => <MatchRow key={m.id} m={m} clubId={clubId} />)}
                          </div>
                        </div>
                      ));
                    }
                    return comp.matches.map(({ week, games }) => (
                      <div key={week} className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                          {week > 0 ? `${t("sports.round", "Rodada")} ${week}` : t("sports.no_round_defined", "Sem rodada definida")}
                        </div>
                        <div className="divide-y divide-gray-50">
                          {games.map(m => <MatchRow key={m.id} m={m} clubId={clubId} />)}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
