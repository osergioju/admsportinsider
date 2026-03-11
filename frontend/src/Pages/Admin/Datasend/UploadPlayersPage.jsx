import { useState } from "react";
import { api } from "../../../services/api";

export default function UploadPlayersPage() {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];

    if (!selected) return;

    if (!selected.name.endsWith(".csv")) {
      alert("O arquivo precisa ser .csv");
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async () => {

    if (!file) {
      alert("Selecione um arquivo XLSX.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {

      setLoading(true);

      const { data } = await api.post(
        "/upload/import/players",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert("Players importados com sucesso!");
      console.log(data);

      setFile(null);

    } catch (err) {

      console.error(err);

      alert(
        err?.response?.data?.error ||
        "Erro ao importar players."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">

      <h1 className="text-2xl font-semibold mb-6">
        Importar Players
      </h1>

      <div className="bg-white rounded-xl p-6 shadow max-w-xl">

        <div className="flex flex-col gap-4">

          {/* INPUT FILE */}

          <div>
            <label className="block text-sm font-medium mb-2">
              Arquivo XLSX
            </label>

            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="border rounded w-full p-2"
            />

            {file && (
              <p className="text-xs text-gray-500 mt-2">
                Arquivo selecionado: <strong>{file.name}</strong>
              </p>
            )}

            <p className="text-xs text-gray-400 mt-1">
              O arquivo deve conter os dados de jogadores da temporada.
            </p>

          </div>

          {/* BOTÃO */}

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className={`px-4 py-2 rounded text-white transition
              ${
                loading || !file
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:opacity-90"
              }`}
          >
            {loading ? "Importando players..." : "Enviar XLSX"}

          </button>

        </div>

      </div>

    </div>
  );
}