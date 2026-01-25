import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../services/api";

export default function FinancialTransPage() {
  const { id } = useParams();

  const [region, setRegion] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Busca região
  async function fetchRegion() {
    const res = await api.get(`/admin/regions/${id}`);
    setRegion(res.data);
  }

  // 🔹 Busca indicadores + traduções
  async function fetchIndicators() {
    const res = await api.get(
      `/admin/regions/${id}/financial-indicators`
    );
    setIndicators(res.data);
    console.log(res.data);
  }

  useEffect(() => {
    async function loadData() {
      try {
        await fetchRegion();
        await fetchIndicators();
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  function handleChange(indicatorId, value) {
    setIndicators((prev) =>
      prev.map((item) =>
        item.id === indicatorId
          ? { ...item, translation: value }
          : item
      )
    );
  }

  // 🔹 Salva traduções
  async function handleSave() {
    try {
     await api.post(`/admin/regions/${id}/financial-indicators`, {
        translations: indicators
          .filter(item => item.translation && item.translation.trim() !== "")
          .map(item => ({
            financial_indicator_id: item.id,
            name: item.translation
          }))
      });

      alert("Traduções salvas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar traduções", err);
      alert("Erro ao salvar traduções");
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-400">Carregando...</div>;
  }

  if (!region) {
    return <div className="p-6 text-red-500">Região não encontrada.</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to={`/admin/regions/${region.id}`}
          className="text-gray-500 hover:text-black"
        >
          <ArrowLeft size={20} />
        </Link>

        <div>
          <h1 className="text-xl font-semibold">
            Indicadores financeiros — {region.name}
          </h1>
          <p className="text-sm text-gray-500">
            Traduções para o código da região:{" "}
            <strong>{region.code}</strong>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr className="text-left">
              <th className="p-3">Código</th>
              <th className="p-3">Nome (PT)</th>
              <th className="p-3">Tradução</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3 font-mono text-xs">{item.code}</td>
                <td className="p-3">{item.name_pt}</td>
                <td className="p-3">
                  <input
                    type="text"
                    value={item.translation || ""}
                    onChange={(e) =>
                      handleChange(item.id, e.target.value)
                    }
                    placeholder={`Tradução (${region.code})`}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {indicators.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            Nenhum indicador encontrado.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-md text-sm"
        >
          <Save size={16} />
          Salvar traduções
        </button>
      </div>
    </div>
  );
}
