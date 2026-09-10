import ReactECharts from "echarts-for-react";
import { buildChartOption } from "../../../utils/chartOptionBuilders";

export default function ChartPreview({ chartType, data, targetMax, height = 280 }) {
  if (!data) return null;

  const option = buildChartOption(chartType, data, targetMax);

  return (
    <div style={{ width: "100%", height }}>
      <ReactECharts option={option} style={{ width: "100%", height: "100%" }} notMerge />
    </div>
  );
}
