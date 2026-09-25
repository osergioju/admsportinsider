// components/netResult/NetResultTableSection.jsx
import { useTranslation } from "../../../../../context/TranslationContext";
import { X } from "lucide-react";
import NetResultTable from "./NetResultTable";
import NetResultLine from "./NetResultLine";
import ChartFilter from "../filter/ChartFilter";
import { useState, useMemo } from "react";

export default function NetResultTableSection({
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


  const [startYearPick, setStartYear] = useState(null);
  const [endYearPick, setEndYear] = useState(null);

  const availableYears = useMemo(() => {
    const years = new Set();

    Object.values(data || {}).forEach((clubData) => {
      clubData.forEach((item) => {
        years.add(item.year);
      });
    });

    return Array.from(years).sort((a, b) => a - b);
  }, [data]);



  // Inicializa selectedYears quando availableYears chega
  // Período: o que o usuário escolheu; enquanto não escolheu, todo o intervalo dos dados (sem efeito de sincronização)
  const startYear = startYearPick ?? availableYears[0] ?? null;
  const endYear = endYearPick ?? availableYears[availableYears.length - 1] ?? null;

  return (
    <div className="relative w-full bg-white lg:p-10 p-6 rounded-xl">
      <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
        {t("club.finance.financial_result", "Resultado financeiro")}
      </h2>
      <span className="text-xs opacity-30 inline-block mb-1 -translate-y-1">{t("club.finance.in_millions", "em milhões")}</span>

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
        availableYears={availableYears}
        yearSelectionMode="multiple"
      />

      <NetResultLine
        data={data}
        clubesSelecionados={selectedClubs}
        clubMap={clubMap}
        mainClubId={mainClubId}
        clubColorMap={clubColorMap}
        startYear={startYear}
        endYear={endYear}
      />

      <div className="my-10"></div>

      <NetResultTable
        data={data}
        clubesSelecionados={selectedClubs}
        clubMap={clubMap}
        mainClubId={mainClubId}
        clubColorMap={clubColorMap}
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
  );
}
