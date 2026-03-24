import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Languages, Activity, Code2, Map, Loader2, ChevronRight } from "lucide-react";
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

  useEffect(() => { fetchRegion(); }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-[#7F33D9]">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!region) {
    return <div className="p-10 text-center text-red-500">Região não encontrada.</div>;
  }

  const actions = [
    {
      to: `/admin/regions/${region.id}/financial-indicators`,
      icon: <Languages size={18} />,
      iconBg: "bg-purple-50 text-[#7F33D9]",
      title: "Indicadores Financeiros",
      description: "Traduzir nomes de métricas",
    },
    {
      to: `/admin/regions/${region.id}/common-terms`,
      icon: <Languages size={18} />,
      iconBg: "bg-blue-50 text-blue-600",
      title: "Termos Comuns",
      description: "Traduzir vocabulário geral",
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">

      {/* Voltar */}
      <Link
        to="/admin/regions"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#7F33D9] transition-colors mb-6 group"
      >
        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:border-[#7F33D9] transition-colors">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        </div>
        Regiões
      </Link>

      {/* Card principal — header + infos em um bloco só */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden mb-4">

        {/* Topo colorido */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{region.name}</h1>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                <Map size={13} /> Configurações da região
              </p>
            </div>
            {region.active ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                Ativa
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                Inativa
              </span>
            )}
          </div>
        </div>

        {/* Campos inline */}
        <div className="px-8 py-5 flex items-center gap-10">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
              <Code2 size={11} /> Código
            </span>
            <span className="font-mono text-sm font-bold bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
              {region.code}
            </span>
          </div>

          <div className="w-px h-8 bg-gray-100" />

          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
              <Activity size={11} /> Status
            </span>
            <span className="text-sm font-medium text-gray-700">
              {region.active ? "Ativa" : "Inativa"}
            </span>
          </div>
        </div>
      </div>

      {/* Cards de ação em grid horizontal */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
        Configurações de Idioma
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#7F33D9]/30 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${action.iconBg} group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-gray-900 text-sm block">{action.title}</span>
              <span className="text-xs text-gray-400 mt-0.5 block">{action.description}</span>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-[#7F33D9] group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
      </div>

    </div>
  );
}