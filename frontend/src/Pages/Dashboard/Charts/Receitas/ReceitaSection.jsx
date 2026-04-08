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
      prev.includes(league.id_league) ? prev : [...prev, league.id_league]
    );
    setLeagueMap((prev) => ({ ...prev, [league.id_league]: league.name }));
  }

  function handleRemoveLeague(leagueId) {
    setSelectedLeagues((prev) => prev.filter((id) => id !== leagueId));
  }

  const availableYears = useMemo(() => {
    const years = new Set();
    Object.values(data || {}).forEach((leagueData) => {
      leagueData.forEach((item) => {
        if (item.code === "recurring_revenue") years.add(item.year);
      });
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [data]);

  useEffect(() => {
    if (!availableYears || availableYears.length === 0) return;
    if (!selectedYear) setSelectedYear(availableYears[availableYears.length - 1]);
  }, [availableYears]);

  return (
    <div className="relative max-w-full w-full min-w-0 bg-white lg:p-8 p-5 rounded-2xl border border-gray-100 shadow-sm">

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[#0A0A0A] font-medium text-lg leading-tight">
            Receitas das ligas
          </h2>
          <p className="text-xs text-[#AFAFB2] mt-0.5">
            Receita recorrente por competição
            {selectedYear ? <> &middot; <span className="text-[#7f34d9] font-medium">{selectedYear}</span></> : ""}
          </p>
        </div>

        {/* Chips das ligas selecionadas */}
        {selectedLeagues.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedLeagues.map((leagueId) => {
              const color = leagueColor?.[leagueId]?.color_one || "#7f34d9";
              return (
                <button
                  key={leagueId}
                  onClick={() => handleRemoveLeague(leagueId)}
                  title="Remover liga"
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                  style={{
                    background: color + "18",
                    color: color,
                    border: `1px solid ${color}30`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="max-w-[140px] truncate">{leagueMap[leagueId] || `Liga ${leagueId}`}</span>
                  <X className="w-3 h-3 opacity-60 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filtro */}
      <ChartFilter
        ligasSelecionadas={selectedLeagues}
        onAddLeague={handleAddLeague}
        currency={currency}
        onChangeCurrency={setCurrency}
        selectedYear={selectedYear}
        onChangeYear={setSelectedYear}
        availableYears={availableYears}
      />

      <div className="border-t border-gray-100 my-5" />

      {/* Gráfico */}
      <RevenueLineChart
        data={data}
        ligasSelecionadas={selectedLeagues}
        leagueMap={leagueMap}
        leagueColor={leagueColor}
        selectedYear={selectedYear}
      />

      <div className="border-t border-gray-100 mt-7 mb-1" />

      {/* Tabela */}
      <ReceitaTable
        data={data}
        ligasSelecionadas={selectedLeagues}
        leagueMap={leagueMap}
        leagueColor={leagueColor}
      />
    </div>
  );
}
