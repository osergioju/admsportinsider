import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { 
  Loader2, 
  UploadCloud, 
  Trophy, 
  ArrowRight, 
  CheckCircle2, 
  Calendar,
  LayoutGrid
} from "lucide-react";

export default function UploadMatchesPage() {
  const [file, setFile] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [league, setLeague] = useState("");
  const [season, setSeason] = useState("");
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

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
      setImportResult(null);

      const { data } = await api.post(
        "upload/import/matches",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setImportResult(data);
      setFile(null);
      alert("Importação concluída com sucesso!");

    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Erro ao importar partidas");
    } finally {
      setLoading(false);
    }
  };

  // --- ESTILOS PADRÃO ---
  const btnPrimary = "flex items-center justify-center gap-2 px-8 py-3.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto";
  const selectClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7F33D9] transition-all font-light";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1";

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Centralizado */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
            <Trophy className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">
            Upload de Partidas
        </h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto font-light">
            Alimente o banco de dados carregando os resultados históricos das rodadas.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Coluna de Configurações (Esquerda) */}
        <div className="lg:col-span-1 space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div>
                <label className={labelClass}>Liga</label>
                <div className="relative">
                    <select
                        value={league}
                        onChange={(e) => setLeague(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">Selecione a Liga</option>
                        {leagues.map((l) => (
                            <option key={l.id_league} value={l.id_league}>{l.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className={labelClass}>Temporada</label>
                <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className={selectClass}
                >
                    <option value="">Ano base</option>
                    {[2021, 2022, 2023, 2024, 2025, 2026].map((year) => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Coluna de Upload (Direita) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 animate-in zoom-in-95 duration-300">
                
                {/* Dropzone */}
                <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-10 hover:border-[#7F33D9] hover:bg-purple-50/30 transition-all duration-300">
                    <input
                        type="file"
                        accept=".csv,.xlsx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        onChange={(e) => {
                            setFile(e.target.files[0]);
                            setImportResult(null);
                        }}
                    />
                    <div className="flex flex-col items-center gap-4 pointer-events-none">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${file ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-[#7F33D9]'}`}>
                            <UploadCloud className="w-7 h-7" />
                        </div>
                        <div className="text-center">
                            <span className={`text-lg font-bold block ${file ? 'text-green-600' : 'text-gray-700 group-hover:text-[#7F33D9]'}`}>
                                {file ? file.name : "Selecionar Arquivo de Partidas"}
                            </span>
                            <p className="text-sm text-gray-400 mt-1">Suporta .csv ou .xlsx</p>
                        </div>
                    </div>
                </div>

                {/* Resultado da Importação */}
                {importResult && (
                    <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-black text-gray-400">Total</p>
                            <p className="text-lg font-bold text-gray-700">{importResult.total}</p>
                        </div>
                        <div className="text-center border-x border-gray-200">
                            <p className="text-[10px] uppercase font-black text-green-400">Inseridos</p>
                            <p className="text-lg font-bold text-green-600">{importResult.inserted}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-black text-orange-400">Ignorados</p>
                            <p className="text-lg font-bold text-orange-600">{importResult.skipped}</p>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !file}
                        className={btnPrimary}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin w-5 h-5" />
                                Importando Partidas...
                            </>
                        ) : (
                            <>
                                Processar Dados <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}