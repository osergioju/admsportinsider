import { useState } from "react";
import { api } from "../../../services/api";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ListChecks,
  Tag,
  Activity,
  Code,
  X,
} from "lucide-react";

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400 pl-10";
const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

function FeedbackMessage({ msg }) {
  if (!msg) return null;
  const isSuccess = msg.type === "success";
  return (
    <div
      className={`mb-6 w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm animate-in fade-in slide-in-from-top-2 ${
        isSuccess
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      <div
        className={`p-1 rounded-full ${
          isSuccess
            ? "bg-green-100 text-green-600"
            : "bg-red-100 text-red-600"
        }`}
      >
        {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      </div>
      <span>{msg.text}</span>
    </div>
  );
}

export default function NovoPlano() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    price: "",
    pagarme_plan_id: "",
    active: true,
  });
  const [benefits, setBenefits] = useState([]);
  const [newBenefit, setNewBenefit] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const addBenefit = () => {
    const trimmed = newBenefit.trim();
    if (!trimmed) return;
    setBenefits((prev) => [...prev, trimmed]);
    setNewBenefit("");
  };

  const removeBenefit = (index) =>
    setBenefits((prev) => prev.filter((_, i) => i !== index));

  async function handleSubmit(e) {
    e?.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      await api.post("/admin/plans", {
        name: form.name,
        price: form.price,
        benefits,
        pagarme_plan_id: form.pagarme_plan_id,
        active: form.active,
      });
      setFeedback({ type: "success", text: "Plano criado com sucesso!" });
      setTimeout(() => navigate("/admin/gestao-planos"), 1500);
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", text: "Erro ao criar o plano. Verifique os campos." });
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/gestao-planos"
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111]">Criar Novo Plano</h1>
            <p className="text-sm text-gray-500 mt-1">
              Defina um novo modelo de assinatura para seus usuários.
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {loading ? "Criando..." : "Criar Plano"}
        </button>
      </div>

      <FeedbackMessage msg={feedback} />

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className={labelClass}>Nome do Plano</label>
              <div className="relative">
                <Tag size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Ex: Plano Pro"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Preço */}
            <div>
              <label className={labelClass}>Preço (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-medium text-sm">R$</span>
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Benefícios */}
          <div>
            <label className={labelClass}>Benefícios</label>
            <div className="space-y-2 mb-3">
              {benefits.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg group"
                >
                  <ListChecks size={14} className="text-[#7F33D9] shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">{b}</span>
                  <button
                    type="button"
                    onClick={() => removeBenefit(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {benefits.length === 0 && (
                <p className="text-xs text-gray-400 italic px-1">Nenhum benefício adicionado.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Acesso a relatórios avançados"
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
              />
              <button
                type="button"
                onClick={addBenefit}
                className="flex items-center gap-1 px-4 py-2 bg-purple-50 text-[#7F33D9] border border-purple-200 rounded-lg text-sm font-bold hover:bg-purple-100 transition-colors"
              >
                <Plus size={15} /> Adicionar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ID Pagar.me */}
            <div>
              <label className={labelClass}>ID do Plano Stripe / Pagar.me</label>
              <div className="relative">
                <Code size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  className={inputClass}
                  type="text"
                  placeholder="plan_xxxxxxxxxxxx"
                  value={form.pagarme_plan_id}
                  onChange={(e) => setForm({ ...form, pagarme_plan_id: e.target.value })}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={labelClass}>Status do Plano</label>
              <div className="relative">
                <Activity size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <select
                  className={inputClass}
                  value={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}
                >
                  <option value="true">Ativo (Visível para usuários)</option>
                  <option value="false">Inativo (Oculto)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <AlertCircle size={14} />
              Certifique-se de que o ID do Pagar.me esteja correto antes de salvar.
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}