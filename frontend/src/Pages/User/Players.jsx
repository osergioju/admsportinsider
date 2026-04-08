import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../services/api";
import { ChevronLeft, ChevronDown, Loader2 } from "lucide-react";

const fmt    = (v, d = 1) => v != null ? Number(v).toFixed(d) : "—";
const fmtI   = v => v != null ? Number(v) : "—";
const fmtPct = v => v != null ? `${Number(v).toFixed(1)}%` : "—";
const fmtDate = d => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

function calcAge(b) {
  if (!b) return null;
  const today = new Date(), bday = new Date(b);
  let age = today.getFullYear() - bday.getFullYear();
  if (today < new Date(today.getFullYear(), bday.getMonth(), bday.getDate())) age--;
  return age;
}

/* ── Sub-components ── */

function BigStat({ value, label, sub }) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-4 gap-0.5">
      <span className="text-2xl font-extrabold text-gray-900 leading-none">{value ?? "—"}</span>
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center leading-tight">{label}</span>
      {sub && <span className="text-[10px] text-gray-300 mt-0.5">{sub}</span>}
    </div>
  );
}

function SplitRow({ label, total, home, away }) {
  const hasData = total != null || home != null || away != null;
  if (!hasData) return null;
  return (
    <tr className="border-t border-gray-50 hover:bg-gray-50/60">
      <td className="px-4 py-2.5 text-xs text-gray-600">{label}</td>
      <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-900">{fmtI(total)}</td>
      <td className="px-4 py-2.5 text-right text-xs text-gray-400">{fmtI(home)}</td>
      <td className="px-4 py-2.5 text-right text-xs text-gray-400">{fmtI(away)}</td>
    </tr>
  );
}

function StatTable({ children, splits }) {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden bg-white">
      <table className="w-full text-xs">
        {splits && (
          <thead>
            <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 font-semibold">Estatística</th>
              <th className="text-right px-4 py-2.5 font-semibold">Total</th>
              <th className="text-right px-4 py-2.5 font-semibold text-[10px]">Casa</th>
              <th className="text-right px-4 py-2.5 font-semibold text-[10px]">Fora</th>
            </tr>
          </thead>
        )}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function SimpleRow({ label, value, link }) {
  return (
    <tr className="border-t border-gray-50 hover:bg-gray-50/60">
      <td className="px-4 py-2.5 text-xs text-gray-600">{label}</td>
      <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-900">
        {link
          ? <Link to={link} className="text-violet-700 hover:underline">{value}</Link>
          : value}
      </td>
    </tr>
  );
}

const TABS = ["Participação","Ofensivo","Chutes","Técnico","Disciplinar"];

export default function Players() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [tab, setTab] = useState("Participação");

  useEffect(() => { loadPlayer(); }, [id]);
  useEffect(() => { if (season !== null) loadPlayer(season); }, [season]);

  async function loadPlayer(s) {
    try {
      setLoading(true);
      const params = s ? `?season=${s}` : "";
      const { data: res } = await api.get(`/dashboard/players/${id}${params}`);
      setData(res);
      if (!season && res.availableSeasons?.length) setSeason(res.availableSeasons[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading && !data) return (
    <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
      <Loader2 className="animate-spin w-5 h-5"/>
      <span className="text-sm">Carregando jogador...</span>
    </div>
  );
  if (!data) return null;

  const { player, seasons, availableSeasons } = data;
  const cur = seasons[0] ?? null;
  const st  = cur?.stats ?? {};
  const age = calcAge(player.birthday);

  return (
    <div className="w-full pb-12 space-y-4">

      {/* Player hero */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors font-medium">
            <ChevronLeft size={16}/>Voltar
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 px-6 py-5">
          {/* Avatar */}
          <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(player.full_name)}&background=f3f4f6&color=6b7280&size=200`}
              alt={player.full_name} className="w-full h-full object-cover object-top"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{player.full_name}</h1>
              {player.flag_url && <img src={player.flag_url} alt="" className="w-7 h-5 object-cover rounded shrink-0 mt-0.5"/>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1.5 text-sm">
              {[
                { l: "Posição",        v: player.position },
                { l: "Nascimento",     v: player.birthday ? `${fmtDate(player.birthday)}${age ? ` (${age} anos)` : ""}` : "—" },
                { l: "Nacionalidade",  v: player.nationality ?? "—" },
              ].map(({ l, v }) => (
                <div key={l} className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">{l}</span>
                  <span className="text-sm text-gray-800 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Club/League/Season bar */}
        {cur && (
          <div className="px-6 pb-4 pt-1 flex flex-wrap items-center gap-3 border-t border-gray-100">
            {cur.club.crest_url && <img src={cur.club.crest_url} alt="" className="w-6 h-6 object-contain"/>}
            <Link to={`/dashboard/clubs/${cur.club.id}`}
              className="text-sm font-bold text-gray-800 hover:text-violet-700 hover:underline transition-colors">
              {cur.club.name}
            </Link>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{cur.league.name}</span>
            <span className="text-gray-300">·</span>

            {/* Season picker */}
            <div className="relative">
              <button onClick={() => setSeasonOpen(v => !v)}
                className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors">
                {season ?? "—"}
                <ChevronDown size={12} className={`text-gray-400 transition-transform ${seasonOpen?"rotate-180":""}`}/>
              </button>
              {seasonOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-24 overflow-hidden">
                  {(availableSeasons ?? []).map(s => (
                    <div key={s} onClick={() => { setSeason(s); setSeasonOpen(false); }}
                      className={`px-4 py-2 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors ${s===season?"text-violet-600 font-semibold":"text-gray-700"}`}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Big number summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <BigStat value={fmtI(st.matches_total)} label="Partidas"/>
        <BigStat value={fmtI(st.minutes_total)} label="Minutos"/>
        <BigStat value={fmtI(st.goals)} label="Gols"/>
        <BigStat value={fmtI(st.assists)} label="Assist."/>
        <BigStat value={fmtI(st.yellow_cards)} label="Amarelos"/>
        <BigStat value={st.rating != null ? fmt(st.rating,1) : "—"} label="Rating"/>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border whitespace-nowrap transition-all ${tab===t?"bg-violet-600 border-violet-600 text-white shadow-sm":"bg-white border-gray-200 text-gray-600 hover:border-violet-200"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-4">

        {/* ── PARTICIPAÇÃO ── */}
        {tab === "Participação" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <BigStat value={fmtI(st.matches_total)} label="Partidas total"/>
              <BigStat value={fmtI(st.matches_started)} label="Como titular"/>
              <BigStat value={fmtI(st.minutes_total)} label="Minutos total"/>
              <BigStat value={st.rating!=null ? fmt(st.rating,2):"—"} label="Rating médio"/>
            </div>
            <StatTable splits>
              <SplitRow label="Partidas" total={st.matches_total}/>
              <SplitRow label="Minutos jogados" total={st.minutes_total}/>
              <SplitRow label="Minutos por jogo"
                total={st.minutes_total && st.matches_total ? fmt(st.minutes_total/st.matches_total) : null}/>
              <SplitRow label="Partidas como titular" total={st.matches_started}/>
            </StatTable>
            <StatTable>
              <SimpleRow label="Clube" value={cur?.club.name ?? "—"} link={cur ? `/dashboard/clubs/${cur.club.id}` : null}/>
              <SimpleRow label="Liga"  value={cur?.league.name ?? "—"}/>
              <SimpleRow label="Camisa" value={cur?.shirt_number ?? "—"}/>
              <SimpleRow label="Valor de mercado"
                value={cur?.market_value ? `€ ${Number(cur.market_value).toLocaleString("pt-BR")}` : "—"}/>
            </StatTable>
          </>
        )}

        {/* ── OFENSIVO ── */}
        {tab === "Ofensivo" && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <BigStat value={fmtI(st.goals)} label="Gols"/>
              <BigStat value={fmtI(st.assists)} label="Assist."/>
              <BigStat value={fmt(st.xg,2)} label="xG total"/>
              <BigStat value={fmtI(st.penalties_scored)} label="Pênaltis"/>
              <BigStat value={fmtI(st.clean_sheets_total)} label="Clean sheets"/>
            </div>
            <StatTable splits>
              <SplitRow label="Gols" total={st.goals} home={st.goals_home} away={st.goals_away}/>
              <SplitRow label="Assistências" total={st.assists} home={st.assists_home} away={st.assists_away}/>
              <SplitRow label="Clean sheets" total={st.clean_sheets_total} home={st.clean_sheets_home} away={st.clean_sheets_away}/>
            </StatTable>
            <StatTable>
              <SimpleRow label="Pênaltis marcados" value={fmtI(st.penalties_scored)}/>
              <SimpleRow label="Pênaltis perdidos" value={fmtI(st.penalties_missed)}/>
              <SimpleRow label="Impedimentos" value={fmtI(st.offsides)}/>
              <SimpleRow label="xG total" value={fmt(st.xg,2)}/>
            </StatTable>
          </>
        )}

        {/* ── CHUTES ── */}
        {tab === "Chutes" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <BigStat value={fmtI(st.shots)} label="Chutes"/>
              <BigStat value={fmtI(st.shots_on_target)} label="A gol"/>
              <BigStat value={fmtPct(st.shot_accuracy_pct)} label="Precisão"/>
            </div>
            <StatTable>
              <SimpleRow label="Chutes totais" value={fmtI(st.shots)}/>
              <SimpleRow label="Chutes por jogo"
                value={st.shots && st.matches_total ? fmt(st.shots/st.matches_total) : "—"}/>
              <SimpleRow label="Chutes a gol" value={fmtI(st.shots_on_target)}/>
              <SimpleRow label="Chutes a gol por jogo"
                value={st.shots_on_target && st.matches_total ? fmt(st.shots_on_target/st.matches_total) : "—"}/>
              <SimpleRow label="Precisão de chute" value={fmtPct(st.shot_accuracy_pct)}/>
            </StatTable>
          </>
        )}

        {/* ── TÉCNICO ── */}
        {tab === "Técnico" && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <BigStat value={fmtI(st.passes)} label="Passes"/>
              <BigStat value={fmtPct(st.pass_completion_rate)} label="Acerto passes"/>
              <BigStat value={fmtI(st.tackles)} label="Desarmes"/>
              <BigStat value={fmtI(st.interceptions)} label="Interceptações"/>
            </div>
            <StatTable>
              <SimpleRow label="Passes certos" value={fmtI(st.passes)}/>
              <SimpleRow label="Taxa de acerto" value={fmtPct(st.pass_completion_rate)}/>
              <SimpleRow label="Passes curtos" value={fmtI(st.short_passes)}/>
              <SimpleRow label="Passes longos" value={fmtI(st.long_passes)}/>
              <SimpleRow label="Passes-chave" value={fmtI(st.key_passes)}/>
              <SimpleRow label="Desarmes" value={fmtI(st.tackles)}/>
              <SimpleRow label="Interceptações" value={fmtI(st.interceptions)}/>
              <SimpleRow label="Cruzamentos" value={fmtI(st.crosses_total)}/>
              <SimpleRow label="Dribles tentados" value={fmtI(st.dribbles_total)}/>
              <SimpleRow label="Dribles bem-sucedidos" value={fmtI(st.dribbles_successful)}/>
              <SimpleRow label="Duelos totais" value={fmtI(st.duels)}/>
              <SimpleRow label="Duelos vencidos %" value={fmtPct(st.duels_won_pct)}/>
              <SimpleRow label="Defesas" value={fmtI(st.saves_total)}/>
              <SimpleRow label="Defesas dentro da área" value={fmtI(st.inside_box_saves)}/>
            </StatTable>
          </>
        )}

        {/* ── DISCIPLINAR ── */}
        {tab === "Disciplinar" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <BigStat value={fmtI(st.yellow_cards)} label="Cartões amarelos"/>
              <BigStat value={fmtI(st.red_cards)} label="Cartões vermelhos"/>
              <BigStat value={fmtI(st.fouls_committed)} label="Faltas cometidas"/>
            </div>
            <StatTable>
              <SimpleRow label="Cartões amarelos" value={fmtI(st.yellow_cards)}/>
              <SimpleRow label="Cartões vermelhos" value={fmtI(st.red_cards)}/>
              <SimpleRow label="Faltas cometidas" value={fmtI(st.fouls_committed)}/>
              <SimpleRow label="Faltas por jogo"
                value={st.fouls_committed && st.matches_total ? fmt(st.fouls_committed/st.matches_total) : "—"}/>
            </StatTable>
          </>
        )}
      </div>
    </div>
  );
}
