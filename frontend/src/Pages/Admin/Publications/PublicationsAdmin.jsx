import { useEffect, useRef, useState } from "react";
import { api } from "../../../services/api";
import { DragDropContext } from "@hello-pangea/dnd";
import { Loader2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import LayoutNode from "./LayoutNode";
import { normalizeTree, emptyTree, reorderChildren } from "../../../utils/layoutTree";

const PAGES = [
  { key: "home", label: "Home" },
  { key: "clubs", label: "Clubes" },
  { key: "competitions", label: "Competições" },
  { key: "federations", label: "Federações" },
];

const ZONES_BY_PAGE = {
  home: [
    { key: "hero", label: "Topo (chamada grande)" },
    { key: "finance", label: "Carrossel de Finanças" },
    { key: "body", label: "Corpo" },
  ],
  clubs: [{ key: "default", label: "Conteúdo" }],
  competitions: [{ key: "default", label: "Conteúdo" }],
  federations: [{ key: "default", label: "Conteúdo" }],
};

export default function PublicationsAdmin() {
  const [pageKey, setPageKey] = useState("home");
  const [zone, setZone] = useState(ZONES_BY_PAGE.home[0].key);
  const [tree, setTree] = useState(emptyTree());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const loadedSnapshot = useRef("");

  const zones = ZONES_BY_PAGE[pageKey];
  const isDirty = !loading && JSON.stringify(tree) !== loadedSnapshot.current;

  async function loadLayout() {
    setLoading(true);
    setSavedAt(null);
    try {
      const res = await api.get(`/admin/publications/${pageKey}/${zone}`);
      const normalized = normalizeTree(res.data.tree);
      setTree(normalized);
      loadedSnapshot.current = JSON.stringify(normalized);
    } catch (error) {
      console.error("Erro ao carregar layout", error);
      setTree(emptyTree());
      loadedSnapshot.current = JSON.stringify(emptyTree());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey, zone]);

  // Evita perder edição sem querer ao fechar/recarregar a aba com "Salvar" pendente.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function confirmDiscardIfDirty() {
    return !isDirty || confirm("Você tem alterações não salvas nesta zona. Trocar agora vai descartá-las. Continuar?");
  }

  function changePage(key) {
    if (key === pageKey) return;
    if (!confirmDiscardIfDirty()) return;
    setPageKey(key);
  }

  function changeZone(key) {
    if (key === zone) return;
    if (!confirmDiscardIfDirty()) return;
    setZone(key);
  }

  function dispatch(fn) {
    setTree((prev) => fn(prev));
  }

  function handleDragEnd(result) {
    if (!result.destination) return;
    if (result.source.droppableId !== result.destination.droppableId) return; // só reorder entre irmãos
    dispatch((prev) => reorderChildren(prev, result.source.droppableId, result.source.index, result.destination.index));
  }

  async function handleSave() {
    setSaving(true);
    setSavedAt(null);
    try {
      await api.put(`/admin/publications/${pageKey}/${zone}`, { tree });
      loadedSnapshot.current = JSON.stringify(tree);
      setSavedAt(Date.now());
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao salvar layout");
    } finally {
      setSaving(false);
    }
  }

  const btnPrimary =
    "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60";

  return (
    <div className="w-full max-w-[98%] mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Publicações</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monte o conteúdo das páginas do PRO em grid — linhas, colunas, e qualquer coluna pode virar uma grid dentro dela.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isDirty && !saving && (
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1 animate-pulse">
              <AlertCircle size={14} /> Alterações não salvas
            </span>
          )}
          {savedAt && !isDirty && (
            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
              <CheckCircle2 size={14} /> Salvo
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`${btnPrimary} ${isDirty ? "ring-2 ring-offset-2 ring-[#7F33D9]" : ""}`}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
        </div>
      </div>

      {/* Tabs de página */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => changePage(p.key)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${pageKey === p.key ? "border-[#7F33D9] text-[#7F33D9]" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Sub-tabs de zona (só Home tem mais de uma) */}
      {zones.length > 1 && (
        <div className="flex gap-2 mb-6">
          {zones.map((z) => (
            <button
              key={z.key}
              onClick={() => changeZone(z.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${zone === z.key ? "bg-purple-50 text-[#7F33D9] border border-[#7F33D9]" : "bg-gray-50 text-gray-500 border border-gray-200"
                }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      )}

      {zone === "finance" && (
        <p className="text-xs text-gray-400 mb-4 -mt-2">
          Dica: o carrossel de Finanças usa blocos do tipo "Link externo" — cada um vira uma chamada do carrossel.
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Loader2 size={32} className="animate-spin mb-2 text-[#7F33D9]" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <LayoutNode node={tree} dispatch={dispatch} isRoot />
        </DragDropContext>
      )}
    </div>
  );
}
