import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

const positionOrder = ["Goleiro", "Lateral", "Zagueiro", "Meio-campista", "Atacante"];

const positionMeta = {
  "Goleiro":       { label: "Goleiros",       accent: "from-amber-400 to-orange-500",   badge: "bg-amber-100 text-amber-700",    dot: "bg-amber-400" },
  "Lateral":       { label: "Laterais",        accent: "from-sky-400 to-blue-600",       badge: "bg-sky-100 text-sky-700",        dot: "bg-sky-400" },
  "Zagueiro":      { label: "Zagueiros",       accent: "from-emerald-400 to-teal-600",   badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  "Meio-campista": { label: "Meio campistas",  accent: "from-violet-400 to-purple-600",  badge: "bg-violet-100 text-violet-700",  dot: "bg-violet-400" },
  "Atacante":      { label: "Atacantes",        accent: "from-rose-400 to-red-600",       badge: "bg-rose-100 text-rose-700",      dot: "bg-rose-400" },
};

function PlayerCard({ player }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const meta = positionMeta[player.position] || positionMeta["Meio-campista"];

  return (
    <div
      onClick={() => navigate(`/dashboard/players/${player.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group cursor-pointer"
      style={{ transition: "transform 0.2s", transform: hovered ? "translateY(-4px)" : "translateY(0)" }}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-lg group-hover:border-gray-200 transition-all duration-200">
        <div className={`h-1 w-full bg-gradient-to-r ${meta.accent}`} />

        {/* Photo / Avatar */}
        <div className="relative bg-gray-50 aspect-square overflow-hidden">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=f3f4f6&color=6b7280&size=200`}
            alt={player.name}
            className="w-full h-full object-cover object-top"
          />
          {player.number != null && (
            <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-sm">
              {player.number}
            </span>
          )}
          {/* Flag */}
          {player.flag_url ? (
            <img
              src={player.flag_url}
              alt={player.nationality}
              className="absolute bottom-2 left-2 w-5 h-4 rounded-sm object-cover shadow-sm"
            />
          ) : (
            <span className="absolute bottom-2 left-2 text-xs text-gray-400 bg-white/80 px-1 rounded">
              {player.nationality?.slice(0, 3)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="px-3 py-2.5">
          <p className="text-gray-900 text-xs font-bold truncate">{player.name}</p>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.badge}`}>
              {player.position}
            </span>
            {player.age && (
              <span className="text-[10px] text-gray-400 font-medium">{player.age} anos</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClubPlayers() {
  const { id }     = useParams();
  const [season, setSeason]                 = useState("2025");
  const [players, setPlayers]               = useState([]);
  const [availableSeasons, setAvailableSeasons] = useState(["2025"]);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    loadPlayers();
  }, [id, season]);

  async function loadPlayers() {
    try {
      setLoading(true);
      const { data } = await api.get(`/dashboard/clubs/${id}/sports/players?season=${season}`);
      setPlayers(data.players);
      if (data.availableSeasons?.length) {
        setAvailableSeasons(data.availableSeasons.map(String));
        // se a temporada atual não está disponível, usa a mais recente
        if (!data.availableSeasons.includes(Number(season))) {
          setSeason(String(data.availableSeasons[0]));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const grouped = positionOrder.reduce((acc, pos) => {
    const list = players.filter(p => p.position === pos);
    if (list.length) acc[pos] = list;
    return acc;
  }, {});

  return (
    <div className="w-full pb-12">
      {/* Season selector */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm font-medium text-gray-500">Selecione a temporada</span>
        <select
          value={season}
          onChange={e => setSeason(e.target.value)}
          className="border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          {availableSeasons.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="animate-spin w-5 h-5" />
          <span className="text-sm">Carregando elenco...</span>
        </div>
      )}

      {!loading && players.length === 0 && (
        <div className="py-16 text-center text-gray-400 text-sm">
          Nenhum jogador encontrado para a temporada {season}.
        </div>
      )}

      {!loading && players.length > 0 && (
        <div className="space-y-10">
          {Object.entries(grouped).map(([pos, list]) => {
            const meta = positionMeta[pos];
            return (
              <div key={pos}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                  <h2 className="text-lg font-bold text-gray-900">{meta.label}</h2>
                  <span className="text-sm text-gray-400 font-medium">{list.length}</span>
                  <div className="flex-1 h-px bg-gray-100 ml-1" />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {list.map(player => <PlayerCard key={player.id} player={player} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
