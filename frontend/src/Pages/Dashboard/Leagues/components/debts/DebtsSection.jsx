// components/debts/DebtsSection.jsx (LEAGUE)
import { X } from "lucide-react";
import DebtsBreakdownBarChart from "./DebtsBreakdownBarChart";
import ChartFilter from "../filter/ChartFilter";

export default function DebtsSection({
  data,
  currency,
  setCurrency,
  currencies = [],
  leagueMap,
  setLeagueMap,
  mainLeagueId,
  selectedLeagues,
  setSelectedLeagues
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
  }

  function handleRemoveLeague(leagueId) {
    setSelectedLeagues((prev) =>
      prev.filter((id) => id !== leagueId)
    );
  }

  return (
    <div className="w-full bg-white lg:p-10 p-6 rounded-xl">
      <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
        Dívidas
      </h2>
      <span className="text-xs opacity-30 inline-block mb-1 -translate-y-1">em milhões</span>

      <ChartFilter
        ligasSelecionadas={selectedLeagues}
        onAddLeague={handleAddLeague}
        currency={currency}
        onChangeCurrency={setCurrency}
        currencies={currencies}
      />

      <DebtsBreakdownBarChart
        data={data}
        ligasSelecionadas={selectedLeagues}
        leagueMap={leagueMap}
        mainLeagueId={mainLeagueId}
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
