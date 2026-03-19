// components/revenue/ReceitaSection.jsx
import { X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import RevenueLineChart from "./ReceitaLineChart";
import ReceitaTable from "./ReceitaTable";
import ChartFilter from "../ChartFilter";

export default function ReceitaSection({
  data,
  leagueMap,
  setLeagueMap,
  leagueColor,
  setLeagueColor,
  selectedLeagues,
  setSelectedLeagues,
  currency,
  setCurrency,
}) {
  const [selectedYear, setSelectedYear] = useState(null);

  function handleAddLeague(league) {
    setSelectedLeagues((prev) =>
      prev.includes(league.id_league)
        ? prev
        : [...prev, league.id_league]
    );

    setLeagueMap((prev) => ({
      ...prev,
      [league.id_league]: league.name,
    }));
  }

  function handleRemoveLeague(leagueId) {
    setSelectedLeagues((prev) => prev.filter((id) => id !== leagueId));
  }

  /**
   * Descobrir anos disponíveis
   */
  const availableYears = useMemo(() => {
    const years = new Set();
    Object.values(data || {}).forEach((leagueData) => {
      leagueData.forEach((item) => {
        if (item.code === "recurring_revenue") {
          years.add(item.year);
        }
      });
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [data]);

  /**
   * Inicializar ano selecionado
   */
  useEffect(() => {
    if (!availableYears || availableYears.length === 0) return;
    if (!selectedYear) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears]);

  console.log(data);
  return (
    <div className="relative max-w-full w-full min-w-0 bg-white lg:p-10 p-6 rounded-xl">
      <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
        Receitas das ligas <small className="text-xs">(por ano)</small>
      </h2>

      <ChartFilter
        ligasSelecionadas={selectedLeagues}
        onAddLeague={handleAddLeague}
        currency={currency}
        onChangeCurrency={setCurrency}
        selectedYear={selectedYear}
        onChangeYear={setSelectedYear}
        availableYears={availableYears}
      />

      {/* Gráfico de barras */}
      <RevenueLineChart
        data={data}
        ligasSelecionadas={selectedLeagues}
        leagueMap={leagueMap}
        leagueColor={leagueColor}
        selectedYear={selectedYear}
      />

      {/* Tabela receita x despesa por liga/ano */}
      <ReceitaTable
        data={data}
        ligasSelecionadas={selectedLeagues}
        leagueMap={leagueMap}
        leagueColor={leagueColor}
      />

      <div className="h-6" />

      {/* Tags das ligas selecionadas */}
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