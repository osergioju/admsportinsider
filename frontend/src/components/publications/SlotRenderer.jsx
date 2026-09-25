import { useEffect, useState } from "react";
import { api } from "../../services/api";
import LayoutNodeView from "./LayoutNodeView";

// Renderiza a árvore de layout resolvida de uma página/zona (ver módulo
// "Publicações" — editor em Pages/Admin/Publications/PublicationsAdmin.jsx).
export default function SlotRenderer({ pageKey, zone = "default", className = "" }) {
  const key = `${pageKey}/${zone}`;
  // Guarda a chave junto do resultado: "carregando" = ainda não chegou a resposta desta página/zona
  const [result, setResult] = useState({ key: null, tree: null });

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/dashboard/publications/${pageKey}/${zone}`)
      .then((res) => !cancelled && setResult({ key, tree: res.data.tree }))
      .catch(() => !cancelled && setResult({ key, tree: null }));
    return () => { cancelled = true; };
  }, [pageKey, zone, key]);

  const loading = result.key !== key;
  const tree = result.tree;

  if (loading || !tree || !tree.children?.length) return null;

  return (
    <div className={className}>
      <LayoutNodeView node={tree} />
    </div>
  );
}
