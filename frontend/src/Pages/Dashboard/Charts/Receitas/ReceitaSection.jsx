import { useTranslation } from "../../../../context/TranslationContext";
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
  leagueMetaMap = {},
  setLeagueMetaMap,
  selectedLeagues,
  setSelectedLeagues,
  currency,
  setCurrency,
}) {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState(null);

  function handleAddLeague(league) {
    setSelectedLeagues((prev) =>
      prev.includes(league.id_league) ? prev : [...prev, league.id_league]
    );
    setLeagueMap((prev) => ({ ...prev, [league.id_league]: league.name }));
    if (setLeagueMetaMap) {
      setLeagueMetaMap((prev) => ({
        ...prev,
        [league.id_league]: {
          slug: league.slug,
          logo_url: league.logo_url,
          flag_url: league.flag_url,
          country_name: league.country_name,
        },
      }));
    }
  }

  function handleRemoveLeague(leagueId) {
    setSelectedLeagues((prev) => prev.filter((id) => id !== leagueId));
  }

  const availableYears = useMemo(() => {
    const years = new Set();
    Object.values(data || {}).forEach((leagueData) => {
      leagueData.forEach((item) => {
        if (item.code === "recurring_revenue" || item.code === "revenue") years.add(item.year);
      });
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [data]);

  const scaleLabel = useMemo(() => {
    let max = 0;
    Object.values(data || {}).forEach((leagueData) => {
      leagueData.forEach((item) => {
        if (item.code === "recurring_revenue" || item.code === "revenue") {
          const v = Number(item.converted_value ?? item.value ?? 0);
          if (v > max) max = v;
        }
      });
    });
    if (max >= 1_000) return t("ui.in_billions", "em bilhões");
    if (max > 0)      return t("ui.in_millions", "em milhões");
    return null;
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
            {t("dashboard.league_revenue_title", "Receitas das ligas")}
          </h2>
          <p className="text-xs text-[#AFAFB2] mt-0.5">
            {t("dashboard.league_revenue_subtitle", "Receita recorrente por competição")}
            {selectedYear ? <> &middot; <span className="text-[#7f34d9] font-medium">{selectedYear}</span></> : ""}
            {scaleLabel ? <> &middot; <span className="opacity-50">{scaleLabel}</span></> : ""}
          </p>
        </div>
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
        currency={currency}
      />

      <div className="border-t border-gray-100 mt-7 mb-1" />

      {/* Tabela */}
      <ReceitaTable
        data={data}
        ligasSelecionadas={selectedLeagues}
        leagueMap={leagueMap}
        leagueColor={leagueColor}
        leagueMetaMap={leagueMetaMap}
        currency={currency}
      />

      {/* Badges das ligas selecionadas */}
      {selectedLeagues.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedLeagues.map((leagueId) => {
            const meta = leagueMetaMap[leagueId] || {};
            return (
              <button
                key={leagueId}
                onClick={() => handleRemoveLeague(leagueId)}
                className="cursor-pointer hover:bg-[#7f34d9] hover:text-white transition-all bg-[#EDE6F6] flex items-center gap-2 px-3 py-1 rounded-lg text-sm text-[#8D6C6C]"
              >
                {(meta.logo_url || meta.slug) && (
                  <img src={meta.logo_url || `https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${meta.slug}.webp`} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                )}
                {meta.flag_url && (
                  <img src={meta.flag_url} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
                )}
                {leagueMap[leagueId] || `Liga ${leagueId}`}
                <X className="w-4" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
