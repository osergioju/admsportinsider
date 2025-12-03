import Box from '@mui/material/Box';
import { BarChart } from '@mui/x-charts/BarChart';

export default function GraficoHeatmapAcessos({ data }) {

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Sem dados suficientes
      </div>
    );
  }

  // Preparar labels (horas)
  const xLabels = data.map(item => `${item.hour}h`);
  const values = data.map(item => Number(item.total));

  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <BarChart
        layout="horizontal" // horizontal = estilo heatmap
        series={[
          {
            data: values,
            label: "Acessos",
            id: "accessByHour",
            color: "#2962FF"
          }
        ]}
        yAxis={[{ data: xLabels, scaleType: 'band', label: "Horas" }]}
        xAxis={[{ label: "Quantidade" }]}
        grid={{ vertical: false, horizontal: true }}
        height={300}
      />
    </Box>
  );
}
