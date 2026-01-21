// components/revenue/RevenueSection.jsx
import { X } from "lucide-react";

import RevenueLineChart from "./RevenueLineChart";
import RevenueTableChart from "./RevenueTableChart";
import ChartFilter from "../filter/ChartFilter";

export default function RevenueSection({
  data,
  clubesSelecionados,
  setClubesSelecionados
}) {
  /**
   * Adiciona clube vindo do ChartFilter
   * (espera objeto { id_club, name })
   */
  function handleAddClub(clube) {
    setClubesSelecionados((prev) =>
      prev.includes(clube.id_club)
        ? prev
        : [...prev, clube.id_club]
    );
  }

  /**
   * Remove clube da comparação
   */
  function handleRemoveClub(clubeId) {
    setClubesSelecionados((prev) =>
      prev.filter((id) => id !== clubeId)
    );
  }

  return (
    <div className="w-full bg-white border p-6 rounded-xl">
      <div className="text-left mb-2">
        <h2 className="mb-4 text-[#0A0A0A] font-[400] text-xl">
          Receitas | Por ano
        </h2>

        {/* FILTRO */}
        <ChartFilter
          clubesSelecionados={clubesSelecionados}
          onAddClub={handleAddClub}
        />

        {/* GRÁFICOS */}
        <RevenueLineChart
          data={data}
          clubesSelecionados={clubesSelecionados}
        />

        <RevenueTableChart
          data={data}
          clubesSelecionados={clubesSelecionados}
        />

        {/* CLUBES SELECIONADOS */}
        {clubesSelecionados.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {clubesSelecionados.map((clubeId) => (
              <button
                key={clubeId}
                onClick={() => handleRemoveClub(clubeId)}
                className="cursor-pointer hover:bg-[#7f34d9] hover:text-white transition-all bg-[#EDE6F6] flex items-center gap-2 px-4 py-1 rounded-lg text-sm text-[#8D6C6C]"
              >
                Clube #{clubeId}
                <X className="w-4" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
