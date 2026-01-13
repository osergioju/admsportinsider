import ReactECharts from "echarts-for-react";
import RevenuesFilters from "./RevenuesFilters";
import { useRevenuesData } from "./useRevenuesData";

export default function RevenuesChart() {
  const {
    countries,
    leagues,
    clubsOptions,
    country,
    league,
    clubs,
    data,
    loading,
    error,
    setCountry,
    setLeague,
    setClubs
    } = useRevenuesData();


  if (loading) {
    return <div>Carregando gráfico...</div>;
    }

    if (error) {
    return <div className="text-red-500">{error}</div>;
    }


  if (!data) {
    return (
      <div className="border rounded-xl p-6 bg-white">
        <RevenuesFilters
            countries={countries}
            leagues={leagues}
            clubsOptions={clubsOptions}
            country={country}
            league={league}
            clubs={clubs}
            onCountryChange={setCountry}
            onLeagueChange={setLeague}
            onClubsChange={setClubs}
        />
        <p className="mt-4 text-sm text-gray-500">
          Selecione uma liga e até 5 clubes
        </p>
      </div>
    );
  }

  const option = {
    tooltip: { trigger: "axis" },
    legend: {
      data: data.series.map(s => s.club)
    },
    xAxis: {
      type: "category",
      data: data.years
    },
    yAxis: {
      type: "value"
    },
    series: data.series.map(s => ({
      name: s.club,
      type: "line",
      smooth: true,
      data: s.values
    }))
  };

  return (
    <div className="border bg-white rounded-xl p-6 space-y-4">
      <RevenuesFilters
        countries={countries}
        leagues={leagues}
        clubsOptions={clubsOptions}
        country={country}
        league={league}
        clubs={clubs}
        onCountryChange={setCountry}
        onLeagueChange={setLeague}
        onClubsChange={setClubs}
      />

      <ReactECharts
        option={option}
        style={{ height: 400 }}
      />
    </div>
  );
}
