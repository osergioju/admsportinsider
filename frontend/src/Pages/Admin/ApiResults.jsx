import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { Loader2, Trophy, ArrowLeft, CheckCircle2, XCircle, CalendarClock } from "lucide-react";

// Acha a competição padrão: a Copa do Mundo (exclui Clubes/Feminina), senão a 1ª
function pickDefaultCompetition(comps) {
  const exact = comps.find(c => c.name === "International World Cup");
  if (exact) return exact;
  const wc = comps.find(c => /world cup/i.test(c.name) && !/club|women/i.test(c.name));
  return wc || comps[0] || null;
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function Crest({ src, alt }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return <div className="w-6 h-6 rounded-full bg-gray-100 shrink-0" />;
  return <img src={src} alt={alt} onError={() => setOk(false)} className="w-6 h-6 object-contain shrink-0" />;
}

function MatchRow({ m }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-sm font-medium text-gray-700 truncate text-right">{m.home.name}</span>
        <Crest src={m.home.image} alt={m.home.name} />
      </div>

      <div className="flex flex-col items-center shrink-0 min-w-[78px]">
        {m.finished ? (
          <span className="text-base font-extrabold text-gray-900 tabular-nums">
            {m.home.goals ?? "–"} <span className="text-gray-300">×</span> {m.away.goals ?? "–"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
            <CalendarClock size={12} /> {fmtDateTime(m.date).replace(", ", " · ")}
          </span>
        )}
        {(m.xg.home != null || m.xg.away != null) && (
          <span className="text-[10px] text-gray-400 tabular-nums mt-0.5">
            <span className="font-semibold text-gray-300 mr-0.5">xG</span>
            {m.xg.home?.toFixed(2) ?? "–"} · {m.xg.away?.toFixed(2) ?? "–"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Crest src={m.away.image} alt={m.away.name} />
        <span className="text-sm font-medium text-gray-700 truncate">{m.away.name}</span>
      </div>
    </div>
  );
}

export default function ApiResults() {
  const [loadingComps, setLoadingComps] = useState(true);
  const [comps, setComps] = useState([]);
  const [compId, setCompId] = useState(null);
  const [seasonId, setSeasonId] = useState(null);
  const [error, setError] = useState(null);

  const [loadingMatches, setLoadingMatches] = useState(false);
  const [data, setData] = useState(null); // { total, finished, rounds }

  const selectedComp = comps.find(c => c.id === compId) ?? null;

  // Carrega competições e escolhe Copa do Mundo por padrão
  useEffect(() => {
    (async () => {
      setLoadingComps(true);
      setError(null);
      try {
        const { data } = await api.get("/admin/api-integration/competitions");
        if (!data.ok) { setError(data.message || "Não foi possível carregar as competições."); return; }
        setComps(data.competitions);
        const def = pickDefaultCompetition(data.competitions);
        if (def) { setCompId(def.id); setSeasonId(def.seasons[0]?.id ?? null); }
      } catch (err) {
        setError(err?.response?.data?.message || "Salve um token válido na tela de API primeiro.");
      } finally {
        setLoadingComps(false);
      }
    })();
  }, []);

  // Busca partidas quando a temporada muda
  useEffect(() => {
    if (!seasonId) return;
    (async () => {
      setLoadingMatches(true);
      setData(null);
      try {
        const { data } = await api.get("/admin/api-integration/matches", { params: { season_id: seasonId } });
        if (!data.ok) { setError(data.message); return; }
        setError(null);
        setData(data);
      } catch (err) {
        setError(err?.response?.data?.message || "Erro ao buscar partidas.");
      } finally {
        setLoadingMatches(false);
      }
    })();
  }, [seasonId]);

  function onPickComp(id) {
    const c = comps.find(x => x.id === Number(id));
    setCompId(c?.id ?? null);
    setSeasonId(c?.seasons[0]?.id ?? null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
          <Trophy size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Resultados (teste API)</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resultados puxados ao vivo do FootyStats. Por padrão abre na Copa do Mundo atual.
          </p>
        </div>
        <Link to="/admin/api" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors shrink-0">
          <ArrowLeft size={15} /> Token
        </Link>
      </div>

      {loadingComps ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="animate-spin w-5 h-5" /><span className="text-sm">Carregando competições…</span>
        </div>
      ) : error && !comps.length ? (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 bg-red-50 text-red-700">
          <XCircle size={16} /> {error}
        </div>
      ) : (
        <>
          {/* Seletores */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Competição</label>
              <select value={compId ?? ""} onChange={(e) => onPickComp(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400">
                {comps.map(c => (
                  <option key={c.id} value={c.id}>{c.country} · {c.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:w-48">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Temporada</label>
              <select value={seasonId ?? ""} onChange={(e) => setSeasonId(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400">
                {(selectedComp?.seasons ?? []).map(s => (
                  <option key={s.id} value={s.id}>{s.yearLabel}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumo */}
          {data && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                {data.total} jogos
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <CheckCircle2 size={13} /> {data.finished} com resultado
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                <CalendarClock size={13} /> {data.total - data.finished} agendados
              </span>
            </div>
          )}

          {/* Lista */}
          {loadingMatches ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <Loader2 className="animate-spin w-5 h-5" /><span className="text-sm">Buscando resultados…</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 bg-red-50 text-red-700">
              <XCircle size={16} /> {error}
            </div>
          ) : data?.rounds?.length ? (
            <div className="space-y-4">
              {data.rounds.map((r) => (
                <div key={r.week} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{r.label}</span>
                    <span className="text-xs text-gray-400 ml-2">{r.matches.length} jogos</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {r.matches.map((m) => <MatchRow key={m.id} m={m} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center text-gray-400 py-12">Nenhuma partida para esta temporada.</p>
          )}
        </>
      )}
    </div>
  );
}
