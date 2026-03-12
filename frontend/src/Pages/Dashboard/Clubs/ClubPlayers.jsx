import { useState } from "react";
import { useNavigate } from "react-router-dom";

const mockPlayers = [
  { id: 1, name: "Hugo Souza", position: "Goleiro", number: 1, age: 26, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/234804-1692882395.jpg" },
  { id: 2, name: "Léo Jardim", position: "Goleiro", number: 23, age: 28, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 3, name: "Ivan", position: "Goleiro", number: 98, age: 24, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },

  { id: 4, name: "Puma Rodríguez", position: "Lateral", number: 22, age: 29, nationality: "🇺🇾", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 5, name: "Lucas Piton", position: "Lateral", number: 6, age: 24, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 6, name: "Paulo Henrique", position: "Lateral", number: 2, age: 27, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 7, name: "Adrián Martínez", position: "Lateral", number: 33, age: 25, nationality: "🇨🇴", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },

  { id: 8, name: "Maicon", position: "Zagueiro", number: 4, age: 32, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 9, name: "João Victor", position: "Zagueiro", number: 3, age: 26, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 10, name: "Léo", position: "Zagueiro", number: 5, age: 30, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },

  { id: 11, name: "Paulinho", position: "Meio-campista", number: 8, age: 23, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 12, name: "Matheus Carvalho", position: "Meio-campista", number: 17, age: 22, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 13, name: "Galdames", position: "Meio-campista", number: 20, age: 27, nationality: "🇨🇱", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 14, name: "Jair", position: "Meio-campista", number: 25, age: 28, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },

  { id: 15, name: "David", position: "Atacante", number: 9, age: 26, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 16, name: "Vegetti", position: "Atacante", number: 99, age: 35, nationality: "🇦🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 17, name: "GB", position: "Atacante", number: 11, age: 24, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
  { id: 18, name: "Rayan", position: "Atacante", number: 77, age: 19, nationality: "🇧🇷", img: "https://img.a.transfermarkt.technology/portrait/medium/326005-1692882395.jpg" },
];

const positionOrder = ["Goleiro", "Lateral", "Zagueiro", "Meio-campista", "Atacante"];

const positionMeta = {
  "Goleiro":       { label: "Goleiros",       accent: "from-amber-400 to-orange-500",   badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-400" },
  "Lateral":       { label: "Laterais",        accent: "from-sky-400 to-blue-600",       badge: "bg-sky-100 text-sky-700",       dot: "bg-sky-400" },
  "Zagueiro":      { label: "Zagueiros",       accent: "from-emerald-400 to-teal-600",   badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  "Meio-campista": { label: "Meio campistas",  accent: "from-violet-400 to-purple-600",  badge: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  "Atacante":      { label: "Atacantes",       accent: "from-rose-400 to-red-600",       badge: "bg-rose-100 text-rose-700",     dot: "bg-rose-400" },
};

function PlayerCard({ player }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const meta = positionMeta[player.position];

  return (
    <div
      onClick={() => navigate(`/dashboard/players/${player.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group cursor-pointer"
      style={{ transition: "transform 0.2s", transform: hovered ? "translateY(-4px)" : "translateY(0)" }}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-lg group-hover:border-gray-200 transition-all duration-200">
        {/* Color bar top */}
        <div className={`h-1 w-full bg-gradient-to-r ${meta.accent}`} />

        {/* Photo */}
        <div className="relative bg-gray-50 aspect-square overflow-hidden">
          <img
            src={player.img}
            alt={player.name}
            className="w-full h-full object-cover object-top"
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=f3f4f6&color=6b7280&size=200`; }}
          />
          {/* Number badge */}
          <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-sm">
            {player.number}
          </span>
          {/* Nationality */}
          <span className="absolute bottom-2 left-2 text-base leading-none">
            {player.nationality}
          </span>
        </div>

        {/* Info */}
        <div className="px-3 py-2.5">
          <p className="text-gray-900 text-xs font-bold truncate">{player.name}</p>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.badge}`}>
              {player.position}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">{player.age} anos</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClubPlayers() {
  const [season, setSeason] = useState("2026");

  const grouped = positionOrder.reduce((acc, pos) => {
    const players = mockPlayers.filter((p) => p.position === pos);
    if (players.length) acc[pos] = players;
    return acc;
  }, {});

  return (
    <div className="w-full pb-12">
      {/* Season selector */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm font-medium text-gray-500">Selecione a temporada</span>
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          {["2026", "2025", "2024", "2023"].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <button className="bg-gray-900 text-white text-sm px-5 py-1.5 rounded-full font-medium hover:bg-gray-700 transition-colors">
          Filtrar →
        </button>
      </div>

      {/* Sections per position */}
      <div className="space-y-10">
        {Object.entries(grouped).map(([pos, players]) => {
          const meta = positionMeta[pos];
          return (
            <div key={pos}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                <h2 className="text-lg font-bold text-gray-900">{meta.label}</h2>
                <span className="text-sm text-gray-400 font-medium">{players.length}</span>
                <div className="flex-1 h-px bg-gray-100 ml-1" />
              </div>

              {/* Players grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {players.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}