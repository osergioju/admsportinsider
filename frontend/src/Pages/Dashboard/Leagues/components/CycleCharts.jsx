import { useState, useContext } from "react";
import ReactECharts from "echarts-for-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AuthContext } from "../../../../context/AuthContext";

const CURRENCIES = ["USD", "BRL", "EUR", "GBP", "JPY"];

function fmt(v) {
  if (v == null) return "—";
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(2)}B`;
  return `${v.toFixed(0)}M`;
}

function CycleChart({ title, editions, field, color, currency }) {
  if (!editions?.length) return null;

  const labels = editions.map(e => String(e.edition_year));
  const values = editions.map(e => {
    const v = parseFloat(e[field]);
    return isNaN(v) ? null : Math.round(v * 10) / 10;
  });

  const nonNull = values.filter(v => v != null);
  const latest  = nonNull.at(-1);
  const prev    = nonNull.at(-2);
  const pct     = (latest != null && prev != null && prev !== 0)
    ? ((latest - prev) / Math.abs(prev)) * 100
    : null;

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const p   = params[0];
        const ed  = editions[p.dataIndex];
        return `<b>${ed?.name || p.name} (${ed?.edition_year})</b><br/>${p.marker} ${fmt(p.value)} ${currency}`;
      }
    },
    grid: { left: 8, right: 8, top: 10, bottom: 24, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 10, color: "#9ca3af" },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (v) => fmt(v), fontSize: 10, color: "#9ca3af" },
      splitLine: { lineStyle: { color: "#f3f4f6" } },
    },
    series: [{
      type: "bar",
      data: values,
      barMaxWidth: 40,
      itemStyle: { color, borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: "top", formatter: (p) => fmt(p.value), fontSize: 9, color: "#6b7280" }
    }]
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-end gap-3 mb-4">
        <p className="text-2xl font-bold text-gray-900">
          {fmt(latest)} <span className="text-sm font-normal text-gray-400">{currency}</span>
        </p>
        {pct != null && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold mb-1 ${pct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {pct >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {Math.abs(pct).toFixed(0)}%
          </span>
        )}
      </div>
      <ReactECharts option={option} style={{ height: 160 }} />
    </div>
  );
}

// ─── Seção completa de 4 gráficos de ciclo ───────────────────────────────────

export default function CycleChartsSection({ editions, loading, onCurrencyChange }) {
  const { user } = useContext(AuthContext);
  const [currency, setCurrency] = useState(user?.currency_code || "USD");

  function handleCurrency(c) {
    setCurrency(c);
    onCurrencyChange?.(c);
  }

  return (
    <div className="space-y-5 mt-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Evolução financeira por ciclo</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Receita · Custos · Lucro = soma dos anos do ciclo &nbsp;·&nbsp; Dívida = último ano do ciclo
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-full p-1 shrink-0">
          {CURRENCIES.map(c => (
            <button key={c} onClick={() => handleCurrency(c)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${currency === c ? "bg-white text-[#7F33D9] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : !editions?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400 text-sm">Sem dados financeiros por ciclo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CycleChart title="Receitas"       editions={editions} field="revenue_converted"    color="#7F33D9" currency={currency} />
          <CycleChart title="Custos"         editions={editions} field="costs_converted"      color="#ef4444" currency={currency} />
          <CycleChart title="Lucro líquido"  editions={editions} field="net_income_converted" color="#10b981" currency={currency} />
          <CycleChart title="Dívida líquida" editions={editions} field="net_debt_converted"   color="#f59e0b" currency={currency} />
        </div>
      )}
    </div>
  );
}
