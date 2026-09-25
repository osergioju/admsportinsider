import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { Pencil, Trash2, Plus, LineChart, BarChart3, Gauge, Layers, Loader2, ChartArea, Share2 } from "lucide-react";
import ChartBuilder from "./ChartBuilder";
import EmbedModal from "./EmbedModal";

const CHART_TYPE_ICON = { line: LineChart, bar: BarChart3, stacked_bar: Layers, gauge: Gauge };
const SCOPE_LABELS = { club: "Clube", league: "Liga/Competição", federation: "Federação" };

export default function ChartsAdmin() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingChart, setEditingChart] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [embedChart, setEmbedChart] = useState(null);

  async function loadCharts() {
    setLoading(true);
    try {
      const res = await api.get("/admin/charts");
      setCharts(res.data);
    } catch (error) {
      console.error("Erro ao carregar gráficos", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCharts();
  }, []);

  function handleNew() {
    setEditingChart(null);
    setShowBuilder(true);
  }

  function handleEdit(chart) {
    setEditingChart(chart);
    setShowBuilder(true);
  }

  function handleSaved() {
    setShowBuilder(false);
    setEditingChart(null);
    loadCharts();
  }

  async function handleDelete(id) {
    if (!confirm("Deseja arquivar este gráfico? Ele deixará de aparecer na lista.")) return;
    try {
      await api.delete(`/admin/charts/${id}`);
      loadCharts();
    } catch {
      alert("Erro ao arquivar gráfico");
    }
  }

  const btnPrimary =
    "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20";

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Gerador de Gráficos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Crie gráficos a partir dos indicadores financeiros para usar nas páginas do PRO.
          </p>
        </div>
        {!showBuilder && (
          <button onClick={handleNew} className={btnPrimary}>
            <Plus size={18} /> Novo gráfico
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {showBuilder && (
          <div className="lg:col-span-1 lg:sticky lg:top-8">
            <ChartBuilder
              editingChart={editingChart}
              onSaved={handleSaved}
              onCancel={() => {
                setShowBuilder(false);
                setEditingChart(null);
              }}
            />
          </div>
        )}

        <div className={showBuilder ? "lg:col-span-2" : "lg:col-span-3"}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-2 text-[#7F33D9]" />
              <p className="text-sm">Carregando gráficos...</p>
            </div>
          ) : charts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                <ChartArea size={24} className="text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-bold">Nenhum gráfico criado ainda</h3>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${showBuilder ? "" : "sm:grid-cols-2 xl:grid-cols-3"} gap-4`}>
              {charts.map((chart) => {
                const Icon = CHART_TYPE_ICON[chart.chart_type] || LineChart;
                return (
                  <div
                    key={chart.id}
                    className={`bg-white border rounded-xl p-5 hover:shadow-md transition-all ${
                      editingChart?.id === chart.id ? "border-[#7F33D9] ring-1 ring-[#7F33D9]" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#7F33D9] flex items-center justify-center shrink-0">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{chart.title}</h3>
                          <p className="text-xs text-gray-400">
                            {chart.source_params?.entity_mode === "context" ? "Clube da página" : SCOPE_LABELS[chart.source_params?.scope] || "—"}
                            {chart.source_params?.entity_name ? ` · ${chart.source_params.entity_name}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleEdit(chart)}
                          className="p-2 text-gray-400 hover:text-[#7F33D9] hover:bg-purple-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(chart.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Arquivar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {chart.description && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2">{chart.description}</p>
                    )}
                    {Array.isArray(chart.allowed_plan_ids) && chart.allowed_plan_ids.length > 0 && (
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 inline-block px-2 py-0.5 rounded">
                        Restrito por plano
                      </p>
                    )}
                    {chart.is_embeddable && (
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 bg-green-50 px-2 py-0.5 rounded">
                          Incorporável
                        </span>
                        <button
                          onClick={() => setEmbedChart(chart)}
                          className="flex items-center gap-1 text-xs font-bold text-[#7F33D9] hover:text-[#6025A8]"
                        >
                          <Share2 size={14} /> Incorporar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {embedChart && <EmbedModal chart={embedChart} onClose={() => setEmbedChart(null)} />}
    </div>
  );
}
