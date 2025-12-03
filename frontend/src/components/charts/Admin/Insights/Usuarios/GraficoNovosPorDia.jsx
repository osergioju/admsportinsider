import Box from '@mui/material/Box';
import { BarChart } from '@mui/x-charts/BarChart';

export default function GraficoNovosPorDia({ data }) {

  // Evita erro se não tiver dados
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Sem dados suficientes
      </div>
    );
  }

  // Eixo X = dia
  const xLabels = data.map(item => item.day);

  // Eixo Y = total de novos por dia
  const yValues = data.map(item => Number(item.total));

  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <BarChart
        series={[
          {
            data: yValues,
            label: 'Novos usuários',
            id: 'newUsersId',
            color: '#2962FF'
          }
        ]}
        xAxis={[{ data: xLabels, scaleType: "band", label: "Dias" }]}
        yAxis={[{ width: 50 }]}
        grid={{ horizontal: true }}
        height={300}
      />
    </Box>
  );
}
