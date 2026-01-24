// components/revenue/RevenueTableChart.jsx
import { useMemo } from "react";
import { adaptRevenueLineData } from "./revenue.adapter";

export default function RevenueTableChart({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId
}) {
  
  const adapted = useMemo(() => {
  if (!data || Object.keys(data).length === 0) return null;

  return adaptRevenueLineData(
    data,
    mainClubId,
    clubesSelecionados,
    clubMap
  );
}, [data, mainClubId, clubesSelecionados, clubMap]);


  function formatMoney(value) {
    if (value === null || value === undefined) return "—";
    return `R$ ${Number(value).toLocaleString("pt-BR")}`;
  }

  if (!adapted || adapted.series.length === 0) {
    return <p className="text-sm text-gray-400">Sem dados de receita</p>;
  }

  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="text-left py-2">Ano</th>

            {adapted.series.map((serie) => (
              <th
                key={serie.name}
                className="text-right py-2 whitespace-nowrap"
              >
                {serie.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {adapted.years.map((year, yearIndex) => (
            <tr key={year} className="border-b last:border-0">
              <td className="py-2">{year}</td>

              {adapted.series.map((serie) => {
                const value = serie.data[yearIndex];

                return (
                  <td
                    key={`${serie.name}-${year}`}
                    className="py-2 text-right"
                  >
                    {formatMoney(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
