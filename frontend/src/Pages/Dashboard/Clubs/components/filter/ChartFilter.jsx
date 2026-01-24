import { useState, useEffect, useMemo } from "react";
import { api } from "../../../../../services/api";

const LIMITE_CLUBES = 4;

export default function ChartFilter({
  clubesSelecionados,
  onAddClub,
  country = null
}) {
  const [busca, setBusca] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState([]);

  async function handleSearch(searchValue) {
    try {
      setLoading(true);

      const { data } = await api.post("/admin/clubs/search", {
        name: searchValue || null,
        country: country || null
      });

      setClubs(data.clubs || []);
    } catch (error) {
      console.error("Erro ao buscar clubes:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!busca) {
      setClubs([]);
      return;
    }

    handleSearch(busca);
  }, [busca]);

  const clubesFiltrados = useMemo(() => {
    return clubs.filter(
      (clube) => !clubesSelecionados.includes(clube.id_club)
    );
  }, [clubs, clubesSelecionados]);

  function handleAdd(clube) {
    if (clubesSelecionados.length >= LIMITE_CLUBES) return;

    onAddClub(clube); // passa o objeto ou id
    setBusca("");
    setIsOpen(false);
    setClubs([]);
  }

  return (
    <div className="w-full">
      <div className="flex gap-4 lg:gap-10">
        <div className="relative w-64">
          <span className="inline-block w-full text-[#AFAFB2] mb-1">
            Comparar clubes (max. 5)
          </span>

          <input
            type="text"
            value={busca}
            disabled={clubesSelecionados.length >= LIMITE_CLUBES}
            onChange={(e) => {
              setBusca(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={
              clubesSelecionados.length >= LIMITE_CLUBES
                ? "Limite de 5 clubes atingido"
                : "Digite o nome do clube"
            }
            className={`w-full border rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 
              ${
                clubesSelecionados.length >= LIMITE_CLUBES
                  ? "bg-gray-100 cursor-not-allowed"
                  : "focus:ring-[#7f34d9]"
              }`}
          />

          {clubesSelecionados.length >= LIMITE_CLUBES && (
            <p className="mt-1 text-xs text-red-500">
              Você pode comparar no máximo 5 clubes
            </p>
          )}

          {isOpen && busca && loading && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
              Buscando clubes...
            </div>
          )}

          {isOpen && busca && !loading && clubesFiltrados.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
              {clubesFiltrados.map((clube) => (
                <li
                  key={clube.id_club}
                  onClick={() => handleAdd(clube)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-[#EDE6F6]"
                >
                  {clube.name}
                </li>
              ))}
            </ul>
          )}

          {isOpen && busca && !loading && clubesFiltrados.length === 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
              Nenhum clube encontrado
            </div>
          )}
        </div>

        <div>
          <span className="inline-block w-full text-[#AFAFB2]">Período</span>
          <select className="w-full border rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7f34d9]">
            <option value="">--</option>
            <option value="5">5 anos</option>
            <option value="10">10 anos</option>
            <option value="15">15 anos</option>
          </select>
        </div>
      </div>
    </div>
  );
}
