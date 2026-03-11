import { useEffect, useState } from "react";
import { api } from "../../../services/api";

export default function UploadMatchesPage() {

  const [file, setFile] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [league, setLeague] = useState("");
  const [season, setSeason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeagues();
  }, []);

  async function loadLeagues() {
    try {
      const { data } = await api.get("/admin/leagues");

      setLeagues(data.leagues);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar ligas");
    }
  }

  const handleSubmit = async () => {

    if (!league) {
      alert("Selecione uma liga.");
      return;
    }

    if (!season) {
      alert("Selecione a temporada.");
      return;
    }

    if (!file) {
      alert("Selecione um arquivo.");
      return;
    }

    const allowedTypes = [".csv", ".xlsx"];
    const isValid = allowedTypes.some(ext => file.name.endsWith(ext));

    if (!isValid) {
      alert("Arquivo deve ser .csv ou .xlsx");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("league", league);
    formData.append("season", season);

    try {

      setLoading(true);

      const { data } = await api.post(
        "upload/import/matches",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert(`
Importação concluída

Inseridos: ${data.inserted}
Ignorados: ${data.skipped}
Total: ${data.total}
      `);

      setFile(null);

    } catch (err) {

      console.error(err);

      alert(
        err?.response?.data?.error ||
        "Erro ao importar partidas"
      );

    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="p-6">

      <h1 className="text-2xl font-semibold mb-6">
        Upload de Partidas
      </h1>

      <div className="bg-white rounded-xl p-6 shadow max-w-xl">

        <div className="flex flex-col gap-4">

          {/* Liga */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Liga
            </label>

            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="border rounded w-full p-2"
            >
              <option value="">Selecione</option>

              {leagues.map((l) => (
                <option key={l.id_league} value={l.id_league}>
                  {l.name}
                </option>
              ))}

            </select>
          </div>

          {/* Temporada */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Temporada
            </label>

            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="border rounded w-full p-2"
            >
              <option value="">Selecione</option>

              {[2021,2022,2023,2024,2025].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}

            </select>
          </div>

          {/* Arquivo */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Arquivo CSV / XLSX
            </label>

            <input
              type="file"
              accept=".csv,.xlsx"
              className="border rounded w-full p-2"
              onChange={(e) => setFile(e.target.files[0])}
            />

          </div>

          {/* Botão */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 rounded text-white
              ${loading ? "bg-gray-400" : "bg-primary hover:opacity-90"}
            `}
          >
            {loading ? "Importando..." : "Importar partidas"}
          </button>

        </div>

      </div>

    </div>
  );
}