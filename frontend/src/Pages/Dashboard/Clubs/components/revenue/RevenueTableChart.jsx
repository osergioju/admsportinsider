// components/revenue/RevenueTableChart.jsx
import { useMemo } from "react";
import { adaptRevenueLineData } from "./revenue.adapter";

export default function RevenueTableChart({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId,
  clubColorMap
}) {
  
  const adapted = useMemo(() => {
  if (!data || Object.keys(data).length === 0) return null;

  return adaptRevenueLineData(
    data,
    mainClubId,
    clubesSelecionados,
    clubMap,
    clubColorMap
  );
}, [data, mainClubId, clubesSelecionados, clubColorMap, clubMap]);


  function formatMoney(value) {
    if (value === null || value === undefined) return "—";
    return `R$ ${Number(value).toLocaleString("pt-BR")}`;
  }

  if (!adapted || adapted.series.length === 0) {
    return <p className="text-sm text-gray-400">Sem dados de receita</p>;
  }

  return (
    <div className="overflow-x-auto border rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F8F9FB] border-b">
            <th className="sticky left-0 z-10 bg-[#F8F9FB] text-left py-2 pl-4 font-[400] text-base text-[#B1B6BA]">Clube</th>

            {adapted.years.map((year) => (
              <th
                key={year}
                className="text-right py-2 pr-4 font-[400] text-sm text-[#626262]"
              >
                {year}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {adapted.series.map((serie) => (
            <tr key={serie.name} className="border-b last:border-0 sticky left-0  bg-white py-2 pl-4">
              <td className="py-2 pl-4">
                <span className="flex gap-2 items-center">
                  <div
                    className="w-2 h-2 rounded-lg"
                    style={{
                      backgroundColor: clubColorMap[serie.id]?.color_one
                    }}
                  />
                  {serie.name}
                </span>
              </td>

              {serie.data.map((value, yearIndex) => (
                <td
                  key={`${serie.name}-${adapted.years[yearIndex]}`}
                  className="text-xs py-2 pr-4 text-right"
                >
                  {formatMoney(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

  );
}
