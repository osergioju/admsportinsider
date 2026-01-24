import { adaptNetResultTable } from "./netResult.adapter";
import React from "react";

function formatMoney(value) {
  if (value === null || value === undefined) return "—";
  return `R$ ${Number(value).toLocaleString("pt-BR")}`;
}

export default function NetResultTable({
  data,
  clubesSelecionados,
  clubMap,
  mainClubId
}) {
  const table = adaptNetResultTable(
    data,
    clubesSelecionados,
    mainClubId,
    clubMap
  );

  if (!table || table.rows.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Sem dados de resultado
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="text-left py-2">Ano</th>
            {table.clubs.map((clubId) => (
              <th
                key={clubId}
                colSpan={3}
                className="text-center py-2"
              >
                {clubMap[clubId] || `Clube ${clubId}`}
              </th>
            ))}
          </tr>
          <tr className="border-b text-gray-400">
            <th></th>
            {table.clubs.map((clubId) => (
              <React.Fragment key={clubId}>
                <th className="text-right py-1">Receita</th>
                <th className="text-right py-1">Custos</th>
                <th className="text-right py-1">Resultado</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.year} className="border-b last:border-0">
              <td className="py-2">{row.year}</td>

              {table.clubs.map((clubId) => {
                const cell = row.byClub[clubId] || {};

                return (
                  <React.Fragment key={clubId}>
                    <td className="py-2 text-right">
                      {formatMoney(cell.revenue)}
                    </td>
                    <td className="py-2 text-right">
                      {formatMoney(cell.costs)}
                    </td>
                    <td
                      className={`py-2 text-right font-medium ${
                        cell.net >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatMoney(cell.net)}
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
