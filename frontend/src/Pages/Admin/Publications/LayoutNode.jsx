import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import {
  GripVertical, Plus, Trash2, Pencil, LayoutGrid,
  Type, Hash, Image as ImageIcon, ChartArea, Link as LinkIcon, CheckCircle2, XCircle, GalleryHorizontal,
} from "lucide-react";
import SlotFormModal from "./SlotFormModal";
import { emptyRow, emptyBlock, wrapInGrid, updateNode, removeNode, addChild } from "../../../utils/layoutTree";

const WIDTH_PRESETS = [
  { label: "1/4", value: 3 },
  { label: "1/3", value: 4 },
  { label: "1/2", value: 6 },
  { label: "2/3", value: 8 },
  { label: "3/4", value: 9 },
  { label: "Inteira", value: 12 },
];

const BLOCK_ICON = { text: Type, number: Hash, ad: ImageIcon, chart: ChartArea, external_link: LinkIcon, carousel: GalleryHorizontal };
const BLOCK_LABEL = { text: "Texto", number: "Número", ad: "Publicidade", chart: "Gráfico", external_link: "Link externo", carousel: "Carrossel de Publicações" };
const CAROUSEL_SOURCE_LABELS = { nota: "Notas", destaque: "Destaques", financas: "Finanças", externa: "Publicação Externa" };

function blockSummary(node) {
  switch (node.block_type) {
    case "text":
      return node.content?.title || "(sem título)";
    case "number":
      return `${node.content?.value || "—"} · ${node.content?.caption || ""}`;
    case "external_link":
      return node.content?.title || node.content?.url || "(sem título)";
    case "chart":
      return node.chart_id ? `Gráfico #${node.chart_id}` : "(nenhum gráfico selecionado)";
    case "ad":
      return node.banner_id ? `Publicidade #${node.banner_id}` : "(nenhuma publicidade selecionada)";
    case "carousel":
      return CAROUSEL_SOURCE_LABELS[node.content?.source] || "(escolha a fonte)";
    default:
      return "";
  }
}

// Envolve um filho com a alça de arrasto + seletor de largura (só faz
// sentido dentro de uma linha) + menu de ações. `dispatch` sempre recebe uma
// função (tree) => novaTree, aplicada no estado do editor (ver PublicationsAdmin.jsx).
function NodeChrome({ node, parentDirection, dispatch, dragHandleProps, children, extraActions }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <div {...dragHandleProps} className="text-gray-300 hover:text-[#7F33D9] cursor-grab shrink-0">
          <GripVertical size={16} />
        </div>

        {parentDirection === "row" && (
          <div className="flex items-center gap-1 flex-wrap">
            {WIDTH_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => dispatch((tree) => updateNode(tree, node.id, (n) => ({ ...n, width: p.value })))}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  node.width === p.value ? "bg-purple-100 text-[#7F33D9]" : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen((v) => !v)} className="text-gray-400 hover:text-gray-700 px-1 text-lg leading-none">
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 w-48">
              {extraActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    action.onClick();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <action.icon size={14} /> {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function LayoutNode({ node, parentDirection, dispatch, dragHandleProps, isRoot = false }) {
  const [editingBlock, setEditingBlock] = useState(false);

  if (node.type === "block") {
    const Icon = BLOCK_ICON[node.block_type] || Type;
    return (
      <NodeChrome
        node={node}
        parentDirection={parentDirection}
        dispatch={dispatch}
        dragHandleProps={dragHandleProps}
        extraActions={[
          { label: "Editar conteúdo", icon: Pencil, onClick: () => setEditingBlock(true) },
          {
            label: "Transformar em grid",
            icon: LayoutGrid,
            onClick: () => dispatch((tree) => updateNode(tree, node.id, wrapInGrid)),
          },
          { label: "Excluir", icon: Trash2, onClick: () => dispatch((tree) => removeNode(tree, node.id)) },
        ]}
      >
        <div className="flex items-center gap-2 py-1">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7F33D9] flex items-center justify-center shrink-0">
            <Icon size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{BLOCK_LABEL[node.block_type]}</span>
              {node.status === "active" ? (
                <span className="text-green-600 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 size={10} /> Publicado
                </span>
              ) : (
                <span className="text-gray-400 text-[10px] font-bold flex items-center gap-1">
                  <XCircle size={10} /> Rascunho
                </span>
              )}
            </div>
            <p className="text-sm text-gray-800 truncate">{blockSummary(node)}</p>
          </div>
        </div>

        {editingBlock && (
          <SlotFormModal
            node={node}
            onSaved={(fields) => {
              dispatch((tree) => updateNode(tree, node.id, (n) => ({ ...n, ...fields })));
              setEditingBlock(false);
            }}
            onClose={() => setEditingBlock(false)}
          />
        )}
      </NodeChrome>
    );
  }

  // stack
  const isColumn = node.direction === "column";

  const stackActions = isColumn
    ? [{ label: "Adicionar linha", icon: Plus, onClick: () => dispatch((tree) => addChild(tree, node.id, emptyRow(12))) }]
    : [{ label: "Adicionar coluna", icon: Plus, onClick: () => dispatch((tree) => addChild(tree, node.id, emptyBlock(12))) }];

  if (!isRoot) {
    stackActions.push({ label: "Excluir", icon: Trash2, onClick: () => dispatch((tree) => removeNode(tree, node.id)) });
  }

  const body = (
    <Droppable droppableId={node.id} direction={isColumn ? "vertical" : "horizontal"}>
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={isColumn ? "flex flex-col gap-3" : "grid gap-3"}
          style={isColumn ? undefined : { gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
        >
          {node.children.map((child, index) => (
            <Draggable key={child.id} draggableId={child.id} index={index}>
              {(dragProvided) => (
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  style={{
                    ...(isColumn ? { width: "100%" } : { gridColumn: `span ${Math.min(12, child.width || 12)} / span ${Math.min(12, child.width || 12)}` }),
                    ...dragProvided.draggableProps.style,
                  }}
                >
                  <LayoutNode node={child} parentDirection={node.direction} dispatch={dispatch} dragHandleProps={dragProvided.dragHandleProps} />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
          {node.children.length === 0 && (
            <p className="text-xs text-gray-300 italic py-2">Vazio — use o menu "⋯" pra adicionar conteúdo.</p>
          )}
        </div>
      )}
    </Droppable>
  );

  if (isRoot) {
    return (
      <div>
        <div className="flex justify-end mb-3">
          {stackActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex items-center gap-1 text-xs font-bold text-[#7F33D9] hover:text-[#6025A8] px-3 py-1.5 bg-purple-50 rounded-full"
            >
              <action.icon size={14} /> {action.label}
            </button>
          ))}
        </div>
        {body}
      </div>
    );
  }

  return (
    <NodeChrome node={node} parentDirection={parentDirection} dispatch={dispatch} dragHandleProps={dragHandleProps} extraActions={stackActions}>
      <div className="mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
          {isColumn ? "Grid (empilhado)" : "Linha (colunas lado a lado)"}
        </span>
      </div>
      {body}
    </NodeChrome>
  );
}
