// components/costs/CostsSection.jsx
import { useTranslation } from "../../../../../context/TranslationContext";
import { X } from "lucide-react";
import CostsPieChart from "./CostsPieChart";
import ChartFilter from "../filter/ChartFilter";
import { useMemo, useEffect, useState } from "react";

export default function CostsSection({
  data,
  clubMap,
  setClubMap,
  mainClubId,
  selectedClubs,
  setSelectedClubs,
  clubColorMap,
  setClubColorMap,
  currency,
  currencies = [],
  setCurrency
}) {
  const { t } = useTranslation();

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

  const [startYear, setStartYear] = useState(null);
  const [endYear, setEndYear] = useState(null);

  const availableYears = useMemo(() => {
    const years = new Set();

    Object.values(data || {}).forEach((clubData) => {
      clubData.forEach((item) => {
        years.add(item.year);
      });
    });

    return Array.from(years).sort((a, b) => a - b);
  }, [data]);


  const [selectedYears, setSelectedYears] = useState([]);

  // Inicializa selectedYears quando availableYears chega
  useEffect(() => {
    if (!availableYears || availableYears.length === 0) return;

    const lastYear = availableYears[availableYears.length - 1];

    setStartYear(lastYear);
    setEndYear(lastYear);
    setSelectedYears([lastYear]); // ✅ só 1 ano
  }, [availableYears]);

  return (
    <div className="relative w-full bg-white lg:p-10 p-6 rounded-xl">
      <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
        {t("club.finance.costs", "Custos")}
      </h2>
      <span className="text-xs opacity-30 inline-block mb-1 -translate-y-1">{t("club.finance.in_millions", "em milhões")}</span>

      <div className="w-full">
        <ChartFilter
          clubesSelecionados={selectedClubs}
          onAddClub={handleAddClub}
          currency={currency}
          onChangeCurrency={setCurrency}
            currencies={currencies}
          startYear={startYear}
          endYear={endYear}
          onChangeStartYear={setStartYear}
          onChangeEndYear={setEndYear}
          yearSelectionMode="single"
          availableYears={availableYears}

          // 👇 FALTANDO ISSO AQUI
          selectedYears={selectedYears}
          onChangeSelectedYears={setSelectedYears}
        />

        <CostsPieChart
          data={data}
          clubesSelecionados={selectedClubs}
          clubMap={clubMap}
          clubColorMap={clubColorMap}
          mainClubId={mainClubId}
          startYear={startYear}
          endYear={endYear}
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
    </div>
  );
}
