import { useState } from "react";
import { api } from "../../../services/api";
import { 
  Loader2, 
  UploadCloud, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Info 
} from "lucide-react";

export default function UploadPlayersPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Aceitando CSV e XLSX conforme o padrão das outras páginas
    const allowedExtensions = [".csv", ".xlsx"];
    const isValid = allowedExtensions.some(ext => selected.name.toLowerCase().endsWith(ext));

    if (!isValid) {
      alert("O arquivo precisa ser .csv ou .xlsx");
      return;
    }

    setFile(selected);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Selecione um arquivo de dados.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setSuccess(false);

      const { data } = await api.post(
        "/upload/import/players",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setSuccess(true);
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

  // --- ESTILOS PADRÃO ---
  const btnPrimary = "flex items-center justify-center gap-2 px-8 py-3.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto";

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Centralizado */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
            <Users className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            Importar Jogadores
        </h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto font-light">
            Carregue a base de dados dos atletas para atualizar estatísticas e elencos da temporada.
        </p>
      </div>

      {/* Card de Upload Principal */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 animate-in zoom-in-95 duration-300">
        
        {/* Dropzone Area */}
        <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-10 hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all duration-300">
          <input
              type="file"
              accept=".csv,.xlsx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-4 pointer-events-none">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${file ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:shadow-md group-hover:text-[#7F33D9]'}`}>
                  {success ? <CheckCircle2 className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
              </div>
              <div className="text-center">
                  <span className={`text-lg font-bold block transition-colors ${file ? 'text-green-600' : 'text-gray-700 group-hover:text-[#7F33D9]'}`}>
                      {file ? file.name : "Selecionar Base de Jogadores"}
                  </span>
                  <p className="text-sm text-gray-400 mt-1 italic">
                    Formatos suportados: .csv ou .xlsx
                  </p>
              </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700">
          <Info size={20} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed font-medium">
            <strong>Dica:</strong> Certifique-se de que os nomes dos clubes na planilha coincidem com os cadastrados no sistema para evitar jogadores sem vínculo.
          </p>
        </div>

        {/* Botão de Ação */}
        <div className="mt-8 flex justify-center">
          <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className={btnPrimary}
          >
              {loading ? (
              <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Processando Atletas...
              </>
              ) : (
              <>
                  Iniciar Importação <ArrowRight size={18} />
              </>
              )}
          </button>
        </div>

      </div>

      {/* Feedback de Sucesso */}
      {success && (
        <div className="mt-6 text-center animate-in fade-in slide-in-from-top-2">
            <p className="text-green-600 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Base de jogadores atualizada com sucesso!
            </p>
        </div>
      )}
    </div>
  );
}