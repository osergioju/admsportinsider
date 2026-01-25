import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../services/api";

export default function RegionDetailPage() {
  const { id } = useParams();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchRegion() {
    try {
      const res = await api.get(`/admin/regions/${id}`);

      setRegion(res.data);
    } catch (err) {
      console.error("Erro ao buscar região", err);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    fetchRegion();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-gray-400">
        Carregando região...
      </div>
    );
  }

  if (!region) {
    return (
      <div className="p-6 text-red-500">
        Região não encontrada.
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/admin/regions"
          className="text-gray-500 hover:text-black"
        >
          <ArrowLeft size={20} />
        </Link>

        <div>
          <h1 className="text-xl font-semibold">{region.name}</h1>
          <p className="text-sm text-gray-500">
            Configurações da região
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Código</span>
            <div className="font-medium">{region.code}</div>
          </div>

          <div>
            <span className="text-gray-500">Ativa</span>
            <div className="font-medium">
              {region.active ? "Sim" : "Não"}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border rounded-lg p-4 gap-2 flex flex-wrap">
        <h2 className="w-full text-sm font-semibold mb-3">Traduções</h2>

        <Link
          to={`/admin/regions/${region.id}/financial-indicators`}
          className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
        >
          <Languages size={16} />
          Traduzir indicadores financeiros
        </Link>

         <Link
          to={`/admin/regions/${region.id}/financial-indicators`}
          className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
        >
          <Languages size={16} />
          Traduzir termos comuns
        </Link>
      </div>
    </div>
  );
}
