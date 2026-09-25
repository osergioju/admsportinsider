import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { Loader2, RefreshCw, X } from "lucide-react";
import { api } from "../../../services/api";
import { useClubModule } from "../ClubModuleContext";
import { buildContextChartOption } from "../../../utils/chartOptionBuilders";
import PlanUpgradePrompt from "../../../Pages/Dashboard/Clubs/components/blockplan/PlanUpgradePrompt";

const LIMITE_COMPARACAO = 4; // mesmo limite dos gráficos atuais da página financeira

const pill = {
  fontFamily: "inherit", fontSize: 13, padding: "7px 12px", borderRadius: 24,
  border: "1px solid #e8e8e4", background: "#fafaf8", color: "#333", outline: "none",
};
const yearSelect = { ...pill, fontSize: 12, padding: "4px 8px", background: "#fff" };

// Aviso de gráfico bloqueado pelo plano do usuário (a trava é validada no servidor; aqui só a mensagem)
export function LockedChart({ data }) {
  const plans = (data?.required_plans || []).map((p) => p.name);
  const names = plans.length ? plans.join(" ou ") : "superior";
  return (
    <PlanUpgradePrompt
      title={data?.chart?.title || "Gráfico exclusivo"}
      description={`Este gráfico está disponível no plano ${names}. Contrate para desbloquear este e outros gráficos financeiros.`}
      badge={`Disponível no plano ${names}`}
      ctaLabel="Ver planos →"
    />
  );
}

// Gráfico "do clube da página": o clube vem da página (ClubModuleContext), os dados de
// GET /dashboard/clubs/:id/charts/:chartId/data. Comparação, período, moeda e tabela só aparecem
// se o admin ligou no gerador (filters_enabled).
export default function ContextChartBlock({ slot }) {
  const ctx = useClubModule();
  const clubId = ctx?.clubId;
  const filters = slot.filters_enabled || {};

  // O resultado guarda a chave do pedido que o gerou: "atualizando" = a resposta ainda não é a do pedido atual
  // (assim os loaders são derivados, sem setState síncrono em efeito).
  const [result, setResult] = useState({ key: null, data: null, failed: false });
  const [retry, setRetry] = useState(0);
  const [compare, setCompare] = useState([]); // [{id, name}]
  const [range, setRange] = useState({ from: null, until: null });
  const [currency, setCurrency] = useState(null);
  const [currencies, setCurrencies] = useState([]);

  const compareKey = compare.map((c) => c.id).join(",");
  const requestKey = [clubId, slot.chart_id, compareKey, range.from, range.until, currency, retry].join("|");

  useEffect(() => {
    if (!clubId || !slot.chart_id) return;
    let cancelled = false;
    api
      .get(`/dashboard/clubs/${clubId}/charts/${slot.chart_id}/data`, {
        params: {
          ...(compareKey ? { compare: compareKey } : {}),
          ...(range.from ? { from: range.from } : {}),
          ...(range.until ? { until: range.until } : {}),
          ...(currency ? { to: currency } : {}),
        },
      })
      .then((res) => { if (!cancelled) setResult({ key: requestKey, data: res.data, failed: false }); })
      .catch(() => { if (!cancelled) setResult((prev) => ({ key: requestKey, data: prev.data, failed: true })); });
    return () => { cancelled = true; };
  }, [clubId, slot.chart_id, compareKey, range.from, range.until, currency, retry, requestKey]);

  const data = result.data;
  const fetching = result.key !== requestKey;
  const failed = result.failed && !fetching;

  useEffect(() => {
    if (!clubId || !filters.currency) return;
    api.get(`/dashboard/clubs/${clubId}/financials/currencies`).then((res) => setCurrencies(res.data || [])).catch(() => {});
  }, [clubId, filters.currency]);

  const option = useMemo(
    () => (data && !data.locked ? buildContextChartOption({ chartType: data.chart.chart_type, data }) : null),
    [data]
  );

  if (!clubId) return null;
  if (!data && failed) {
    return (
      <div className="rounded-xl bg-white p-8 text-center" role="alert">
        <p className="text-sm text-gray-500">Não foi possível carregar este gráfico.</p>
        <button type="button" onClick={() => setRetry((n) => n + 1)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7F33D9] hover:underline cursor-pointer">
          <RefreshCw size={14} aria-hidden="true" /> Tentar de novo
        </button>
      </div>
    );
  }
  if (!data) return <ChartSkeleton />;
  if (data.locked) return <LockedChart data={data} />;

  const years = data.available_years || [];
  const from = range.from ?? years[0];
  const until = range.until ?? years[years.length - 1];
  const hasData = data.years.length > 0;

  return (
    <div className="relative max-w-full w-full min-w-0 bg-white lg:p-10 p-6 rounded-xl h-full overflow-hidden" aria-busy={fetching}>
      {/* Barra de progresso no topo enquanto atualiza (troca de moeda, período ou clube comparado) */}
      {fetching && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#7F33D9]/70 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
      )}
      <h2 className="text-[#0A0A0A] font-[400] text-xl">{data.chart.title}</h2>
      {data.chart.description && <p className="text-sm text-gray-500 mt-1">{data.chart.description}</p>}
      <span className="text-xs inline-flex items-center gap-2 mt-1 mb-2">
        <span className="opacity-40">em milhões · {data.currency}</span>
        {fetching && (
          <span className="inline-flex items-center gap-1 text-[#7F33D9]">
            <Loader2 size={12} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Atualizando…
          </span>
        )}
      </span>
      <span className="sr-only" role="status" aria-live="polite">{fetching ? "Atualizando gráfico" : ""}</span>
      {failed && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700" role="alert">
          Não foi possível atualizar o gráfico.
          <button type="button" onClick={() => setRetry((n) => n + 1)} className="font-semibold underline underline-offset-2 cursor-pointer">Tentar de novo</button>
        </div>
      )}

      {(filters.compare || filters.currency || (filters.period && years.length > 0)) && (
        <div className="w-full flex items-start flex-wrap gap-3 justify-between mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {filters.compare && (
              <CompareSearch
                selected={[clubId, ...compare.map((c) => c.id)]}
                atLimit={compare.length >= LIMITE_COMPARACAO}
                onAdd={(club) => setCompare((prev) => (prev.length >= LIMITE_COMPARACAO ? prev : [...prev, { id: club.id_club, name: club.name }]))}
              />
            )}
            {filters.currency && (
              <select value={data.currency} onChange={(e) => setCurrency(e.target.value)} style={pill} aria-label="Moeda">
                {currencies.length > 0
                  ? currencies.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)
                  : <><option value="BRL">R$ BRL</option><option value="USD">US$ USD</option><option value="EUR">€ EUR</option></>}
              </select>
            )}
          </div>

          {filters.period && years.length > 0 && (
            <div className="flex items-center flex-wrap gap-2">
              <span style={{ fontSize: 12, color: "#999" }}>De</span>
              <select value={from} onChange={(e) => setRange((r) => ({ ...r, from: Math.min(Number(e.target.value), until) }))} style={yearSelect} aria-label="Ano inicial">
                {years.filter((y) => y <= until).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <span style={{ fontSize: 12, color: "#999" }}>até</span>
              <select value={until} onChange={(e) => setRange((r) => ({ ...r, until: Math.max(Number(e.target.value), from) }))} style={yearSelect} aria-label="Ano final">
                {years.filter((y) => y >= from).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <p className="font-semibold text-[#0A0A0A] text-lg">Ah, não!</p>
          <p className="text-sm text-gray-400 max-w-xs mt-2">Esses dados não estão disponíveis no documento publicado pelo clube.</p>
        </div>
      ) : (
        <div className="relative w-full max-w-full h-[250px] lg:h-[300px] overflow-hidden">
          <div className={`h-full w-full transition-opacity duration-200 ${fetching ? "opacity-40" : ""}`}>
            <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge />
          </div>
          {fetching && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Loader2 size={28} className="animate-spin motion-reduce:animate-none text-[#7F33D9]" aria-hidden="true" />
            </div>
          )}
        </div>
      )}

      {filters.table && hasData && (
        <div className={`transition-opacity duration-200 ${fetching ? "opacity-40" : ""}`}><DataTable data={data} /></div>
      )}

      {compare.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {compare.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCompare((prev) => prev.filter((x) => x.id !== c.id))}
              className="cursor-pointer hover:bg-[#7f34d9] hover:text-white transition-all bg-[#EDE6F6] flex items-center gap-2 px-4 py-1 rounded-lg text-sm text-[#8D6C6C]"
            >
              {c.name}
              <X className="w-4" aria-hidden="true" />
              <span className="sr-only">Remover da comparação</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Busca de clube pra comparar (mesmo endpoint dos gráficos atuais). "Buscando" é derivado: a lista guarda o
// termo que a gerou; enquanto não bate com o que foi digitado, a busca (com espera de 250 ms) está em andamento.
function CompareSearch({ selected, atLimit, onAdd }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ q: "", list: [] });
  const [open, setOpen] = useState(false);
  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .post("/admin/clubs/search", { name: term, country: null }, { signal: controller.signal })
        .then(({ data }) => setResults({ q: term, list: data.clubs || [] }))
        .catch((err) => { if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") setResults({ q: term, list: [] }); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term]);

  const searching = term.length >= 2 && results.q !== term;
  const shown = term.length >= 2 && !searching ? results.list.filter((c) => !selected.includes(c.id_club)) : [];
  const showPanel = open && term.length >= 2;

  return (
    <div className="relative" style={{ minWidth: 190 }}>
      <input
        type="text"
        value={q}
        disabled={atLimit}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={atLimit ? "Limite atingido" : "Comparar clube…"}
        aria-label="Comparar com outro clube"
        aria-busy={searching}
        style={{ ...pill, width: "100%", paddingRight: searching ? 34 : 12, cursor: atLimit ? "not-allowed" : "text", color: atLimit ? "#bbb" : "#333" }}
      />
      {searching && (
        <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin motion-reduce:animate-none text-[#7F33D9]" aria-hidden="true" />
      )}
      {showPanel && (
        <ul className="absolute z-30 mt-1.5 w-full bg-white border border-[#e8e8e4] rounded-xl shadow-lg max-h-48 overflow-y-auto" role="listbox">
          {searching ? (
            <li className="px-3.5 py-2.5 text-[13px] text-gray-400 flex items-center gap-2" role="status">
              <Loader2 size={13} className="animate-spin motion-reduce:animate-none text-[#7F33D9]" aria-hidden="true" /> Buscando clubes…
            </li>
          ) : shown.length === 0 ? (
            <li className="px-3.5 py-2.5 text-[13px] text-gray-400">Nenhum clube encontrado</li>
          ) : (
            shown.map((club) => (
              <li key={club.id_club} role="option" aria-selected="false">
                <button
                  type="button"
                  onClick={() => { onAdd(club); setQ(""); setResults({ q: "", list: [] }); setOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] hover:bg-[#f5f0fc] cursor-pointer"
                >
                  {club.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// Esqueleto do cartão enquanto o gráfico carrega pela primeira vez (mesma forma do cartão final)
function ChartSkeleton() {
  return (
    <div className="relative max-w-full w-full min-w-0 bg-white lg:p-10 p-6 rounded-xl h-full animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="Carregando gráfico">
      <div className="h-6 w-52 rounded bg-gray-100" />
      <div className="h-3 w-24 rounded bg-gray-100 mt-3" />
      <div className="flex gap-2 mt-5">
        <div className="h-9 w-44 rounded-full bg-gray-100" />
        <div className="h-9 w-32 rounded-full bg-gray-100" />
      </div>
      <div className="h-[250px] lg:h-[300px] rounded-lg bg-gray-50 mt-6 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin motion-reduce:animate-none text-[#7F33D9]/60" aria-hidden="true" />
      </div>
    </div>
  );
}

// Tabela de valores em milhões: anos em COLUNAS, uma linha por série (clube, ou clube · indicador) e a
// primeira coluna FIXA ao rolar na horizontal — com muitos anos, o nome nunca some da tela.
function DataTable({ data }) {
  const rows = [];
  data.clubs.forEach((club) => {
    data.indicators.forEach((ind) => {
      const name = data.clubs.length === 1 ? ind.label : data.indicators.length === 1 ? club.name : `${club.name} · ${ind.label}`;
      rows.push({ key: `${club.id}-${ind.code}`, name, color: club.primary_color, values: data.series[club.id]?.[ind.code] || {} });
    });
  });
  const fmt = (v) => (v == null ? "—" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 }));
  const label = data.clubs.length === 1 && data.indicators.length > 1 ? "Indicador" : "Clube";

  // Célula fixa: fundo sólido (senão os números passam por baixo ao rolar) e sombra na borda direita
  const sticky = "sticky left-0 z-10 bg-white shadow-[6px_0_8px_-6px_rgba(0,0,0,0.12)]";

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-gray-100" tabIndex={0} role="region" aria-label="Tabela de valores por ano; role para o lado para ver todos os anos">
      <table className="border-collapse text-sm w-max min-w-full">
        <thead>
          <tr className="text-xs text-gray-400">
            <th scope="col" className={`${sticky} py-2.5 pl-4 pr-4 text-left font-medium min-w-[170px] max-w-[220px]`}>{label}</th>
            {data.years.map((y) => (
              <th key={y} scope="col" className="py-2.5 px-3 text-right font-medium tabular-nums min-w-[68px]">{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-gray-100 hover:bg-gray-50/60">
              <th scope="row" className={`${sticky} py-2.5 pl-4 pr-4 text-left font-medium text-gray-800 min-w-[170px] max-w-[220px]`}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color || "#7F33D9" }} aria-hidden="true" />
                  <span className="truncate" title={r.name}>{r.name}</span>
                </span>
              </th>
              {data.years.map((y) => (
                <td key={y} className="py-2.5 px-3 text-right text-gray-600 tabular-nums">{fmt(r.values[y])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
