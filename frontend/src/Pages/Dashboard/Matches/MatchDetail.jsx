import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../../services/api";
import { clubUrl } from "../../../utils/clubUrl";
import { ChevronLeft, Loader2, MapPin, User, Users } from "lucide-react";

const fmt = (v, d = 1) => v != null ? Number(v).toFixed(d) : null;
const fmtDate = d => d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "—";

/* Comparison bar: shows two teams side by side with proportion bar */
function StatBar({ label, home, away, isPercent }) {
  if (home == null && away == null) return null;
  const h = Number(home ?? 0);
  const a = Number(away ?? 0);
  const total = h + a;
  const homePct = total > 0 ? (h / total) * 100 : 50;

  const display = v => isPercent ? `${Number(v).toFixed(0)}%` : Number(v).toFixed(v % 1 !== 0 ? 1 : 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold text-gray-800">
        <span>{display(h)}</span>
        <span className="text-gray-400 font-medium text-[10px] uppercase tracking-wider">{label}</span>
        <span>{display(a)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
        <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-gray-300 rounded-full transition-all duration-500" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

const TABS = ["Esportivo", "Disciplinar", "Financeiro"];

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Esportivo");

  useEffect(() => {
    api.get(`/dashboard/matches/${id}`)
      .then(r => setData(r.data))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
      <Loader2 className="animate-spin w-5 h-5" />
      <span className="text-sm">Carregando partida...</span>
    </div>
  );
  if (!data) return null;

  const { home, away, score, score_ht, info, stats, league, season, game_week } = data;
  console.log(data);
  const s = stats ?? {};

  return (
    <div className="w-full max-w-2xl mx-auto pb-12 space-y-4">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors font-medium">
        <ChevronLeft size={16} />
        Voltar
      </button>

      {/* Scoreboard hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Liga / rodada */}
        <div className="flex items-center justify-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-semibold text-gray-500">
            <Link to={`/dashboard/competitions/${league.id}`} className="hover:text-violet-600 transition-colors">{league.name}</Link>
            {game_week ? ` · Rodada ${game_week}` : ""}
            {season ? ` · ${season}` : ""}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center justify-between px-8 py-6 gap-4">
          {/* Home */}
          {home.hidden
            ? <div className="flex flex-col items-center gap-2 flex-1">
                {home.slug
                  ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + home.slug + `.webp`} alt={home.name} className="w-16 h-16 object-contain" />
                  : <div className="w-16 h-16 rounded-2xl bg-gray-100" />
                }
                <span className="text-xs font-bold text-gray-800 text-center leading-tight">{home.name}</span>
              </div>
            : <Link to={clubUrl(home.id, home.slug)} className="flex flex-col items-center gap-2 flex-1 hover:opacity-80 transition-opacity">
                {home.slug
                  ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + home.slug + `.webp`} alt={home.name} className="w-16 h-16 object-contain" />
                  : <div className="w-16 h-16 rounded-2xl bg-gray-100" />
                }
                <span className="text-xs font-bold text-gray-800 text-center leading-tight">{home.name}</span>
              </Link>
          }

          {/* Score center */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-extrabold text-gray-900">{score.home ?? "–"}</span>
              <span className="text-2xl font-bold text-gray-300">×</span>
              <span className="text-4xl font-extrabold text-gray-900">{score.away ?? "–"}</span>
            </div>
            {score_ht?.home != null && (
              <span className="text-xs text-gray-400 font-medium">Intervalo: {score_ht.home} – {score_ht.away}</span>
            )}
          </div>

          {/* Away */}
          {away.hidden
            ? <div className="flex flex-col items-center gap-2 flex-1">
                {away.slug
                  ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + away.slug + `.webp`} alt={away.name} className="w-16 h-16 object-contain" />
                  : <div className="w-16 h-16 rounded-2xl bg-gray-100" />
                }
                <span className="text-xs font-bold text-gray-800 text-center leading-tight">{away.name}</span>
              </div>
            : <Link to={clubUrl(away.id, away.slug)} className="flex flex-col items-center gap-2 flex-1 hover:opacity-80 transition-opacity">
                {away.slug
                  ? <img src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_` + away.slug + `.webp`} alt={away.name} className="w-16 h-16 object-contain" />
                  : <div className="w-16 h-16 rounded-2xl bg-gray-100" />
                }
                <span className="text-xs font-bold text-gray-800 text-center leading-tight">{away.name}</span>
              </Link>
          }
        </div>

        {/* Info bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          {data.date && (
            <span className="capitalize">{fmtDate(data.date)}</span>
          )}
          {info.stadium && (
            <span className="flex items-center gap-1"><MapPin size={11} />{info.stadium}</span>
          )}
          {info.referee && (
            <span className="flex items-center gap-1"><User size={11} />{info.referee}</span>
          )}
          {info.attendance && (
            <span className="flex items-center gap-1"><Users size={11} />{Number(info.attendance).toLocaleString("pt-BR")} presentes</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${tab === t ? "bg-violet-600 border-violet-600 text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-violet-200"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* Teams header */}
        <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-100">
          <span className="text-violet-700">{home.name}</span>
          <span className="text-gray-400">vs</span>
          <span className="text-gray-700">{away.name}</span>
        </div>

        {tab === "Esportivo" && (
          <div className="space-y-4">
            <StatBar label="Chutes" home={s.home_shots} away={s.away_shots} />
            <StatBar label="Chutes a gol" home={s.home_shots_on_target} away={s.away_shots_on_target} />
            <StatBar label="Posse de bola %" home={s.home_possession} away={s.away_possession} isPercent />
            <StatBar label="xG pré-jogo" home={fmt(s.home_xg_pre, 2)} away={fmt(s.away_xg_pre, 2)} />
            <StatBar label="Escanteios" home={s.home_corners} away={s.away_corners} />
          </div>
        )}

        {tab === "Disciplinar" && (
          <div className="space-y-4">
            <StatBar label="Faltas" home={s.home_fouls} away={s.away_fouls} />
            <StatBar label="Cartões amarelos" home={s.home_yellow_cards} away={s.away_yellow_cards} />
            <StatBar label="Cartões vermelhos" home={s.home_red_cards} away={s.away_red_cards} />
          </div>
        )}

        {tab === "Financeiro" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Público presente</span>
              <span className="text-sm font-bold text-gray-900">
                {info.attendance ? Number(info.attendance).toLocaleString("pt-BR") : "—"}
              </span>
            </div>
            {[["Pagantes", "—"], ["Receita", "—"], ["Despesa", "—"], ["Resultado líquido", "—"]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{l}</span>
                <span className="text-sm font-bold text-gray-400">{v}</span>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center pt-2">Dados financeiros não disponíveis nesta versão.</p>
          </div>
        )}
      </div>
    </div>
  );
}
