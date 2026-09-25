// components/netResult/NetResultSection.jsx (LEAGUE)
import { X } from "lucide-react";
import NetResultLineChart from "./NetResultLineChart";
import ChartFilter from "../filter/ChartFilter";
import { useMemo, useState } from "react";
import { useTranslation } from "../../../../../context/TranslationContext";
import NoFinancialData from "../NoFinancialData";

export default function NetResultSection({
  data,
  currency,
  setCurrency,
  currencies = [],
  leagueMap,
  setLeagueMap,
  mainLeagueId,
  selectedLeagues,
  setSelectedLeagues,
  leagueColor,
  setLeagueColor
}) {
  const { t } = useTranslation();

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

  const [startYearPick, setStartYear] = useState(null);
  const [endYearPick, setEndYear] = useState(null);

  const availableYears = useMemo(() => {
    const years = new Set();

    Object.values(data || {}).forEach((clubData) => {
      clubData.forEach((item) => {
        if (Number(item.converted_value) !== 0) years.add(item.year);
      });
    });

    return Array.from(years).sort((a, b) => a - b);
  }, [data]);

  // Período: o que o usuário escolheu; enquanto não escolheu, todo o intervalo dos dados (sem efeito de sincronização)
  const startYear = startYearPick ?? availableYears[0] ?? null;
  const endYear = endYearPick ?? availableYears[availableYears.length - 1] ?? null;

  const mainData = data?.[mainLeagueId];

  return (
    <div className="w-full bg-white lg:p-10 p-6 rounded-xl">
      {mainData !== undefined && !mainData.length ? (
        <NoFinancialData title={t("club.finance.net_result", "Resultado líquido")} />
      ) : mainData?.length > 0 && (
        <>
          <h2 className="mb-1 text-[#0A0A0A] font-[400] text-xl">
            {t("club.finance.net_result", "Resultado líquido")}
          </h2>
          <span className="text-xs opacity-30 inline-block mb-1 -translate-y-1">{t("club.finance.in_millions", "em milhões")}</span>
          <ChartFilter
            ligasSelecionadas={selectedLeagues}
            currency={currency}
            onChangeCurrency={setCurrency}
            currencies={currencies}
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
                <button key={leagueId} onClick={() => handleRemoveLeague(leagueId)}
                  className="cursor-pointer hover:bg-[#7f34d9] hover:text-white transition-all bg-[#EDE6F6] flex items-center gap-2 px-4 py-1 rounded-lg text-sm text-[#8D6C6C]">
                  {leagueMap[leagueId] || `Liga ${leagueId}`}
                  <X className="w-4" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
