import Box from '@mui/material/Box';
import { PieChart } from '@mui/x-charts/PieChart';

export default function GraficoUsuariosPorPais({ data }) {

  // Se não houver dados, evita erro
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Sem dados suficientes
      </div>
    );
  }

  // Formata os dados para o PieChart
  const pieData = data.map((item, index) => ({
    id: item.country || `C${index}`,
    value: Number(item.total),
    label: item.country || "N/A"
  }));

  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <PieChart
        series={[
          {
            data: pieData,
            innerRadius: 20,
            outerRadius: 120,
            paddingAngle: 2,
            cornerRadius: 4,
            startAngle: 0,
            endAngle: 360,
          },
        ]}
        height={300}
        slotProps={{
          legend: { hidden: false },
        }}
      />
    </Box>
  );
}
