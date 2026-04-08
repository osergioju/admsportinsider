// components/revenue/RevenueSection.jsx
import { X } from "lucide-react";
import { } from "react";
import RevenueLineChart from "./RevenueLineChart";
import RevenueTableChart from "./RevenueTableChart";
import ChartFilter from "../filter/ChartFilter";
import { useMemo, useEffect, useState } from "react";

export default function RevenueSection({
  data,
  clubMap,
  setClubMap,
  mainClubId,
  clubColorMap,
  setClubColorMap,
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
        if (item.code === "revenue") {
          years.add(item.year);
        }
      });
    });

    return Array.from(years).sort((a, b) => a - b);
  }, [data]);

  useEffect(() => {
    if (!availableYears || availableYears.length === 0) return;

    if (!startYear) {
      setStartYear(availableYears[0]);
    }

    if (!endYear) {
      setEndYear(availableYears[availableYears.length - 1]);
    }

  }, [availableYears]);


  return (
    <div className="relative max-w-full w-full min-w-0 bg-white lg:p-10 p-6 rounded-xl">
      <div className="flex items-center flex-wrap">
        <div className="w-full">
          <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
            Receitas <small className="text-xs">(por ano)</small>
          </h2>
        </div>
        <div className="w-full">
          <ChartFilter
            clubesSelecionados={selectedClubs}
            onAddClub={handleAddClub}
            currency={currency}
            onChangeCurrency={setCurrency}
            startYear={startYear}
            endYear={endYear}
            onChangeStartYear={setStartYear}
            onChangeEndYear={setEndYear}
            availableYears={availableYears}
            yearSelectionMode="multiple"
          />
        </div>
      </div>

      <RevenueLineChart
        data={data}
        clubesSelecionados={selectedClubs}
        clubMap={clubMap}
        mainClubId={mainClubId}
        clubColorMap={clubColorMap}
        startYear={startYear}
        endYear={endYear}
      />

      <div className="h-6"></div>

      <RevenueTableChart
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
