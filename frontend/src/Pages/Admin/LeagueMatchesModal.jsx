import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Search, Save, ChevronDown, ChevronRight } from "lucide-react";
import { api } from "../../services/api";

const fmtDate = d => d ? new Date(d).toISOString().slice(0, 10) : "";

function ClubCrest({ crest, name }) {
  return crest ? (
    <img
      src={`https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_plus/reduced_reduced_${crest}.webp`}
      alt=""
      className="w-5 h-5 object-contain shrink-0"
      onError={e => { e.currentTarget.style.display = "none"; }}
    />
  ) : <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />;
}

function MatchRow({ match, onSave }) {
  const [edit, setEdit] = useState({
    home_goals: match.home_goals ?? "",
    away_goals: match.away_goals ?? "",
    winner_club_id: match.winner_club_id ?? "",
    game_week: match.game_week ?? "",
    match_date: fmtDate(match.match_date),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDraw =
    edit.home_goals !== "" &&
    edit.away_goals !== "" &&
    Number(edit.home_goals) === Number(edit.away_goals);

  const hasWinner = edit.winner_club_id !== "" && edit.winner_club_id != null;

  const dirty =
    String(edit.home_goals) !== String(match.home_goals ?? "") ||
    String(edit.away_goals) !== String(match.away_goals ?? "") ||
    String(edit.winner_club_id ?? "") !== String(match.winner_club_id ?? "") ||
    String(edit.game_week ?? "") !== String(match.game_week ?? "") ||
    fmtDate(edit.match_date) !== fmtDate(match.match_date);

  const set = (k, v) => {
    setSaved(false);
    setEdit(p => ({ ...p, [k]: v }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(match.id_match, {
        home_goals: edit.home_goals !== "" ? Number(edit.home_goals) : null,
        away_goals: edit.away_goals !== "" ? Number(edit.away_goals) : null,
        winner_club_id: edit.winner_club_id !== "" ? Number(edit.winner_club_id) : null,
        game_week: edit.game_week !== "" ? Number(edit.game_week) : null,
        match_date: edit.match_date || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-12 text-center border border-gray-200 rounded px-1 py-0.5 text-sm focus:outline-none focus:border-violet-400 bg-white tabular-nums";

  return (
    <tr className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors text-sm">
      {/* Home */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5 justify-end min-w-0">
          <span className="truncate text-gray-700 font-medium text-right">{match.home_name}</span>
          <ClubCrest crest={match.home_crest} />
        </div>
      </td>

      {/* Score */}
      <td className="px-2 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <input
            type="number" min={0}
            className={inputCls}
            value={edit.home_goals}
            onChange={e => set("home_goals", e.target.value)}
          />
          <span className="text-gray-300 font-bold">–</span>
          <input
            type="number" min={0}
            className={inputCls}
            value={edit.away_goals}
            onChange={e => set("away_goals", e.target.value)}
          />
        </div>
      </td>

      {/* Away */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <ClubCrest crest={match.away_crest} />
          <span className="truncate text-gray-700 font-medium">{match.away_name}</span>
        </div>
      </td>

      {/* Winner (visível quando empate ou já tem vencedor definido) */}
      <td className="px-2 py-2 text-center">
        {(isDraw || hasWinner) ? (
          <select
            className="border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-violet-400 bg-white text-gray-700 max-w-[130px]"
            value={edit.winner_club_id}
            onChange={e => set("winner_club_id", e.target.value)}
          >
            <option value="">Empate</option>
            <option value={match.home_club_id}>{match.home_name}</option>
            <option value={match.away_club_id}>{match.away_name}</option>
          </select>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* Game week */}
      <td className="px-2 py-2 text-center">
        <input
          type="number" min={0}
          className={`${inputCls} w-10`}
          value={edit.game_week}
          onChange={e => set("game_week", e.target.value)}
        />
      </td>

      {/* Date */}
      <td className="px-2 py-2 text-center">
        <input
          type="date"
          className="border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-violet-400 bg-white text-gray-600"
          value={edit.match_date}
          onChange={e => set("match_date", e.target.value)}
        />
      </td>

      {/* Save */}
      <td className="px-2 py-2 text-center">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all
            ${saved
              ? "bg-emerald-100 text-emerald-600"
              : dirty
                ? "bg-violet-100 text-violet-600 hover:bg-violet-200"
                : "bg-gray-50 text-gray-300 cursor-default"}`}
          title="Salvar"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        </button>
      </td>
    </tr>
  );
}

export default function LeagueMatchesModal({ league, onClose }) {
  const [seasons, setSeasons] = useState([]);
  const [season, setSeason] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Load available seasons on open
  useEffect(() => {
    api.get(`/admin/leagues/${league.id_league}/matches`).then(({ data }) => {
      setSeasons(data.seasons ?? []);
      if (data.seasons?.length) setSeason(data.seasons[0]);
    });
  }, [league.id_league]);

  // Load matches when season changes
  useEffect(() => {
    if (!season) return;
    setLoading(true);
    api.get(`/admin/leagues/${league.id_league}/matches?season=${season}`)
      .then(({ data }) => setMatches(data.matches ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [league.id_league, season]);

  const handleSave = useCallback(async (idMatch, fields) => {
    await api.put(`/admin/matches/${idMatch}`, fields);
    // Reflect saved values locally
    setMatches(prev => prev.map(m => m.id_match === idMatch ? { ...m, ...fields } : m));
  }, []);

  const filtered = matches.filter(m =>
    !search ||
    m.home_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.away_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by game_week for display
  const grouped = filtered.reduce((acc, m) => {
    const wk = m.game_week ?? 0;
    if (!acc[wk]) acc[wk] = [];
    acc[wk].push(m);
    return acc;
  }, {});

  const weeks = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const [collapsed, setCollapsed] = useState({});
  const toggleWeek = wk => setCollapsed(p => ({ ...p, [wk]: !p[wk] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {league.slug && (
              <img
                src={`https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${league.slug}.webp`}
                alt="" className="w-7 h-7 object-contain"
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
            )}
            <div>
              <h2 className="text-base font-bold text-gray-900">{league.name}</h2>
              <p className="text-xs text-gray-400">Editar partidas</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-50">
          {/* Season selector */}
          <div className="flex items-center gap-1.5">
            {seasons.map(s => (
              <button
                key={s}
                onClick={() => setSeason(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all
                  ${season === s ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrar clube..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-violet-400 w-44"
            />
          </div>
          <span className="text-xs text-gray-400 shrink-0">{filtered.length} partidas</span>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <Loader2 className="animate-spin w-5 h-5" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : !seasons.length ? (
            <p className="text-center text-sm text-gray-400 py-16">Nenhuma temporada encontrada para esta liga.</p>
          ) : !filtered.length ? (
            <p className="text-center text-sm text-gray-400 py-16">Nenhuma partida encontrada.</p>
          ) : (
            weeks.map(wk => (
              <div key={wk}>
                {/* Week header */}
                <button
                  onClick={() => toggleWeek(wk)}
                  className="w-full flex items-center gap-2 px-6 py-2 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100 text-left"
                >
                  {collapsed[wk] ? <ChevronRight size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {wk === 0 ? "Sem rodada" : `Rodada ${wk}`}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">· {grouped[wk].length} jogos</span>
                </button>

                {!collapsed[wk] && (
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-50">
                        <th className="px-3 py-1.5 text-right font-semibold">Casa</th>
                        <th className="px-2 py-1.5 text-center font-semibold">Placar</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Fora</th>
                        <th className="px-2 py-1.5 text-center font-semibold">Vencedor</th>
                        <th className="px-2 py-1.5 text-center font-semibold">Rod.</th>
                        <th className="px-2 py-1.5 text-center font-semibold">Data</th>
                        <th className="px-2 py-1.5 text-center font-semibold w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[wk].map(m => (
                        <MatchRow key={m.id_match} match={m} onSave={handleSave} />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
