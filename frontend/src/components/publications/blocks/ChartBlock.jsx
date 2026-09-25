import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { api } from "../../../services/api";
import { buildChartOption } from "../../../utils/chartOptionBuilders";
import ContextChartBlock, { LockedChart } from "./ContextChartBlock";

// Renderização interna (dentro do PRO) — nunca mostra a marca Sport Insider.
// O caminho com marca é exclusivamente o script de embed (chart-embed.js).
export default function ChartBlock({ slot }) {
  // Gráfico "do clube da página" (página financeira do clube): tem componente próprio
  if (slot.source_params?.entity_mode === "context") return <ContextChartBlock slot={slot} />;
  return <FixedChartBlock slot={slot} />;
}

function FixedChartBlock({ slot }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!slot.chart_id) return;
    api.get(`/dashboard/charts/${slot.chart_id}/data`).then((res) => setData(res.data));
  }, [slot.chart_id]);

  if (!slot.chart_id) return null;
  if (!data) {
    return <div className="w-full h-full min-h-[280px] bg-gray-50 rounded-2xl animate-pulse" />;
  }

  // Trava por plano (validada no servidor): mostra o aviso em vez do gráfico
  if (data.locked) return <LockedChart data={data} />;

  const option = buildChartOption(data.chart_type, data, data.target_max);

  return (
    <div className="w-full h-full flex flex-col bg-white border border-gray-100 rounded-2xl p-6">
      <h3 className="text-sm font-bold text-gray-900 mb-2 shrink-0">{data.title}</h3>
      {/* flex-1 + min-height: o gráfico estica pra ocupar toda a altura do card
          (útil quando a coluna ao lado tem mais conteúdo empilhado e fica mais alta),
          mas nunca fica menor que 220px mesmo se o card for baixo. */}
      <div className="flex-1 min-h-[220px]">
        <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />
      </div>
    </div>
  );
}
