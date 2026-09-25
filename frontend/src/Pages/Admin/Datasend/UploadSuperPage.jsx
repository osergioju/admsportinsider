import { useState, useMemo, useEffect } from "react";
import { api } from "../../../services/api";
import {
  Loader2, UploadCloud, ArrowRight, CheckCircle2, AlertTriangle,
  XCircle, EyeOff, Shield, Users, Trophy, Globe, X, Plus, MapPin,
  Zap, ChevronRight, FileText,
} from "lucide-react";
import SearchableSelect from "../../../components/uxui/SearchableSelect";

const selectClass =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7F33D9] transition-all font-light";
const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1";
const btnPrimary =
  "flex items-center justify-center gap-2 px-8 py-3.5 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed";
const inputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7F33D9] focus:ring-1 focus:ring-[#7F33D9] transition-all placeholder:text-gray-400";

const TYPE_ICONS = {
  teams: <Shield size={13} className="text-purple-500" />,
  players: <Users size={13} className="text-blue-500" />,
  matches: <Trophy size={13} className="text-amber-500" />,
};

// ── Detect file type from CSV headers + filename ──────────────────────────────
async function detectFileType(file) {
  const name = file.name.toLowerCase();
  if (/team|time|club/.test(name) && !/player|jogador|match|partida/.test(name)) return "teams";
  if (/player|jogador/.test(name)) return "players";
  if (/match|partida|fixture/.test(name)) return "matches";
  if (file.name.toLowerCase().endsWith(".csv")) {
    try {
      const text = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = (e) => res(e.target.result);
        r.onerror = rej;
        r.readAsText(file.slice(0, 600));
      });
      const first = text.split("\n")[0].toLowerCase();
      if (first.includes("home_team_name") || first.includes("away_team_name")) return "matches";
      if (first.includes("full_name") && first.includes("nationality")) return "players";
      if (first.includes("common_name") || (first.includes("team_name") && first.includes("matches_played"))) return "teams";
    } catch { /* ignore */ }
  }
  return null;
}

// ── Resolve o team_type ('clubs' | 'national') de uma liga nas listas disponíveis
function leagueTypeFrom(leagueId, ...leagueArrays) {
  if (!leagueId) return null;
  for (const arr of leagueArrays) {
    const found = (arr ?? []).find((l) => String(l.id_league) === String(leagueId));
    if (found?.team_type) return found.team_type;
  }
  return null;
}

// ── RegisterCountryModal ──────────────────────────────────────────────────────
function RegisterCountryModal({ csvNat, suggestion, onClose, onCreated }) {
  const [name, setName] = useState(suggestion?.namePtBr ?? csvNat ?? "");
  const [flag, setFlag] = useState(suggestion?.flag ?? "");
  const [loading, setLoading] = useState(false);
  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post("/admin/send-countries", { value: name.trim(), flag: flag.trim() || null, codigo: suggestion?.cca2 ?? null });
      const res = await api.get("/admin/countries?limit=500");
      const created = res.data.countries.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
      onCreated({ id_country: created?.id_country, name: name.trim(), flag_url: created?.flag_url || flag.trim() || null });
    } catch { alert("Erro ao cadastrar país"); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Globe size={18} className="text-[#7F33D9]" /> Cadastrar País</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {suggestion ? (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <img src={suggestion.flag} alt={suggestion.nameEn} className="w-8 h-5 rounded object-cover shadow-sm shrink-0" onError={(e) => { e.target.style.display = "none"; }} />
            <span className="text-xs text-gray-500">Encontrado em <strong>world-countries</strong> como <span className="font-mono text-gray-700">{suggestion.nameEn}</span></span>
          </div>
        ) : (
          <div className="mb-4 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">Nacionalidade <strong>"{csvNat}"</strong> não reconhecida.</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nome</label>
            <input type="text" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Brasil" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">URL da Bandeira</label>
            <div className="flex gap-2 items-center">
              {flag && <img src={flag} alt="preview" className="w-8 h-5 rounded object-cover shadow-sm shrink-0" onError={(e) => { e.target.style.display = "none"; }} />}
              <input type="text" className={inputClass} value={flag} onChange={(e) => setFlag(e.target.value)} placeholder={`https://flagcdn.com/${suggestion?.cca2?.toLowerCase() ?? "xx"}.svg`} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={!name.trim() || loading} className={`w-full ${btnPrimary}`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Cadastrar e selecionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CountryMappingRow — para competições de seleções nacionais ────────────────
function CountryMappingRow({ csvName, countryMappings, countriesOptions, onMap }) {
  return (
    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
      <div className="flex items-center gap-1.5">
        {countryMappings[csvName] ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
          : <XCircle size={13} className="text-amber-400 shrink-0" />}
        <span className="text-xs font-mono font-semibold text-gray-700 truncate">{csvName}</span>
        <ArrowRight size={11} className="text-gray-300 shrink-0 ml-auto" />
      </div>
      <SearchableSelect
        options={countriesOptions}
        value={countryMappings[csvName] || ""}
        onChange={(val) => onMap(csvName, val)}
        placeholder="Buscar país... (vazio = ignorar)"
      />
    </div>
  );
}

// ── ClubMappingRow ────────────────────────────────────────────────────────────
function ClubMappingRow({ csvName, countryName, clubMappings, hiddenClubs, creatingHidden, clubsGrouped, onMap, onCreateHidden, onUndoHidden }) {
  return (
    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
      <div className="flex items-center gap-1.5">
        {hiddenClubs[csvName] ? <EyeOff size={13} className="text-purple-400 shrink-0" />
          : clubMappings[csvName] ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
            : <XCircle size={13} className="text-amber-400 shrink-0" />}
        <span className="text-xs font-mono font-semibold text-gray-700 truncate">{csvName}</span>
        {countryName && <span className="text-[10px] text-gray-400 shrink-0">{countryName}</span>}
        {hiddenClubs[csvName] && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold shrink-0">oculto</span>}
        <ArrowRight size={11} className="text-gray-300 shrink-0 ml-auto" />
      </div>
      {!hiddenClubs[csvName] && (
        <SearchableSelect grouped={clubsGrouped} value={clubMappings[csvName] || ""} onChange={(val) => onMap(csvName, val)} placeholder="Buscar clube... (vazio = ignorar)" />
      )}
      {!clubMappings[csvName] && !hiddenClubs[csvName] && (
        <button onClick={() => onCreateHidden(csvName)} disabled={creatingHidden[csvName]}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-50 transition-colors">
          {creatingHidden[csvName] ? <Loader2 size={11} className="animate-spin" /> : <EyeOff size={11} />}
          Cadastrar como oculto
        </button>
      )}
      {hiddenClubs[csvName] && (
        <button onClick={() => onUndoHidden(csvName)} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">Desfazer</button>
      )}
    </div>
  );
}

// ── Season tag list (shows all seasons detected across files) ─────────────────
function SeasonBadges({ previews }) {
  const seasons = previews.map((p) => p.csvSeason || p.detectedYear || "—");
  return (
    <div className="flex flex-wrap gap-1.5">
      {seasons.map((s, i) => (
        <span key={i} className="px-2 py-0.5 bg-purple-50 border border-purple-100 rounded-full text-[11px] font-bold text-purple-600">
          {s}
        </span>
      ))}
    </div>
  );
}

// ── Import progress bar ───────────────────────────────────────────────────────
function ImportProgress({ current, total, label }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px] text-gray-500 font-semibold">
        <span>{label}</span>
        <span>{current}/{total}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#7F33D9] rounded-full transition-all duration-500" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function UploadSuperPage() {
  const [phase, setPhase] = useState("configure");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [allCountries, setAllCountries] = useState([]);
  const [allLeagues, setAllLeagues] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  const [fileItems, setFileItems] = useState([]);

  // ── Teams ──────────────────────────────────────────────────────────────────
  const [teamsPreviews, setTeamsPreviews] = useState([]); // one per file
  const [teamsLeague, setTeamsLeague] = useState("");
  const [teamsShowAllLeagues, setTeamsShowAllLeagues] = useState(false);
  const [teamsClubMappings, setTeamsClubMappings] = useState({});
  const [teamsHiddenClubs, setTeamsHiddenClubs] = useState({});
  const [teamsCreatingHidden, setTeamsCreatingHidden] = useState({});
  const [teamsIsCountryMode, setTeamsIsCountryMode] = useState(false);
  const [teamsCountryMappings, setTeamsCountryMappings] = useState({});
  const [teamsPreviewCountries, setTeamsPreviewCountries] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsImportingIdx, setTeamsImportingIdx] = useState(0);
  const [teamsResults, setTeamsResults] = useState([]);

  // ── Players ────────────────────────────────────────────────────────────────
  const [playersPreviews, setPlayersPreviews] = useState([]);
  const [playersLeagueId, setPlayersLeagueId] = useState("");
  const [playersClubMappings, setPlayersClubMappings] = useState({});
  const [playersHiddenClubs, setPlayersHiddenClubs] = useState({});
  const [playersCreatingHidden, setPlayersCreatingHidden] = useState({});
  const [playersNatMappings, setPlayersNatMappings] = useState({});
  const [playersCountries, setPlayersCountries] = useState([]);
  const [playersIsCountryMode, setPlayersIsCountryMode] = useState(false);
  const [playersCountryMappings, setPlayersCountryMappings] = useState({});
  const [playersPreviewCountries, setPlayersPreviewCountries] = useState([]);
  const [registerModal, setRegisterModal] = useState(null);
  // Modal "substituir dados existentes?": { seasons:[...], label, resolve }
  const [replacePrompt, setReplacePrompt] = useState(null);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersImportingIdx, setPlayersImportingIdx] = useState(0);
  const [playersResults, setPlayersResults] = useState([]);

  // ── Matches ────────────────────────────────────────────────────────────────
  const [matchesPreviews, setMatchesPreviews] = useState([]);
  const [matchesLeague, setMatchesLeague] = useState("");
  const [matchesCountry, setMatchesCountry] = useState("");
  const [matchesClubMappings, setMatchesClubMappings] = useState({});
  const [matchesHiddenClubs, setMatchesHiddenClubs] = useState({});
  const [matchesCreatingHidden, setMatchesCreatingHidden] = useState({});
  const [matchesIsCountryMode, setMatchesIsCountryMode] = useState(false);
  const [matchesCountryMappings, setMatchesCountryMappings] = useState({});
  const [matchesPreviewCountries, setMatchesPreviewCountries] = useState([]);
  // per-file season overrides (index → year string)
  const [matchesSeasonOverrides, setMatchesSeasonOverrides] = useState({});
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesImportingIdx, setMatchesImportingIdx] = useState(0);
  const [matchesResults, setMatchesResults] = useState([]);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        // Uma única chamada com limit alto — o loop paginado anterior fazia ~10
        // requisições e qualquer falha deixava a lista de países vazia.
        const { data } = await api.get("/admin/countries?limit=1000");
        setAllCountries(data.countries ?? []);
      } catch { /* ignore */ }
      try {
        const { data } = await api.get("/admin/leagues?limit=500");
        setAllLeagues(data.leagues ?? []);
      } catch { /* ignore */ }
    }
    load();
  }, []);

  // ── Derived file lists ──────────────────────────────────────────────────────
  const teamsFiles = useMemo(() => fileItems.filter((f) => f.type === "teams").map((f) => f.file), [fileItems]);
  const playersFiles = useMemo(() => fileItems.filter((f) => f.type === "players").map((f) => f.file), [fileItems]);
  const matchesFiles = useMemo(() => fileItems.filter((f) => f.type === "matches").map((f) => f.file), [fileItems]);

  // ── Phase helpers ───────────────────────────────────────────────────────────
  function firstMappingPhase(tf, pf, mf) {
    if (tf) return "teams_mapping";
    if (pf) return "players_mapping";
    if (mf) return "matches_mapping";
    return "done";
  }
  function nextPhaseAfter(current) {
    const queue = [
      { phase: "teams_mapping", has: teamsFiles.length > 0 },
      { phase: "players_mapping", has: playersFiles.length > 0 },
      { phase: "matches_mapping", has: matchesFiles.length > 0 },
    ];
    const idx = queue.findIndex((q) => q.phase === current);
    for (let i = idx + 1; i < queue.length; i++) if (queue[i].has) return queue[i].phase;
    return "done";
  }

  // ── File detection ──────────────────────────────────────────────────────────
  async function handleFiles(files) {
    const incoming = Array.from(files);
    const items = incoming.map((f) => ({ file: f, type: null, detecting: true }));
    setFileItems((prev) => {
      const merged = [...prev];
      for (const item of items) {
        const existing = merged.findIndex((x) => x.file.name === item.file.name);
        if (existing >= 0) merged[existing] = item;
        else merged.push(item);
      }
      return merged;
    });
    for (const item of items) {
      const detected = await detectFileType(item.file);
      setFileItems((prev) =>
        prev.map((x) => (x.file.name === item.file.name ? { ...x, type: detected, detecting: false } : x))
      );
    }
  }

  function removeFile(name) { setFileItems((prev) => prev.filter((f) => f.file.name !== name)); }
  function setFileType(fileName, type) {
    setFileItems((prev) => prev.map((x) => (x.file.name === fileName ? { ...x, type } : x)));
  }

  // ── Inicializa mapeamentos por etapa conforme o modo (clubes × seleções) ────
  // Chamado na análise inicial e sempre que a liga selecionada troca o modo.
  function initTeamsMappings(previews, countryMode) {
    if (countryMode) {
      setTeamsIsCountryMode(true);
      setTeamsClubMappings({});
      const unionNotFound = new Set(previews.flatMap((p) => (p.notFoundCountriesData ?? []).map((d) => d.name)));
      const countryInit = {};
      for (const n of unionNotFound) countryInit[n] = "";
      setTeamsCountryMappings(countryInit);
      const previewCountries = previews[0]?.allCountriesData ?? [];
      setTeamsPreviewCountries(previewCountries.length ? previewCountries : allCountries);
    } else {
      setTeamsIsCountryMode(false);
      setTeamsCountryMappings({});
      const unionNotFound = new Set(previews.flatMap((p) => p.notFoundTeams ?? []));
      const init = {};
      for (const n of unionNotFound) init[n] = "";
      for (const p of previews)
        for (const c of p.duplicateConflicts ?? [])
          for (const n of c.csv_names) init[n] = String(c.id_club);
      setTeamsClubMappings(init);
    }
  }

  function initPlayersMappings(previews, countryMode) {
    if (countryMode) {
      setPlayersIsCountryMode(true);
      setPlayersClubMappings({});
      const unionCountries = new Set(previews.flatMap((p) => p.notFoundCountryTeams ?? []));
      const initCountry = {};
      for (const n of unionCountries) initCountry[n] = "";
      setPlayersCountryMappings(initCountry);
      const previewCountries = previews[0]?.allCountries ?? [];
      setPlayersPreviewCountries(previewCountries.length ? previewCountries : allCountries);
    } else {
      setPlayersIsCountryMode(false);
      setPlayersCountryMappings({});
      const unionClubs = new Set(previews.flatMap((p) => p.notFoundClubs ?? []));
      const initClubs = {};
      for (const c of unionClubs) initClubs[c] = "";
      setPlayersClubMappings(initClubs);
    }
  }

  function initMatchesMappings(previews, countryMode) {
    if (countryMode) {
      setMatchesIsCountryMode(true);
      setMatchesClubMappings({});
      const unionNotFound = new Set(previews.flatMap((p) => (p.notFoundCountriesData ?? []).map((d) => d.name)));
      const countryInit = {};
      for (const n of unionNotFound) countryInit[n] = "";
      setMatchesCountryMappings(countryInit);
      const previewCountries = previews[0]?.allCountriesData ?? [];
      setMatchesPreviewCountries(previewCountries.length ? previewCountries : allCountries);
    } else {
      setMatchesIsCountryMode(false);
      setMatchesCountryMappings({});
      const unionTeams = new Set(previews.flatMap((p) => p.notFoundTeams ?? []));
      const init = {};
      for (const n of unionTeams) init[n] = "";
      setMatchesClubMappings(init);
    }
  }

  // Modo da etapa: team_type da liga manda; sem liga (ou liga sem flag), usa a heurística do preview
  function resolveCountryMode(leagueId, heuristic, ...leagueArrays) {
    const t = leagueTypeFrom(leagueId, ...leagueArrays, allLeagues);
    if (t) return t === "national";
    return !!heuristic;
  }

  // ── Troca de liga por etapa: realinha o modo (clubes × seleções) se necessário
  function handleTeamsLeagueChange(val) {
    setTeamsLeague(val);
    const t = leagueTypeFrom(val, teamsPreviews[0]?.leagues, teamsPreviews[0]?.allLeagues, allLeagues);
    if (!t) return;
    const wantCountry = t === "national";
    if (wantCountry !== teamsIsCountryMode) initTeamsMappings(teamsPreviews, wantCountry);
  }

  function handlePlayersLeagueChange(val) {
    setPlayersLeagueId(val);
    const t = leagueTypeFrom(val, playersPreviews[0]?.allLeagues, allLeagues);
    if (!t) return;
    const wantCountry = t === "national";
    if (wantCountry !== playersIsCountryMode) initPlayersMappings(playersPreviews, wantCountry);
  }

  function handleMatchesLeagueChange(val) {
    setMatchesLeague(val);
    const t = leagueTypeFrom(val, matchesPreviews[0]?.leagues, allLeagues);
    if (!t) return;
    const wantCountry = t === "national";
    if (wantCountry !== matchesIsCountryMode) initMatchesMappings(matchesPreviews, wantCountry);
  }

  // ── Propaga mapeamento de seleções (id_country) para etapas seguintes ───────
  function propagateCountryFromTeams(csvName, idCountry) {
    if (!idCountry) return;
    setPlayersCountryMappings((p) => Object.prototype.hasOwnProperty.call(p, csvName) ? { ...p, [csvName]: idCountry } : p);
    setMatchesCountryMappings((p) => Object.prototype.hasOwnProperty.call(p, csvName) ? { ...p, [csvName]: idCountry } : p);
  }

  function propagateCountryFromPlayers(csvName, idCountry) {
    if (!idCountry) return;
    setMatchesCountryMappings((p) => Object.prototype.hasOwnProperty.call(p, csvName) ? { ...p, [csvName]: idCountry } : p);
  }

  // ── Analyze ALL files in parallel ───────────────────────────────────────────
  async function handleAnalyze() {
    const tf = fileItems.filter((f) => f.type === "teams").map((f) => f.file);
    const pf = fileItems.filter((f) => f.type === "players").map((f) => f.file);
    const mf = fileItems.filter((f) => f.type === "matches").map((f) => f.file);
    if (!tf.length && !pf.length && !mf.length) return alert("Adicione pelo menos um arquivo.");

    setAnalyzing(true);
    setPhase("analyzing");

    function previewForm(endpoint, file) {
      const f = new FormData();
      f.append("file", file);
      return api.post(endpoint, f, { headers: { "Content-Type": "multipart/form-data" } })
        .then((r) => r.data)
        .catch(() => null);
    }

    try {
      const [teamsData, playersData, matchesData] = await Promise.all([
        Promise.all(tf.map((f) => previewForm("/upload/import/teams/preview", f))),
        Promise.all(pf.map((f) => previewForm("/upload/import/players/preview", f))),
        Promise.all(mf.map((f) => previewForm("/upload/import/matches/preview", f))),
      ]);

      // Teams: union of all not-found clubs (ou países em country mode)
      const validTeams = teamsData.filter(Boolean);
      if (validTeams.length) {
        setTeamsPreviews(validTeams);
        const league = selectedLeague || (validTeams[0].leagues?.length === 1 ? String(validTeams[0].leagues[0].id_league) : "");
        setTeamsLeague(league);
        if (validTeams[0].isMultiCountry) setTeamsShowAllLeagues(true);

        initTeamsMappings(
          validTeams,
          resolveCountryMode(league, validTeams[0].countryMode, validTeams[0].leagues, validTeams[0].allLeagues)
        );
      }

      // Players: union of not-found clubs + nationalities
      const validPlayers = playersData.filter(Boolean);
      if (validPlayers.length) {
        setPlayersPreviews(validPlayers);
        const league = selectedLeague || (validPlayers[0].foundLeague ? String(validPlayers[0].foundLeague.id_league) : "");
        setPlayersLeagueId(league);

        initPlayersMappings(
          validPlayers,
          resolveCountryMode(league, validPlayers[0].clubsAreCountries, validPlayers[0].allLeagues)
        );

        const unionNat = new Set(validPlayers.flatMap((p) => p.notFoundNationalities ?? []));
        const initNat = {};
        for (const n of unionNat) initNat[n] = "";
        setPlayersNatMappings(initNat);
        setPlayersCountries(validPlayers[0].allCountries ?? []);
      }

      // Matches: union of not-found teams/countries, per-file season overrides
      const validMatches = matchesData.filter(Boolean);
      if (validMatches.length) {
        setMatchesPreviews(validMatches);
        setMatchesLeague(selectedLeague || "");
        const overrides = {};
        validMatches.forEach((p, i) => { overrides[i] = String(p.detectedYear ?? ""); });
        setMatchesSeasonOverrides(overrides);

        initMatchesMappings(
          validMatches,
          resolveCountryMode(selectedLeague, validMatches[0].countryMode, validMatches[0].leagues)
        );
      }

      setPhase(firstMappingPhase(validTeams.length > 0, validPlayers.length > 0, validMatches.length > 0));
    } catch {
      alert("Erro ao analisar arquivos.");
      setPhase("configure");
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Extrai mensagem de erro do axios ou JS ────────────────────────────────────
  function extractError(err) {
    return err?.response?.data?.error
      || err?.response?.data?.message
      || (typeof err?.response?.data === "string" && err.response.data.length < 200 ? err.response.data : null)
      || err?.message
      || "Erro desconhecido";
  }

  // ── Import Teams: sequential loop ───────────────────────────────────────────
  // Pergunta ao backend quais das temporadas já têm dados desse tipo.
  async function checkExisting(type, league, seasons) {
    const uniq = [...new Set(seasons.map((s) => Number(s)).filter(Boolean))];
    if (!league || !uniq.length) return [];
    try {
      const { data } = await api.post("/upload/import/check-existing", {
        league, type, seasons: uniq,
      });
      return (data?.existing ?? []).map(Number);
    } catch {
      // Se a verificação falhar, não bloqueia o import (segue sem substituir).
      return [];
    }
  }

  // Abre o modal e resolve com 'replace' | 'keep' | 'cancel'.
  function askReplace(seasons, label) {
    return new Promise((resolve) => setReplacePrompt({ seasons, label, resolve }));
  }
  function answerReplace(decision) {
    if (replacePrompt) replacePrompt.resolve(decision);
    setReplacePrompt(null);
  }

  async function handleImportTeams() {
    if (!teamsLeague) return alert("Selecione uma competição.");
    // Detecta temporadas já existentes e pergunta se quer substituir.
    const teamsSeasonOf = (p) => Number(p?.csvSeason);
    const teamsExisting = await checkExisting(
      "teams", teamsLeague,
      teamsPreviews.slice(0, teamsFiles.length).map(teamsSeasonOf)
    );
    let teamsDecision = "keep";
    if (teamsExisting.length) {
      teamsDecision = await askReplace(teamsExisting, "times");
      if (teamsDecision === "cancel") return;
    }
    setTeamsLoading(true);
    const results = [];
    const total = Math.min(teamsFiles.length, teamsPreviews.length);
    for (let i = 0; i < total; i++) {
      setTeamsImportingIdx(i);
      const preview = teamsPreviews[i];
      if (!preview) { results.push({ fileName: teamsFiles[i].name, season: "—", importError: "Preview não disponível" }); continue; }
      try {
        const form = new FormData();
        form.append("file", teamsFiles[i]);
        form.append("league", teamsLeague);
        form.append("season", preview.csvSeason);
        if (teamsDecision === "replace" && teamsExisting.includes(teamsSeasonOf(preview))) {
          form.append("replace", "true");
        }
        if (teamsIsCountryMode) {
          const activeMappings = Object.fromEntries(
            Object.entries(teamsCountryMappings).filter(([, v]) => v !== "")
          );
          if (Object.keys(activeMappings).length) form.append("countryMappings", JSON.stringify(activeMappings));
          else form.append("countryMappings", "{}");
        } else {
          const activeMappings = Object.fromEntries(
            Object.entries(teamsClubMappings).filter(([k, v]) => v !== "" && (preview.notFoundTeams ?? []).includes(k))
          );
          if (Object.keys(activeMappings).length) form.append("clubMappings", JSON.stringify(activeMappings));
        }
        const { data } = await api.post("/upload/import/teams", form, { headers: { "Content-Type": "multipart/form-data" } });
        results.push({ ...data, fileName: teamsFiles[i].name, season: String(preview.csvSeason ?? "") });
      } catch (err) {
        results.push({ fileName: teamsFiles[i].name, season: String(preview.csvSeason ?? ""), importError: extractError(err) });
      }
    }
    setTeamsResults(results);
    setTeamsLoading(false);
    setPhase(nextPhaseAfter("teams_mapping"));
  }

  // ── Import Players: sequential loop ─────────────────────────────────────────
  async function handleImportPlayers() {
    if (!playersLeagueId) return alert("Selecione a liga.");
    const playersSeasonOf = (p) => Number(p?.csvSeason);
    const playersExisting = await checkExisting(
      "players", playersLeagueId,
      playersPreviews.slice(0, playersFiles.length).map(playersSeasonOf)
    );
    let playersDecision = "keep";
    if (playersExisting.length) {
      playersDecision = await askReplace(playersExisting, "jogadores");
      if (playersDecision === "cancel") return;
    }
    setPlayersLoading(true);
    const results = [];
    const total = Math.min(playersFiles.length, playersPreviews.length);
    for (let i = 0; i < total; i++) {
      setPlayersImportingIdx(i);
      const preview = playersPreviews[i];
      if (!preview) { results.push({ fileName: playersFiles[i].name, season: "—", importError: "Preview não disponível" }); continue; }
      try {
        const notFoundNatKeys = [
          ...(preview.notFoundNationalities ?? []),
          ...(preview.notFoundNationalitiesData?.map((d) => d.csvName) ?? []),
        ];
        const activeNat = Object.fromEntries(
          Object.entries(playersNatMappings).filter(([k, v]) => v !== "" && notFoundNatKeys.includes(k))
        );
        const form = new FormData();
        form.append("file", playersFiles[i]);
        form.append("leagueId", playersLeagueId);
        if (playersDecision === "replace" && playersExisting.includes(playersSeasonOf(preview))) {
          form.append("replace", "true");
        }
        if (playersIsCountryMode) {
          // Envia mapeamentos de seleções (id_country string values)
          const activeCountry = Object.fromEntries(
            Object.entries(playersCountryMappings).filter(([k, v]) => v !== "" && (preview.notFoundCountryTeams ?? []).includes(k))
          );
          form.append("countryMappings", JSON.stringify(activeCountry));
        } else {
          const activeClub = Object.fromEntries(
            Object.entries(playersClubMappings).filter(([k, v]) => v !== "" && (preview.notFoundClubs ?? []).includes(k))
          );
          if (Object.keys(activeClub).length) form.append("clubMappings", JSON.stringify(activeClub));
        }
        if (Object.keys(activeNat).length) form.append("nationalityMappings", JSON.stringify(activeNat));
        const { data } = await api.post("/upload/import/players", form, { headers: { "Content-Type": "multipart/form-data" } });
        results.push({ ...data, fileName: playersFiles[i].name, season: String(preview.csvSeason ?? "") });
      } catch (err) {
        results.push({ fileName: playersFiles[i].name, season: String(preview.csvSeason ?? ""), importError: extractError(err) });
      }
    }
    setPlayersResults(results);
    setPlayersLoading(false);
    setPhase(nextPhaseAfter("players_mapping"));
  }

  // ── Import Matches: sequential loop ─────────────────────────────────────────
  async function handleImportMatches() {
    if (!matchesLeague) return alert("Selecione uma competição.");
    // Sem ano o backend rejeita o arquivo ("Liga e temporada são obrigatórias")
    // e ele seria silenciosamente descartado — bloqueia aqui antes.
    const missingIdx = matchesPreviews.findIndex(
      (p, i) => !String(matchesSeasonOverrides[i] ?? "").trim() && !p.detectedYear
    );
    if (missingIdx >= 0) {
      return alert(`Não foi possível detectar o ano do arquivo "${matchesFiles[missingIdx]?.name}". Preencha o campo de ano dele antes de importar.`);
    }
    const matchesSeasonOf = (i) => Number(matchesSeasonOverrides[i] || matchesPreviews[i]?.detectedYear);
    const matchesExisting = await checkExisting(
      "matches", matchesLeague,
      matchesPreviews.slice(0, matchesFiles.length).map((_, i) => matchesSeasonOf(i))
    );
    let matchesDecision = "keep";
    if (matchesExisting.length) {
      matchesDecision = await askReplace(matchesExisting, "partidas");
      if (matchesDecision === "cancel") return;
    }
    setMatchesLoading(true);
    const results = [];
    const total = Math.min(matchesFiles.length, matchesPreviews.length);
    for (let i = 0; i < total; i++) {
      setMatchesImportingIdx(i);
      const preview = matchesPreviews[i];
      if (!preview) { results.push({ fileName: matchesFiles[i].name, season: "—", importError: "Preview não disponível" }); continue; }
      try {
        const form = new FormData();
        form.append("file", matchesFiles[i]);
        form.append("league", matchesLeague);
        form.append("season", matchesSeasonOverrides[i] || preview.detectedYear);
        if (matchesDecision === "replace" && matchesExisting.includes(matchesSeasonOf(i))) {
          form.append("replace", "true");
        }
        if (matchesIsCountryMode) {
          const activeCountryMappings = Object.fromEntries(
            Object.entries(matchesCountryMappings).filter(([, v]) => v !== "")
          );
          form.append("countryMappings", JSON.stringify(activeCountryMappings));
        } else {
          const activeMappings = Object.fromEntries(
            Object.entries(matchesClubMappings).filter(([k, v]) => v !== "" && (preview.notFoundTeams ?? []).includes(k))
          );
          if (Object.keys(activeMappings).length) form.append("clubMappings", JSON.stringify(activeMappings));
        }
        const { data } = await api.post("/upload/import/matches", form, { headers: { "Content-Type": "multipart/form-data" } });
        results.push({ ...data, fileName: matchesFiles[i].name, season: String(matchesSeasonOverrides[i] || preview.detectedYear || "") });
      } catch (err) {
        results.push({ fileName: matchesFiles[i].name, season: String(matchesSeasonOverrides[i] || preview.detectedYear || ""), importError: extractError(err) });
      }
    }
    setMatchesResults(results);
    setMatchesLoading(false);
    setPhase("done");
  }

  // ── Hidden clubs handlers ────────────────────────────────────────────────────
  // Ao criar um oculto numa etapa, propaga automaticamente para as etapas seguintes
  // que tiverem o mesmo csvName pendente — evita que o usuário mapeie o mesmo clube
  // repetidamente em teams → players → matches.

  async function createHiddenForTeams(csvName) {
    setTeamsCreatingHidden((p) => ({ ...p, [csvName]: true }));
    try {
      const { data } = await api.post("/admin/clubs/create-hidden", { name: csvName });
      const id = String(data.id_club);
      setTeamsClubMappings((p) => ({ ...p, [csvName]: id }));
      setTeamsHiddenClubs((p) => ({ ...p, [csvName]: true }));
      // propaga para players (usa nome como valor) e matches (usa id como valor)
      if (Object.prototype.hasOwnProperty.call(playersClubMappings, csvName)) {
        setPlayersClubMappings((p) => ({ ...p, [csvName]: csvName }));
        setPlayersHiddenClubs((p) => ({ ...p, [csvName]: true }));
      }
      if (Object.prototype.hasOwnProperty.call(matchesClubMappings, csvName)) {
        setMatchesClubMappings((p) => ({ ...p, [csvName]: id }));
        setMatchesHiddenClubs((p) => ({ ...p, [csvName]: true }));
      }
    } catch (err) { alert(err?.response?.data?.error || "Erro."); }
    finally { setTeamsCreatingHidden((p) => ({ ...p, [csvName]: false })); }
  }

  async function createHiddenForPlayers(csvName) {
    setPlayersCreatingHidden((p) => ({ ...p, [csvName]: true }));
    try {
      const { data } = await api.post("/admin/clubs/create-hidden", { name: csvName });
      const id = String(data.id_club);
      setPlayersClubMappings((p) => ({ ...p, [csvName]: csvName }));
      setPlayersHiddenClubs((p) => ({ ...p, [csvName]: true }));
      // propaga para matches
      if (Object.prototype.hasOwnProperty.call(matchesClubMappings, csvName)) {
        setMatchesClubMappings((p) => ({ ...p, [csvName]: id }));
        setMatchesHiddenClubs((p) => ({ ...p, [csvName]: true }));
      }
    } catch (err) { alert(err?.response?.data?.error || "Erro."); }
    finally { setPlayersCreatingHidden((p) => ({ ...p, [csvName]: false })); }
  }

  async function createHiddenForMatches(csvName) {
    setMatchesCreatingHidden((p) => ({ ...p, [csvName]: true }));
    try {
      const { data } = await api.post("/admin/clubs/create-hidden", { name: csvName });
      setMatchesClubMappings((p) => ({ ...p, [csvName]: String(data.id_club) }));
      setMatchesHiddenClubs((p) => ({ ...p, [csvName]: true }));
    } catch (err) { alert(err?.response?.data?.error || "Erro."); }
    finally { setMatchesCreatingHidden((p) => ({ ...p, [csvName]: false })); }
  }

  function undoHidden(csvName, setMappings, setHidden) {
    setHidden((p) => ({ ...p, [csvName]: false }));
    setMappings((p) => ({ ...p, [csvName]: "" }));
  }

  // ── Nationality ──────────────────────────────────────────────────────────────
  function handleCountryCreated(csvNat, newCountry) {
    if (newCountry.id_country)
      setPlayersCountries((prev) => prev.find((c) => c.id_country === newCountry.id_country)
        ? prev : [...prev, newCountry].sort((a, b) => a.name.localeCompare(b.name)));
    setPlayersNatMappings((prev) => ({ ...prev, [csvNat]: newCountry.name }));
    setRegisterModal(null);
  }

  // ── Derived grouped clubs ────────────────────────────────────────────────────
  function buildGrouped(allClubs, detectedCountry, valueIsId = true) {
    if (!allClubs) return [];
    const map = new Map();
    for (const c of allClubs) {
      const key = c.country_name ?? "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ value: valueIsId ? String(c.id_club) : c.name, label: c.name, slug: c.slug, image: c.crest_url });
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "pt"))
      .map(([g, options]) => ({
        groupLabel: detectedCountry && g === detectedCountry ? `${g} ✓` : g,
        options,
        _det: detectedCountry && g === detectedCountry,
      }))
      .sort((a, b) => (b._det ? 1 : 0) - (a._det ? 1 : 0));
  }

  // Seleções aparecem como "País — FEDERAÇÃO" (ex: "Brasil — CBF"); o valor segue
  // sendo id_country, mas a federação vinculada é a identidade navegável da seleção
  const toSelecaoOption = (c) => ({
    value: String(c.id_country),
    label: c.federation_acronym ? `${c.name} — ${c.federation_acronym}` : c.name,
    image: c.federation_logo || c.flag_url,
  });

  const teamsClubsGrouped = useMemo(() => buildGrouped(teamsPreviews[0]?.allClubs, teamsPreviews[0]?.csvCountry, true), [teamsPreviews]);
  const teamsCountriesOptions = useMemo(() =>
    teamsPreviewCountries.map(toSelecaoOption),
    [teamsPreviewCountries]
  );
  const playersClubsGrouped = useMemo(() => buildGrouped(playersPreviews[0]?.allClubs, null, false), [playersPreviews]);
  const playersCountriesOptions = useMemo(() =>
    playersPreviewCountries.map(toSelecaoOption),
    [playersPreviewCountries]
  );
  const matchesClubsGrouped = useMemo(() => buildGrouped(matchesPreviews[0]?.allClubs, null, true), [matchesPreviews]);

  // Mapa csvName → country_name para clubes não encontrados e conflitos duplicados
  const teamsCountryMap = useMemo(() => {
    const map = {};
    for (const p of teamsPreviews) {
      for (const item of (p.notFoundTeamsData ?? []))
        if (item.country_name && !map[item.name]) map[item.name] = item.country_name;
      for (const conflict of (p.duplicateConflicts ?? []))
        for (const item of (conflict.csv_names_data ?? []))
          if (item.country_name && !map[item.name]) map[item.name] = item.country_name;
    }
    return map;
  }, [teamsPreviews]);

  const matchesCountryMap = useMemo(() => {
    const map = {};
    for (const p of matchesPreviews)
      for (const item of (p.notFoundTeamsData ?? []))
        if (item.country_name && !map[item.name]) map[item.name] = item.country_name;
    return map;
  }, [matchesPreviews]);

  // ── Lookup helpers ────────────────────────────────────────────────────────────
  // Dada uma lista de allClubs, retorna nome a partir do id ou id a partir do nome
  function clubNameById(id) {
    const allClubs = teamsPreviews[0]?.allClubs ?? playersPreviews[0]?.allClubs ?? matchesPreviews[0]?.allClubs ?? [];
    return allClubs.find((c) => String(c.id_club) === String(id))?.name ?? null;
  }
  function clubIdByName(name) {
    const allClubs = matchesPreviews[0]?.allClubs ?? playersPreviews[0]?.allClubs ?? teamsPreviews[0]?.allClubs ?? [];
    return allClubs.find((c) => c.name === name) ? String(allClubs.find((c) => c.name === name).id_club) : null;
  }

  // Propaga mapeamento de times (ID) → jogadores (nome) e partidas (ID)
  function propagateTeamsMap(csvName, clubId) {
    if (!clubId) return;
    if (Object.prototype.hasOwnProperty.call(playersClubMappings, csvName)) {
      const name = clubNameById(clubId);
      if (name) {
        setPlayersClubMappings((p) => ({ ...p, [csvName]: name }));
        setPlayersHiddenClubs((p) => ({ ...p, [csvName]: false }));
      }
    }
    if (Object.prototype.hasOwnProperty.call(matchesClubMappings, csvName)) {
      setMatchesClubMappings((p) => ({ ...p, [csvName]: clubId }));
      setMatchesHiddenClubs((p) => ({ ...p, [csvName]: false }));
    }
  }

  // Propaga mapeamento de jogadores (nome) → partidas (ID)
  function propagatePlayersMap(csvName, clubName) {
    if (!clubName) return;
    if (Object.prototype.hasOwnProperty.call(matchesClubMappings, csvName)) {
      const id = clubIdByName(clubName);
      if (id) {
        setMatchesClubMappings((p) => ({ ...p, [csvName]: id }));
        setMatchesHiddenClubs((p) => ({ ...p, [csvName]: false }));
      }
    }
  }

  const playersCountryOptions = useMemo(() =>
    playersCountries.map((c) => ({ value: c.name, label: c.name, image: c.flag_url })),
    [playersCountries]
  );

  const notFoundNatData = useMemo(() => {
    const seen = new Set();
    return playersPreviews.flatMap((p) => {
      if (p.notFoundNationalitiesData?.length) return p.notFoundNationalitiesData.filter((d) => { if (seen.has(d.csvName)) return false; seen.add(d.csvName); return true; });
      return (p.notFoundNationalities ?? []).filter((n) => { if (seen.has(n)) return false; seen.add(n); return true; }).map((n) => ({ csvName: n, suggestion: null }));
    });
  }, [playersPreviews]);

  const countriesForSelect = useMemo(() => [
    { groupLabel: "Tipo", options: [{ value: "__international__", label: "Internacional / Continentais" }] },
    { groupLabel: "Países", options: allCountries.map((c) => ({ value: c.name, label: c.name, image: c.flag_url })) },
  ], [allCountries]);

  const filteredLeagues = useMemo(() => {
    if (selectedCountry === "__international__") return allLeagues.filter((l) => !l.country_name);
    return selectedCountry ? allLeagues.filter((l) => l.country_name === selectedCountry) : allLeagues;
  }, [allLeagues, selectedCountry]);

  const matchesCountries = useMemo(() => {
    const all = matchesPreviews.flatMap((p) => p.leagues ?? []);
    return [...new Map(all.map((l) => [l.id_country, l.country_name])).entries()]
      .filter(([id, name]) => id != null && name != null)
      .map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [matchesPreviews]);

  const matchesLeaguesList = useMemo(() => {
    const all = matchesPreviews.flatMap((p) => p.leagues ?? []);
    const dedup = [...new Map(all.map((l) => [l.id_league, l])).values()];
    if (selectedCountry === "__international__") return dedup.filter((l) => !l.country_name);
    if (matchesCountry) return dedup.filter((l) => String(l.id_country) === matchesCountry);
    return dedup;
  }, [matchesPreviews, matchesCountry, selectedCountry]);

  // total counts for summary cards
  const teamsTotalFound = teamsPreviews.reduce((s, p) => s + (p.foundTeams?.length ?? 0), 0);
  const teamsTotalNotFound = [...new Set(teamsPreviews.flatMap((p) => p.notFoundTeams ?? []))].length;
  const playersTotalFound = playersIsCountryMode
    ? playersPreviews.reduce((s, p) => s + (p.foundCountryTeams?.length ?? 0), 0)
    : playersPreviews.reduce((s, p) => s + (p.foundClubs?.length ?? 0), 0);
  const playersTotalNotFound = playersIsCountryMode
    ? Object.keys(playersCountryMappings).length
    : Object.keys(playersClubMappings).length;
  const matchesTotalFound = matchesIsCountryMode
    ? matchesPreviews.reduce((s, p) => s + (p.foundCountries?.length ?? 0), 0)
    : matchesPreviews.reduce((s, p) => s + (p.foundTeams?.length ?? 0), 0);
  const matchesTotalNotFound = matchesIsCountryMode
    ? Object.keys(matchesCountryMappings).length
    : Object.keys(matchesClubMappings).length;

  const matchesCountriesOptions = useMemo(() =>
    matchesPreviewCountries.map(toSelecaoOption),
    [matchesPreviewCountries]
  );

  function handleReset() {
    setPhase("configure"); setFileItems([]);
    setSelectedCountry(""); setSelectedLeague("");
    setTeamsPreviews([]); setTeamsLeague(""); setTeamsClubMappings({}); setTeamsHiddenClubs({}); setTeamsCreatingHidden({}); setTeamsResults([]); setTeamsShowAllLeagues(false); setTeamsImportingIdx(0); setTeamsIsCountryMode(false); setTeamsCountryMappings({}); setTeamsPreviewCountries([]);
    setPlayersPreviews([]); setPlayersLeagueId(""); setPlayersClubMappings({}); setPlayersHiddenClubs({}); setPlayersCreatingHidden({}); setPlayersNatMappings({}); setPlayersCountries([]); setPlayersResults([]); setPlayersImportingIdx(0); setPlayersIsCountryMode(false); setPlayersCountryMappings({}); setPlayersPreviewCountries([]);
    setMatchesPreviews([]); setMatchesLeague(""); setMatchesCountry(""); setMatchesClubMappings({}); setMatchesHiddenClubs({}); setMatchesCreatingHidden({}); setMatchesIsCountryMode(false); setMatchesCountryMappings({}); setMatchesPreviewCountries([]); setMatchesSeasonOverrides({}); setMatchesResults([]); setMatchesImportingIdx(0);
  }

  const configDone = phase !== "configure" && phase !== "analyzing";

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm">
          <Zap className="text-[#7F33D9] w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Esportivo 2.0</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto font-light">
          Jogue todas as temporadas de uma vez. O sistema analisa tudo em paralelo, você mapeia uma única vez e ele importa em sequência.
        </p>
      </div>

      {/* Pipeline pills */}
      {configDone && (
        <div className="flex items-center gap-1.5 mb-6 justify-center text-[11px] font-bold flex-wrap">
          {[
            { phase: "teams_mapping", icon: <Shield size={11} />, label: `Times (${teamsFiles.length})`, has: teamsFiles.length > 0, done: teamsResults.length > 0 },
            { phase: "players_mapping", icon: <Users size={11} />, label: `Jogadores (${playersFiles.length})`, has: playersFiles.length > 0, done: playersResults.length > 0 },
            { phase: "matches_mapping", icon: <Trophy size={11} />, label: `Partidas (${matchesFiles.length})`, has: matchesFiles.length > 0, done: matchesResults.length > 0 },
          ].filter((p) => p.has).map((p, i, arr) => (
            <div key={p.phase} className="flex items-center gap-1.5">
              <span className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${p.done ? "bg-green-100 text-green-600" : phase === p.phase ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"
                }`}>
                {p.done ? <CheckCircle2 size={11} /> : p.icon} {p.label}
              </span>
              {i < arr.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
            </div>
          ))}
          {phase === "done" && <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-600 ml-1"><CheckCircle2 size={11} /> Concluído</span>}
        </div>
      )}

      {/* ── CONFIGURE ─────────────────────────────────────────────────────────── */}
      {phase === "configure" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>País <span className="normal-case font-normal text-gray-400">(opcional)</span></label>
              <SearchableSelect
                grouped={countriesForSelect}
                value={selectedCountry}
                onChange={(val) => { setSelectedCountry(val); setSelectedLeague(""); }}
                placeholder="Filtrar por país..."
              />
            </div>
            <div>
              <label className={labelClass}>Liga <span className="normal-case font-normal text-gray-400">(opcional)</span></label>
              <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} className={selectClass}>
                <option value="">Selecione a liga</option>
                {filteredLeagues.map((l) => (
                  <option key={l.id_league} value={String(l.id_league)}>
                    {l.name}
                    {l.country_name && selectedCountry !== l.country_name ? ` — ${l.country_name}` : ""}
                    {!l.country_name && l.continent_name ? ` — ${l.continent_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dropzone */}
          <div>
            <label className={labelClass}>
              Arquivos CSV / XLSX
              <span className="normal-case font-normal text-gray-400 ml-2">— arraste quantos quiser</span>
            </label>
            <div
              className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-[#7F33D9] hover:bg-purple-50/20 transition-all duration-300 cursor-pointer group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            >
              <input type="file" multiple accept=".csv,.xlsx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={(e) => handleFiles(e.target.files)} />
              <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#7F33D9] transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600 group-hover:text-[#7F33D9]">Arraste ou clique para adicionar</p>
                  <p className="text-xs text-gray-400 mt-1">Misture times, jogadores e partidas de várias temporadas</p>
                </div>
              </div>
            </div>

            {fileItems.length > 0 && (
              <div className="mt-3 space-y-2">
                {/* group by type for visual clarity */}
                {["teams", "players", "matches", null].map((type) => {
                  const group = fileItems.filter((f) => f.type === type);
                  if (!group.length) return null;
                  return (
                    <div key={String(type)}>
                      {type && (
                        <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1 ml-1 flex items-center gap-1">
                          {TYPE_ICONS[type]} {type === "teams" ? "Times" : type === "players" ? "Jogadores" : "Partidas"}
                          <span className="text-gray-300 font-normal normal-case">— {group.length} arquivo{group.length > 1 ? "s" : ""}</span>
                        </p>
                      )}
                      {!type && <p className="text-[10px] uppercase font-black text-amber-400 tracking-widest mb-1 ml-1">Tipo não identificado</p>}
                      {group.map((item) => (
                        <div key={item.file.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 mb-1.5">
                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            {item.detecting ? <Loader2 size={14} className="animate-spin text-gray-400" />
                              : item.type ? TYPE_ICONS[item.type]
                                : <AlertTriangle size={14} className="text-amber-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{item.file.name}</p>
                            <p className="text-[10px] text-gray-400">{(item.file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <select
                            value={item.type ?? ""}
                            onChange={(e) => setFileType(item.file.name, e.target.value || null)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#7F33D9] shrink-0"
                          >
                            <option value="">— tipo —</option>
                            <option value="teams">Times</option>
                            <option value="players">Jogadores</option>
                            <option value="matches">Partidas</option>
                          </select>
                          <button onClick={() => removeFile(item.file.name)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0"><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {fileItems.some((f) => f.type) && (
            <div className="pt-2 space-y-3">
              {/* Summary of what will be processed */}
              <div className="flex gap-2 justify-center flex-wrap text-[11px]">
                {[["teams", "Times", "text-purple-600 bg-purple-50 border-purple-100"],
                ["players", "Jogadores", "text-blue-600 bg-blue-50 border-blue-100"],
                ["matches", "Partidas", "text-amber-600 bg-amber-50 border-amber-100"]].map(([type, label, cls]) => {
                  const count = fileItems.filter((f) => f.type === type).length;
                  if (!count) return null;
                  return (
                    <span key={type} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border font-bold ${cls}`}>
                      {TYPE_ICONS[type]} {count} {label}
                    </span>
                  );
                })}
              </div>
              <div className="flex justify-center">
                <button onClick={handleAnalyze} disabled={analyzing || fileItems.some((f) => f.detecting)} className={btnPrimary}>
                  {analyzing ? <><Loader2 className="animate-spin w-4 h-4" /> Analisando...</> : <><Zap size={16} /> Analisar Tudo</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYZING ─────────────────────────────────────────────────────────── */}
      {phase === "analyzing" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-12 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
          <Loader2 className="animate-spin w-10 h-10 text-[#7F33D9]" />
          <p className="text-sm font-semibold text-gray-600">Analisando {fileItems.length} arquivo{fileItems.length > 1 ? "s" : ""} em paralelo...</p>
          <p className="text-xs text-gray-400">Detectando clubes, temporadas e times não encontrados</p>
        </div>
      )}

      {/* ── TEAMS MAPPING ─────────────────────────────────────────────────────── */}
      {phase === "teams_mapping" && teamsPreviews.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 space-y-5 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
              <Shield size={16} className="text-[#7F33D9]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Mapeamento de Times</p>
              <p className="text-xs text-gray-400">{teamsFiles.length} arquivo{teamsFiles.length > 1 ? "s" : ""} — mapeie uma vez, importa todos em sequência</p>
            </div>
          </div>

          {/* Detected seasons */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Temporadas detectadas</p>
            <SeasonBadges previews={teamsPreviews} />
          </div>

          {/* Detected country */}
          {teamsPreviews[0].csvCountry && (
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-2">
              <MapPin size={13} className="text-purple-400" />
              <p className="text-sm font-bold text-purple-700">{teamsPreviews[0].csvCountry}</p>
            </div>
          )}

          {/* Liga */}
          <div>
            <label className={labelClass}>Competição</label>
            {(() => {
              const pool = teamsShowAllLeagues ? (teamsPreviews[0].allLeagues ?? teamsPreviews[0].leagues) : teamsPreviews[0].leagues;
              const filtered = selectedCountry === "__international__" ? pool.filter((l) => !l.country_name) : pool;
              return (
                <>
                  <select value={teamsLeague} onChange={(e) => handleTeamsLeagueChange(e.target.value)} className={selectClass}>
                    <option value="">Selecione a liga</option>
                    {filtered.map((l) => (
                      <option key={l.id_league} value={String(l.id_league)}>
                        {l.name}{l.country_name ? ` (${l.country_name})` : l.continent_name ? ` (${l.continent_name})` : ""}
                      </option>
                    ))}
                  </select>
                  {!teamsShowAllLeagues && selectedCountry !== "__international__" && (
                    <button onClick={() => setTeamsShowAllLeagues(true)} className="text-[11px] text-gray-400 hover:text-[#7F33D9] ml-1 mt-1 underline underline-offset-2">Ver todas as ligas</button>
                  )}
                </>
              );
            })()}
          </div>

          {/* Stats cards (aggregated) */}
          {(() => {
            const found = teamsIsCountryMode
              ? teamsPreviews.reduce((s, p) => s + (p.foundCountries?.length ?? 0), 0)
              : teamsTotalFound;
            const notFound = teamsIsCountryMode
              ? Object.keys(teamsCountryMappings).length
              : teamsTotalNotFound;
            return (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 border border-green-100 rounded-2xl">
                  <p className="text-[10px] uppercase font-black text-green-400 mb-1">Encontrados</p>
                  <p className="text-xl font-bold text-green-600">{found}</p>
                  <p className="text-[10px] text-green-500 mt-0.5">em todos os arquivos</p>
                </div>
                <div className={`p-3 rounded-2xl border ${notFound > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
                  <p className={`text-[10px] uppercase font-black mb-1 ${notFound > 0 ? "text-amber-400" : "text-green-400"}`}>Não encontrados</p>
                  <p className={`text-xl font-bold ${notFound > 0 ? "text-amber-600" : "text-green-600"}`}>{notFound}</p>
                  <p className={`text-[10px] mt-0.5 ${notFound > 0 ? "text-amber-500" : "text-green-500"}`}>
                    {notFound > 0 ? "mapear abaixo" : "todos reconhecidos!"}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Unmapped countries (country mode) */}
          {teamsIsCountryMode && Object.keys(teamsCountryMappings).length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Seleções Não Encontradas</p>
              <p className="text-xs text-gray-400">Associe cada seleção ao país cadastrado no sistema.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Object.keys(teamsCountryMappings).map((csvName) => (
                  <CountryMappingRow
                    key={csvName}
                    csvName={csvName}
                    countryMappings={teamsCountryMappings}
                    countriesOptions={teamsCountriesOptions}
                    onMap={(n, v) => { setTeamsCountryMappings((p) => ({ ...p, [n]: v })); propagateCountryFromTeams(n, v); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unmapped clubs (club mode) */}
          {!teamsIsCountryMode && Object.keys(teamsClubMappings).length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Times Não Encontrados</p>
              <p className="text-xs text-gray-400">O mapeamento vale para todas as temporadas simultaneamente.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Object.keys(teamsClubMappings).map((csvName) => (
                  <ClubMappingRow
                    key={csvName}
                    csvName={csvName}
                    countryName={teamsCountryMap[csvName] ?? null}
                    clubMappings={teamsClubMappings}
                    hiddenClubs={teamsHiddenClubs}
                    creatingHidden={teamsCreatingHidden}
                    clubsGrouped={teamsClubsGrouped}
                    onMap={(n, v) => { setTeamsClubMappings((p) => ({ ...p, [n]: v })); setTeamsHiddenClubs((p) => ({ ...p, [n]: false })); propagateTeamsMap(n, v); }}
                    onCreateHidden={createHiddenForTeams}
                    onUndoHidden={(n) => undoHidden(n, setTeamsClubMappings, setTeamsHiddenClubs)}
                  />
                ))}
              </div>
            </div>
          )}

          {teamsLoading && (
            <ImportProgress current={teamsImportingIdx + 1} total={teamsFiles.length} label={`Importando temporada ${teamsPreviews[teamsImportingIdx]?.csvSeason}...`} />
          )}

          <div className="flex justify-center">
            <button onClick={handleImportTeams} disabled={teamsLoading || !teamsLeague} className={btnPrimary}>
              {teamsLoading
                ? <><Loader2 className="animate-spin w-4 h-4" /> Importando {teamsImportingIdx + 1}/{teamsFiles.length}...</>
                : <><Shield size={16} /> Importar {teamsFiles.length} temporada{teamsFiles.length > 1 ? "s" : ""} <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* ── PLAYERS MAPPING ───────────────────────────────────────────────────── */}
      {phase === "players_mapping" && playersPreviews.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 space-y-5 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <Users size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Mapeamento de Jogadores</p>
              <p className="text-xs text-gray-400">{playersFiles.length} arquivo{playersFiles.length > 1 ? "s" : ""} — mapeie uma vez, importa todos</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Temporadas detectadas</p>
            <SeasonBadges previews={playersPreviews} />
          </div>

          {/* Liga */}
          <div>
            <label className={labelClass}>Liga
              {playersPreviews[0].foundLeague && <span className="ml-2 text-green-500 normal-case font-normal">— encontrada automaticamente</span>}
            </label>
            <select value={playersLeagueId} onChange={(e) => handlePlayersLeagueChange(e.target.value)} className={selectClass}>
              <option value="">Selecione a liga</option>
              {(selectedCountry === "__international__"
                ? playersPreviews[0].allLeagues.filter((l) => !l.country_name)
                : playersPreviews[0].allLeagues
              ).map((l) => (
                <option key={l.id_league} value={String(l.id_league)}>
                  {l.name}{l.country_name ? ` (${l.country_name})` : l.continent_name ? ` (${l.continent_name})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 border border-green-100 rounded-2xl">
              <p className="text-[10px] uppercase font-black text-green-400 mb-1">{playersIsCountryMode ? "Seleções encontradas" : "Clubes encontrados"}</p>
              <p className="text-xl font-bold text-green-600">{playersTotalFound}</p>
            </div>
            <div className={`p-3 rounded-2xl border ${playersTotalNotFound > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
              <p className={`text-[10px] uppercase font-black mb-1 ${playersTotalNotFound > 0 ? "text-amber-400" : "text-green-400"}`}>{playersIsCountryMode ? "Seleções não encontradas" : "Clubes não encontrados"}</p>
              <p className={`text-xl font-bold ${playersTotalNotFound > 0 ? "text-amber-600" : "text-green-600"}`}>{playersTotalNotFound}</p>
            </div>
          </div>

          {/* Country mode: mapear seleções → países */}
          {playersIsCountryMode && Object.keys(playersCountryMappings).length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Seleções Não Encontradas</p>
              <p className="text-xs text-gray-400">Associe cada seleção ao país cadastrado no sistema.</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {Object.keys(playersCountryMappings).map((csvName) => (
                  <CountryMappingRow
                    key={csvName}
                    csvName={csvName}
                    countryMappings={playersCountryMappings}
                    countriesOptions={playersCountriesOptions}
                    onMap={(n, v) => { setPlayersCountryMappings((p) => ({ ...p, [n]: v })); propagateCountryFromPlayers(n, v); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Club mode: mapear clubes normalmente */}
          {!playersIsCountryMode && Object.keys(playersClubMappings).length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Clubes Não Encontrados</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {Object.keys(playersClubMappings).map((csvClub) => (
                  <ClubMappingRow
                    key={csvClub}
                    csvName={csvClub}
                    clubMappings={playersClubMappings}
                    hiddenClubs={playersHiddenClubs}
                    creatingHidden={playersCreatingHidden}
                    clubsGrouped={playersClubsGrouped}
                    onMap={(n, v) => { setPlayersClubMappings((p) => ({ ...p, [n]: v })); setPlayersHiddenClubs((p) => ({ ...p, [n]: false })); propagatePlayersMap(n, v); }}
                    onCreateHidden={createHiddenForPlayers}
                    onUndoHidden={(n) => undoHidden(n, setPlayersClubMappings, setPlayersHiddenClubs)}
                  />
                ))}
              </div>
            </div>
          )}

          {notFoundNatData.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Nacionalidades Não Encontradas</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {notFoundNatData.map(({ csvName, suggestion }) => (
                  <div key={csvName} className={`p-3 rounded-2xl border space-y-2 ${playersNatMappings[csvName] ? "bg-white border-gray-100" : "bg-amber-50/40 border-amber-200"}`}>
                    <div className="flex items-center gap-1.5">
                      {playersNatMappings[csvName] ? <CheckCircle2 size={13} className="text-green-500 shrink-0" /> : <XCircle size={13} className="text-amber-400 shrink-0" />}
                      <span className="text-xs font-mono font-semibold text-gray-700 truncate">{csvName}</span>
                      <ArrowRight size={11} className="text-gray-300 shrink-0 ml-auto" />
                    </div>
                    <div className="flex gap-2 items-center">
                      <SearchableSelect options={playersCountryOptions} value={playersNatMappings[csvName] || ""} onChange={(val) => setPlayersNatMappings((p) => ({ ...p, [csvName]: val }))} placeholder="Buscar país..." />
                      {!playersNatMappings[csvName] && (
                        <button onClick={() => setRegisterModal({ csvNat: csvName, suggestion })} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-[#7F33D9]/10 text-[#7F33D9] hover:bg-[#7F33D9]/20 border border-[#7F33D9]/20">
                          <Plus size={16} />
                        </button>
                      )}
                    </div>
                    {!playersNatMappings[csvName] && suggestion && (
                      <p className="text-[10px] text-amber-600 flex items-center gap-1">
                        <img src={suggestion.flag} alt="" className="w-4 h-3 rounded object-cover shrink-0" onError={(e) => { e.target.style.display = "none"; }} />
                        Sugestão: <strong>{suggestion.nameEn}</strong>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {playersLoading && (
            <ImportProgress current={playersImportingIdx + 1} total={playersFiles.length} label={`Importando temporada ${playersPreviews[playersImportingIdx]?.csvSeason}...`} />
          )}

          <div className="flex justify-center">
            <button onClick={handleImportPlayers} disabled={playersLoading || !playersLeagueId} className={btnPrimary}>
              {playersLoading
                ? <><Loader2 className="animate-spin w-4 h-4" /> Importando {playersImportingIdx + 1}/{playersFiles.length}...</>
                : <><Users size={16} /> Importar {playersFiles.length} temporada{playersFiles.length > 1 ? "s" : ""} <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* ── MATCHES MAPPING ───────────────────────────────────────────────────── */}
      {phase === "matches_mapping" && matchesPreviews.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 space-y-5 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <Trophy size={16} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Mapeamento de Partidas</p>
              <p className="text-xs text-gray-400">{matchesFiles.length} arquivo{matchesFiles.length > 1 ? "s" : ""} — confirme os anos e selecione a competição</p>
            </div>
          </div>

          {/* Per-file season override */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Anos detectados</p>
            <div className="space-y-2">
              {matchesPreviews.map((p, i) => {
                const yearMissing = !String(matchesSeasonOverrides[i] ?? "").trim() && !p.detectedYear;
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${yearMissing ? "bg-red-50 border-red-200" : "bg-purple-50 border-purple-100"}`}>
                    <FileText size={13} className={`shrink-0 ${yearMissing ? "text-red-400" : "text-purple-400"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-500 truncate block">{matchesFiles[i]?.name}</span>
                      {yearMissing && <span className="text-[10px] font-bold text-red-500">Ano não detectado — preencha para importar</span>}
                    </div>
                    <input
                      type="number"
                      value={matchesSeasonOverrides[i] ?? ""}
                      onChange={(e) => setMatchesSeasonOverrides((prev) => ({ ...prev, [i]: e.target.value }))}
                      className={`w-20 text-center text-sm font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#7F33D9] ${yearMissing
                        ? "text-red-700 bg-white border-2 border-red-300"
                        : "text-purple-700 bg-white border border-purple-200"}`}
                      placeholder={yearMissing ? "ano?" : String(p.detectedYear ?? "")}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Country filter */}
          {!matchesPreviews[0]?.isMultiCountry && matchesCountries.length > 0 && (
            <div>
              <label className={labelClass}>Filtrar por País</label>
              <select value={matchesCountry} onChange={(e) => { setMatchesCountry(e.target.value); setMatchesLeague(""); }} className={selectClass}>
                <option value="">Todos os países</option>
                {matchesCountries.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Competição</label>
            {matchesLeaguesList.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-sm text-amber-700">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" /> Nenhuma competição encontrada.
              </div>
            ) : (
              <select value={matchesLeague} onChange={(e) => handleMatchesLeagueChange(e.target.value)} className={selectClass}>
                <option value="">Selecione a liga</option>
                {matchesLeaguesList.map((l) => (
                  <option key={l.id_league} value={String(l.id_league)}>
                    {l.name}{l.country_name ? ` — ${l.country_name}` : l.continent_name ? ` — ${l.continent_name}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 border border-green-100 rounded-2xl">
              <p className="text-[10px] uppercase font-black text-green-400 mb-1">{matchesIsCountryMode ? "Seleções encontradas" : "Times encontrados"}</p>
              <p className="text-xl font-bold text-green-600">{matchesTotalFound}</p>
              <p className="text-[10px] text-green-500 mt-0.5">em todos os arquivos</p>
            </div>
            <div className={`p-3 rounded-2xl border ${matchesTotalNotFound > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
              <p className={`text-[10px] uppercase font-black mb-1 ${matchesTotalNotFound > 0 ? "text-amber-400" : "text-green-400"}`}>Não encontrados</p>
              <p className={`text-xl font-bold ${matchesTotalNotFound > 0 ? "text-amber-600" : "text-green-600"}`}>{matchesTotalNotFound}</p>
            </div>
          </div>

          {matchesIsCountryMode && Object.keys(matchesCountryMappings).length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Seleções Não Encontradas</p>
              <p className="text-xs text-gray-400">Associe cada seleção ao país cadastrado no sistema.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Object.keys(matchesCountryMappings).map((csvName) => (
                  <CountryMappingRow
                    key={csvName}
                    csvName={csvName}
                    countryMappings={matchesCountryMappings}
                    countriesOptions={matchesCountriesOptions}
                    onMap={(n, v) => setMatchesCountryMappings((p) => ({ ...p, [n]: v }))}
                  />
                ))}
              </div>
            </div>
          )}

          {!matchesIsCountryMode && Object.keys(matchesClubMappings).length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mapear Times Não Encontrados</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Object.keys(matchesClubMappings).map((csvName) => (
                  <ClubMappingRow
                    key={csvName}
                    csvName={csvName}
                    countryName={matchesCountryMap[csvName] ?? null}
                    clubMappings={matchesClubMappings}
                    hiddenClubs={matchesHiddenClubs}
                    creatingHidden={matchesCreatingHidden}
                    clubsGrouped={matchesClubsGrouped}
                    onMap={(n, v) => { setMatchesClubMappings((p) => ({ ...p, [n]: v })); setMatchesHiddenClubs((p) => ({ ...p, [n]: false })); }}
                    onCreateHidden={createHiddenForMatches}
                    onUndoHidden={(n) => undoHidden(n, setMatchesClubMappings, setMatchesHiddenClubs)}
                  />
                ))}
              </div>
            </div>
          )}

          {matchesLoading && (
            <ImportProgress current={matchesImportingIdx + 1} total={matchesFiles.length} label={`Importando temporada ${matchesSeasonOverrides[matchesImportingIdx] || matchesPreviews[matchesImportingIdx]?.detectedYear}...`} />
          )}

          <div className="flex justify-center">
            <button onClick={handleImportMatches} disabled={matchesLoading || !matchesLeague} className={btnPrimary}>
              {matchesLoading
                ? <><Loader2 className="animate-spin w-4 h-4" /> Importando {matchesImportingIdx + 1}/{matchesFiles.length}...</>
                : <><Trophy size={16} /> Importar {matchesFiles.length} temporada{matchesFiles.length > 1 ? "s" : ""} <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* ── DONE ──────────────────────────────────────────────────────────────── */}
      {phase === "done" && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
          <div className="text-center">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-green-100">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Tudo importado!</h2>
            <p className="text-xs text-gray-400 mt-1">Resumo por arquivo</p>
          </div>

          {teamsResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield size={13} className="text-[#7F33D9]" />
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Times</p>
              </div>
              {teamsResults.map((r, i) => (
                <div key={i} className={`p-3 rounded-2xl border ${r.importError ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{r.fileName}</p>
                      <p className="text-[10px] text-gray-400">{r.season}</p>
                    </div>
                    {r.importError
                      ? <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={11} /> Falhou</span>
                      : <><span className="text-xs font-bold text-green-600">{r.inserted ?? 0} inseridos</span>{(r.skipped ?? 0) > 0 && <span className="text-xs font-bold text-orange-500">{r.skipped} ignorados</span>}</>}
                  </div>
                  {r.importError && <p className="text-[10px] text-red-600 mt-1.5 font-mono leading-relaxed">{r.importError}</p>}
                  {!r.importError && (r.skippedTeams?.length > 0) && (
                    <div className="mt-2 pt-2 border-t border-orange-100">
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide mb-1">Não encontrados no banco</p>
                      <div className="flex flex-wrap gap-1">
                        {r.skippedTeams.map((name, j) => (
                          <span key={j} className="text-[10px] bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-2 py-0.5">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {playersResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users size={13} className="text-blue-500" />
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Jogadores</p>
              </div>
              {playersResults.map((r, i) => (
                <div key={i} className={`p-3 rounded-2xl border ${r.importError ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{r.fileName}</p>
                      <p className="text-[10px] text-gray-400">{r.season}</p>
                    </div>
                    {r.importError
                      ? <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={11} /> Falhou</span>
                      : <><span className="text-xs font-bold text-gray-600">{r.players ?? 0} jogadores</span><span className="text-xs font-bold text-green-600">{r.stats ?? 0} stats</span></>}
                  </div>
                  {r.importError && <p className="text-[10px] text-red-600 mt-1.5 font-mono leading-relaxed">{r.importError}</p>}
                </div>
              ))}
            </div>
          )}

          {matchesResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy size={13} className="text-amber-500" />
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Partidas</p>
              </div>
              {matchesResults.map((r, i) => {
                const details = r.skippedDetails ?? [];
                const clubsNotFound = [...new Set(
                  details
                    .filter(d => d.reason === "club_not_found")
                    .flatMap(d => [d.home, d.away].filter(Boolean))
                )];
                const missingName = details.filter(d => d.reason === "missing_team_name").length;
                return (
                  <div key={i} className={`p-3 rounded-2xl border ${r.importError ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{r.fileName}</p>
                        <p className="text-[10px] text-gray-400">{r.season}</p>
                      </div>
                      {r.importError
                        ? <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={11} /> Falhou</span>
                        : <><span className="text-xs font-bold text-green-600">{r.inserted} inseridas</span>{r.skipped > 0 && <span className="text-xs font-bold text-orange-500">{r.skipped} ignoradas</span>}</>}
                    </div>
                    {r.importError && <p className="text-[10px] text-red-600 mt-1.5 font-mono leading-relaxed">{r.importError}</p>}
                    {!r.importError && clubsNotFound.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-orange-100">
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide mb-1">Times não encontrados (causaram partidas ignoradas)</p>
                        <div className="flex flex-wrap gap-1">
                          {clubsNotFound.map((name, j) => (
                            <span key={j} className="text-[10px] bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-2 py-0.5">{name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!r.importError && missingName > 0 && (
                      <div className="mt-2 pt-2 border-t border-orange-100">
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide mb-1">{missingName} partida(s) sem nome de time</p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          O arquivo não tem as colunas <code className="bg-gray-100 px-1 rounded">home_team_name</code> / <code className="bg-gray-100 px-1 rounded">away_team_name</code> preenchidas — provavelmente o cabeçalho/formato desse XLSX é diferente do CSV da FootyStats. Confira a 1ª linha da planilha.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button onClick={handleReset} className="text-sm text-[#7F33D9] font-bold hover:underline">Fazer novo upload</button>
          </div>
        </div>
      )}

      {registerModal && (
        <RegisterCountryModal
          csvNat={registerModal.csvNat}
          suggestion={registerModal.suggestion}
          onClose={() => setRegisterModal(null)}
          onCreated={(newCountry) => handleCountryCreated(registerModal.csvNat, newCountry)}
        />
      )}

      {replacePrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Dados já existem</h3>
            </div>
            <p className="text-sm text-gray-600 font-light mb-2">
              Estas temporadas de <strong>{replacePrompt.label}</strong> já têm dados cadastrados:
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[...replacePrompt.seasons].sort((a, b) => a - b).map((y) => (
                <span key={y} className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">{y}</span>
              ))}
            </div>
            <p className="text-xs text-gray-500 font-light mb-5">
              <strong>Substituir</strong> apaga os dados dessas temporadas e reimporta do zero.{" "}
              <strong>Manter</strong> reaproveita os registros existentes (atualiza/upsert) sem apagar.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => answerReplace("replace")}
                className="w-full px-5 py-3 bg-[#7F33D9] text-white rounded-full text-sm font-bold hover:bg-[#6025A8] transition-all"
              >
                Substituir essas temporadas
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => answerReplace("keep")}
                  className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm font-bold hover:bg-gray-200 transition-all"
                >
                  Manter (upsert)
                </button>
                <button
                  onClick={() => answerReplace("cancel")}
                  className="flex-1 px-5 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-full text-sm font-bold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
