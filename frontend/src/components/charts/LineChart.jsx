import { LineChart, lineElementClasses } from '@mui/x-charts/LineChart';
import Box from '@mui/material/Box';


export default function GraficoLinha({ dados, labelsx, series }) {
  // Loop de series, pra criar a váriavel series e popular assim o gráfico { data: dados[0], label: series[0], area: true, showMark: false },
  const superseries = series.map((label, index) => ({
    data: dados[index],
    label,
    area: true,
    showMark: false,
  }));

  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <LineChart
        series={superseries}
        xAxis={[{ scaleType: "point", data: labelsx }]}
        sx={{
          [`& .${lineElementClasses.root}`]: {
            display: "none",
          },
        }}
      />
    </Box>
  );
}
