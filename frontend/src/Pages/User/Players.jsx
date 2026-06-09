import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../services/api";
import { clubUrl } from "../../utils/clubUrl";
import { ChevronLeft, ChevronDown, Loader2, Timer, Star } from "lucide-react";
import { useTranslation } from "../../context/TranslationContext";

/* ── helpers ── */
const fmt = (v, d = 1) => v != null ? Number(v).toFixed(d) : "—";
const fmtI = v => v != null ? Number(v) : "—";
const fmtPct = v => v != null ? `${Number(v).toFixed(1)}%` : "—";
const fmtDate = d => d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";

const sumStat = (comps, key) => {
  const vals = comps.map(c => c.stats[key]).filter(v => v != null);
  return vals.length ? vals.reduce((a, b) => a + Number(b), 0) : null;
};

function calcAge(b) {
  if (!b) return null;
  const today = new Date(), bday = new Date(b);
  let age = today.getFullYear() - bday.getFullYear();
  if (today < new Date(today.getFullYear(), bday.getMonth(), bday.getDate())) age--;
  return age;
}

/* ── Position style ── */
const POS_STYLE = {
  "Goleiro": { badge: "bg-blue-50   text-blue-700   border-blue-200" },
  "Zagueiro": { badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "Lateral": { badge: "bg-teal-50   text-teal-700   border-teal-200" },
  "Meio-campista": { badge: "bg-violet-50  text-violet-700 border-violet-200" },
  "Atacante": { badge: "bg-orange-50  text-orange-700 border-orange-200" },
};
const posStyle = pos => POS_STYLE[pos] ?? POS_STYLE["Meio-campista"];

/* ── Card icons ── */
function YellowCard({ size = "md" }) {
  const s = size === "sm" ? "w-2 h-3 rounded-[2px]" : "w-3.5 h-5 rounded-[2px]";
  return <span className={`${s} bg-amber-400 inline-block shrink-0`} />;
}
function RedCard({ size = "md" }) {
  const s = size === "sm" ? "w-2 h-3 rounded-[2px]" : "w-3.5 h-5 rounded-[2px]";
  return <span className={`${s} bg-red-500 inline-block shrink-0`} />;
}

/* ── BigStat — white card, colored number ── */
function BigStat({ value, label, numColor, icon }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-gray-150 rounded-xl p-4 gap-1 shadow-sm">
      {icon && <div className="text-gray-400 mb-0.5">{icon}</div>}
      <span className={`text-2xl font-extrabold leading-none tabular-nums ${numColor || "text-gray-900"}`}>
        {value ?? "—"}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-center text-gray-400 leading-tight mt-0.5">
        {label}
      </span>
    </div>
  );
}

/* ── StatPill — 2-col grid, label + value compact ── */
function StatPill({ label, value, accent, wide }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors ${wide ? "col-span-2" : ""}`}>
      <span className="text-sm text-gray-500 leading-snug">{label}</span>
      <span className={`text-sm font-bold shrink-0 tabular-nums ${accent || "text-gray-900"}`}>{value}</span>
    </div>
  );
}

function StatPillGrid({ children }) {
  return <div className="grid grid-cols-2 gap-1.5">{children}</div>;
}

/* ── SplitCard — label + total + home/away chips ── */
function SplitCard({ label, total, home, away }) {
  if (total == null && home == null && away == null) return null;
  const hasHomeAway = home != null || away != null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-3 py-3 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-gray-500">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {hasHomeAway && (
            <>
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                Casa {fmtI(home)}
              </span>
              <span className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                Fora {fmtI(away)}
              </span>
            </>
          )}
          <span className="text-base font-bold text-gray-900 tabular-nums min-w-[1.5rem] text-right">
            {fmtI(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Section label ── */
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 pt-1">{children}</p>
  );
}

/* ── Tabs ── */
const TABS = [
  { key: "participacao", label: "Participação" },
  { key: "ofensivo", label: "Ofensivo" },
  { key: "chutes", label: "Chutes" },
  { key: "tecnico", label: "Técnico" },
  { key: "disciplinar", label: "Disciplinar" },
];

/* ── CompetitionTabs ── */
function CompetitionTabs({ comp }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("participacao");
  const st = comp.stats;
  const mp = st.matches_total || 1;

  return (
    <div className="space-y-3 pt-3">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border whitespace-nowrap transition-all
              ${tab === key
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── PARTICIPAÇÃO ── */}
      {tab === "participacao" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <BigStat value={fmtI(st.matches_total)} label={t("player.stat.total_matches", "Partidas")} />
            <BigStat value={fmtI(st.matches_started)} label={t("player.stat.as_starter", "Titular")} />
            <BigStat value={fmtI(st.minutes_total)} label={t("player.stat.total_minutes", "Minutos")} icon={<Timer size={11} />} />
            <BigStat value={st.rating > 0 && !isNaN(Number(st.rating)) ? fmt(st.rating, 2) : "—"} label={t("player.stat.avg_rating", "Rating")} numColor="text-amber-500" icon={<Star size={11} />} />
          </div>

          <SectionLabel>Partidas e minutos</SectionLabel>
          <div className="space-y-1">
            <SplitCard label={t("player.stat.matches", "Partidas")} total={st.matches_total} home={st.matches_home} away={st.matches_away} />
            <SplitCard label={t("player.stat.minutes_played", "Minutos")} total={st.minutes_total} home={st.minutes_home} away={st.minutes_away} />
          </div>
          <StatPillGrid>
            <StatPill label={t("player.stat.minutes_per_game", "Min/jogo")}
              value={st.minutes_per_match != null ? fmt(st.minutes_per_match) : (st.minutes_total && st.matches_total ? fmt(st.minutes_total / mp) : "—")} />
            <StatPill label={t("player.stat.starter_matches", "Titular")} value={fmtI(st.matches_started)} />
          </StatPillGrid>

          <SectionLabel>Competição</SectionLabel>
          <StatPillGrid>
            <StatPill wide label={t("player.stat.club", "Clube")} value={
              <Link to={clubUrl(comp.club.id, comp.club.slug)} className="text-violet-600 hover:underline font-bold text-[11px]">{comp.club.name}</Link>
            } />
            <StatPill wide label={t("player.stat.league", "Liga")} value={
              <Link to={`/dashboard/competitions/${comp.league.slug || comp.league.id}`} className="text-violet-600 hover:underline font-bold text-[11px]">{comp.league.name}</Link>
            } />
            <StatPill label={t("player.stat.jersey", "Camisa")} value={comp.shirt_number ?? "—"} />
            <StatPill label={t("player.stat.market_value", "Valor mercado")}
              value={comp.market_value ? `€ ${Number(comp.market_value).toLocaleString("pt-BR")}` : "—"} />
          </StatPillGrid>
        </div>
      )}

      {/* ── OFENSIVO ── */}
      {tab === "ofensivo" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <BigStat value={fmtI(st.goals)} label={t("player.stat.goals", "Gols")} numColor="text-emerald-600" />
            <BigStat value={fmtI(st.assists)} label={t("player.stat.assists_short", "Assist.")} numColor="text-blue-600" />
            <BigStat value={fmt(st.xg, 2)} label="xG" numColor="text-violet-600" />
            <BigStat value={fmtI(st.penalties_scored)} label={t("player.stat.penalties", "Pênaltis")} />
            <BigStat value={fmtI(st.clean_sheets_total)} label={t("player.stat.clean_sheets", "C. Sheets")} />
          </div>

          <SectionLabel>Casa e fora</SectionLabel>
          <div className="space-y-1">
            <SplitCard label={t("player.stat.goals", "Gols")} total={st.goals} home={st.goals_home} away={st.goals_away} />
            <SplitCard label={t("player.stat.assists", "Assistências")} total={st.assists} home={st.assists_home} away={st.assists_away} />
            <SplitCard label={t("player.stat.clean_sheets", "Clean sheets")} total={st.clean_sheets_total} home={st.clean_sheets_home} away={st.clean_sheets_away} />
          </div>

          <SectionLabel>Detalhes</SectionLabel>
          <StatPillGrid>
            <StatPill label={t("player.stat.penalties_scored", "Pênaltis marcados")} value={fmtI(st.penalties_scored)} />
            <StatPill label={t("player.stat.penalties_missed", "Pênaltis perdidos")} value={fmtI(st.penalties_missed)} />
            <StatPill label={t("player.stat.offsides", "Impedimentos")} value={fmtI(st.offsides)} />
            <StatPill label="xG total" value={fmt(st.xg, 2)} />
          </StatPillGrid>
        </div>
      )}

      {/* ── CHUTES ── */}
      {tab === "chutes" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <BigStat value={fmtI(st.shots)} label={t("player.tab.shots", "Chutes")} />
            <BigStat value={fmtI(st.shots_on_target)} label={t("player.stat.on_target_short", "A gol")} />
            <BigStat value={fmtPct(st.shot_accuracy_pct)} label={t("player.stat.accuracy_short", "Precisão")} numColor="text-emerald-600" />
          </div>

          <SectionLabel>Eficiência</SectionLabel>
          <StatPillGrid>
            <StatPill label={t("player.stat.total_shots", "Chutes totais")} value={fmtI(st.shots)} />
            <StatPill label={t("player.stat.shots_per_game", "Chutes/jogo")} value={st.shots && st.matches_total ? fmt(st.shots / mp) : "—"} />
            <StatPill label={t("player.stat.on_target", "A gol")} value={fmtI(st.shots_on_target)} />
            <StatPill label={t("player.stat.shot_accuracy", "Precisão %")} value={fmtPct(st.shot_accuracy_pct)} />
            <StatPill label={t("player.stat.shots_on_target_per90", "A gol/90")}
              value={st.shots_on_target_per90 != null ? fmt(st.shots_on_target_per90, 2) : "—"} />
            <StatPill label={t("player.stat.shots_on_target_per90_pct", "Precisão percentil")}
              value={fmtPct(st.shots_on_target_per90_pct)} />
          </StatPillGrid>
        </div>
      )}

      {/* ── TÉCNICO ── */}
      {tab === "tecnico" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <BigStat value={fmtI(st.passes)} label={t("player.stat.passes", "Passes")} />
            <BigStat value={fmtPct(st.pass_completion_rate)} label={t("player.stat.pass_accuracy_short", "Acerto")} numColor="text-blue-600" />
            <BigStat value={fmtI(st.tackles)} label={t("player.stat.tackles", "Desarmes")} />
            <BigStat value={fmtI(st.interceptions)} label={t("player.stat.interceptions", "Intercep.")} />
          </div>

          <SectionLabel>Passes</SectionLabel>
          <StatPillGrid>
            <StatPill label={t("player.stat.passes_correct", "Total")} value={fmtI(st.passes)} />
            <StatPill label={t("player.stat.pass_rate", "Taxa de acerto")} value={fmtPct(st.pass_completion_rate)} />
            <StatPill label={t("player.stat.pass_completion_rate_pct", "Acerto percentil")} value={fmtPct(st.pass_completion_rate_pct)} />
            <StatPill label={t("player.stat.short_passes", "Passes curtos")} value={fmtI(st.short_passes)} />
            <StatPill label={t("player.stat.long_passes", "Passes longos")} value={fmtI(st.long_passes)} />
            <StatPill label={t("player.stat.key_passes", "Passes-chave")} value={fmtI(st.key_passes)} />
          </StatPillGrid>

          <SectionLabel>Defesa e duelos</SectionLabel>
          <StatPillGrid>
            <StatPill label={t("player.stat.tackles", "Desarmes")} value={fmtI(st.tackles)} />
            <StatPill label={t("player.stat.interceptions", "Interceptações")} value={fmtI(st.interceptions)} />
            <StatPill label={t("player.stat.interceptions_per90", "Interc./90")}
              value={st.interceptions_per90 != null ? fmt(st.interceptions_per90, 2) : "—"} />
            <StatPill label={t("player.stat.crosses", "Cruzamentos")} value={fmtI(st.crosses_total)} />
            <StatPill label={t("player.stat.dribbles_attempted", "Dribles tent.")} value={fmtI(st.dribbles_total)} />
            <StatPill label={t("player.stat.dribbles_success", "Dribles ok")} value={fmtI(st.dribbles_successful)} />
            <StatPill label={t("player.stat.total_duels", "Duelos")} value={fmtI(st.duels)} />
            <StatPill label={t("player.stat.duels_won", "Duelos vencidos %")} value={fmtPct(st.duels_won_pct)} />
          </StatPillGrid>

          <SectionLabel>Goleiro</SectionLabel>
          <StatPillGrid>
            <StatPill label={t("player.stat.saves", "Defesas")} value={fmtI(st.saves_total)} />
            <StatPill label={t("player.stat.saves_inside", "Defesas na área")} value={fmtI(st.inside_box_saves)} />
          </StatPillGrid>
        </div>
      )}

      {/* ── DISCIPLINAR ── */}
      {tab === "disciplinar" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <BigStat value={fmtI(st.yellow_cards)} label={t("player.stat.yellow_cards", "Amarelos")} numColor="text-amber-500" icon={<YellowCard />} />
            <BigStat value={fmtI(st.red_cards)} label={t("player.stat.red_cards", "Vermelhos")} numColor="text-red-600" icon={<RedCard />} />
            <BigStat value={fmtI(st.fouls_committed)} label={t("player.stat.fouls", "Faltas")} />
          </div>

          <SectionLabel>Detalhe</SectionLabel>
          <StatPillGrid>
            <StatPill label={t("player.stat.yellow_cards", "Amarelos")}
              value={<span className="inline-flex items-center gap-1.5 text-amber-600 font-bold"><YellowCard size="sm" />{fmtI(st.yellow_cards)}</span>} />
            <StatPill label={t("player.stat.red_cards", "Vermelhos")}
              value={<span className="inline-flex items-center gap-1.5 text-red-600 font-bold"><RedCard size="sm" />{fmtI(st.red_cards)}</span>} />
            <StatPill label={t("player.stat.fouls", "Faltas cometidas")} value={fmtI(st.fouls_committed)} />
            <StatPill label={t("player.stat.fouls_per_game", "Faltas/jogo")}
              value={st.fouls_committed && st.matches_total ? fmt(st.fouls_committed / mp) : "—"} />
          </StatPillGrid>
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
export default function Players() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { loadPlayer(); }, [id]);
  useEffect(() => { if (season !== null) loadPlayer(season); }, [season]);

  async function loadPlayer(s) {
    try {
      setLoading(true);
      const params = s ? `?season=${s}` : "";
      const { data: res } = await api.get(`/dashboard/players/${id}${params}`);
      setData(res);
      if (!season && res.availableSeasons?.length) setSeason(res.availableSeasons[0]);
      if (res.seasons?.length) setExpanded({ [res.seasons[0].league.id]: true });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const toggle = leagueId => setExpanded(p => ({ ...p, [leagueId]: !p[leagueId] }));

  const summary = useMemo(() => {
    if (!data?.seasons?.length) return null;
    const s = data.seasons;
    return {
      matches: sumStat(s, "matches_total"),
      minutes: sumStat(s, "minutes_total"),
      goals: sumStat(s, "goals"),
      assists: sumStat(s, "assists"),
      yellow: sumStat(s, "yellow_cards"),
      red: sumStat(s, "red_cards"),
      rating: (() => {
        const valid = s.map(c => Number(c.stats.rating)).filter(v => v > 0 && !isNaN(v));
        return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
      })(),
    };
  }, [data]);

  if (loading && !data) return (
    <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
      <Loader2 className="animate-spin w-5 h-5" />
      <span className="text-sm">{t("player.loading", "Carregando jogador...")}</span>
    </div>
  );
  if (!data) return null;

  const { player, seasons, availableSeasons } = data;
  const age = calcAge(player.birthday);
  const ps = posStyle(player.position);

  return (
    <div className="w-full pb-12 space-y-4">

      {/* ── Hero ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors font-medium">
            <ChevronLeft size={16} />{t("ui.back", "Voltar")}
          </button>
        </div>

        <div className="items-center flex flex-col sm:flex-row gap-5 px-6 py-5">
          {/* Avatar */}
          <div className="lg:w-40 lg:h-40 shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={player.photo_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(player.full_name)}&background=f3f4f6&color=6b7280&size=200`}
              alt={player.full_name}
              className="w-full h-full object-cover object-top"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h1 className="text-lg lg:text-2xl font-bold text-gray-900 leading-tight truncate">{player.full_name}</h1>
                {player.position && (
                  <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${ps.badge}`}>
                    {player.position}
                  </span>
                )}
              </div>
              {player.flag_url && (
                <img src={player.flag_url} alt="" className="w-7 h-[19px] object-cover rounded shrink-0 mt-0.5" />
              )}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              {player.birthday && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("player.stat.birth", "Nasc.")}</span>
                  <span className="text-sm text-gray-700 font-medium">
                    {fmtDate(player.birthday)}{age ? ` · ${age} anos` : ""}
                  </span>
                </div>
              )}
              {player.nationality && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("player.stat.nationality", "Nac.")}</span>
                  <span className="text-sm text-gray-700 font-medium">{player.nationality}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Seletor de temporada ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="w-full text-sm font-semibold text-gray-500 flex items-center gap-1.5">
          <Timer size={14} />{t("sports.season", "Temporada")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {(availableSeasons ?? []).map(y => (
            <button key={y} onClick={() => setSeason(y)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-all
                ${season === y
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"}`}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary agregado ── */}
      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          <BigStat value={fmtI(summary.matches)} label={t("player.stat.matches", "Partidas")} />
          <BigStat value={fmtI(summary.minutes)} label={t("player.stat.minutes", "Minutos")} icon={<Timer size={11} />} />
          <BigStat value={fmtI(summary.goals)} label={t("player.stat.goals", "Gols")} numColor="text-emerald-600" />
          <BigStat value={fmtI(summary.assists)} label={t("player.stat.assists_short", "Assist.")} numColor="text-blue-600" />
          <BigStat value={fmtI(summary.yellow)} label={t("player.stat.yellow_short", "Amarelos")} numColor="text-amber-500" icon={<YellowCard size="sm" />} />
          <BigStat value={fmtI(summary.red)} label={t("player.stat.red_cards", "Vermelhos")} numColor="text-red-600" icon={<RedCard size="sm" />} />
          <BigStat value={summary.rating != null ? fmt(summary.rating, 1) : "—"} label={t("player.stat.rating", "Rating")} numColor="text-amber-500" icon={<Star size={11} />} />
        </div>
      )}

      {/* ── Competições (accordion) ── */}
      {loading ? (
        <div className="flex justify-center py-10 text-gray-400 gap-2">
          <Loader2 className="animate-spin w-5 h-5" /><span className="text-sm">{t("ui.loading", "Carregando...")}</span>
        </div>
      ) : !seasons?.length ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          {t("sports.no_data_season", "Nenhum dado para a temporada")} {season}.
        </div>
      ) : seasons.map(comp => {
        const isOpen = !!expanded[comp.league.id];
        return (
          <div key={comp.league.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Header */}
            <button onClick={() => toggle(comp.league.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                {comp.club.crest_url
                  ? <img src={comp.club.crest_url} alt="" className="w-7 h-7 object-contain shrink-0" />
                  : <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0" />
                }
                <div className="text-left min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{comp.league.name}</p>
                  <p className="text-xs text-gray-400 truncate">{comp.club.name}</p>
                </div>

                {/* mini stats */}
                <div className="hidden sm:flex items-center gap-1.5 ml-2">
                  {comp.stats.matches_total != null && (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {comp.stats.matches_total} J
                    </span>
                  )}
                  {comp.stats.goals != null && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {comp.stats.goals} G
                    </span>
                  )}
                  {comp.stats.assists != null && comp.stats.assists > 0 && (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {comp.stats.assists} A
                    </span>
                  )}
                  {comp.stats.yellow_cards != null && comp.stats.yellow_cards > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      <YellowCard size="sm" />{comp.stats.yellow_cards}
                    </span>
                  )}
                  {comp.stats.red_cards != null && comp.stats.red_cards > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                      <RedCard size="sm" />{comp.stats.red_cards}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ml-2 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 pb-5">
                <CompetitionTabs comp={comp} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
