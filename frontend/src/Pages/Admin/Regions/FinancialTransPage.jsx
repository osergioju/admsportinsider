import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2, CheckCircle2, Globe, FileText, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../services/api";

export default function FinancialTransPage() {
  const { id } = useParams();

  const [region, setRegion] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

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

      setFeedback({ type: 'success', message: 'Traduções salvas com sucesso!' });
      setTimeout(() => setFeedback(null), 3000); // Hide after 3s

    } catch (err) {
      console.error("Erro ao salvar traduções", err);
      setFeedback({ type: 'error', message: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  }

  // --- ESTILOS ---
  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
  const btnPrimary = "flex items-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-gray-400 animate-pulse">
        <Loader2 size={32} className="animate-spin mb-2 text-[#7F33D9]" />
        <p className="text-sm">Carregando dados da região...</p>
      </div>
    );
  }

  if (!region) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Região não encontrada</h2>
        <Link to="/admin/regions" className="mt-4 text-[#7F33D9] hover:underline text-sm font-medium">Voltar para lista</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500 relative">
      
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300 animate-in slide-in-from-right-10 ${feedback.type === 'success' ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'}`}>
            <div className={`p-1 rounded-full ${feedback.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </div>
            <p className="text-sm font-medium">{feedback.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
            <Link
            to={`/admin/regions/${region.id}`}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm"
            >
            <ArrowLeft size={20} />
            </Link>

            <div>
            <h1 className="text-2xl font-bold text-[#111] flex items-center gap-2">
                Traduções Financeiras <span className="text-gray-300">|</span> <span className="text-[#7F33D9]">{region.name}</span>
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                <Globe size={14}/> Traduzindo para o código: <span className="font-mono bg-gray-100 px-1.5 rounded text-xs font-bold text-gray-700">{region.code}</span>
            </p>
            </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={btnPrimary}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>

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
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                            {item.code}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                        <FileText size={14} className="text-gray-300 shrink-0"/>
                        {item.name_pt}
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

      {/* Footer Fixo Mobile (Opcional, bom para UX em telas pequenas) */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-lg z-40 flex justify-end">
         <button onClick={handleSave} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : "Salvar Alterações"}
         </button>
      </div>

    </div>
  );
}