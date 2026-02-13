import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { 
  Plus, 
  Trash2, 
  Pencil, 
  CheckCircle2, 
  XCircle, 
  Search, 
  HelpCircle,
  ArrowRight,
  Save,
  Loader2
} from "lucide-react";

export default function FaqAdmin() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  async function loadFaqs() {
    try {
      const res = await api.get("/admin/faq");
      setFaqs(res.data);
    } catch (error) {
      console.error("Erro ao carregar FAQ", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFaqs();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      question,
      answer,
      sort_order: Number(sortOrder),
      is_active: isActive
    };

    try {
      if (editingId) {
        await api.put(`/admin/faq/${editingId}`, payload);
      } else {
        await api.post("/admin/faq", payload);
      }
      resetForm();
      loadFaqs();
    } catch (error) {
      alert("Erro ao salvar pergunta");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setQuestion("");
    setAnswer("");
    setSortOrder(0);
    setEditingId(null);
    setIsActive(true);
  }

  function handleEdit(faq) {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setSortOrder(faq.sort_order ?? 0);
    setIsActive(faq.is_active);
    
    // Scroll para o topo em mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!confirm("Deseja realmente excluir esta pergunta?")) return;
    try {
      await api.delete(`/admin/faq/${id}`);
      loadFaqs();
    } catch (error) {
      alert("Erro ao excluir");
    }
  }

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- ESTILOS ---
  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";
  const btnPrimary = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70";

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-[#111] tracking-tight">FAQ</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie as perguntas frequentes do app.</p>
        </div>
        
        {/* Busca */}
        <div className="relative group w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7F33D9] transition-colors">
                <Search size={18} />
            </div>
            <input 
                type="text" 
                placeholder="Buscar pergunta..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO (Sticky) */}
        <div className="lg:col-span-1 lg:sticky lg:top-8">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                    {editingId ? <Pencil size={18} className="text-[#7F33D9]"/> : <Plus size={18} className="text-[#7F33D9]"/>}
                    <h2 className="font-bold text-gray-900">{editingId ? "Editar Pergunta" : "Nova Pergunta"}</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className={labelClass}>Pergunta</label>
                        <input 
                            type="text" 
                            className={inputClass} 
                            placeholder="Ex: Como cancelo minha assinatura?" 
                            value={question} 
                            onChange={(e) => setQuestion(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Resposta</label>
                        <textarea 
                            rows={5} 
                            className={inputClass} 
                            placeholder="Digite a resposta detalhada..." 
                            value={answer} 
                            onChange={(e) => setAnswer(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Ordem</label>
                            <input 
                                type="number" 
                                className={inputClass} 
                                value={sortOrder} 
                                onChange={(e) => setSortOrder(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <button 
                                type="button"
                                onClick={() => setIsActive(!isActive)}
                                className={`w-full px-4 py-2.5 rounded-lg text-sm border flex items-center justify-center gap-2 transition-all ${isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                            >
                                {isActive ? <CheckCircle2 size={16}/> : <XCircle size={16}/>}
                                {isActive ? "Ativa" : "Inativa"}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        {editingId && (
                            <button 
                                type="button" 
                                onClick={resetForm} 
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 flex-1"
                            >
                                Cancelar
                            </button>
                        )}
                        <button 
                            type="submit" 
                            disabled={saving}
                            className={`${btnPrimary} flex-1`}
                        >
                            {saving ? <Loader2 size={18} className="animate-spin"/> : <>{editingId ? "Atualizar" : "Adicionar"}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* COLUNA DIREITA: LISTA */}
        <div className="lg:col-span-2 space-y-4">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Loader2 size={32} className="animate-spin mb-2 text-[#7F33D9]" />
                    <p className="text-sm">Carregando FAQ...</p>
                </div>
            ) : filteredFaqs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                        <HelpCircle size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 font-bold">Nenhuma pergunta encontrada</h3>
                    <p className="text-sm text-gray-500 mt-1">Utilize o formulário para adicionar a primeira.</p>
                </div>
            ) : (
                filteredFaqs.map((faq) => (
                    <div 
                        key={faq.id} 
                        className={`group bg-white border rounded-xl p-5 transition-all hover:shadow-md ${editingId === faq.id ? 'border-[#7F33D9] ring-1 ring-[#7F33D9] shadow-md' : 'border-gray-200'}`}
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                        Ordem {faq.sort_order}
                                    </span>
                                    {faq.is_active ? (
                                        <span className="text-green-600 text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide">
                                            <CheckCircle2 size={12}/> Ativo
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide">
                                            <XCircle size={12}/> Inativo
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-base font-bold text-gray-900">{faq.question}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>

                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleEdit(faq)} 
                                    className="p-2 text-gray-400 hover:text-[#7F33D9] hover:bg-purple-50 rounded-lg transition-colors" 
                                    title="Editar"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(faq.id)} 
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                    title="Excluir"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

      </div>
    </div>
  );
}