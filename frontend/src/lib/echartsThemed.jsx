// Substitui o `echarts-for-react` em TODO o app (ver alias em vite.config.js): mesma API, mas no modo
// escuro as cores da opção são remapeadas (utils/chartTheme.js). No claro, passa a opção sem mexer.
import { forwardRef, useMemo } from "react";
import ReactECharts from "echarts-for-react/esm/index.js";
import { useTheme } from "../hooks/useTheme";
import { themeChartOption } from "../utils/chartTheme";

const ThemedReactECharts = forwardRef(function ThemedReactECharts({ option, ...rest }, ref) {
  const { isDark } = useTheme();
  const themed = useMemo(() => (isDark && option ? themeChartOption(option) : option), [isDark, option]);
  // key: ao trocar o tema o gráfico é recriado — o setOption do ECharts MESCLA, e sobrariam as cores
  // do tema anterior (ex.: linhas de grade escuras no claro).
  return <ReactECharts key={isDark ? "dark" : "light"} ref={ref} option={themed} {...rest} />;
});

export default ThemedReactECharts;
