export default function ReceitaTable({ data, ligasSelecionadas, leagueMap, leagueColor }) {
  if (!data || ligasSelecionadas.length === 0) {
    return (
      <p className="text-sm text-[#AFAFB2] mt-4 py-4 text-center">
        Sem dados para exibir.
      </p>
    );
  }

  const yearsSet = new Set();
  ligasSelecionadas.forEach((leagueId) => {
    (data[leagueId] || []).forEach((item) => {
      if (item.code === "recurring_revenue" || item.code === "costs") {
        yearsSet.add(Number(item.year));
      }
    });
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);

  if (years.length === 0) {
    return (
      <p className="text-sm text-[#AFAFB2] mt-4 py-4 text-center">
        Nenhum dado encontrado.
      </p>
    );
  }

  function getLeagueYearMap(leagueId) {
    const map = {};
    (data[leagueId] || []).forEach((item) => {
      const year = Number(item.year);
      if (!map[year]) map[year] = {};
      // Usa converted_value (já convertido pelo backend para a moeda selecionada)
      if (item.code === "recurring_revenue") map[year].revenue = Number(item.converted_value ?? item.value);
      if (item.code === "costs") map[year].costs = Number(item.converted_value ?? item.value);
    });
    return map;
  }

  function formatValue(val) {
    if (val === undefined || val === null) return "—";
    const n = Number(val);
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  }

  return (
    <div className="mt-5 w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left py-3 pr-6 text-xs font-medium text-[#AFAFB2] uppercase tracking-wide whitespace-nowrap">
              Liga
            </th>
            {years.map((year) => (
              <th
                key={year}
                className="text-right py-3 px-4 text-xs font-medium text-[#AFAFB2] uppercase tracking-wide whitespace-nowrap"
              >
                {year}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {ligasSelecionadas.map((leagueId) => {
            const yearMap = getLeagueYearMap(leagueId);
            const color = leagueColor?.[leagueId]?.color_one || "#7f34d9";
            const name = leagueMap?.[leagueId] || `Liga ${leagueId}`;

            return (
              <tr
                key={leagueId}
                className="group hover:bg-[#faf8ff] transition-colors"
              >
                <td className="py-3.5 pr-6 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-[#0A0A0A] truncate max-w-[160px]" title={name}>
                      {name}
                    </span>
                  </div>
                </td>

                {years.map((year) => {
                  const entry = yearMap[year] || {};
                  const hasValue = entry.revenue !== undefined;

                  return (
                    <td
                      key={`${year}-rev`}
                      className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap"
                    >
                      {hasValue ? (
                        <span
                          className="inline-flex items-center justify-end gap-1 font-medium"
                          style={{ color }}
                        >
                          {formatValue(entry.revenue)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
