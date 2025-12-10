import { useState, useEffect } from "react";
import { api } from "../../../services/api";

export default function SendLeaguePage() {

  const [leagues, setLeagues] = useState([]);
  const [leagueId, setLeagueId] = useState("");
  const [file, setFile] = useState(null);

  // Carrega ligas ao abrir a página
  useEffect(() => {
    async function loadLeagues() {
      try {
        const { data } = await api.get("/admin/leagues");
        setLeagues(data.leagues);
      } catch (err) {
        console.error("Erro ao carregar ligas:", err);
      }
    }
    loadLeagues();
  }, []);

  const handleSubmit = async () => {
    if (!leagueId || !file) {
      alert("Selecione a liga e envie o arquivo.");
      return;
    }

    const formData = new FormData();
    formData.append("leagueId", leagueId);
    formData.append("file", file);

    try {
      const { data } = await api.post(
        "/upload/leagues/import-balance",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Dados da liga importados com sucesso!");
      console.log(data);

    } catch (err) {
      console.error(err);
      alert("Erro ao importar balanço da liga.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload Financeiro da Liga</h1>

      <div className="bg-white rounded-xl p-6 shadow">

        <div className="flex flex-col gap-4">

          {/* Selecionar Liga */}
          <div>
            <label className="block text-sm font-medium mb-1">Liga</label>
            <select
              className="border rounded w-full p-2"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
            >
              <option value="">Selecione uma liga</option>

              {leagues.map((l) => (
                <option key={l.id_league} value={l.id_league}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Arquivo XLSX */}
          <div>
            <label className="block text-sm font-medium mb-1">Arquivo XLSX</label>
            <input
              type="file"
              accept=".xlsx"
              className="border rounded w-full p-2"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          {/* Botão */}
          <button
            onClick={handleSubmit}
            className="bg-primary text-white px-4 py-2 rounded"
          >
            Enviar
          </button>

        </div>
      </div>
    </div>
  );
}
