import { useClubModule } from "../ClubModuleContext";
import { latestTwo, makeFormatter } from "../../../utils/clubModules";

// Big number. Dois modos: "static" (valor + legenda digitados, como na Home) e
// "indicator" (página de clube: último valor de um indicador financeiro do clube).
export default function NumberBlock({ slot }) {
  const ctx = useClubModule();
  const { value, caption, mode, indicator_code, value_format } = slot.content || {};

  let display = value;
  let legend = caption;

  if (mode === "indicator") {
    if (!ctx?.moduleData) {
      return <div className="w-full h-full min-h-[120px] bg-gray-50 rounded-2xl animate-pulse" />;
    }
    const [latest] = latestTwo(ctx.moduleData, indicator_code);
    const label = ctx.moduleData.indicators?.find((i) => i.code === indicator_code)?.label || indicator_code;
    display = latest ? makeFormatter(ctx.moduleData, value_format)(latest.value) : "—";
    legend = caption || (latest ? `${label} · ${latest.year}` : label);
  }

  return (
    <div className="w-full h-full bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
      <span className="text-3xl sm:text-4xl font-bold text-[#7F33D9] tracking-tight">{display}</span>
      {legend && <span className="text-sm text-gray-500 mt-2">{legend}</span>}
    </div>
  );
}
