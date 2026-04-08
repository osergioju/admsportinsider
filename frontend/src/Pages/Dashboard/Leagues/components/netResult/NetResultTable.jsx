import { adaptNetResultTable } from "./netResultLeague.adapter";
import { useMemo } from "react";
import React from "react";

function formatMoney(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("pt-BR")}`;
}

export default function NetResultTable({
  data,
  ligasSelecionadas,
  leagueMap,
  mainLeagueId,
  leagueColor,
  startYear,
  endYear
}) {
  const table = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return null;

    let filteredData = data;

    if (startYear || endYear) {
      filteredData = {};

      Object.keys(data).forEach((leagueId) => {
        filteredData[leagueId] = data[leagueId].filter((item) => {
          if (startYear && item.year < startYear) return false;
          if (endYear && item.year > endYear) return false;
          return true;
        });
      });
    }

    return adaptNetResultTable(
      filteredData,
      ligasSelecionadas,
      mainLeagueId,
      leagueMap
    );

  }, [data, mainLeagueId, ligasSelecionadas, leagueMap, startYear, endYear]);

  if (!table || table.rows.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Sem dados de resultado
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F8F9FB] border-b">
            <th className="sticky left-0 z-10 bg-[#F8F9FB] text-left py-2 pl-4 font-[400] text-base text-[#B1B6BA]">
              Liga
            </th>

            {table.rows.map((row) => (
              <th
                key={row.year}
                className="text-right py-2 pr-4 font-[400] text-sm text-[#626262]"
              >
                {row.year}
              </th>
            ))}
          </tr>

          <tr className="border-b text-gray-400">
            <th className="sticky left-0 z-10 bg-[#F8F9FB]"></th>
            {table.rows.map((row) => (
              <th
                key={row.year}
                className="text-right py-1 pr-4 font-medium"
              >
                Ebitda
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {table.leagues.map((leagueId) => (
            <tr key={leagueId} className="border-b last:border-0">
              <td className="sticky left-0 bg-white py-2 pl-4">
                <span className="flex gap-2 items-center">
                  <div
                    className="w-2 h-2 rounded-lg"
                    style={{
                      backgroundColor: leagueColor[leagueId]?.color_one
                    }}
                  />
                  {leagueMap[leagueId] || `Liga ${leagueId}`}
                </span>
              </td>

              {table.rows.map((row) => {
                const cell = row.byLeague[leagueId] || {};

                return (
                  <td
                    key={`${leagueId}-${row.year}`}
                    className={`text-xs pr-4 py-2 text-right font-medium ${cell.ebitda >= 0
                      ? "text-green-600"
                      : "text-red-600"
                      }`}
                  >
                    {formatMoney(cell.ebitda)}
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
