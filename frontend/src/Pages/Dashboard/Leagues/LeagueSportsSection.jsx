import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import { Loader2, Trophy, Globe } from "lucide-react";

const fmtDate = d => d
  ? new Date(d).toLocaleDateString("pt-BR",{timeZone:"UTC",day:"2-digit",month:"2-digit"})
  : "—";

function SubTabs({ value, onChange, options }) {
  return (
    <div className="flex gap-1 mb-4">
      {options.map(({ key, label }) => (
        <button key={key} onClick={() => onChange(key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${value===key?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-500 hover:border-violet-300"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function StandingsTable({ rows }) {
  if (!rows?.length) return (
    <p className="text-sm text-center text-gray-400 py-8">Sem dados de classificação.</p>
  );
  return (
    <div className="rounded-xl border border-gray-100 overflow-x-auto">
      <table className="w-full text-xs min-w-[540px]">
        <thead>
          <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
            {["#","Clube","P","J","V","E","D","GP","GC","SG","%"].map(h=>(
              <th key={h} className={`py-2.5 px-2 font-semibold ${h==="Clube"?"text-left":""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={t.id ?? i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
              <td className="px-2 py-2.5 text-center font-bold text-gray-400">{t.pos ?? i+1}</td>
              <td className="px-2 py-2.5">
                <Link to={`/dashboard/clubs/${t.id}`} className="flex items-center gap-2 hover:text-violet-700 transition-colors font-semibold text-gray-700">
                  {t.crest
                    ? <img src={t.crest} alt="" className="w-4 h-4 object-contain shrink-0"/>
                    : <div className="w-4 h-4"/>
                  }
                  {t.name}
                </Link>
              </td>
              <td className="px-2 py-2.5 text-center font-bold text-gray-800">{t.pts}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.j}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.v}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.e}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.d}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.gp}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.gc}</td>
              <td className={`px-2 py-2.5 text-center font-semibold ${t.sg>0?"text-emerald-600":t.sg<0?"text-red-500":"text-gray-400"}`}>
                {t.sg>0?`+${t.sg}`:t.sg}
              </td>
              <td className="px-2 py-2.5 text-center text-gray-500">{t.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchCard({ m }) {
  const finished = m.home_goals != null && m.away_goals != null;
  return (
    <Link to={`/dashboard/matches/${m.id}`}
      className="flex items-center gap-2 py-2.5 px-4 hover:bg-gray-50 transition-colors group">
      {/* Home */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-xs font-semibold text-gray-700 truncate group-hover:text-violet-700 transition-colors">{m.home.name}</span>
        {m.home.crest && <img src={m.home.crest} alt="" className="w-5 h-5 object-contain shrink-0"/>}
      </div>
      {/* Score */}
      <div className="flex flex-col items-center shrink-0 min-w-[56px]">
        {finished
          ? <span className="text-sm font-extrabold text-gray-900">{m.home_goals} – {m.away_goals}</span>
          : <span className="text-xs font-semibold text-violet-500">{fmtDate(m.date)}</span>
        }
        {finished && m.home_goals_ht != null && (
          <span className="text-[9px] text-gray-400">({m.home_goals_ht}–{m.away_goals_ht})</span>
        )}
      </div>
      {/* Away */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {m.away.crest && <img src={m.away.crest} alt="" className="w-5 h-5 object-contain shrink-0"/>}
        <span className="text-xs font-semibold text-gray-700 truncate group-hover:text-violet-700 transition-colors">{m.away.name}</span>
      </div>
    </Link>
  );
}

export default function LeagueSportsSection({ leagueId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason]   = useState(null);
  const [mainTab, setMainTab] = useState("classificacao");
  const [split, setSplit]     = useState("total");
  const [openWeeks, setOpenWeeks] = useState({});

  useEffect(() => { load(season); }, [leagueId, season]);

  async function load(s) {
    setLoading(true);
    try {
      const params = s ? `?season=${s}` : "";
      const { data: res } = await api.get(`/dashboard/leagues/${leagueId}/sports${params}`);
      setData(res);
      if (!season && res.season) setSeason(res.season);
      // auto-open first week
      if (res.matches?.length) setOpenWeeks({ [res.matches[0].week]: true });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const toggleWeek = w => setOpenWeeks(p => ({ ...p, [w]: !p[w] }));

  if (loading && !data) return (
    <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
      <Loader2 className="animate-spin w-5 h-5"/>
      <span className="text-sm">Carregando...</span>
    </div>
  );

  if (!data) return null;

  const { league, seasons, standings, matches } = data;

  return (
    <div className="space-y-5">
      {/* League hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
          {league.logo_url
            ? <img src={league.logo_url} alt="" className="w-full h-full object-contain p-1"/>
            : <Trophy size={24} className="text-gray-300"/>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 truncate">{league.name}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            {league.country_name && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                {league.flag_url && <img src={league.flag_url} alt="" className="w-4 h-3 object-cover rounded-sm"/>}
                {league.country_name}
              </span>
            )}
            {league.format && (
              <span className="text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md">
                {league.format === "pontos_corridos" ? "Pontos corridos" : league.format === "mata_mata" ? "Mata-mata" : league.format}
              </span>
            )}
            {league.organizer && (
              <span className="text-xs text-gray-500">{league.organizer}</span>
            )}
          </div>
        </div>
      </div>

      {/* Season selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-500">Temporada</span>
        <div className="flex gap-1 flex-wrap">
          {(seasons ?? []).map(y => (
            <button key={y} onClick={() => setSeason(y)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${season===y?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-600 hover:border-violet-300"}`}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Main tabs: Classificação | Partidas */}
      <div className="flex gap-1">
        {[{key:"classificacao",label:"Classificação"},{key:"partidas",label:"Partidas"}].map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${mainTab===t.key?"bg-violet-600 border-violet-600 text-white shadow-sm":"bg-white border-gray-200 text-gray-600 hover:border-violet-200"}`}>
            {t.label}
            {t.key==="partidas" && matches?.length > 0 && (
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${mainTab===t.key?"bg-violet-500 text-white":"bg-gray-100 text-gray-500"}`}>
                {matches.reduce((s,w)=>s+w.games.length,0)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CLASSIFICAÇÃO ── */}
      {mainTab === "classificacao" && (
        <>
          <SubTabs
            value={split}
            onChange={setSplit}
            options={[{key:"total",label:"Total"},{key:"home",label:"Casa"},{key:"away",label:"Fora"}]}
          />
          {loading
            ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400"/></div>
            : <StandingsTable rows={standings?.[split] ?? []}/>
          }
        </>
      )}

      {/* ── PARTIDAS ── */}
      {mainTab === "partidas" && (
        <>
          {!matches?.length
            ? <p className="text-sm text-center text-gray-400 py-8">Nenhuma partida registrada.</p>
            : matches.map(({ week, games }) => (
              <div key={week} className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
                <button onClick={() => toggleWeek(week)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {week > 0 ? `Rodada ${week}` : "Sem rodada"}
                  </span>
                  <span className="text-xs text-gray-400">{games.length} jogos</span>
                </button>
                {openWeeks[week] && (
                  <div className="divide-y divide-gray-50">
                    {games.map(m => <MatchCard key={m.id} m={m}/>)}
                  </div>
                )}
              </div>
            ))
          }
        </>
      )}
    </div>
  );
}
