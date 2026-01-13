export default function RevenueByClubChart({ rawData }) {
  if (!rawData || rawData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow">
        <p className="text-sm text-gray-500">
          Nenhum dado disponível.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="text-lg font-medium mb-4">
        Receitas por Clube
      </h2>

      {/* gráfico entra aqui depois */}
      <div className="h-[420px] flex items-center justify-center text-gray-400">
        Gráfico aqui
      </div>
    </div>
  );
}
