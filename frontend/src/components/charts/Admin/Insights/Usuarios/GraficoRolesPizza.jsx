import Box from '@mui/material/Box';
import { PieChart } from '@mui/x-charts/PieChart';

export default function GraficoRolesPizza({ data }) {

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Sem dados suficientes
      </div>
    );
  }

  const pieData = data.map((item, index) => ({
    id: item.role || `${index}`,
    value: Number(item.total),
    label: item.role
  }));

  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <PieChart
        series={[
          {
            data: pieData,
            innerRadius: 35,
            outerRadius: 120,
            paddingAngle: 2,
            cornerRadius: 3,
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
