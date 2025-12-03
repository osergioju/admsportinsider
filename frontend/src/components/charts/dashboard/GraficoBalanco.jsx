// Importa gráficos 
import GraficoLinha from '../../charts/LineChart';
import TitleChart from '../../uxui/TitleChart';

export default function GraficoBalanco() {
  // Dados em num
  const uData = [
    [4000, 3000, 2000, 2780, 1890, 2390, 3490],
    [30, 3400, 1000, 1780, 890, 1390, 2490],
    [10, 4000, 3000, 2000, 2780, 1890, 2390]
  ];

  // Label x
  const xLabels = [ 'Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F', 'Page G', ];

  // Séries 
  const series = ['Palmeiras', 'São Paulo', 'Santos'];

  return (
    <div className="border rounded-xl p-6 bg-white">
        <TitleChart title={`Balanço dos clubes – ${series.join(", ")}`} />
        <GraficoLinha dados={uData} labelsx={xLabels} series={series}></GraficoLinha>
    </div>
  )

}