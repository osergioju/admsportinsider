import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2, CheckCircle2, Globe, FileText, AlertCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../services/api";

export default function FinancialTransPage() {
  const { id } = useParams();

  const [region, setRegion] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Feedback System
  const [feedback, setFeedback] = useState(null); 

  async function fetchRegion() {
    const res = await api.get(`/admin/regions/${id}`);
    setRegion(res.data);
  }

  async function fetchIndicators() {
    const res = await api.get(`/admin/regions/${id}/financial-indicators`);
    setIndicators(res.data);
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
        item.id === indicatorId ? { ...item, translation: value } : item
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      await api.post(`/admin/regions/${id}/financial-indicators`, {
        translations: indicators
          .filter(item => item.translation && item.translation.trim() !== "")
          .map(item => ({
            financial_indicator_id: item.id,
            name: item.translation
          }))
      });

      setFeedback({ type: 'success', text: 'Traduções salvas com sucesso!' });
      setTimeout(() => setFeedback(null), 3000); 

    } catch (err) {
      console.error("Erro ao salvar traduções", err);
      setFeedback({ type: 'error', text: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  }

  // 🔹 Componente Visual de Mensagem (Padrão Unificado)
  const FeedbackMessage = ({ msg }) => {
    if (!msg) return null;
    const isSuccess = msg.type === 'success';
    return (
        <div className={`mb-6 w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className={`p-1 rounded-full ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {isSuccess ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            </div>
            <span>{msg.text}</span>
        </div>
    );
  };

  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
  const btnPrimary = "flex items-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-[#7F33D9]"><Loader2 className="animate-spin" size={40}/></div>;
  }

  if (!region) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-center">
        <AlertTriangle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Região não encontrada</h2>
        <Link to="/admin/regions" className="mt-4 text-[#7F33D9] hover:underline text-sm font-medium">Voltar para lista</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500 relative">
      
      {/* 🔹 HEADER COM SETA DE VOLTAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
            <Link
                to={`/admin/regions/${region.id}`}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform"/>
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-[#111] flex items-center gap-2">
                    Traduções Financeiras
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <Globe size={14}/> 
                    Região: <span className="font-bold text-gray-700">{region.name}</span> 
                    <span className="text-gray-300">|</span>
                    Código: <span className="font-mono bg-gray-100 px-1.5 rounded text-xs font-bold text-gray-700">{region.code}</span>
                </p>
            </div>
        </div>

        <button onClick={handleSave} disabled={saving} className={btnPrimary}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>

      {/* 🔹 MENSAGEM DE FEEDBACK (Grande e visível) */}
      <FeedbackMessage msg={feedback} />

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 w-32">Código</th>
                <th className="px-6 py-4 w-1/3">Original (PT)</th>
                <th className="px-6 py-4">Tradução Local</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {indicators.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">{item.code}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                        <FileText size={14} className="text-gray-300 shrink-0"/>{item.name_pt}
                    </td>
                    <td className="px-6 py-4">
                        <input
                            type="text"
                            value={item.translation || ""}
                            onChange={(e) => handleChange(item.id, e.target.value)}
                            placeholder={`Digite a tradução para ${item.name_pt}...`}
                            className={inputClass}
                        />
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        {indicators.length === 0 && (
          <div className="p-10 text-center flex flex-col items-center justify-center text-gray-400">
            <FileText size={32} className="mb-3 opacity-50"/>
            <p>Nenhum indicador financeiro encontrado para traduzir.</p>
          </div>
        )}
      </div>
    </div>
  );
}