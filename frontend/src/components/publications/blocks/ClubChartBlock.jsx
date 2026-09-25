import ReactECharts from "echarts-for-react";
import { useClubModule } from "../ClubModuleContext";
import { buildClubChartOption } from "../../../utils/chartOptionBuilders";
import { hasAnyData, isBlockVisible, renderTokens } from "../../../utils/clubModules";

const HEADING_GRADIENT = { background: "linear-gradient(99deg, #0a0a0a, #444, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

function Heading({ children, colors }) {
  const bar = `linear-gradient(to bottom, ${colors[0]}, ${colors[2]}, ${colors[1]}, transparent)`;
  return (
    <h2 style={HEADING_GRADIENT} className="mb-4 text-3xl font-light lg:text-4xl relative pl-2 lg:pl-6">
      <span className="block top-0 left-0 w-1 h-full absolute rounded-full" style={{ background: bar }} />
      {children}
    </h2>
  );
}

function NoData({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {title && <p className="text-base font-semibold text-gray-500 mb-3">{title}</p>}
      <p className="font-semibold text-[#0A0A0A] text-lg">Ah, não!</p>
      <p className="text-sm text-gray-400 max-w-xs mt-2">
        Esses dados não estão disponíveis no documento publicado pelo clube.
      </p>
    </div>
  );
}

// Módulo "Gráfico" da página de clube. Variantes:
//   basic — título, subtítulo e gráfico
//   split — gráfico de um lado, título + texto do outro (chart_side: left|right)
// Título, subtítulo e texto aceitam variáveis ({{club}}, {{revenue.value}}...) — ver utils/clubModules.js.
export default function ClubChartBlock({ slot }) {
  const ctx = useClubModule();
  const c = slot.content || {};
  const codes = c.indicator_codes || [];

  if (!ctx) return null;
  if (!ctx.moduleData) {
    return <div className="w-full h-full min-h-[280px] bg-gray-50 rounded-2xl animate-pulse" />;
  }

  if (!isBlockVisible(c, ctx.moduleData)) return null;

  const valueFormat = c.value_format;
  const render = (text) => renderTokens(text, { ...ctx, valueFormat });
  const title = render(c.title);
  const subtitle = render(c.subtitle);
  const body = render(c.body);
  const card = "rounded-2xl w-full h-full px-6 py-4 xl:py-8 lg:px-11 bg-white";

  if (!codes.length || !hasAnyData(ctx.moduleData, codes)) {
    return <div className={card}><NoData title={title} /></div>;
  }

  const option = buildClubChartOption({
    chartType: c.chart_type || "line",
    moduleData: ctx.moduleData,
    codes,
    colors: ctx.colors,
    yearFrom: c.year_from ? Number(c.year_from) : null,
    yearTo: c.year_to ? Number(c.year_to) : null,
    valueFormat,
  });

  const chart = (
    <div className="w-full max-w-full h-[250px] lg:h-[300px] overflow-hidden">
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge />
    </div>
  );

  if (c.variant === "split") {
    const chartRight = c.chart_side === "right";
    return (
      <div className={card}>
        <div className="flex flex-wrap w-full items-center">
          <div className={`w-full lg:w-1/2 ${chartRight ? "lg:order-2 lg:pl-10" : ""}`}>{chart}</div>
          <div className={`w-full lg:w-1/2 pt-8 lg:pt-0 ${chartRight ? "lg:order-1 lg:pr-10" : "lg:pl-10"}`}>
            {title && <Heading colors={ctx.colors}>{title}</Heading>}
            {subtitle && <p className="mb-3 text-base text-gray-500">{subtitle}</p>}
            {body && (
              <p style={HEADING_GRADIENT} className="text-lg font-light lg:text-xl xl:text-2xl whitespace-pre-line">
                {body}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={card}>
      {title && <Heading colors={ctx.colors}>{title}</Heading>}
      {subtitle && <p className="mb-4 -mt-2 text-base text-gray-500">{subtitle}</p>}
      {chart}
    </div>
  );
}
