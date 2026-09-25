import { useIsMobile } from "../../hooks/useIsMobile";
import TextBlock from "./blocks/TextBlock";
import NumberBlock from "./blocks/NumberBlock";
import AdBlock from "./blocks/AdBlock";
import ChartBlock from "./blocks/ChartBlock";
import ExternalLinkCard from "./blocks/ExternalLinkCard";
import PublicationsCarousel from "./blocks/PublicationsCarousel";
import ClubChartBlock from "./blocks/ClubChartBlock";

const BLOCK_COMPONENTS = {
  text: TextBlock,
  number: NumberBlock,
  ad: AdBlock,
  chart: ChartBlock,
  external_link: ExternalLinkCard,
  carousel: PublicationsCarousel,
  club_chart: ClubChartBlock,
  // federação e competição usam o mesmo módulo: muda só a fonte dos dados (ciclos), que vem do contexto
  federation_chart: ClubChartBlock,
  league_chart: ClubChartBlock,
};

// Espelho read-only de LayoutNode.jsx (admin) — renderiza a árvore de layout
// já resolvida (chart/banner embutidos). No mobile, linhas colapsam em coluna
// única (cada item ocupa 100%), independente da fração definida no admin.
export default function LayoutNodeView({ node }) {
  const isMobile = useIsMobile();
  if (!node) return null;

  if (node.type === "block") {
    const Block = BLOCK_COMPONENTS[node.block_type];
    if (!Block) return null;
    return (
      <div className="h-full">
        <Block slot={node} />
      </div>
    );
  }

  const isRow = node.direction === "row" && !isMobile;

  return (
    <div
      className={isRow ? "grid gap-4" : "flex flex-col gap-4"}
      style={isRow ? { gridTemplateColumns: "repeat(12, minmax(0, 1fr))" } : undefined}
    >
      {node.children.map((child) => (
        <div key={child.id} style={isRow ? { gridColumn: `span ${Math.min(12, child.width || 12)} / span ${Math.min(12, child.width || 12)}` } : { width: "100%" }}>
          <LayoutNodeView node={child} />
        </div>
      ))}
    </div>
  );
}
