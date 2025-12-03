import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts/LineChart';

export default function GraficoCrescimentoUsuarios({ data }) {

  // Caso o backend retorne vazio (evita erro)
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Sem dados suficientes
      </div>
    );
  }

  // Preparar dados para o gráfico
  const xLabels = data.map(item => item.day);
  const yValues = data.map(item => Number(item.total));

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <LineChart
        xAxis={[
          { 
            data: xLabels, 
            scaleType: "band",
            label: "Dias"
          }
        ]}
        series={[
          { 
            data: yValues, 
            label: "Novos usuários", 
            id: "growthDailyId",
            color: "#2962FF"
          }
        ]}
        yAxis={[{ width: 50 }]}
        grid={{ vertical: false, horizontal: true }}
      />
    </Box>
  );
}
