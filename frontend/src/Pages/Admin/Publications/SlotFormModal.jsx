import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { X, Loader2, Search, ExternalLink, RefreshCw } from "lucide-react";
import RichTextEditor from "../../../components/uxui/RichTextEditor";
import ClubChartFields, { IndicatorPicker } from "./ClubChartFields";
import { BLOCK_TYPES_BY_PAGE } from "./EditorContext";

const BLOCK_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número (big number)" },
  { value: "ad", label: "Publicidade" },
  { value: "chart", label: "Gráfico" },
  { value: "club_chart", label: "Gráfico do clube" },
  { value: "federation_chart", label: "Gráfico da federação" },
  { value: "league_chart", label: "Gráfico da competição" },
  { value: "external_link", label: "Link externo" },
  { value: "carousel", label: "Carrossel de Publicações" },
];

const CAROUSEL_SOURCES = [
  { value: "nota", label: "Notas" },
  { value: "destaque", label: "Destaques" },
  { value: "financas", label: "Finanças" },
  { value: "externa", label: "Publicação Externa" },
];

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";
const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";
const btnPrimary =
  "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all disabled:opacity-60";

// Editor de conteúdo de UM bloco (folha da árvore de layout). Não fala com a
// API pra salvar — quem persiste é o botão "Salvar" da página inteira em
// PublicationsAdmin.jsx; aqui só devolvemos os campos do bloco pro `onSaved`.
export default function SlotFormModal({ node, pageKey = "home", onSaved, onClose }) {
  const [form, setForm] = useState({
    block_type: node.block_type || "text",
    status: node.status || "draft",
    content: node.content || {},
    chart_id: node.chart_id || null,
    banner_id: node.banner_id || null,
  });
  const [error, setError] = useState("");
  const [charts, setCharts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const allowedTypes = BLOCK_TYPES_BY_PAGE[pageKey] || BLOCK_TYPES_BY_PAGE.default;
  const isEntityChart = ["club_chart", "federation_chart", "league_chart"].includes(form.block_type);
  const needsCatalog = isEntityChart || (form.block_type === "number" && form.content.mode === "indicator");

  useEffect(() => {
    if (form.block_type === "chart" && !charts.length) {
      // Página financeira do clube usa só gráficos "do clube da página"; as demais, só os de entidade fixa
      const wantContext = pageKey === "clubs-finance";
      api.get("/admin/charts").then((res) =>
        setCharts((res.data || []).filter((c) => (c.source_params?.entity_mode === "context") === wantContext))
      );
    }
    if (needsCatalog && !catalog.length) {
      // federação: só indicadores que têm dado por ciclo; clube: catálogo completo
      const catalogUrls = { federations: "/admin/federation-modules/catalog", competitions: "/admin/league-modules/catalog" };
      const url = catalogUrls[pageKey] || "/admin/charts/data-catalog";
      api.get(url).then((res) => setCatalog(res.data.indicators || []));
    }
    if (form.block_type === "ad" && !banners.length) {
      loadBanners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.block_type, needsCatalog]);

  function loadBanners() {
    api.get("/admin/banners").then((res) => setBanners(res.data.banners || []));
  }

  function updateContent(patch) {
    setForm((f) => ({ ...f, content: { ...f.content, ...patch } }));
  }

  async function fetchLinkPreview() {
    if (!form.content.url) return;
    setFetchingPreview(true);
    try {
      const res = await api.post("/admin/publications/link-preview", { url: form.content.url });
      updateContent({
        title: res.data.title || form.content.title,
        image_url: res.data.image_url || form.content.image_url,
        source_label: res.data.source_label || form.content.source_label,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao buscar prévia do link");
    } finally {
      setFetchingPreview(false);
    }
  }

  function handleSave(e) {
    e.preventDefault();
    onSaved(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Editar bloco</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Isso só atualiza o bloco na tela. Não esqueça de clicar em "Salvar" no topo da página pra publicar de verdade.
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <label className={labelClass}>Tipo de bloco</label>
            <div className="grid grid-cols-3 gap-2">
              {BLOCK_TYPES.filter(({ value }) => allowedTypes.includes(value) || value === form.block_type).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, block_type: value, content: {}, chart_id: null, banner_id: null }))}
                  className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                    form.block_type === value
                      ? "border-[#7F33D9] bg-purple-50 text-[#7F33D9]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.block_type === "text" && (
            <>
              <div>
                <label className={labelClass}>Título (opcional)</label>
                <input
                  className={inputClass}
                  value={form.content.title || ""}
                  onChange={(e) => updateContent({ title: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Conteúdo</label>
                <RichTextEditor value={form.content.body_html || ""} onChange={(html) => updateContent({ body_html: html })} />
              </div>
            </>
          )}

          {form.block_type === "number" && (
            <div className="space-y-4">
              {["clubs", "federations", "competitions"].includes(pageKey) && (
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: "static", l: "Valor digitado" }, { v: "indicator", l: { federations: "Indicador da federação", competitions: "Indicador da competição" }[pageKey] || "Indicador do clube" }].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateContent({ mode: v })}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${(form.content.mode || "static") === v ? "border-[#7F33D9] bg-purple-50 text-[#7F33D9]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {form.content.mode === "indicator" ? (
                <>
                  <div>
                    <label className={labelClass}>Indicador (último ano com dado)</label>
                    <IndicatorPicker
                      single
                      catalog={catalog}
                      selected={form.content.indicator_code ? [form.content.indicator_code] : []}
                      onChange={([code]) => updateContent({ indicator_code: code })}
                    />
                    {form.content.indicator_code && (
                      <p className="text-xs text-[#7F33D9] font-bold mt-1">Selecionado: {catalog.find((i) => i.code === form.content.indicator_code)?.name_pt || form.content.indicator_code}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Formato do valor</label>
                    <select className={inputClass} value={form.content.value_format || "currency"} onChange={(e) => updateContent({ value_format: e.target.value })}>
                      <option value="currency">Dinheiro (moeda da página)</option>
                      <option value="number">Número (contagem, ex.: público)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Legenda (opcional)</label>
                    <input
                      className={inputClass}
                      placeholder="Deixe vazio para usar 'Indicador · ano'"
                      value={form.content.caption || ""}
                      onChange={(e) => updateContent({ caption: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Valor</label>
                    <input
                      className={inputClass}
                      placeholder="Ex: R$ 1,2 bi"
                      value={form.content.value || ""}
                      onChange={(e) => updateContent({ value: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Legenda curta</label>
                    <input
                      className={inputClass}
                      placeholder="Ex: Receita 2025"
                      value={form.content.caption || ""}
                      onChange={(e) => updateContent({ caption: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {isEntityChart && (
            <ClubChartFields content={form.content} updateContent={updateContent} catalog={catalog} pageKey={pageKey} />
          )}

          {form.block_type === "ad" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>Publicidade</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={loadBanners} className="text-gray-400 hover:text-[#7F33D9]" title="Atualizar lista">
                    <RefreshCw size={14} />
                  </button>
                  <a
                    href="/admin/banners"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#7F33D9] hover:text-[#6025A8] flex items-center gap-1"
                  >
                    Nova publicidade <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              <select
                className={inputClass}
                value={form.banner_id || ""}
                onChange={(e) => setForm((f) => ({ ...f, banner_id: Number(e.target.value) || null }))}
              >
                <option value="">Selecione...</option>
                {banners.map((b) => (
                  <option key={b.id_banner} value={b.id_banner}>
                    {b.title} ({b.format === "square" ? "quadrada" : "horizontal"})
                  </option>
                ))}
              </select>
              {!banners.length && (
                <p className="text-xs text-gray-400 mt-1">
                  Nenhuma publicidade cadastrada ainda. Clique em "Nova publicidade" ao lado, cadastre lá e depois em
                  "Atualizar lista".
                </p>
              )}
            </div>
          )}

          {form.block_type === "chart" && (
            <div>
              <label className={labelClass}>Gráfico</label>
              <select
                className={inputClass}
                value={form.chart_id || ""}
                onChange={(e) => setForm((f) => ({ ...f, chart_id: Number(e.target.value) || null }))}
              >
                <option value="">Selecione...</option>
                {charts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              {!charts.length && (
                <p className="text-xs text-gray-400 mt-1">
                  {pageKey === "clubs-finance"
                    ? 'Nenhum gráfico "Clube da página" criado ainda. Crie um no Gerador de Gráficos, escolhendo esse escopo.'
                    : "Nenhum gráfico criado ainda. Crie um no Gerador de Gráficos."}
                </p>
              )}
            </div>
          )}

          {form.block_type === "external_link" && (
            <>
              <div>
                <label className={labelClass}>URL</label>
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="https://..."
                    value={form.content.url || ""}
                    onChange={(e) => updateContent({ url: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={fetchLinkPreview}
                    disabled={!form.content.url || fetchingPreview}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1 shrink-0"
                  >
                    {fetchingPreview ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Buscar
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Título</label>
                <input
                  className={inputClass}
                  value={form.content.title || ""}
                  onChange={(e) => updateContent({ title: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Imagem</label>
                <input
                  className={inputClass}
                  value={form.content.image_url || ""}
                  onChange={(e) => updateContent({ image_url: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Fonte (opcional)</label>
                <input
                  className={inputClass}
                  placeholder="Ex: Estadão, Placar..."
                  value={form.content.source_label || ""}
                  onChange={(e) => updateContent({ source_label: e.target.value })}
                />
              </div>
            </>
          )}

          {form.block_type === "carousel" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fonte</label>
                <select
                  className={inputClass}
                  value={form.content.source || "nota"}
                  onChange={(e) => updateContent({ source: e.target.value })}
                >
                  {CAROUSEL_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Quantidade buscada do site</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className={inputClass}
                  value={form.content.limit || 4}
                  onChange={(e) => updateContent({ limit: Number(e.target.value) || 4 })}
                />
              </div>
              <div>
                <label className={labelClass}>Itens visíveis — Desktop</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  className={inputClass}
                  value={form.content.desktop_items || 4}
                  onChange={(e) => updateContent({ desktop_items: Number(e.target.value) || 4 })}
                />
              </div>
              <div>
                <label className={labelClass}>Itens visíveis — Mobile</label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  className={inputClass}
                  value={form.content.mobile_items || 1}
                  onChange={(e) => updateContent({ mobile_items: Number(e.target.value) || 1 })}
                />
              </div>
              <p className="col-span-2 text-xs text-gray-400">
                Puxa automaticamente do WordPress (sportinsider.com.br) — não precisa cadastrar nada manualmente.
                "Quantidade buscada" é quanto conteúdo carrega no total; "itens visíveis" é quantos aparecem na tela
                de uma vez (o resto rola no carrossel).
              </p>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.status === "active"}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? "active" : "draft" }))}
              className="accent-[#7F33D9]"
            />
            Publicado (visível na página)
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" className={`${btnPrimary} w-full`}>
            Aplicar (depois clique em "Salvar" no topo)
          </button>
        </form>
      </div>
    </div>
  );
}
