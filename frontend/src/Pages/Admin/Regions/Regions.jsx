import { Link } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import NewRegionModal from "./NewRegionModal";
import { api } from "../../../services/api";

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // 🔹 BUSCA REGIÕES (GET /admin/regions)
  async function fetchRegions() {
    try {
      const res = await api.get("/admin/regions");
      setRegions(res.data);
    } catch (err) {
      console.error("Erro ao buscar regiões", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRegions();
  }, []);

  // 🔹 CRIA REGIÃO (POST /admin/regions)
  async function handleCreateRegion(data) {
    try {
      await api.post("/admin/regions", data);
      setOpenModal(false);
      fetchRegions();
    } catch (err) {
      console.error("Erro ao criar região", err);
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Regiões</h1>
          <p className="text-sm text-gray-500">
            Gerencie as regiões
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm"
        >
          <Plus size={16} />
          Nova região
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-6 text-center text-gray-400">
            Carregando regiões...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-3">Código</th>
                <th className="p-3">Nome</th>
                <th className="p-3">Ativa</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {regions.map((region) => (
                <tr
                  key={region.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-3">{region.code}</td>
                  <td className="p-3">{region.name}</td>
                  <td className="p-3">
                    {region.active ? "Sim" : "Não"}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/admin/regions/${region.id}`}
                      className="inline-flex items-center text-gray-500 hover:text-black"
                      title="Abrir região"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && regions.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            Nenhuma região cadastrada.
          </div>
        )}
      </div>

      {/* MODAL */}
      <NewRegionModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleCreateRegion}
      />
    </div>
  );
}
