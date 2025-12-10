import { useEffect, useState } from "react";
import GraficoLinha from "../../charts/LineChart";

export default function GraficoReceitaLiga({titulo :  titulo}) {
  const [labels, setLabels] = useState([]);
  const [series, setSeries] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      setLoading(true);

      const resp = await fetch("http://localhost:3000/dashboard/ligas/receita");
      const json = await resp.json();

      setLabels(json.labels);
      setSeries(json.series);
      setData(json.data);

      setLoading(false);
    }

    carregar();
  }, []);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="border rounded-xl p-6 bg-white">
      <h2 className="text-2xl font-light mb-4">{titulo}</h2>

      <GraficoLinha dados={data} labelsx={labels} series={series} />
    </div>
  );
}
