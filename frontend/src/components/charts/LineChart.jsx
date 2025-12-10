import { LineChart } from "@mui/x-charts/LineChart";
import Box from "@mui/material/Box";

export default function GraficoLinha({ dados, labelsx, series }) {
  const superseries = series.map((label, index) => ({
    data: dados[index],
    label,
    area: true,
    showMark: false,
    curve: "catmullRom",           // deixa as curvas suaves
    color: index === 0 ? "rgba(0, 123, 255, 0.6)" : "rgba(255, 99, 132, 0.6)", // opaco
  }));

  return (
    <Box sx={{ width: "100%", height: 350 }}>
      <LineChart
        xAxis={[{ scaleType: "point", data: labelsx }]}
        series={superseries}
        sx={{
          "& .MuiAreaElement-root": {
            opacity: 0.3,              // deixa mais suave
          },
          "& .MuiLineElement-root": {
            strokeWidth: 2,
          },
        }}
      />
    </Box>
  );
}
