// components/revenue/ReceitaTable.jsx
export default function ReceitaTable({
  data,
  ligasSelecionadas,
  leagueMap,
  leagueColor,
}) {
  if (!data || ligasSelecionadas.length === 0) {
    return (
      <p className="text-sm text-gray-400 mt-4">
        Sem dados para exibir na tabela.
      </p>
    );
  }

  // Coleta todos os anos disponíveis nos dados
  const yearsSet = new Set();
  ligasSelecionadas.forEach((leagueId) => {
    (data[leagueId] || []).forEach((item) => {
      if (
        item.code === "recurring_revenue" ||
        item.code === "costs"
      ) {
        yearsSet.add(Number(item.year));
      }
    });
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);

  if (years.length === 0) {
    return (
      <p className="text-sm text-gray-400 mt-4">
        Nenhum dado encontrado.
      </p>
    );
  }

  // Para cada liga, monta um mapa { year: { revenue, costs } }
  function getLeagueYearMap(leagueId) {
    const map = {};
    (data[leagueId] || []).forEach((item) => {
      const year = Number(item.year);
      if (!map[year]) map[year] = {};
      if (item.code === "recurring_revenue") {
        map[year].revenue = Number(item.value);
      }
      if (item.code === "costs") {
        map[year].costs = Number(item.value);
      }
    });
    return map;
  }

  function formatValue(val) {
    if (val === undefined || val === null) return "—";
    return `R$ ${Number(val).toLocaleString("pt-BR", {
      maximumFractionDigits: 0,
    })}`;
  }

  
  return (
    <div className="mt-8 w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          {/* Linha 1: cabeçalho dos anos (cada ano ocupa 2 colunas) */}
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 pr-4 font-medium text-[#AFAFB2] whitespace-nowrap w-40">
              Liga
            </th>
            {years.map((year) => (
              <th
                key={year}
                colSpan={2}
                className="text-center py-3 px-2 font-semibold text-[#0A0A0A]"
              >
                {year}
              </th>
            ))}
          </tr>

          {/* Linha 2: sub-cabeçalhos Receita / Despesa */}
          <tr className="border-b border-gray-200 bg-[#FAFAFA]">
            <th className="py-2 pr-4" />
            {years.map((year) => (
              <>
                <th
                  key={`${year}-rec`}
                  className="py-2 px-3 text-xs font-medium text-[#7f34d9] text-center whitespace-nowrap"
                >
                  Receita
                </th>
                <th
                  key={`${year}-desp`}
                  className="py-2 px-3 text-xs font-medium text-[#d93434] text-center whitespace-nowrap"
                >
                  Despesa
                </th>
              </>
            ))}
          </tr>
        </thead>

        <tbody>
          {ligasSelecionadas.map((leagueId, rowIdx) => {
            const yearMap = getLeagueYearMap(leagueId);
            const color =
              leagueColor?.[leagueId]?.color_one || "#7f34d9";
            const name =
              leagueMap?.[leagueId] || `Liga ${leagueId}`;

            return (
              <tr
                key={leagueId}
                className={`border-b border-gray-100 transition-colors hover:bg-[#F9F5FF] ${
                  rowIdx % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"
                }`}
              >
                {/* Nome da liga com bolinha colorida */}
                <td className="py-3 pr-4 whitespace-nowrap font-medium text-[#0A0A0A]">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate max-w-[140px]" title={name}>
                      {name}
                    </span>
                  </div>
                </td>

                {/* Dados por ano */}
                {years.map((year) => {
                  const entry = yearMap[year] || {};
                  const revenue = entry.revenue;
                  const costs = entry.costs;

                  return (
                    <>
                      <td
                        key={`${year}-rev`}
                        className="py-3 px-3 text-center text-[#7f34d9] font-medium tabular-nums whitespace-nowrap"
                      >
                        {formatValue(revenue)}
                      </td>
                      <td
                        key={`${year}-cost`}
                        className="py-3 px-3 text-center text-[#d93434] font-medium tabular-nums whitespace-nowrap"
                      >
                        {formatValue(costs)}
                      </td>
                    </>
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