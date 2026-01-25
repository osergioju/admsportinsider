import { useState, useEffect, useMemo } from "react";
import { api } from "../../../../../services/api";

const LIMITE_LIGAS = 4;

export default function ChartFilter({
  ligasSelecionadas,
  onAddLeague,
  country = null
}) {
  const [busca, setBusca] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState([]);

  async function handleSearch(searchValue) {
    try {
      setLoading(true);

      const { data } = await api.post("/admin/leagues/search", {
        name: searchValue || null,
        country: country || null
      });

      setLeagues(data.leagues || []);
    } catch (error) {
      console.error("Erro ao buscar ligas:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!busca) {
      setLeagues([]);
      return;
    }

    handleSearch(busca);
  }, [busca]);

  const ligasFiltradas = useMemo(() => {
    return leagues.filter(
      (liga) => !ligasSelecionadas.includes(liga.id_league)
    );
  }, [leagues, ligasSelecionadas]);

  function handleAdd(liga) {
    if (ligasSelecionadas.length >= LIMITE_LIGAS) return;

    onAddLeague(liga);
    setBusca("");
    setIsOpen(false);
    setLeagues([]);
  }

  return (
    <div className="w-full mb-2 z-20 relative">
      <div className="flex gap-4 lg:gap-10">
        <div className="relative w-64">
          <span className="inline-block font-light w-full text-[#AFAFB2] mb-2">
            Comparar ligas (max. {LIMITE_LIGAS})
          </span>

          <input
            type="text"
            value={busca}
            disabled={ligasSelecionadas.length >= LIMITE_LIGAS}
            onChange={(e) => {
              setBusca(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={
              ligasSelecionadas.length >= LIMITE_LIGAS
                ? `Limite de ${LIMITE_LIGAS} ligas atingido`
                : "Digite o nome da liga"
            }
            className={`w-full border rounded-full px-4 py-4 font-light text-sm focus:outline-none focus:ring-2 
              ${
                ligasSelecionadas.length >= LIMITE_LIGAS
                  ? "bg-gray-100 cursor-not-allowed"
                  : "focus:ring-[#7f34d9]"
              }`}
          />

          {ligasSelecionadas.length >= LIMITE_LIGAS && (
            <p className="mt-1 text-xs text-red-500">
              Você pode comparar no máximo {LIMITE_LIGAS} ligas
            </p>
          )}

          {isOpen && busca && loading && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
              Buscando ligas...
            </div>
          )}

          {isOpen && busca && !loading && ligasFiltradas.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
              {ligasFiltradas.map((liga) => (
                <li
                  key={liga.id_league}
                  onClick={() => handleAdd(liga)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-[#EDE6F6]"
                >
                  {liga.name}
                </li>
              ))}
            </ul>
          )}

          {isOpen && busca && !loading && ligasFiltradas.length === 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
              Nenhuma liga encontrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
