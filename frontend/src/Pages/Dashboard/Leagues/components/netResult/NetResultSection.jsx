// components/netResult/NetResultSection.jsx (LEAGUE)
import { X } from "lucide-react";
import NetResultLineChart from "./NetResultLineChart";
import ChartFilter from "../filter/ChartFilter";
import { useMemo, useEffect, useState } from "react";

export default function NetResultSection({
  data,
  currency,
  setCurrency,
  leagueMap,
  setLeagueMap,
  mainLeagueId,
  selectedLeagues,
  setSelectedLeagues,
  leagueColor,
  setLeagueColor
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

  const availableYears = useMemo(() => {
    const years = new Set();

    Object.values(data || {}).forEach((clubData) => {
      clubData.forEach((item) => {
        years.add(item.year);
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
    <div className="w-full bg-white lg:p-10 p-6 rounded-xl">
      <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
        Resultado líquido
      </h2>

      <ChartFilter
        ligasSelecionadas={selectedLeagues}
        currency={currency}
        onChangeCurrency={setCurrency}
        onAddLeague={handleAddLeague}
        startYear={startYear}
        endYear={endYear}
        onChangeStartYear={setStartYear}
        onChangeEndYear={setEndYear}
        availableYears={availableYears}
        yearSelectionMode="multiple"
      />

      <NetResultLineChart
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
