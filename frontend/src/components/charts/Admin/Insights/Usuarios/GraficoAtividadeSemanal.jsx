import Box from '@mui/material/Box';
import { BarChart } from '@mui/x-charts/BarChart';

const diasSemana = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

export default function GraficoAtividadeSemanal({ data }) {

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Sem dados suficientes
      </div>
    );
  }

  // Eixo X com nomes dos dias
  const xLabels = data.map(item => diasSemana[item.weekday]);

  // Eixo Y com totais
  const yValues = data.map(item => Number(item.total));

  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <BarChart
        series={[
          {
            data: yValues,
            label: 'Ativos',
            id: 'weeklyActiveId',
            color: '#AA00FF'
          }
        ]}
        xAxis={[{ data: xLabels, scaleType: "band", label: "Dia da Semana" }]}
        yAxis={[{ width: 50 }]}
        grid={{ horizontal: true }}
        height={300}
      />
    </Box>
  );
}
