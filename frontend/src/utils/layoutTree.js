// Utilitários puros pra manipular a árvore de layout (ver plano "Editor de
// Publicações: grid aninhada"). Sempre devolvem uma árvore NOVA (imutável) —
// o estado do editor em PublicationsAdmin.jsx é sempre a árvore inteira.

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyBlock(width = 12) {
  return { id: makeId(), type: "block", width, block_type: "text", status: "draft", content: {} };
}

export function emptyRow(width = 12) {
  return { id: makeId(), type: "stack", direction: "row", width, children: [emptyBlock(12)] };
}

export function emptyTree() {
  return { id: "root", type: "stack", direction: "column", children: [] };
}

// Garante que todo nó (inclusive a raiz) tem um `id` único — árvores
// antigas/seed podem ter sido salvas sem id na raiz, ou (bug já corrigido em
// wrapInGrid) com ids duplicados entre um container e um descendente seu.
// `seen` viaja por toda a chamada recursiva pra pegar duplicatas em qualquer
// distância na árvore, não só entre irmãos.
export function normalizeTree(node, seen = new Set()) {
  let id = node.id;
  if (!id || seen.has(id)) id = makeId();
  seen.add(id);
  if (node.type === "stack") {
    return { ...node, id, children: (node.children || []).map((child) => normalizeTree(child, seen)) };
  }
  return { ...node, id };
}

// Substitui o nó de id `targetId` pelo resultado de `updater(node)`. Se
// updater devolver null, o nó é removido dos filhos do pai.
export function updateNode(tree, targetId, updater) {
  if (tree.id === targetId) {
    return updater(tree);
  }
  if (tree.type !== "stack") return tree;
  const children = tree.children
    .map((child) => (child.id === targetId ? updater(child) : updateNode(child, targetId, updater)))
    .filter(Boolean);
  return { ...tree, children };
}

export function removeNode(tree, targetId) {
  return updateNode(tree, targetId, () => null);
}

// Redistribui a largura igualmente entre os filhos de um stack "row".
function rebalanceRowWidths(children) {
  if (!children.length) return children;
  const width = Math.max(2, Math.floor(12 / children.length));
  return children.map((c) => ({ ...c, width }));
}

export function addChild(tree, parentId, newChild) {
  return updateNode(tree, parentId, (node) => {
    const children = [...node.children, newChild];
    return { ...node, children: node.direction === "row" ? rebalanceRowWidths(children) : children };
  });
}

export function reorderChildren(tree, parentId, sourceIndex, destIndex) {
  return updateNode(tree, parentId, (node) => {
    const children = Array.from(node.children);
    const [moved] = children.splice(sourceIndex, 1);
    children.splice(destIndex, 0, moved);
    return { ...node, children };
  });
}

// "Transformar em grid": converte um bloco-folha num container, preservando
// o conteúdo original como primeira (e única, por enquanto) linha dentro dele.
// O bloco preservado ganha um id NOVO — reaproveitar o id original faria dois
// nós da árvore (o container novo e o bloco antigo, agora aninhado) compartilharem
// o mesmo id, e qualquer updateNode() por esse id acabaria mexendo nos dois de vez
// (era exatamente o bug "clico no full de um e reflete no pai").
export function wrapInGrid(node) {
  return {
    id: node.id,
    type: "stack",
    direction: "column",
    width: node.width,
    children: [{ ...emptyRow(12), children: [{ ...node, id: makeId(), width: 12 }] }],
  };
}
