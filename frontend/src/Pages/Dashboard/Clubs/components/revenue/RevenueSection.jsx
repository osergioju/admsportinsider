// components/revenue/RevenueSection.jsx
import { X } from "lucide-react";

import RevenueLineChart from "./RevenueLineChart";
import RevenueTableChart from "./RevenueTableChart";
import ChartFilter from "../filter/ChartFilter";

export default function RevenueSection({
  data,
  clubMap,
  setClubMap,
  mainClubId,
  clubColorMap,
  setClubColorMap,
  // ⬇️ AGORA VEM DO PAI
  selectedClubs,
  setSelectedClubs
}) {
  function handleAddClub(clube) {
    setSelectedClubs((prev) =>
      prev.includes(clube.id_club)
        ? prev
        : [...prev, clube.id_club]
    );

    setClubMap((prev) => ({
      ...prev,
      [clube.id_club]: clube.name
    }));

    setClubColorMap((prev) => ({
      ...prev,
      [clube.id_club]: {
        color_one: clube.primary_color,
        color_two: clube.secondary_color
      }
    }));

  }

  function handleRemoveClub(clubeId) {
    setSelectedClubs((prev) =>
      prev.filter((id) => id !== clubeId)
    );
  }

  return (
    <div className="max-w-full w-full min-w-0 bg-white lg:p-10 p-6 rounded-xl">
      <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
        Receitas | Por ano
      </h2>

      <ChartFilter
        clubesSelecionados={selectedClubs}
        onAddClub={handleAddClub}
      />
      
      <RevenueLineChart
        data={data}
        clubesSelecionados={selectedClubs}
        clubMap={clubMap}
        mainClubId={mainClubId}
        clubColorMap={clubColorMap}
      />  

      <div className="h-6"></div>

      <RevenueTableChart
        data={data}
        clubesSelecionados={selectedClubs}
        clubMap={clubMap}
        mainClubId={mainClubId}
        clubColorMap={clubColorMap}
      />

      {selectedClubs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedClubs.map((clubeId) => (
            <button
              key={clubeId}
              onClick={() => handleRemoveClub(clubeId)}
              className="cursor-pointer hover:bg-[#7f34d9] hover:text-white transition-all bg-[#EDE6F6] flex items-center gap-2 px-4 py-1 rounded-lg text-sm text-[#8D6C6C]"
            >
              {clubMap[clubeId] || `Clube ${clubeId}`}
              <X className="w-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
