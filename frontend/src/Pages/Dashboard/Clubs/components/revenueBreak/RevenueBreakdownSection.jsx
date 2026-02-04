// components/revenueBreak/RevenueBreakdownSection.jsx
import { X, Heart } from "lucide-react";
import RevenueBreakdownBarChart from "./RevenueBreakdownBarChart";
import ChartFilter from "../filter/ChartFilter";
import { api } from "../../../../../services/api";

export default function RevenueBreakdownSection({
  data,
  clubMap,
  setClubMap,
  mainClubId,
  selectedClubs, 
  setSelectedClubs,
  clubColorMap,
  setClubColorMap,
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

  async function handleFavorite() {
    const payload = {
      chartType: "revenue_breakdown",
      title: "Receitas por clube",
      mainClubId,
      selectedClubs
    };

    try {
      await api.post("/dashboard/favorites", payload);
      alert("Favorito salvo 😎");
    } catch (err) {
      console.error(err);
      alert("Deu ruim ao salvar favorito");
    }
  }


  return (
    <div className="relative w-full bg-white lg:p-10 p-6 rounded-xl">
      <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
          Receitas <small className="text-xs">(por ano)</small>
         {selectedClubs.length > 0 && (
            <button 
              className="cursor-pointer border rounded-full w-10 h-10 flex items-center justify-center text-[#d9337e] hover:bg-[#d9337e] hover:text-white transition-all"
              onClick={handleFavorite}>
              <Heart className="w-4" />
            </button>
          )}
      </h2>

      <ChartFilter
        clubesSelecionados={selectedClubs}
        onAddClub={handleAddClub}
        currency={currency}
        onChangeCurrency={setCurrency}
      />

      <RevenueBreakdownBarChart
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
