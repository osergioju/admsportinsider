import { useState } from "react";
import { api } from "../../../services/api";

export default function UploadTeamsPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      alert("Selecione um arquivo XLSX.");
      return;
    }

    if (!file.name.endsWith(".xlsx")) {
      alert("O arquivo deve estar no formato .xlsx");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const { data } = await api.post(
        "/upload/clubs/import-balance",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Dados dos clubes importados com sucesso!");
      console.log(data);

      setFile(null);

    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
        "Erro ao importar balanço dos clubes."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Upload Financeiro dos Clubes
      </h1>

      <div className="bg-white rounded-xl p-6 shadow max-w-xl">
        <div className="flex flex-col gap-4">

          {/* Arquivo XLSX */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Arquivo XLSX
            </label>
            <input
              type="file"
              accept=".xlsx"
              className="border rounded w-full p-2"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <p className="text-xs text-gray-500 mt-1">
              O arquivo deve conter o <strong>slug do clube</strong>.
            </p>
          </div>

          {/* Botão */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 rounded text-white
              ${loading ? "bg-gray-400" : "bg-primary hover:opacity-90"}
            `}
          >
            {loading ? "Importando..." : "Enviar"}
          </button>

        </div>
      </div>
    </div>
  );
}
