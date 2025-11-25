import { useState, useEffect } from "react";
import { api } from "../../../services/api"; 

export default function SendLeaguePage() {
  const [countries, setCountries] = useState([]);
  const [countryId, setCountryId] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [file, setFile] = useState(null);

  // Carrega países quando a página abre
  useEffect(() => {
    async function loadCountries() {
      try {
        const { data } = await api.get("/admin/countries");
        setCountries(data.countries);
      } catch (err) {
        console.error("Erro ao carregar países:", err);
      }
    }
    loadCountries();
  }, []);

  const handleSubmit = async () => {
    if (!countryId || !leagueName || !file) {
      alert("Preencha todos os campos.");
      return;
    }

    const formData = new FormData();
    formData.append("countryId", countryId);
    formData.append("leagueName", leagueName);
    formData.append("file", file);

    try {
      const { data } = await api.post(
        "/admin/leagues/import-balance",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Balanço enviado com sucesso!");
      console.log(data);

    } catch (err) {
      console.error(err);
      alert("Erro ao enviar balanço.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload de Balanço da Liga</h1>

      <div className="bg-white rounded-xl p-6 shadow">

        <div className="flex flex-col gap-4">

          {/* País */}
          <div>
            <label className="block text-sm font-medium mb-1">País</label>
            <select
              className="border rounded w-full p-2"
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
            >
              <option value="">Selecione um país</option>

              {countries.map((c) => (
                <option key={c.id_country} value={c.id_country}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nome da liga */}
          <div>
            <label className="block text-sm font-medium mb-1">Nome da liga</label>
            <input
              type="text"
              className="border rounded w-full p-2"
              placeholder="Ex: Brasileirão Série A"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
            />
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
