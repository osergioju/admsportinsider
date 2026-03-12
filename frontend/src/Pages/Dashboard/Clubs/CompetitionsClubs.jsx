import { useState } from "react";

// Mock data para demonstração
const mockCompetitions = [
  {
    id: 1,
    type: "NACIONAL",
    name: "Brasileirão Série A",
    expanded: true,
    standings: [
      { pos: 1,  name: "Palmeiras",     pts: 7, j: 3, v: 2, e: 1, d: 0, gp: 10, gc: 4, sg: 6,  pct: 77, form: ["W","W","D"], isMain: false },
      { pos: 2,  name: "São Paulo",      pts: 7, j: 3, v: 2, e: 1, d: 0, gp: 5,  gc: 2, sg: 3,  pct: 77, form: ["W","D","W"], isMain: false },
      { pos: 3,  name: "Fluminense",     pts: 7, j: 3, v: 2, e: 1, d: 0, gp: 4,  gc: 2, sg: 2,  pct: 77, form: ["W","W","D"], isMain: false },
      { pos: 4,  name: "Bahia",          pts: 7, j: 3, v: 2, e: 1, d: 0, gp: 4,  gc: 2, sg: 2,  pct: 77, form: ["W","D","W"], isMain: false },
      { pos: 5,  name: "Corinthians",    pts: 6, j: 3, v: 2, e: 0, d: 1, gp: 4,  gc: 2, sg: 2,  pct: 66, form: ["W","W","L"], isMain: false },
      { pos: 6,  name: "Athletico-PR",   pts: 6, j: 3, v: 2, e: 0, d: 1, gp: 3,  gc: 2, sg: 1,  pct: 66, form: ["L","W","W"], isMain: false },
      { pos: 7,  name: "Bragantino",     pts: 6, j: 3, v: 2, e: 0, d: 1, gp: 2,  gc: 2, sg: 0,  pct: 66, form: ["W","W","L"], isMain: false },
      { pos: 8,  name: "Chapecoense",    pts: 5, j: 3, v: 1, e: 2, d: 0, gp: 8,  gc: 6, sg: 2,  pct: 55, form: ["D","W","D"], isMain: false },
      { pos: 9,  name: "Mirassol",       pts: 5, j: 3, v: 1, e: 2, d: 0, gp: 6,  gc: 5, sg: 1,  pct: 55, form: ["D","D","W"], isMain: false },
      { pos: 10, name: "Vasco da Gama",  pts: 4, j: 3, v: 1, e: 1, d: 1, gp: 5,  gc: 5, sg: 0,  pct: 44, form: ["W","L","D"], isMain: false },
      { pos: 11, name: "Flamengo",       pts: 4, j: 3, v: 1, e: 1, d: 1, gp: 4,  gc: 4, sg: 0,  pct: 44, form: ["D","W","L"], isMain: false },
      { pos: 12, name: "Grêmio",         pts: 3, j: 3, v: 1, e: 0, d: 2, gp: 3,  gc: 5, sg: -2, pct: 33, form: ["W","L","L"], isMain: true  },
      { pos: 13, name: "Internacional",  pts: 3, j: 3, v: 1, e: 0, d: 2, gp: 2,  gc: 4, sg: -2, pct: 33, form: ["L","W","L"], isMain: false },
      { pos: 14, name: "Santos",         pts: 2, j: 3, v: 0, e: 2, d: 1, gp: 2,  gc: 3, sg: -1, pct: 22, form: ["D","L","D"], isMain: false },
      { pos: 15, name: "Botafogo",       pts: 2, j: 3, v: 0, e: 2, d: 1, gp: 1,  gc: 2, sg: -1, pct: 22, form: ["D","D","L"], isMain: false },
      { pos: 16, name: "Cruzeiro",       pts: 1, j: 3, v: 0, e: 1, d: 2, gp: 1,  gc: 4, sg: -3, pct: 11, form: ["L","D","L"], isMain: false },
      { pos: 17, name: "Atlético-MG",    pts: 1, j: 3, v: 0, e: 1, d: 2, gp: 1,  gc: 5, sg: -4, pct: 11, form: ["L","L","D"], isMain: false },
      { pos: 18, name: "Fortaleza",      pts: 0, j: 3, v: 0, e: 0, d: 3, gp: 0,  gc: 6, sg: -6, pct: 0,  form: ["L","L","L"], isMain: false },
      { pos: 19, name: "Juventude",      pts: 0, j: 3, v: 0, e: 0, d: 3, gp: 0,  gc: 7, sg: -7, pct: 0,  form: ["L","L","L"], isMain: false },
      { pos: 20, name: "Sport",          pts: 0, j: 3, v: 0, e: 0, d: 3, gp: 0,  gc: 8, sg: -8, pct: 0,  form: ["L","L","L"], isMain: false },
    ],
    stats: [
      { item: "Chutes (total, mandante/casa e visitante/fora)", avg: "4.2" },
      { item: "Chutes a gol (total, mandante/casa e visitante/fora)", avg: "1.8" },
      { item: "Posse de bola (total, mandante/casa e visitante/fora)", avg: "48%" },
      { item: "Jogos sem sofrer gols", avg: "0" },
      { item: "Escanteios (total, mandante/casa e visitante/fora)", avg: "5.1" },
      { item: "Vencendo no intervalo", avg: "1" },
    ],
    discipline: [
      { item: "Faltas", avg: "12.4" },
      { item: "Cartões amarelos", avg: "1.8" },
      { item: "Cartões vermelhos", avg: "0.2" },
    ],
    financial: [
      { item: "Público (total)", avg: "42.000" },
      { item: "Público (média)", avg: "14.000" },
      { item: "Receita (total)", avg: "R$ 1.2M" },
      { item: "Receita (média)", avg: "R$ 400K" },
      { item: "Tíquete médio", avg: "R$ 85" },
      { item: "Ocupação média", avg: "72%" },
    ],
  },
  { id: 2, type: "NACIONAL", name: "Copa do Brasil", expanded: false, standings: [], stats: [], discipline: [], financial: [] },
  { id: 3, type: "NACIONAL", name: "Recopa", expanded: false, standings: [], stats: [], discipline: [], financial: [] },
  { id: 4, type: "ESTADUAL", name: "Campeonato Gaúcho", expanded: false, standings: [], stats: [], discipline: [], financial: [] },
  { id: 5, type: "CONTINENTAL", name: "Libertadores", expanded: false, standings: [], stats: [], discipline: [], financial: [] },
  { id: 6, type: "CONTINENTAL", name: "Sudamericana", expanded: false, standings: [], stats: [], discipline: [], financial: [] },
  { id: 7, type: "INTERCONTINENTAL", name: "Mundial de Clubes FIFA", expanded: false, standings: [], stats: [], discipline: [], financial: [] },
];

const FormBadge = ({ result }) => {
  const colors = {
    W: "bg-emerald-500 text-white",
    D: "bg-gray-400 text-white",
    L: "bg-red-500 text-white",
  };
  return (
    <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${colors[result]}`}>
      {result === "W" ? "V" : result === "D" ? "E" : "D"}
    </span>
  );
};

export default function CompetitionsClubs() {
  const [competitions, setCompetitions] = useState(mockCompetitions);
  const [season, setSeason] = useState("2025");

  const toggle = (id) =>
    setCompetitions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c))
    );

  const mainClubIndex = competitions[0].standings.findIndex((s) => s.isMain);

  // Rows a mostrar: 3 acima, o clube, 3 abaixo (janela deslizante)
  const getVisibleRows = (standings) => {
    const idx = standings.findIndex((s) => s.isMain);
    if (idx === -1) return standings.slice(0, 9);
    const start = Math.max(0, idx - 3);
    const end = Math.min(standings.length, idx + 4);
    return standings.slice(start, end);
  };

  const typeColor = {
    NACIONAL: "text-violet-500",
    ESTADUAL: "text-blue-500",
    CONTINENTAL: "text-amber-500",
    INTERCONTINENTAL: "text-rose-500",
  };

  return (
    <div className="w-full space-y-4 pb-10">
      {/* Season selector */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-medium text-gray-500">Selecione a temporada</span>
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          {["2025", "2024", "2023", "2022"].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <button className="bg-gray-900 text-white text-sm px-5 py-1.5 rounded-full font-medium hover:bg-gray-700 transition-colors">
          Filtrar →
        </button>
      </div>

      <h2 className="text-xl font-bold text-gray-900">Campeonatos</h2>

      {competitions.map((comp) => (
        <div key={comp.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          {/* Accordion header */}
          <button
            onClick={() => toggle(comp.id)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold uppercase tracking-widest ${typeColor[comp.type] || "text-gray-400"}`}>
                {comp.type}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-semibold text-gray-800">{comp.name}</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${comp.expanded ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Expanded content */}
          {comp.expanded && comp.standings.length > 0 && (
            <div className="px-5 pb-6 space-y-6 border-t border-gray-100">
              
              {/* Classificação */}
              <div className="pt-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Classificação</h3>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider">
                        <th className="text-left px-3 py-2.5 font-semibold w-6">#</th>
                        <th className="text-left px-3 py-2.5 font-semibold">Clube</th>
                        <th className="px-2 py-2.5 font-semibold text-center">P</th>
                        <th className="px-2 py-2.5 font-semibold text-center">J</th>
                        <th className="px-2 py-2.5 font-semibold text-center">V</th>
                        <th className="px-2 py-2.5 font-semibold text-center">E</th>
                        <th className="px-2 py-2.5 font-semibold text-center">D</th>
                        <th className="px-2 py-2.5 font-semibold text-center">GP</th>
                        <th className="px-2 py-2.5 font-semibold text-center">GC</th>
                        <th className="px-2 py-2.5 font-semibold text-center">SG</th>
                        <th className="px-2 py-2.5 font-semibold text-center">%</th>
                        <th className="px-3 py-2.5 font-semibold text-center">Ult. jogos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getVisibleRows(comp.standings).map((team, i, arr) => {
                        const isMain = team.isMain;
                        const prevTeam = arr[i - 1];
                        const nextTeam = arr[i + 1];
                        const showTopGap = i > 0 && prevTeam && !prevTeam.isMain && team.pos - prevTeam.pos > 1;
                        const isAboveMain = nextTeam?.isMain;
                        const isBelowMain = prevTeam?.isMain;

                        return (
                          <>
                            {showTopGap && (
                              <tr key={`gap-${team.pos}`}>
                                <td colSpan={12} className="py-1 px-3">
                                  <div className="border-t border-dashed border-gray-200" />
                                </td>
                              </tr>
                            )}
                            <tr
                              key={team.pos}
                              className={`border-b border-gray-50 transition-colors ${
                                isMain
                                  ? "bg-violet-50 border-l-4 border-l-violet-500 font-bold"
                                  : "hover:bg-gray-50/60"
                              }`}
                            >
                              <td className={`px-3 py-2.5 font-bold ${isMain ? "text-violet-600" : "text-gray-400"}`}>
                                {team.pos}
                              </td>
                              <td className={`px-3 py-2.5 font-semibold ${isMain ? "text-violet-700" : "text-gray-700"}`}>
                                {team.name}
                                {isMain && (
                                  <span className="ml-2 text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">
                                    você
                                  </span>
                                )}
                              </td>
                              <td className={`px-2 py-2.5 text-center font-bold ${isMain ? "text-violet-700" : "text-gray-800"}`}>{team.pts}</td>
                              <td className="px-2 py-2.5 text-center text-gray-600">{team.j}</td>
                              <td className="px-2 py-2.5 text-center text-gray-600">{team.v}</td>
                              <td className="px-2 py-2.5 text-center text-gray-600">{team.e}</td>
                              <td className="px-2 py-2.5 text-center text-gray-600">{team.d}</td>
                              <td className="px-2 py-2.5 text-center text-gray-600">{team.gp}</td>
                              <td className="px-2 py-2.5 text-center text-gray-600">{team.gc}</td>
                              <td className={`px-2 py-2.5 text-center font-semibold ${team.sg > 0 ? "text-emerald-600" : team.sg < 0 ? "text-red-500" : "text-gray-400"}`}>
                                {team.sg > 0 ? `+${team.sg}` : team.sg}
                              </td>
                              <td className="px-2 py-2.5 text-center text-gray-500">{team.pct}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex gap-1 justify-center">
                                  {team.form.map((r, fi) => <FormBadge key={fi} result={r} />)}
                                </div>
                              </td>
                            </tr>
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">
                  Exibindo posições ao redor do seu clube · {comp.standings.length} times no total
                </p>
              </div>

              {/* Estatísticas no campeonato */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">Estatísticas no campeonato</h3>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                        <th className="text-left px-4 py-2.5 font-semibold">Item</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Média por partida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comp.stats.map((s, i) => (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                          <td className="px-4 py-2.5 text-gray-600">{s.item}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-violet-600">{s.avg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Estatísticas disciplinares */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">Estatísticas disciplinares</h3>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                        <th className="text-left px-4 py-2.5 font-semibold">Item</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Média por partida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comp.discipline.map((s, i) => (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                          <td className="px-4 py-2.5 text-gray-600">{s.item}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-violet-600">{s.avg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Estatísticas financeiras */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">Financeiro</h3>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                        <th className="text-left px-4 py-2.5 font-semibold">Financeiro</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Geral</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comp.financial.map((s, i) => (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                          <td className="px-4 py-2.5 text-gray-600">{s.item}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-violet-600">{s.avg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {comp.expanded && comp.standings.length === 0 && (
            <div className="px-5 py-10 text-center text-gray-400 text-sm border-t border-gray-100">
              Nenhum dado disponível para esta competição nesta temporada.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}