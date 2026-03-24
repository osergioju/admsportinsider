import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2, CheckCircle2, Globe, Tag, AlertCircle, AlertTriangle, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../services/api";

export default function CommonTermsTransPage() {
  const { id } = useParams();

  const [region, setRegion] = useState(null);
  const [terms, setTerms] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [openCategories, setOpenCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function fetchRegion() {
    const res = await api.get(`/admin/regions/${id}`);
    setRegion(res.data);
  }

  async function fetchTerms() {
    const res = await api.get(`/admin/regions/${id}/common-terms`);
    const data = res.data;
    setTerms(data);

    // Agrupa por categoria (campo `category` ou fallback "Geral")
    const groups = data.reduce((acc, item) => {
      const cat = item.category || "Geral";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    setGrouped(groups);

    // Abre todas as categorias por padrão
    const allOpen = Object.keys(groups).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setOpenCategories(allOpen);
  }

  useEffect(() => {
    async function loadData() {
      try {
        await fetchRegion();
        await fetchTerms();
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  function handleChange(termId, value) {
    setTerms((prev) =>
      prev.map((item) =>
        item.id === termId ? { ...item, translation: value } : item
      )
    );
    // Atualiza também o grouped para refletir o estado
    setGrouped((prev) => {
      const updated = { ...prev };
      for (const cat in updated) {
        updated[cat] = updated[cat].map((item) =>
          item.id === termId ? { ...item, translation: value } : item
        );
      }
      return updated;
    });
  }

  function toggleCategory(cat) {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      await api.post(`/admin/regions/${id}/common-terms`, {
        translations: terms
          .filter((item) => item.translation && item.translation.trim() !== "")
          .map((item) => ({
            common_term_id: item.id,
            name: item.translation,
          })),
      });

      setFeedback({ type: "success", text: "Traduções salvas com sucesso!" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Erro ao salvar traduções", err);
      setFeedback({ type: "error", text: "Erro ao salvar. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  const FeedbackMessage = ({ msg }) => {
    if (!msg) return null;
    const isSuccess = msg.type === "success";
    return (
      <div className={`mb-6 w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${isSuccess ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
        <div className={`p-1 rounded-full ${isSuccess ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
          {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
        </div>
        <span>{msg.text}</span>
      </div>
    );
  };

  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
  const btnPrimary = "flex items-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-[#7F33D9]">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!region) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-center">
        <AlertTriangle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Região não encontrada</h2>
        <Link to="/admin/regions" className="mt-4 text-[#7F33D9] hover:underline text-sm font-medium">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const categoryColors = [
    "bg-purple-50 text-purple-700 border-purple-200",
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "bg-orange-50 text-orange-700 border-orange-200",
    "bg-pink-50 text-pink-700 border-pink-200",
    "bg-cyan-50 text-cyan-700 border-cyan-200",
  ];
  const categoryKeys = Object.keys(grouped);

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link
            to={`/admin/regions/${region.id}`}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111]">Termos Comuns</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <Globe size={14} />
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

      {/* FEEDBACK */}
      <FeedbackMessage msg={feedback} />

      {/* RESUMO */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500">
          <span className="font-bold text-gray-800">{terms.length}</span> termos em{" "}
          <span className="font-bold text-gray-800">{categoryKeys.length}</span> categorias
        </span>
        <span className="text-gray-200">|</span>
        <span className="text-sm text-gray-500">
          <span className="font-bold text-[#7F33D9]">
            {terms.filter((t) => t.translation && t.translation.trim() !== "").length}
          </span>{" "}
          traduzidos
        </span>
      </div>

      {/* CATEGORIAS */}
      <div className="flex flex-col gap-4">
        {categoryKeys.length === 0 && (
          <div className="p-10 text-center flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-200">
            <Tag size={32} className="mb-3 opacity-50" />
            <p>Nenhum termo comum encontrado para traduzir.</p>
          </div>
        )}

        {categoryKeys.map((cat, catIndex) => {
          const colorClass = categoryColors[catIndex % categoryColors.length];
          const isOpen = openCategories[cat];
          const items = grouped[cat];
          const translatedCount = items.filter((t) => t.translation && t.translation.trim() !== "").length;

          return (
            <div key={cat} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Cabeçalho da categoria — clicável para colapsar */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
                    <Tag size={11} />
                    {cat}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {translatedCount}/{items.length} traduzidos
                  </span>
                  {/* Barra de progresso */}
                  <div className="hidden sm:flex w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7F33D9] rounded-full transition-all duration-500"
                      style={{ width: `${items.length > 0 ? (translatedCount / items.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Tabela da categoria */}
              {isOpen && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-3 w-32">Código</th>
                        <th className="px-6 py-3 w-1/3">Original (PT)</th>
                        <th className="px-6 py-3">Tradução Local</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3">
                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                              {item.code}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <Tag size={13} className="text-gray-300 shrink-0" />
                              {item.name_pt}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={item.translation || ""}
                              onChange={(e) => handleChange(item.id, e.target.value)}
                              placeholder={`Tradução para "${item.name_pt}"...`}
                              className={inputClass}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}