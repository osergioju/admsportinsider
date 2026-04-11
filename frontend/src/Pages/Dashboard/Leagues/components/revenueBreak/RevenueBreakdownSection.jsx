// components/revenueBreak/RevenueBreakdownSection.jsx (LEAGUE)
import { X } from "lucide-react";
import RevenueBreakdownBarChart from "./RevenueBreakdownBarChart";
import ChartFilter from "../filter/ChartFilter";
import { useState, useMemo, useEffect } from "react";

export default function RevenueBreakdownSection({
  data,
  currency,
  setCurrency,
  leagueMap,
  setLeagueMap,
  mainLeagueId,
  selectedLeagues,
  setSelectedLeagues,
  leagueColor,
  setLeagueColor,
  yearSelectionMode
}) {
  function handleAddLeague(liga) {
    setSelectedLeagues((prev) =>
      prev.includes(liga.id_league)
        ? prev
        : [...prev, liga.id_league]
    );

    setLeagueMap((prev) => ({
      ...prev,
      [liga.id_league]: liga.name
    }));

    if (setLeagueColor) {
      setLeagueColor((prev) => ({
        ...prev,
        [liga.id_league]: {
          color_one: liga.primary_color
        }
      }));
    }
  }

  function handleRemoveLeague(leagueId) {
    setSelectedLeagues((prev) =>
      prev.filter((id) => id !== leagueId)
    );
  }

  const [startYear, setStartYear] = useState(null);
  const [endYear, setEndYear] = useState(null);
  const [selectedYears, setSelectedYears] = useState([]);

  const availableYears = useMemo(() => {
    const years = new Set();

    Object.values(data || {}).forEach((leagueData) => {
      leagueData.forEach((item) => {
        years.add(item.year);
      });
    });

    return Array.from(years).sort((a, b) => a - b);
  }, [data]);

  useEffect(() => {
    if (!availableYears || availableYears.length === 0) return;

    // já tem seleção? não mexe
    if (selectedYears.length > 0) return;

    const lastYear = availableYears[availableYears.length - 1];

    setStartYear(lastYear);
    setEndYear(lastYear);

    if (yearSelectionMode === "single") {
      setSelectedYears([lastYear]);
    } else {
      setStartYear(availableYears[0]);
      setEndYear(lastYear);
      setSelectedYears(availableYears);
    }
  }, [availableYears, yearSelectionMode]);


  return (
    <div className="w-full bg-white lg:p-10 p-6 rounded-xl">
      <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
        Receitas <small className="text-xs">(por origem)</small>
      </h2>
      <span className="text-xs opacity-30 inline-block mb-1 -translate-y-1">em milhões</span>


      <ChartFilter
        ligasSelecionadas={selectedLeagues}
        onAddLeague={handleAddLeague}
        currency={currency}
        onChangeCurrency={setCurrency}
        startYear={startYear}
        endYear={endYear}
        onChangeStartYear={setStartYear}
        onChangeEndYear={setEndYear}
        availableYears={availableYears}
        selectedYears={selectedYears}
        onChangeSelectedYears={setSelectedYears}
        yearSelectionMode="single"
      />

      <RevenueBreakdownBarChart
        data={data}
        ligasSelecionadas={selectedLeagues}
        leagueMap={leagueMap}
        mainLeagueId={mainLeagueId}
        leagueColor={leagueColor}
        startYear={startYear}
        endYear={endYear}
      />

      {selectedLeagues.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedLeagues.map((leagueId) => (
            <button
              key={leagueId}
              onClick={() => handleRemoveLeague(leagueId)}
              className="cursor-pointer hover:bg-[#7f34d9] hover:text-white transition-all bg-[#EDE6F6] flex items-center gap-2 px-4 py-1 rounded-lg text-sm text-[#8D6C6C]"
            >
              {leagueMap[leagueId] || `Liga ${leagueId}`}
              <X className="w-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
