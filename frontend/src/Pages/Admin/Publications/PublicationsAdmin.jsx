import { useEffect, useRef, useState } from "react";
import { api } from "../../../services/api";
import { DragDropContext } from "@hello-pangea/dnd";
import { Loader2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import LayoutNode from "./LayoutNode";
import { normalizeTree, emptyTree, reorderChildren } from "../../../utils/layoutTree";
import { makeDefaultClubTree, makeDefaultFederationTree, makeDefaultLeagueTree } from "../../../utils/clubDefaultLayout";
import EntityModules from "../../../components/publications/EntityModules";
import ClubScopeBar, { ClubSearch } from "./ClubScopeBar";
import { EditorContext, ENTITY_PAGES } from "./EditorContext";

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
  // Em "Clubes": página inicial ou página FINANCEIRA (mesma page_key, zonas próprias)
  const [clubsSection, setClubsSection] = useState("home");
  const [zone, setZone] = useState(ZONES_BY_PAGE.home[0].key);
  const [tree, setTree] = useState(emptyTree());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const loadedSnapshot = useRef("");
  // Página de clube: layout padrão (zone "default") ou próprio de um clube (zone "club:<id>")
  const [exists, setExists] = useState(true);
  const [overrides, setOverrides] = useState([]);
  const [removing, setRemoving] = useState(false);
  const [previewClub, setPreviewClub] = useState(null);
  // Páginas de clube/federação: layout padrão + layout próprio por entidade (zona "club:<id>"/"federation:<id>")
  const editorKey = pageKey === "clubs" && clubsSection === "finance" ? "clubs-finance" : pageKey;
  const entity = ENTITY_PAGES[editorKey] || null;
  const isEntityPage = !!entity;
  const zoneClubId = entity && zone.startsWith(entity.zonePrefix) ? Number(zone.slice(entity.zonePrefix.length)) : null;

  const zones = ZONES_BY_PAGE[pageKey];
  const isDirty = !loading && JSON.stringify(tree) !== loadedSnapshot.current;

  async function refreshOverrides() {
    if (!entity) return;
    try {
      const res = await api.get(entity.layoutsUrl);
      setOverrides(res.data.layouts || []);
    } catch {
      setOverrides([]);
    }
  }

  // Ponto de partida quando ainda não há layout salvo: o padrão salvo (p/ layout próprio) ou o embutido.
  async function entityTemplate() {
    if (zone !== "default") {
      try {
        const def = await api.get(`/admin/publications/${pageKey}/default`);
        if (def.data.exists) return def.data.tree;
      } catch { /* cai no embutido */ }
    }
    // Financeira: sem padrão embutido — enquanto nada for salvo, a página mostra a versão original
    if (editorKey === "clubs-finance") return emptyTree();
    if (pageKey === "federations") return makeDefaultFederationTree();
    if (pageKey === "competitions") return makeDefaultLeagueTree();
    return makeDefaultClubTree();
  }

  async function loadLayout() {
    setLoading(true);
    setSavedAt(null);
    try {
      const res = await api.get(`/admin/publications/${pageKey}/${zone}`);
      const saved = res.data.exists !== false;
      setExists(saved);
      const base = !saved && isEntityPage ? await entityTemplate() : res.data.tree;
      const normalized = normalizeTree(base);
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

  useEffect(() => {
    refreshOverrides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorKey]);

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
    setClubsSection("home");
    setZone(ZONES_BY_PAGE[key][0].key);
  }

  function changeClubsSection(section) {
    if (section === clubsSection) return;
    if (!confirmDiscardIfDirty()) return;
    setClubsSection(section);
    setZone(ENTITY_PAGES[section === "finance" ? "clubs-finance" : "clubs"].defaultZone);
  }

  function changeZone(key) {
    if (key === zone) return;
    if (!confirmDiscardIfDirty()) return;
    setZone(key);
  }

  function selectClubZone(nextZone) {
    if (nextZone === zone) return;
    if (!confirmDiscardIfDirty()) return;
    setZone(nextZone);
  }

  async function removeOverride() {
    if (!zoneClubId || !confirm(`Remover o layout próprio ${entity.article === "o" ? "deste" : "desta"} ${entity.singular}? Volta a usar o padrão.`)) return;
    setRemoving(true);
    try {
      await api.delete(`/admin/publications/${pageKey}/${zone}`);
      await refreshOverrides();
      await loadLayout();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao remover layout");
    } finally {
      setRemoving(false);
    }
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
      setExists(true);
      refreshOverrides();
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

      {pageKey === "clubs" && (
        <div className="flex gap-2 mb-4" role="tablist" aria-label="Página do clube">
          {[{ key: "home", label: "Página inicial" }, { key: "finance", label: "Financeiro" }].map((sec) => (
            <button
              key={sec.key}
              role="tab"
              aria-selected={clubsSection === sec.key}
              onClick={() => changeClubsSection(sec.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${clubsSection === sec.key ? "bg-[#7F33D9] text-white" : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"}`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      )}

      {isEntityPage && (
        <ClubScopeBar
          entity={entity}
          zone={zone}
          exists={exists}
          overrides={overrides}
          removing={removing}
          onSelectZone={selectClubZone}
          onRemoveOverride={removeOverride}
        />
      )}

      {isEntityPage && !exists && !loading && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {zoneClubId
            ? `Est${entity.article === "o" ? "e" : "a"} ${entity.singular} ainda usa o layout padrão. O que aparece abaixo é uma cópia do padrão — ao salvar, passa a ter layout próprio.`
            : editorKey === "clubs-finance"
              ? "Nenhum layout salvo: a página financeira dos clubes está mostrando a versão original (fixa). Monte o layout com gráficos do gerador e salve para substituí-la."
              : `Nenhum layout padrão salvo ainda: ${entity.article === "o" ? "os" : "as"} ${entity.plural} estão mostrando o layout embutido (o mesmo que aparece abaixo). Salve para poder editá-lo.`}
        </div>
      )}

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
        <EditorContext.Provider value={{ pageKey: editorKey }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <LayoutNode node={tree} dispatch={dispatch} isRoot />
          </DragDropContext>
        </EditorContext.Provider>
      )}

      {isEntityPage && !loading && (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-bold text-[#111]">Pré-visualização</h2>
              <p className="text-xs text-gray-500">
                Mostra o layout acima (mesmo sem salvar) com os dados reais {entity.article === "o" ? "do" : "da"} {entity.singular}. Rascunhos não aparecem, como na página publicada.
              </p>
            </div>
            {!zoneClubId && (
              <div className="w-72">
                <ClubSearch scope={entity.scope} placeholder={`Escolher ${entity.singular} para pré-visualizar`} onPick={setPreviewClub} />
              </div>
            )}
          </div>
          {(() => {
            const previewId = zoneClubId || previewClub?.id;
            if (!previewId) {
              return <p className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-2xl p-8 text-center">Escolha {entity.article === "o" ? "um" : "uma"} {entity.singular} para ver como o layout fica.</p>;
            }
            return (
              <div className="bg-[#F6F5FA] rounded-2xl p-4">
                {!zoneClubId && <p className="text-xs font-bold text-gray-500 mb-3 capitalize">{entity.singular}: {previewClub.name}</p>}
                <EntityModules key={`${editorKey}-${previewId}`} kind={entity.kind} entityKey={previewId} tree={tree} />
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
}
