import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Languages, Activity, Code2, Map, Loader2 } from "lucide-react";
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
    return <div className="flex h-screen items-center justify-center text-[#7F33D9]"><Loader2 className="animate-spin" size={40}/></div>;
  }

  if (!region) {
    return <div className="p-10 text-center text-red-500">Região não encontrada.</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      
      {/* Header com Seta de Voltar */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/admin/regions"
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-[#111]">{region.name}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
             <Map size={14}/> Configurações da região
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Info Card */}
        <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Informações Gerais</h2>
                    <Map size={20} className="text-gray-300"/>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2"><Code2 size={14}/> Código</span>
                        <div className="font-mono text-xl font-medium text-gray-900 bg-gray-50 px-3 py-1 rounded-lg w-fit border border-gray-100">
                            {region.code}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2"><Activity size={14}/> Status</span>
                        <div>
                            {region.active ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-50 text-green-700 border border-green-200">Ativa</span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-600 border border-gray-200">Inativa</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide ml-1">Configurações de Idioma</h2>
            
            <Link to={`/admin/regions/${region.id}/financial-indicators`} className="group flex flex-col bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-[#7F33D9] mb-3 group-hover:scale-110 transition-transform"><Languages size={20} /></div>
                <span className="font-bold text-gray-900">Indicadores Financeiros</span>
                <span className="text-xs text-gray-500 mt-1">Traduzir nomes de métricas</span>
            </Link>

            <Link to={`/admin/regions/${region.id}/financial-indicators`} className="group flex flex-col bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform"><Languages size={20} /></div>
                <span className="font-bold text-gray-900">Termos Comuns</span>
                <span className="text-xs text-gray-500 mt-1">Traduzir vocabulário geral</span>
            </Link>
        </div>

      </div>
    </div>
  );
}