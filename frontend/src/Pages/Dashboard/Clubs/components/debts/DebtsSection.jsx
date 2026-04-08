// components/debts/DebtsSection.jsx
import { X } from "lucide-react";
import DebtsBreakdownBarChart from "./DebtsBreakdownBarChart";
import ChartFilter from "../filter/ChartFilter";

export default function DebtsSection({
  data,
  clubMap,
  setClubMap,
  mainClubId,
  selectedClubs,
  setSelectedClubs,
  currency,
  setCurrency
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
  }

  function handleRemoveClub(clubeId) {
    setSelectedClubs((prev) =>
      prev.filter((id) => id !== clubeId)
    );
  }

  return (
    <div className="relative w-full bg-white lg:p-10 p-6 rounded-xl">
      <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
        Dívidas
      </h2>
      <span className="text-xs opacity-30 inline-block mb-1 -translate-y-1">em milhões</span>

      <ChartFilter
        clubesSelecionados={selectedClubs}
        onAddClub={handleAddClub}
        currency={currency}
        onChangeCurrency={setCurrency}
        yearSelectionMode="multiple"
      />


      <DebtsBreakdownBarChart
        data={data}
        clubesSelecionados={selectedClubs}
        clubMap={clubMap}
        mainClubId={mainClubId}
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
