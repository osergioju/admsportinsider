import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../../services/api";
import { Loader2, ChevronDown, Trophy } from "lucide-react";

/* ── helpers ── */
const fmt  = (v, d = 1) => v != null ? Number(v).toFixed(d) : "—";
const fmtI = v => v != null ? Number(v) : "—";
const fmtPct = v => v != null ? `${Number(v).toFixed(0)}%` : "—";
const fmtDate = d => d ? new Date(d).toLocaleDateString("pt-BR",{timeZone:"UTC",day:"2-digit",month:"2-digit"}) : "—";

/* ── sub-components ── */

function BigNum({ value, label, highlight }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl p-4 border ${highlight ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-100"}`}>
      <span className={`text-2xl font-extrabold leading-none ${highlight ? "text-white" : "text-gray-900"}`}>{value ?? "—"}</span>
      <span className={`text-[10px] font-semibold uppercase tracking-wide mt-1 text-center leading-tight ${highlight ? "text-violet-200" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}

function SubTabs({ value, onChange }) {
  return (
    <div className="flex gap-1 mb-4">
      {["total","home","away"].map((k, i) => (
        <button key={k} onClick={() => onChange(k)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${value===k ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-violet-300"}`}>
          {["Total","Casa","Fora"][i]}
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
            {["#","Clube","P","J","V","E","D","GP","GC","SG","%"].map(h=>(
              <th key={h} className={`py-2.5 px-2 font-semibold ${h==="Clube"?"text-left":""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((t, i) => (
            <tr key={t.id ?? i} className={`border-t border-gray-50 ${t.isMain ? "bg-violet-50 font-bold" : "hover:bg-gray-50/60"}`}>
              <td className={`px-2 py-2.5 text-center font-bold ${t.isMain?"text-violet-600":"text-gray-400"}`}>{t.pos??i+1}</td>
              <td className={`px-2 py-2.5 flex items-center gap-2 ${t.isMain?"text-violet-700":"text-gray-700"}`}>
                {t.crest ? <img src={t.crest} alt="" className="w-4 h-4 object-contain"/> : <div className="w-4 h-4"/>}
                {t.name}
                {t.isMain && <span className="ml-1 text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">você</span>}
              </td>
              <td className={`px-2 py-2.5 text-center font-bold ${t.isMain?"text-violet-700":"text-gray-800"}`}>{t.pts}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.j}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.v}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.e}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.d}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.gp}</td>
              <td className="px-2 py-2.5 text-center text-gray-600">{t.gc}</td>
              <td className={`px-2 py-2.5 text-center font-semibold ${t.sg>0?"text-emerald-600":t.sg<0?"text-red-500":"text-gray-400"}`}>{t.sg>0?`+${t.sg}`:t.sg}</td>
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
  const rc = { V:"bg-emerald-500",E:"bg-gray-400",D:"bg-red-500" };

  return (
    <Link to={`/dashboard/matches/${m.id}`} className="flex items-center gap-3 py-2.5 px-4 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {m.home.crest && <img src={m.home.crest} alt="" className="w-5 h-5 object-contain shrink-0"/>}
        <span className={`text-xs font-semibold truncate ${m.home.id===clubId?"text-violet-700":"text-gray-700"}`}>{m.home.name}</span>
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
        <span className={`text-xs font-semibold truncate ${m.away.id===clubId?"text-violet-700":"text-gray-700"}`}>{m.away.name}</span>
        {m.away.crest && <img src={m.away.crest} alt="" className="w-5 h-5 object-contain shrink-0"/>}
      </div>
      {result && (
        <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white shrink-0 ${rc[result]}`}>{result}</span>
      )}
    </Link>
  );
}

/* ── Main component ── */
export default function CompetitionsClubs() {
  const { id } = useParams();
  const clubId = Number(id);
  const [season, setSeason] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [mainTab, setMainTab] = useState({});     // compId → tab
  const [splitTab, setSplitTab] = useState({});   // compId → split

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
      const mt = {}, st = {};
      res.competitions.forEach(c => { mt[c.id] = "classificacao"; st[c.id] = "total"; });
      setMainTab(mt);
      setSplitTab(st);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const toggle = id => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const setMT  = (id, v) => setMainTab(p => ({ ...p, [id]: v }));
  const setST  = (id, v) => setSplitTab(p => ({ ...p, [id]: v }));

  const MAIN_TABS = [
    { key:"classificacao", label:"Classificação" },
    { key:"esportivo",     label:"Esportivo" },
    { key:"intervalo",     label:"Intervalo" },
    { key:"disciplinar",   label:"Disciplinar" },
    { key:"partidas",      label:"Partidas" },
  ];

  return (
    <div className="w-full space-y-4 pb-10">

      {/* Season selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-500">Temporada</span>
        <div className="flex gap-1 flex-wrap">
          {(data?.availableSeasons ?? [2025,2024,2023,2022,2021]).map(y => (
            <button key={y} onClick={() => setSeason(y)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${season===y?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-600 hover:border-violet-300"}`}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="animate-spin w-5 h-5"/>
          <span className="text-sm">Carregando...</span>
        </div>
      )}

      {!loading && (!data?.competitions?.length) && (
        <div className="py-16 text-center text-gray-400 text-sm">Nenhum dado para a temporada {season}.</div>
      )}

      {!loading && data?.competitions?.map(comp => {
        const isOpen = expanded[comp.id];
        const mt = mainTab[comp.id] ?? "classificacao";
        const st = splitTab[comp.id] ?? "total";
        const sp = comp.esportivo?.[st] ?? {};
        const ht = comp.halfTime?.[st] ?? {};
        const di = comp.discipline?.[st] ?? {};
        const s  = comp.summary ?? {};
        const mp = sp.matches || s.matches || 1;

        return (
          <div key={comp.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">

            {/* Accordion header */}
            <button onClick={() => toggle(comp.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                {comp.logo_url
                  ? <img src={comp.logo_url} alt="" className="w-7 h-7 object-contain"/>
                  : <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center"><Trophy size={14} className="text-gray-400"/></div>
                }
                <span className="text-sm font-bold text-gray-900">{comp.name}</span>
                {s.pos && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">{s.pos}º lugar</span>}
              </div>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen?"rotate-180":""}`}/>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">

                {/* Big numbers summary */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 px-5 py-4 border-b border-gray-100">
                  <BigNum value={s.pos} label="Posição" highlight />
                  <BigNum value={s.pts} label="Pontos" />
                  <BigNum value={s.wins} label="Vitórias" />
                  <BigNum value={s.draws} label="Empates" />
                  <BigNum value={s.losses} label="Derrotas" />
                  <BigNum value={s.gp} label="Gols pró" />
                  <BigNum value={s.gc} label="Gols contra" />
                </div>

                {/* Main tabs */}
                <div className="flex gap-1 px-5 pt-4 pb-1 overflow-x-auto">
                  {MAIN_TABS.map(t => (
                    <button key={t.key} onClick={() => setMT(comp.id, t.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap transition-all ${mt===t.key?"bg-violet-600 border-violet-600 text-white":"bg-white border-gray-200 text-gray-500 hover:border-violet-300"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="px-5 pb-6 pt-3 space-y-4">

                  {/* ── CLASSIFICAÇÃO ── */}
                  {mt === "classificacao" && (
                    <>
                      <SubTabs value={st} onChange={v => setST(comp.id, v)} />
                      <StandingsTable rows={comp.standings?.[st] ?? []} clubId={clubId} />
                      <p className="text-xs text-gray-400 text-right">{comp.standings?.total?.length ?? 0} clubes · exibindo posições ao redor do seu clube</p>
                    </>
                  )}

                  {/* ── ESPORTIVO ── */}
                  {mt === "esportivo" && (
                    <>
                      <SubTabs value={st} onChange={v => setST(comp.id, v)} />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        <BigNum value={fmtI(sp.gp)} label="Gols marcados"/>
                        <BigNum value={fmtI(sp.gc)} label="Gols sofridos"/>
                        <BigNum value={fmtI(sp.shots)} label="Chutes"/>
                        <BigNum value={fmtPct(sp.possession)} label="Posse média"/>
                      </div>
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
                            <th className="text-left px-4 py-2.5 font-semibold">Estatística</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Valor</th>
                          </tr></thead>
                          <tbody>
                            <StatRow label="Chutes" value={fmtI(sp.shots)}/>
                            <StatRow label="Chutes a gol" value={fmtI(sp.shots_ot)}/>
                            <StatRow label="Posse de bola" value={fmtPct(sp.possession)}/>
                            <StatRow label="Clean sheets" value={fmtI(sp.clean_sheets)}/>
                            <StatRow label="Escanteios" value={fmtI(sp.corners)}/>
                            <StatRow label="Gols marcados por jogo" value={fmt(comp.esportivo?.total?.gp/mp,2)}/>
                            <StatRow label="Gols sofridos por jogo" value={fmt(comp.esportivo?.total?.gc/mp,2)}/>
                            <StatRow label="xG médio (pró)" value={fmt(comp.esportivo?.total?.xg_for,2)}/>
                            <StatRow label="xG médio (contra)" value={fmt(comp.esportivo?.total?.xg_against,2)}/>
                            <StatRow label="Ambos marcam %" value={fmtPct(comp.esportivo?.total?.btts_pct)}/>
                            <StatRow label="Acima de 2.5 gols %" value={fmtPct(comp.esportivo?.total?.over25_pct)}/>
                            <StatRow label="Clean sheet %" value={fmtPct(comp.esportivo?.total?.cs_pct)}/>
                            <StatRow label="Pontos por jogo" value={fmt(comp.esportivo?.total?.ppg,2)}/>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* ── INTERVALO ── */}
                  {mt === "intervalo" && (
                    <>
                      <SubTabs value={st} onChange={v => setST(comp.id, v)} />
                      {ht.winning == null
                        ? <p className="text-sm text-gray-400 text-center py-8">Dados de intervalo não disponíveis para esta temporada.</p>
                        : (
                          <>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <BigNum value={fmtI(ht.winning)} label="Vencendo no intervalo"/>
                              <BigNum value={fmtI(ht.drawing)} label="Empatando"/>
                              <BigNum value={fmtI(ht.losing)} label="Perdendo"/>
                            </div>
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead><tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
                                  <th className="text-left px-4 py-2.5 font-semibold">Item</th>
                                  <th className="text-right px-4 py-2.5 font-semibold">Valor</th>
                                </tr></thead>
                                <tbody>
                                  <StatRow label="Vencendo no intervalo" value={fmtI(ht.winning)}/>
                                  <StatRow label="Empatando no intervalo" value={fmtI(ht.drawing)}/>
                                  <StatRow label="Perdendo no intervalo" value={fmtI(ht.losing)}/>
                                  <StatRow label="Gols marcados (1º tempo)" value={fmtI(ht.gs)}/>
                                  <StatRow label="Gols sofridos (1º tempo)" value={fmtI(ht.gc)}/>
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
                      <SubTabs value={st} onChange={v => setST(comp.id, v)} />
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <BigNum value={fmtI(di.yellow)} label="Cartões amarelos"/>
                        <BigNum value={fmtI(di.red)} label="Cartões vermelhos"/>
                        <BigNum value={fmtI(di.fouls)} label="Faltas"/>
                      </div>
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
                            <th className="text-left px-4 py-2.5 font-semibold">Item</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Valor</th>
                          </tr></thead>
                          <tbody>
                            <StatRow label="Faltas cometidas" value={fmtI(di.fouls)}/>
                            <StatRow label="Faltas por jogo" value={fmt(di.fouls/mp)}/>
                            <StatRow label="Cartões amarelos" value={fmtI(di.yellow)}/>
                            <StatRow label="Cartões vermelhos" value={fmtI(di.red)}/>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* ── PARTIDAS ── */}
                  {mt === "partidas" && (
                    <>
                      {!comp.matches?.length
                        ? <p className="text-sm text-gray-400 text-center py-8">Nenhuma partida registrada.</p>
                        : comp.matches.map(({ week, games }) => (
                          <div key={week} className="rounded-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                              {week > 0 ? `Rodada ${week}` : "Sem rodada definida"}
                            </div>
                            <div className="divide-y divide-gray-50">
                              {games.map(m => <MatchRow key={m.id} m={m} clubId={clubId}/>)}
                            </div>
                          </div>
                        ))
                      }
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
