import { useEffect, useState } from "react";
import GraficoLinha from "../../charts/LineChart";

export default function GraficoReceita({ clube }) {
  const [labels, setLabels] = useState([]);
  const [series, setSeries] = useState([]);
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);

      const url = new URL("http://localhost:3000/dashboard/receita");
      if (clube) url.searchParams.set("clube", clube);

      const response = await fetch(url);
      const json = await response.json();

      setLabels(json.labels);
      setSeries(json.series);
      setDados(json.data);

      setLoading(false);
    }

    carregarDados();
  }, [clube]);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="border rounded-xl p-6 bg-white">
      <h2 className="text-2xl font-light mb-4">
        Receita – {clube || "Todos os clubes"}
      </h2>

      <GraficoLinha dados={dados} labelsx={labels} series={series} />
    </div>
  );
}
