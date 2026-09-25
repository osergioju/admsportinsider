import { useEffect, useMemo, useState } from "react";
import { api } from "../../../services/api";
import { Search, Loader2, X, LineChart, BarChart3, Gauge, Layers } from "lucide-react";
import ChartPreview from "./ChartPreview";

const SCOPE_LABELS = { club_context: "Clube da página (contextual)", club: "Clube", league: "Liga/Competição", federation: "Federação" };
// Opções do gráfico contextual (o admin liga/desliga cada uma)
const FILTER_OPTIONS = [
  { key: "compare", label: "Comparar com outros clubes", hint: "Campo de busca para adicionar até 4 clubes ao gráfico." },
  { key: "period", label: "Filtro de período", hint: "Seleção de ano inicial e final." },
  { key: "currency", label: "Seletor de moeda", hint: "Converte pela cotação. Desligado: moeda nativa do clube." },
  { key: "table", label: "Tabela abaixo do gráfico", hint: "Valores por ano em tabela." },
];
const CHART_TYPES = [
  { value: "line", label: "Linha", icon: LineChart },
  { value: "bar", label: "Barras verticais", icon: BarChart3 },
  { value: "stacked_bar", label: "Barras empilhadas", icon: Layers },
  { value: "gauge", label: "Velocímetro", icon: Gauge },
];

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";
const btnPrimary =
  "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70";

function emptyForm() {
  return {
    title: "",
    description: "",
    chart_type: "line",
    scope: "club",
    entity: null,
    indicator_codes: [],
    target_max: "",
    is_embeddable: false,
    filters: { compare: false, period: false, currency: false, table: false },
    allowed_plan_ids: [], // vazio = todos os planos
  };
}

export default function ChartBuilder({ editingChart, onSaved, onCancel }) {
  const [form, setForm] = useState(emptyForm());
  const [catalog, setCatalog] = useState([]);
  const [catalogFilter, setCatalogFilter] = useState("");
  const [entityQuery, setEntityQuery] = useState("");
  const [entityResults, setEntityResults] = useState([]);
  const [searchingEntity, setSearchingEntity] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api.get("/admin/plans").then((res) => setPlans((res.data.plans || []).filter((p) => p.active))).catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    api.get("/admin/charts/data-catalog").then((res) => setCatalog(res.data.indicators || []));
  }, []);

  // Carrega o gráfico em edição no formulário.
  useEffect(() => {
    if (!editingChart) {
      setForm(emptyForm());
      setPreviewData(null);
      return;
    }
    const params = editingChart.source_params || {};
    setForm({
      title: editingChart.title,
      description: editingChart.description || "",
      chart_type: editingChart.chart_type,
      scope: params.entity_mode === "context" ? "club_context" : params.scope || "club",
      entity: params.entity_id ? { id: params.entity_id, name: params.entity_name || `#${params.entity_id}` } : null,
      indicator_codes: params.indicator_codes || [],
      target_max: params.target_max || "",
      is_embeddable: editingChart.is_embeddable,
      filters: { compare: false, period: false, currency: false, table: false, ...(editingChart.filters_enabled || {}) },
      allowed_plan_ids: editingChart.allowed_plan_ids || [],
    });
    setEntityQuery(params.entity_name || "");
  }, [editingChart]);

  // Busca de entidade (clube/liga/federação) com debounce simples.
  useEffect(() => {
    if (!entityQuery || (form.entity && entityQuery === form.entity.name)) {
      setEntityResults([]);
      return;
    }
    setSearchingEntity(true);
    const handle = setTimeout(async () => {
      try {
        const res = await api.get("/admin/charts/entities", { params: { scope: form.scope === "club_context" ? "club" : form.scope, q: entityQuery } });
        setEntityResults(res.data.entities || []);
      } catch {
        setEntityResults([]);
      } finally {
        setSearchingEntity(false);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityQuery, form.scope]);

  function selectEntity(entity) {
    setForm((f) => ({ ...f, entity }));
    setEntityQuery(entity.name);
    setEntityResults([]);
  }

  function toggleIndicator(code) {
    setForm((f) => {
      const has = f.indicator_codes.includes(code);
      if (f.chart_type === "gauge") {
        return { ...f, indicator_codes: has ? [] : [code] };
      }
      return {
        ...f,
        indicator_codes: has ? f.indicator_codes.filter((c) => c !== code) : [...f.indicator_codes, code],
      };
    });
  }

  function changeChartType(value) {
    setForm((f) => ({
      ...f,
      chart_type: value,
      indicator_codes: value === "gauge" ? f.indicator_codes.slice(0, 1) : f.indicator_codes,
    }));
  }

  const isContext = form.scope === "club_context";

  // O que é SALVO: no contextual não há entidade fixa (o clube vem da página onde o gráfico aparece).
  const savedParams = useMemo(() => {
    if (!form.indicator_codes.length) return null;
    if (isContext) {
      return {
        scope: "club",
        entity_mode: "context",
        indicator_codes: form.indicator_codes,
      };
    }
    if (!form.entity) return null;
    return {
      scope: form.scope,
      entity_id: form.entity.id,
      entity_name: form.entity.name,
      indicator_codes: form.indicator_codes,
      ...(form.chart_type === "gauge" && form.target_max ? { target_max: Number(form.target_max) } : {}),
    };
  }, [isContext, form.scope, form.entity, form.indicator_codes, form.chart_type, form.target_max]);

  // O que vai pro PREVIEW: no contextual usa o clube escolhido só pra pré-visualizar
  const sourceParams = useMemo(() => {
    if (!savedParams) return null;
    if (!isContext) return savedParams;
    return form.entity ? { scope: "club", entity_id: form.entity.id, entity_name: form.entity.name, indicator_codes: form.indicator_codes } : null;
  }, [savedParams, isContext, form.entity, form.indicator_codes]);

  function toggleFilter(key) {
    setForm((f) => ({ ...f, filters: { ...f.filters, [key]: !f.filters[key] } }));
  }

  function togglePlan(id) {
    setForm((f) => ({
      ...f,
      allowed_plan_ids: f.allowed_plan_ids.includes(id) ? f.allowed_plan_ids.filter((p) => p !== id) : [...f.allowed_plan_ids, id],
    }));
  }

  async function handlePreview() {
    if (!sourceParams) return;
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const res = await api.post("/admin/charts/preview", { source_params: sourceParams });
      setPreviewData(res.data);
    } catch (err) {
      setPreviewError(err.response?.data?.message || "Erro ao gerar preview");
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!savedParams) return;
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      chart_type: form.chart_type,
      source_params: savedParams,
      filters_enabled: isContext ? form.filters : {},
      allowed_plan_ids: form.allowed_plan_ids,
      is_embeddable: form.is_embeddable,
    };
    try {
      if (editingChart) {
        await api.put(`/admin/charts/${editingChart.id}`, payload);
      } else {
        await api.post("/admin/charts", payload);
      }
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao salvar gráfico");
    } finally {
      setSaving(false);
    }
  }

  const filteredCatalog = catalog.filter(
    (i) =>
      !catalogFilter ||
      i.name_pt.toLowerCase().includes(catalogFilter.toLowerCase()) ||
      i.code.toLowerCase().includes(catalogFilter.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h2 className="font-bold text-gray-900">{editingChart ? "Editar gráfico" : "Novo gráfico"}</h2>
        {editingChart && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-5">
        <div>
          <label className={labelClass}>Título</label>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Receita x Folha salarial"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Descrição (opcional)</label>
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Breve descrição do gráfico"
          />
        </div>

        <div>
          <label className={labelClass}>Tipo de gráfico</label>
          <div className="grid grid-cols-2 gap-2">
            {CHART_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => changeChartType(value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs font-medium transition-all ${
                  form.chart_type === value
                    ? "border-[#7F33D9] bg-purple-50 text-[#7F33D9]"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Escopo</label>
            <select
              className={inputClass}
              value={form.scope}
              onChange={(e) => {
                setEntityQuery("");
                setForm((f) => ({ ...f, scope: e.target.value, entity: null }));
              }}
            >
              {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label className={labelClass}>
              {isContext ? "Clube p/ pré-visualizar" : SCOPE_LABELS[form.scope]}
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={`${inputClass} pl-9`}
                value={entityQuery}
                onChange={(e) => {
                  setEntityQuery(e.target.value);
                  setForm((f) => ({ ...f, entity: null }));
                }}
                placeholder="Buscar por nome..."
              />
              {searchingEntity && (
                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
              )}
            </div>
            {entityResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {entityResults.map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => selectEntity(entity)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 hover:text-[#7F33D9]"
                  >
                    {entity.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isContext && (
          <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-4 space-y-3">
            <p className="text-xs text-gray-600">
              <b>Gráfico do clube da página:</b> não fica preso a um clube. Ao colocá-lo na página financeira, ele mostra
              os dados do clube de quem está vendo. O clube ao lado serve só para pré-visualizar.
            </p>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Recursos do gráfico</p>
            {FILTER_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={!!form.filters[opt.key]} onChange={() => toggleFilter(opt.key)} className="mt-0.5 accent-[#7F33D9]" />
                <span>
                  {opt.label}
                  <span className="block text-xs text-gray-400">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        <div>
          <label className={labelClass}>
            {form.chart_type === "gauge" ? "Indicador (um só, pro velocímetro)" : "Indicadores"}
          </label>
          <input
            className={`${inputClass} mb-2`}
            placeholder="Filtrar indicadores..."
            value={catalogFilter}
            onChange={(e) => setCatalogFilter(e.target.value)}
          />
          <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-50">
            {filteredCatalog.map((ind) => (
              <label
                key={ind.id}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                style={{ paddingLeft: `${12 + (ind.level - 1) * 16}px` }}
              >
                <input
                  type={form.chart_type === "gauge" ? "radio" : "checkbox"}
                  checked={form.indicator_codes.includes(ind.code)}
                  onChange={() => toggleIndicator(ind.code)}
                  className="accent-[#7F33D9]"
                />
                <span className={ind.level === 1 ? "font-semibold text-gray-800" : "text-gray-600"}>
                  {ind.name_pt}
                </span>
              </label>
            ))}
          </div>
        </div>

        {form.chart_type === "gauge" && (
          <div>
            <label className={labelClass}>Valor máximo do mostrador (opcional)</label>
            <input
              type="number"
              className={inputClass}
              value={form.target_max}
              onChange={(e) => setForm((f) => ({ ...f, target_max: e.target.value }))}
              placeholder="Deixe em branco pra calcular automaticamente"
            />
          </div>
        )}

        <div className="rounded-xl border border-gray-200 p-4 space-y-2">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Quem pode ver este gráfico</p>
          <p className="text-xs text-gray-400">
            Marque os planos com acesso. Sem nenhum marcado, <b>todos</b> os planos veem. Quem não tem acesso vê um aviso
            para contratar o plano.
          </p>
          {plans.length === 0 ? (
            <p className="text-xs text-gray-400">Carregando planos...</p>
          ) : (
            plans.map((plan) => (
              <label key={plan.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.allowed_plan_ids.includes(plan.id)} onChange={() => togglePlan(plan.id)} className="accent-[#7F33D9]" />
                {plan.name}
                <span className="text-xs text-gray-400">{Number(plan.price) === 0 ? "gratuito" : "pago"}</span>
              </label>
            ))
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.is_embeddable}
            onChange={(e) => setForm((f) => ({ ...f, is_embeddable: e.target.checked }))}
            className="accent-[#7F33D9]"
          />
          Permitir incorporação (embed) deste gráfico
        </label>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!sourceParams || previewLoading}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-bold hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {previewLoading ? <Loader2 size={16} className="animate-spin" /> : "Pré-visualizar"}
          </button>
          <button type="submit" disabled={!savedParams || saving} className={`${btnPrimary} flex-1`}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : editingChart ? "Atualizar" : "Criar gráfico"}
          </button>
        </div>

        {previewError && <p className="text-sm text-red-600">{previewError}</p>}
      </form>

      {previewData && (
        <div className="border-t border-gray-100 p-6">
          <span className={labelClass}>Preview</span>
          <ChartPreview chartType={form.chart_type} data={previewData} targetMax={Number(form.target_max) || null} />
        </div>
      )}
    </div>
  );
}
