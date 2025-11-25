import { useEffect, useState } from "react";
import GraficoBarra from "../../charts/BarChart";

export default function GraficoLigaBilheteria() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      setLoading(false);
    }

    carregarDados();
  });

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="border rounded-xl p-6 bg-white">
      <h2 className="text-2xl font-light mb-4">
        Bilheteria
      </h2>

      <GraficoBarra/>
    </div>
  );
}
