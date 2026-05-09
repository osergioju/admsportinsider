import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Coins, Globe, TrendingUp, ChevronRight,
  ArrowLeft, Loader2, X, Calendar, AlertTriangle, Upload, CheckCircle
} from "lucide-react";
import { api } from "../../../services/api";
import SearchableSelect from "../../../components/uxui/SearchableSelect";

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const btnPrimary =
  "flex items-center gap-2 px-5 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary =
  "flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors";
const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

// ---------------------------------------------------------------------------
// Modal genérico de confirmação de exclusão
// ---------------------------------------------------------------------------
function ConfirmDeleteModal({ title, description, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 " onClick={() => !loading && onClose()} />
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl relative z-10 p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{description}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} disabled={loading} className={btnSecondary}>Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 disabled:opacity-70"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tela de taxas de um par (RUB → BRL com histórico por ano)
// ---------------------------------------------------------------------------
function PairRatesView({ currency, pair, onBack }) {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ year: new Date().getFullYear(), rate: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, year }
  const [deleting, setDeleting] = useState(false);

  async function fetchRates() {
    setLoading(true);
    try {
      const res = await api.get(`/currency/currency-rates/${pair.base_currency}/${pair.reference_currency}`);
      setRates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRates(); }, []);

  async function handleSave() {
    if (!formData.year || !formData.rate) return;
    setSaving(true);
    try {
      await api.post("/currency/currency-rates", {
        base_currency: pair.base_currency,
        reference_currency: pair.reference_currency,
        year: formData.year,
        rate: formData.rate,
      });
      setShowForm(false);
      setFormData({ year: new Date().getFullYear(), rate: "" });
      fetchRates();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao salvar taxa");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/currency/currency-rates/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchRates();
    } catch {
      alert("Erro ao deletar taxa");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header do par */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm flex-1">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Par de câmbio</p>
            <p className="font-bold text-gray-900 text-lg">
              {pair.base_currency} → {pair.reference_currency}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Taxa mais recente</p>
            <p className="font-mono font-bold text-[#7F33D9]">{Number(pair.latest_rate).toFixed(6)}</p>
          </div>
        </div>
      </div>

      {/* Card de taxas */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" /> Histórico de Taxas
          </h3>
          <button onClick={() => setShowForm((v) => !v)} className={btnPrimary}>
            <Plus size={16} /> Nova Taxa
          </button>
        </div>

        {/* Formulário inline */}
        {showForm && (
          <div className="px-6 py-4 bg-purple-50/50 border-b border-purple-100">
            <div className="flex gap-3 items-end">
              <div className="w-32">
                <label className={labelClass}>Ano</label>
                <input
                  type="number"
                  min="1900" max="2100"
                  className={inputClass}
                  value={formData.year}
                  onChange={(e) => setFormData((p) => ({ ...p, year: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Taxa ({pair.base_currency}/{pair.reference_currency})</label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Ex: 0.072500"
                  className={inputClass}
                  value={formData.rate}
                  onChange={(e) => setFormData((p) => ({ ...p, rate: e.target.value }))}
                />
              </div>
              <button onClick={handleSave} disabled={saving} className={btnPrimary}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Salvar"}
              </button>
              <button onClick={() => setShowForm(false)} className="p-2.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-[#7F33D9]" />
          </div>
        ) : rates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar size={32} className="text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Nenhuma taxa cadastrada</p>
            <button onClick={() => setShowForm(true)} className={`mt-3 ${btnPrimary}`}>
              <Plus size={14} /> Adicionar taxa
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-3">Período</th>
                <th className="px-6 py-3">Taxa</th>
                <th className="px-6 py-3">Fonte</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rates.map((r) => {
                const d = new Date(r.period);
                const month = d.getUTCMonth() + 1; // 1-based
                const periodLabel = month <= 6
                  ? `${d.getUTCFullYear()} H1`
                  : month <= 12
                  ? `${d.getUTCFullYear()} H2`
                  : `${d.getUTCFullYear()}`;
                return (
                <tr key={r.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-bold text-gray-900">
                    {periodLabel}
                  </td>
                  <td className="px-6 py-3 font-mono text-sm text-[#7F33D9] font-bold">
                    {Number(r.rate).toFixed(6)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {r.source}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget({ id: r.id, year: new Date(r.period).getFullYear() })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Remover taxa?"
          description={`Deseja remover a taxa de ${deleteTarget.year} do par ${pair.base_currency}/${pair.reference_currency}?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tela de pares de uma moeda (RUB → [BRL, USD, EUR])
// ---------------------------------------------------------------------------
function CurrencyPairsView({ currency, onBack }) {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherCurrencies, setOtherCurrencies] = useState([]);
  const [showNewPairForm, setShowNewPairForm] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null);
  const [newPairCode, setNewPairCode] = useState("");
  const [newPairYear, setNewPairYear] = useState(new Date().getFullYear());
  const [newPairRate, setNewPairRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchPairs() {
    setLoading(true);
    try {
      const res = await api.get(`/currency/currencies/${currency.id}/pairs`);
      setPairs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOtherCurrencies() {
    try {
      const res = await api.get(`/currency/currencies/${currency.id}/other-currencies`);
      setOtherCurrencies(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchPairs();
    fetchOtherCurrencies();
  }, []);

  async function handleCreatePair() {
    if (!newPairCode || !newPairYear || !newPairRate) return;
    setSaving(true);
    try {
      await api.post("/currency/currency-rates", {
        base_currency: currency.code,
        reference_currency: newPairCode,
        year: newPairYear,
        rate: newPairRate,
      });
      setShowNewPairForm(false);
      setNewPairCode(""); setNewPairYear(new Date().getFullYear()); setNewPairRate("");
      fetchPairs();
      fetchOtherCurrencies();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao criar par");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePair() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/currency/currency-pairs/${deleteTarget.base}/${deleteTarget.reference}`);
      setDeleteTarget(null);
      fetchPairs();
      fetchOtherCurrencies();
    } catch {
      alert("Erro ao deletar par");
    } finally {
      setDeleting(false);
    }
  }

  // Drilldown para taxas do par
  if (selectedPair) {
    return (
      <PairRatesView
        currency={currency}
        pair={selectedPair}
        onBack={() => setSelectedPair(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#7F33D9] hover:border-[#7F33D9] transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7F33D9] to-[#9D5CE8] flex items-center justify-center text-white font-bold">
            {currency.symbol}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{currency.code}</h2>
            <p className="text-xs text-gray-500">{currency.name} · {currency.country_name}</p>
          </div>
        </div>
      </div>

      {/* Card de pares */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-400" /> Pares de Câmbio
          </h3>
          <button
            onClick={() => setShowNewPairForm((v) => !v)}
            className={btnPrimary}
          >
            <Plus size={16} /> Novo Par
          </button>
        </div>

        {/* Formulário novo par */}
        {showNewPairForm && (
          <div className="px-6 py-5 bg-purple-50/50 border-b border-purple-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Moeda destino</label>
                <SearchableSelect
                  options={otherCurrencies.map((c) => ({
                    value: c.code,
                    label: `${c.code} — ${c.name} (${c.country_name})`,
                    image: c.flag_url,
                  }))}
                  value={newPairCode}
                  onChange={(val) => setNewPairCode(val)}
                  placeholder="Selecione a moeda..."
                />
              </div>
              <div>
                <label className={labelClass}>Ano inicial</label>
                <input
                  type="number" min="1900" max="2100"
                  className={inputClass}
                  value={newPairYear}
                  onChange={(e) => setNewPairYear(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Taxa inicial ({currency.code}/…)</label>
                <input
                  type="number" step="0.000001"
                  placeholder="Ex: 0.0725"
                  className={inputClass}
                  value={newPairRate}
                  onChange={(e) => setNewPairRate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewPairForm(false)} className={btnSecondary}>
                Cancelar
              </button>
              <button
                onClick={handleCreatePair}
                disabled={saving || !newPairCode || !newPairRate}
                className={btnPrimary}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Criar par"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-[#7F33D9]" />
          </div>
        ) : pairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp size={32} className="text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Nenhum par cadastrado ainda</p>
            <button onClick={() => setShowNewPairForm(true)} className={`mt-3 ${btnPrimary}`}>
              <Plus size={14} /> Criar primeiro par
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pairs.map((pair) => (
              <div
                key={pair.reference_currency}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                {pair.to_flag && (
                  <img
                    src={pair.to_flag}
                    alt={pair.reference_currency}
                    className="w-8 h-5 rounded object-cover shadow-sm shrink-0"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {pair.base_currency} → {pair.reference_currency}
                    </span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {pair.total_rates} período{pair.total_rates > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{pair.to_currency_name} · {pair.to_country_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold text-[#7F33D9]">
                    {Number(pair.latest_rate).toFixed(6)}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(pair.latest_period).getFullYear()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPair(pair)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-[#7F33D9] bg-gray-50 hover:bg-purple-50 rounded-lg border border-gray-200 hover:border-[#7F33D9]/30 transition-all"
                >
                  Ver taxas <ChevronRight size={12} />
                </button>
                <button
                  onClick={() => setDeleteTarget({ base: pair.base_currency, reference: pair.reference_currency })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Remover par?"
          description={`Isso vai deletar todas as taxas do par ${deleteTarget.base}/${deleteTarget.reference}. Esta ação não pode ser desfeita.`}
          onConfirm={handleDeletePair}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tela principal — listagem de moedas
// ---------------------------------------------------------------------------
export default function Currencies() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  // Modal nova moeda
  const [showNewModal, setShowNewModal] = useState(false);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [formData, setFormData] = useState({ id_country: "", code: "", name: "", symbol: "" });
  const [saving, setSaving] = useState(false);

  // Modal delete moeda
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Importação xlsx
  const importInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  async function fetchCurrencies() {
    setLoading(true);
    try {
      const res = await api.get("/currency/currencies");
      setCurrencies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailableCountries() {
    try {
      const res = await api.get("/currency/currencies/available/countries");
      setAvailableCountries(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { fetchCurrencies(); }, []);

  async function handleCreate() {
    if (!formData.code || !formData.name || !formData.symbol) return;
    setSaving(true);
    try {
      await api.post("/currency/currencies", formData);
      setShowNewModal(false);
      setFormData({ id_country: "", code: "", name: "", symbol: "" });
      fetchCurrencies();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao cadastrar moeda");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/currency/currencies/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchCurrencies();
    } catch {
      alert("Erro ao desativar moeda");
    } finally {
      setDeleting(false);
    }
  }

  async function handleImportXlsx(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/currency/bulk-import-xlsx", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult({ success: true, message: res.data.message, total: res.data.rates?.total });
      fetchCurrencies();
    } catch (err) {
      setImportResult({ success: false, message: err.response?.data?.error || "Erro ao importar arquivo" });
    } finally {
      setImporting(false);
    }
  }

  const openNewModal = () => {
    fetchAvailableCountries();
    setFormData({ id_country: "", code: "", name: "", symbol: "" });
    setShowNewModal(true);
  };

  // Drilldown para pares
  if (selectedCurrency) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in duration-300">
        <CurrencyPairsView
          currency={selectedCurrency}
          onBack={() => setSelectedCurrency(null)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight flex items-center gap-2">
            <Coins className="text-[#7F33D9]" size={26} /> Gestão de Moedas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre moedas, vincule países e configure taxas de câmbio por ano.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleImportXlsx}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className={btnSecondary}
          >
            {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Importar Câmbio.xlsx
          </button>
          <button onClick={openNewModal} className={btnPrimary}>
            <Plus size={18} /> Nova Moeda
          </button>
        </div>
      </div>

      {/* Resultado da importação */}
      {importResult && (
        <div className={`mb-6 flex items-start gap-3 p-4 rounded-2xl border text-sm ${importResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {importResult.success ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
          <span className="flex-1">{importResult.message}</span>
          <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* Grid de moedas */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#7F33D9]" />
        </div>
      ) : currencies.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center shadow-sm">
          <Coins size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhuma moeda cadastrada</h3>
          <p className="text-sm text-gray-500 mb-6">Comece cadastrando a primeira moeda do sistema.</p>
          <button onClick={openNewModal} className={`${btnPrimary} mx-auto`}>
            <Plus size={16} /> Cadastrar moeda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currencies.map((currency) => (
            <div
              key={currency.id}
              className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-[#7F33D9]/30 transition-all duration-300 flex flex-col gap-4"
            >
              {/* Topo */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7F33D9] to-[#9D5CE8] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {currency.symbol}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{currency.code}</p>
                    <p className="text-xs text-gray-500 leading-tight">{currency.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget({ id: currency.id, name: currency.name, code: currency.code })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* País */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {currency.flag_url ? (
                  <img
                    src={currency.flag_url}
                    alt={currency.country_name}
                    className="w-5 h-3.5 rounded object-cover shadow-sm"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <Globe size={13} />
                )}
                <span>{currency.country_name || "País não vinculado"}</span>
              </div>

              {/* Botão gerenciar câmbio */}
              <button
                onClick={() => setSelectedCurrency(currency)}
                className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-[#7F33D9] hover:text-white hover:border-[#7F33D9] transition-all group-hover:bg-[#7F33D9] group-hover:text-white group-hover:border-[#7F33D9]"
              >
                <TrendingUp size={14} /> Gerenciar Câmbio
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal nova moeda */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => !saving && setShowNewModal(false)}
        >
          <div className="absolute inset-0 bg-black/40 " />
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Coins size={18} className="text-[#7F33D9]" /> Nova Moeda
              </h2>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>País <span className="font-normal text-gray-400 normal-case">(opcional)</span></label>
                <SearchableSelect
                  options={availableCountries.map((c) => ({
                    value: c.id_country,
                    label: c.name,
                    image: c.flag_url,
                  }))}
                  value={formData.id_country}
                  onChange={(val) => setFormData((p) => ({ ...p, id_country: val }))}
                  placeholder="Buscar país..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Código (ex: BRL)</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="BRL"
                    className={inputClass}
                    value={formData.code}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Símbolo (ex: R$)</label>
                  <input
                    type="text"
                    placeholder="R$"
                    className={inputClass}
                    value={formData.symbol}
                    onChange={(e) => setFormData((p) => ({ ...p, symbol: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Nome completo</label>
                <input
                  type="text"
                  placeholder="Real Brasileiro"
                  className={inputClass}
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewModal(false)} className={btnSecondary}>Cancelar</button>
              <button
                onClick={handleCreate}
                disabled={saving || !formData.code || !formData.name || !formData.symbol}
                className={`flex-1 ${btnPrimary} justify-center`}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal delete moeda */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Desativar moeda?"
          description={`Deseja desativar ${deleteTarget.code} — ${deleteTarget.name}? Os pares de câmbio vinculados serão preservados.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}