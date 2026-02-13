import { Link } from "react-router-dom";
import { Plus, ChevronRight, Search, Map, X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import NewRegionModal from "./NewRegionModal";
import { api } from "../../../services/api";

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // BUSCA REGIÕES
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

  // FILTRO CLIENT-SIDE
  const filteredRegions = regions.filter(region => 
    region.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    region.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  //  CRIA REGIÃO
  async function handleCreateRegion(data) {
    try {
      await api.post("/admin/regions", data);
      setOpenModal(false);
      fetchRegions(); 
    } catch (err) {
      console.error("Erro ao criar região", err);
      alert("Erro ao criar região. Verifique se o código já existe.");
    }
  }

  // ESTILOS 
  const btnPrimary = "flex items-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20";

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">Regiões</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie as regiões geográficas do sistema.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Busca */}
            <div className="relative group w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors">
                    <Search size={18} />
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar região..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                        <X size={14} />
                    </button>
                )}
            </div>

            <button onClick={() => setOpenModal(true)} className={btnPrimary}>
                <Plus size={18} /> <span className="whitespace-nowrap">Nova Região</span>
            </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 size={32} className="animate-spin mb-2 text-[#7F33D9]" />
            <p className="text-sm">Carregando regiões...</p>
          </div>
        ) : filteredRegions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center py-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <Map size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Nenhuma região encontrada</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                {searchTerm ? `Sem resultados para "${searchTerm}"` : "Cadastre as regiões para organizar as ligas."}
            </p>
            {!searchTerm && (
                <button onClick={() => setOpenModal(true)} className={`mt-4 ${btnPrimary}`}>
                    Criar Região
                </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  <th className="px-6 py-4 w-auto">Código</th>
                  <th className="px-6 py-4 w-full">Nome</th>
                  <th className="px-6 py-4 w-32">Status</th>
                  <th className="px-6 py-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRegions.map((region) => (
                  <tr 
                    key={region.id} 
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap"> {/* Adicionado whitespace-nowrap aqui */}
                        <span className="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 whitespace-nowrap">
                            {region.code}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                        {region.name}
                    </td>
                    <td className="px-6 py-4">
                      {region.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          Inativa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/regions/${region.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-[#7F33D9] hover:bg-purple-50 transition-all"
                        title="Ver detalhes"
                      >
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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