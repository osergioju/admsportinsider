import ReactECharts from "echarts-for-react";
import { adaptRevenueLineData } from "./revenue.adapter";

export default function RevenueTableChart({ data }) {
  const adapted = adaptRevenueLineData(data);

  function formatMoney(value) {
    if (value === null || value === undefined) return "—";
    return `R$ ${Number(value).toLocaleString("pt-BR")}`;
  }

  console.log(adapted);
  if (!adapted.series.length) {
    return <p className="text-sm text-gray-400">Sem dados de receita</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="text-left py-2">Ano</th>
            <th className="text-right py-2">Receita</th>
            <th className="text-right py-2">Receita recorrente</th>
          </tr>
        </thead>

        <tbody>
        {adapted.years.map((year, index) => {
            const receita = Number(adapted.series[0].data[index]);
            const receitaRecorrente = Number(adapted.series[1].data[index]);

            return (
                <tr key={year} className="border-b last:border-0">
                    <td className="py-2">
                        {year}
                    </td>

                    <td className="py-2 text-right">
                        {formatMoney(receita)}
                    </td>

                    <td className="py-2 text-right">
                        {formatMoney(receitaRecorrente)}
                    </td>
                </tr>
            );
        })}
        </tbody>

      </table>
    </div>
  );
}
