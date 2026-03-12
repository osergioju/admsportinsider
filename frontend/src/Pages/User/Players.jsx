import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Target, Clock, Shield, ChevronDown, Filter } from "lucide-react";

const mockPlayer = {
  name: "Léo Jardim",
  nickname: "Léo",
  nationality: "Brasileira",
  birthdate: "03/01/1994",
  age: 31,
  position: "Goleiro",
  agent: "Jorge Mendes",
  photo: "https://img.a.transfermarkt.technology/portrait/header/342229-1694600884.jpg?lll=1",
  club: {
    name: "Club de Regatas Vasco da Gama",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Vasco_da_Gama_logo.png/240px-Vasco_da_Gama_logo.png",
    founded: "21 de agosto de 1898",
    age: 127,
    stadium: "São Januário",
    structure: "SAF",
  },
};

const seasons = ["2025", "2024", "2023", "2022"];
const competitions = ["Brasileirão", "Copa do Brasil", "Carioca"];

const summaryStats = [
  { label: "Partidas", value: 8 },
  { label: "Gols", value: 0 },
  { label: "Assistências", value: 2 },
  { label: "Vitórias", value: 5 },
  { label: "Derrotas", value: 1 },
  { label: "Empates", value: 2 },
  { label: "Amarelos", value: 2 },
  { label: "Vermelhos", value: 0 },
];

const statsGroups = [
  {
    title: "Estatísticas no campeonato",
    icon: Target,
    rows: [
      { label: "Gols (total / casa / fora)", value: "0 / 0 / 0" },
      { label: "Assistências (total / casa / fora)", value: "2 / 1 / 1" },
      { label: "Pênaltis convertidos", value: "0" },
      { label: "Pênaltis perdidos", value: "0" },
      { label: "Impedimentos", value: "0" },
      { label: "Jogos sem sofrer gols (total / casa / fora)", value: "3 / 2 / 1" },
      { label: "Chutes", value: "0" },
      { label: "Chutes por jogo", value: "0.0" },
      { label: "Chutes a gol", value: "0" },
      { label: "Chutes a gol por jogo (%)", value: "0 (0%)" },
      { label: "Passes certos (total / %)", value: "320 (88%)" },
      { label: "Passes curtos", value: "210" },
      { label: "Passes longos", value: "110" },
      { label: "Passes-chave", value: "4" },
      { label: "Desarmes", value: "0" },
      { label: "Interceptações", value: "1" },
      { label: "Cruzamentos certos (%)", value: "0 (0%)" },
      { label: "Dribles (total / certos)", value: "0 / 0" },
      { label: "Duelos (% vencidos)", value: "12 (58%)" },
      { label: "Defesas", value: "28" },
      { label: "Defesas dentro da área", value: "22" },
    ],
  },
  {
    title: "Minutagem",
    icon: Clock,
    rows: [
      { label: "Minutos (total / casa / fora)", value: "720 / 360 / 360" },
      { label: "Minutos por jogo", value: "90" },
      { label: "Partidas (total / casa / fora)", value: "8 / 4 / 4" },
      { label: "Partidas como titular", value: "8" },
    ],
  },
  {
    title: "Disciplinar",
    icon: Shield,
    rows: [
      { label: "Cartões amarelos", value: "2" },
      { label: "Cartões vermelhos", value: "0" },
    ],
  },
];

export default function Players() {
  const navigate = useNavigate();
  const [season, setSeason] = useState("2025");
  const [activeComp, setActiveComp] = useState("Brasileirão");
  const [seasonOpen, setSeasonOpen] = useState(false);

  return (
    <div className="w-full pb-12 space-y-4">

      {/* Season selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Temporada
          </span>
          <div className="relative">
            <button
              onClick={() => setSeasonOpen((v) => !v)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:border-gray-300 transition-colors"
            >
              {season}
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${seasonOpen ? "rotate-180" : ""}`} />
            </button>
            {seasonOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 min-w-28 overflow-hidden">
                {seasons.map((s) => (
                  <div
                    key={s}
                    onClick={() => { setSeason(s); setSeasonOpen(false); }}
                    className={`px-4 py-2 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors ${s === season ? "text-violet-600 font-semibold" : "text-gray-700"}`}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-700 transition-colors">
          <Filter size={13} />
          Filtrar
        </button>
      </div>

      {/* Player card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Back nav */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors font-medium"
          >
            <ChevronLeft size={16} />
            Voltar para o elenco
          </button>
        </div>

        {/* Player info */}
        <div className="flex flex-col sm:flex-row gap-6 px-6 py-5">
          <div className="flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={mockPlayer.photo}
              alt={mockPlayer.name}
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 mb-3">{mockPlayer.name}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-1.5">
              {[
                { label: "Nome", value: mockPlayer.name },
                { label: "Apelido", value: mockPlayer.nickname },
                { label: "Nacionalidade", value: "🇧🇷 " + mockPlayer.nationality },
                { label: "Nascimento (idade)", value: `${mockPlayer.birthdate} (${mockPlayer.age} anos)` },
                { label: "Posição", value: mockPlayer.position },
                { label: "Empresário", value: mockPlayer.agent },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-36 flex-shrink-0 pt-0.5 leading-5">
                    {item.label}
                  </span>
                  <span className="text-sm text-gray-800 font-medium leading-5">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Competition tabs */}
        <div className="flex gap-6 px-6 border-t border-gray-100">
          {competitions.map((comp) => (
            <button
              key={comp}
              onClick={() => setActiveComp(comp)}
              className={`text-sm font-semibold py-3 border-b-2 transition-colors ${
                activeComp === comp
                  ? "text-gray-900 border-gray-900"
                  : "text-gray-400 border-transparent hover:text-gray-600"
              }`}
            >
              {comp}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {summaryStats.map(({ label, value }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-4 px-2 gap-1 hover:border-gray-300 transition-colors"
          >
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-[10px] font-semibold text-gray-400 text-center uppercase tracking-wide leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Stat tables */}
      {statsGroups.map(({ title, icon: Icon, rows }) => (
        <div key={title} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon size={14} className="text-gray-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-widest px-6 py-3">
                  Item
                </th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-widest px-6 py-3">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, value }, i) => (
                <tr
                  key={label}
                  className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  }`}
                >
                  <td className="px-6 py-3 text-sm text-gray-600">{label}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

    </div>
  );
}