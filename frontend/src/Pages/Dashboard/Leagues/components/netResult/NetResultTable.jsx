import { adaptNetResultTable } from "./netResult.adapter";

function formatMoney(value) {
  if (value === null || value === undefined) return "—";
  return `R$ ${Number(value).toLocaleString("pt-BR")}`;
}

export default function NetResultTable({ data }) {
  const rows = adaptNetResultTable(data);

  if (!rows.length) {
    return <p className="text-sm text-gray-400">Sem dados de resultado</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="text-left py-2">Ano</th>
            <th className="text-right py-2">Receita</th>
            <th className="text-right py-2">Custos</th>
            <th className="text-right py-2">Resultado líquido</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.year} className="border-b last:border-0">
              <td className="py-2">{row.year}</td>
              <td className="py-2 text-right">
                {formatMoney(row.revenue)}
              </td>
              <td className="py-2 text-right">
                {formatMoney(row.costs)}
              </td>
              <td
                className={`py-2 text-right font-medium ${
                  row.net >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatMoney(row.net)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
