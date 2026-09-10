import { useEffect, useState } from "react";
import { api } from "../../services/api";
import LayoutNodeView from "./LayoutNodeView";

// Renderiza a árvore de layout resolvida de uma página/zona (ver módulo
// "Publicações" — editor em Pages/Admin/Publications/PublicationsAdmin.jsx).
export default function SlotRenderer({ pageKey, zone = "default", className = "" }) {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/dashboard/publications/${pageKey}/${zone}`)
      .then((res) => setTree(res.data.tree))
      .catch(() => setTree(null))
      .finally(() => setLoading(false));
  }, [pageKey, zone]);

  if (loading || !tree || !tree.children?.length) return null;

  return (
    <div className={className}>
      <LayoutNodeView node={tree} />
    </div>
  );
}
