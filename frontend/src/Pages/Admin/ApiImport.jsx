import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import {
  DownloadCloud, Loader2, CheckCircle2, XCircle, AlertTriangle, Globe,
  Trophy, Link2, Shield, FlaskConical, Rocket, RefreshCw, Plus, ArrowLeft,
} from "lucide-react";

// Imagens do FootyStats podem vir relativas ("teams/brazil.png")
const img = (p) => (!p ? null : /^https?:\/\//.test(p) ? p : `https://cdn.footystats.org/img/${p}`);

const CREATE = "__create__";

export default function ApiImport() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [apiLeagues, setApiLeagues] = useState([]);
  const [platformLeagues, setPlatformLeagues] = useState([]);
  const [countries, setCountries] = useState([]);

  // Etapa 1 — país / competição / liga / temporada
  const [country, setCountry] = useState("");
  const [apiLeague, setApiLeague] = useState(null);   // item de apiLeagues
  const [mappedLeagueId, setMappedLeagueId] = useState("");
  const [savingLeague, setSavingLeague] = useState(false);
  const [season, setSeason] = useState(null);          // { id, year, label, defaultYear }
  const [seasonYear, setSeasonYear] = useState("");

  // Etapa 2 — clubes
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsData, setTeamsData] = useState(null);    // { teams, clubs, leagueCountryId }
  const [choices, setChoices] = useState({});          // apiId → id_club | CREATE | ""
  const [createMeta, setCreateMeta] = useState({});    // apiId → { name, idCountry }
  const [savingClubs, setSavingClubs] = useState(false);
  const [clubsMsg, setClubsMsg] = useState(null);

  // Etapa 3 — opções / preview / run
  const [targets, setTargets] = useState({ matches: true, teamStats: true, players: true });
  const [mode, setMode] = useState("upsert");
  const [includeIncomplete, setIncludeIncomplete] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data }, cRes] = await Promise.all([
          api.get("/admin/api-import/leagues"),
          api.get("/admin/countries", { params: { limit: 500 } }),
        ]);
        setApiLeagues(data.apiLeagues ?? []);
        setPlatformLeagues(data.platformLeagues ?? []);
        setCountries(cRes.data?.countries ?? []);
      } catch (err) {
        setLoadError(err?.response?.data?.message || "Erro ao carregar competições da API.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const countryList = useMemo(() => {
    const map = new Map();
    for (const l of apiLeagues) map.set(l.country, (map.get(l.country) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [apiLeagues]);

  const leaguesOfCountry = useMemo(
    () => apiLeagues.filter((l) => l.country === country),
    [apiLeagues, country]
  );

  function pickApiLeague(l) {
    setApiLeague(l);
    setMappedLeagueId(l.mappedLeague?.id_league ?? "");
    setSeason(null);
    setSeasonYear("");
    setTeamsData(null);
    setPreview(null);
    setRunResult(null);
  }

  async function saveLeagueMapping(idLeague) {
    setMappedLeagueId(idLeague);
    setSavingLeague(true);
    try {
      await api.post("/admin/api-import/map-league", {
        idLeague: idLeague || null,
        apiName: apiLeague.name,
        apiCountry: apiLeague.country,
      });
      setApiLeagues((prev) => prev.map((l) =>
        l.name === apiLeague.name && l.country === apiLeague.country
          ? { ...l, mappedLeague: idLeague ? { id_league: Number(idLeague), name: platformLeagues.find((p) => p.id_league === Number(idLeague))?.name } : null }
          : l
      ));
    } catch (err) {
      alert(err?.response?.data?.message || "Erro ao salvar vínculo da liga.");
    } finally {
      setSavingLeague(false);
    }
  }

  function pickSeason(s) {
    setSeason(s);
    setSeasonYear(String(s.defaultYear ?? ""));
    setTeamsData(null);
    setPreview(null);
    setRunResult(null);
    loadTeams(s);
  }

  async function loadTeams(s = season) {
    if (!s || !mappedLeagueId) return;
    setTeamsLoading(true);
    setClubsMsg(null);
    try {
      const { data } = await api.get("/admin/api-import/teams", {
        params: { season_id: s.id, league_id: mappedLeagueId },
      });
      setTeamsData(data);
      const initial = {};
      for (const t of data.teams) initial[t.apiId] = t.suggestion?.id_club ?? "";
      setChoices(initial);
      setCreateMeta({});
    } catch (err) {
      setClubsMsg({ type: "error", text: err?.response?.data?.message || "Erro ao carregar times." });
    } finally {
      setTeamsLoading(false);
    }
  }

  const pendingTeams = useMemo(() => {
    if (!teamsData) return [];
    return teamsData.teams.filter((t) => {
      const c = choices[t.apiId];
      return !c || (c === CREATE && !(createMeta[t.apiId]?.name && createMeta[t.apiId]?.idCountry));
    });
  }, [teamsData, choices, createMeta]);

  async function saveClubMappings() {
    if (!teamsData) return;
    const mappings = [];
    const creations = [];
    for (const t of teamsData.teams) {
      const c = choices[t.apiId];
      if (c === CREATE) {
        const meta = createMeta[t.apiId];
        if (meta?.name && meta?.idCountry) {
          creations.push({ apiId: t.apiId, name: meta.name, crestUrl: img(t.image), idCountry: meta.idCountry });
        }
      } else if (c && !(t.suggestion?.via === "api_id" && t.suggestion?.id_club === Number(c))) {
        mappings.push({ apiId: t.apiId, idClub: Number(c) });
      }
    }
    if (!mappings.length && !creations.length) {
      setClubsMsg({ type: "success", text: "Nada novo para salvar — mapeamentos já estão gravados." });
      return;
    }
    setSavingClubs(true);
    setClubsMsg(null);
    try {
      const { data } = await api.post("/admin/api-import/map-clubs", { mappings, creations });
      const parts = [];
      if (data.saved?.length) parts.push(`${data.saved.length} vinculado(s)`);
      if (data.created?.length) parts.push(`${data.created.length} clube(s) criado(s)`);
      if (data.errors?.length) parts.push(`${data.errors.length} erro(s)`);
      setClubsMsg({ type: data.errors?.length ? "error" : "success", text: parts.join(" · ") || "Salvo." });
      loadTeams(); // recarrega para refletir vínculos por ID
    } catch (err) {
      setClubsMsg({ type: "error", text: err?.response?.data?.message || "Erro ao salvar mapeamentos." });
    } finally {
      setSavingClubs(false);
    }
  }

  async function handlePreview() {
    setPreviewing(true);
    setPreview(null);
    setRunResult(null);
    try {
      const { data } = await api.post("/admin/api-import/preview", {
        leagueId: Number(mappedLeagueId),
        seasonId: season.id,
        seasonYear: Number(seasonYear),
        targets, includeIncomplete,
      });
      setPreview(data);
    } catch (err) {
      setPreview({ ok: false, message: err?.response?.data?.message || "Erro ao gerar preview." });
    } finally {
      setPreviewing(false);
    }
  }

  async function handleRun() {
    const league = platformLeagues.find((p) => p.id_league === Number(mappedLeagueId));
    if (!confirm(`Importar dados de "${apiLeague.name}" (${season.label}) para a liga "${league?.name}" na temporada ${seasonYear}?\n\nModo: ${mode === "upsert" ? "inserir e atualizar existentes" : "só inserir novas"}.`)) return;
    setRunning(true);
    setRunResult(null);
    try {
      const { data } = await api.post("/admin/api-import/run", {
        leagueId: Number(mappedLeagueId),
        seasonId: season.id,
        seasonYear: Number(seasonYear),
        targets, includeIncomplete, mode,
      });
      setRunResult(data);
      setPreview(null);
    } catch (err) {
      const body = err?.response?.data;
      setRunResult({ ok: false, message: body?.message || "Erro ao importar.", unmappedTeams: body?.unmappedTeams });
    } finally {
      setRunning(false);
    }
  }

  const selectedTargetsCount = Object.values(targets).filter(Boolean).length;

  const stepDone = "bg-emerald-500 text-white";
  const stepActive = "bg-violet-600 text-white";
  const stepIdle = "bg-gray-200 text-gray-500";
  const StepBadge = ({ n, done, active }) => (
    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? stepDone : active ? stepActive : stepIdle}`}>
      {done ? "✓" : n}
    </span>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
          <DownloadCloud size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Importar dados via API</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Carga de partidas, estatísticas e jogadores direto do FootyStats. Nada é gravado sem pré-visualização.
          </p>
        </div>
        <Link to="/admin/api" className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-800">
          <ArrowLeft size={15} /> Configuração da API
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="animate-spin w-5 h-5" /><span className="text-sm">Carregando competições da API…</span>
        </div>
      ) : loadError ? (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 bg-red-50 text-red-700">
          <XCircle size={16} /> {loadError} — confira o token em <Link to="/admin/api" className="underline font-semibold">/admin/api</Link>.
        </div>
      ) : (
        <>
          {/* ── ETAPA 1: País → competição → liga → temporada ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <StepBadge n={1} done={!!(apiLeague && mappedLeagueId && season)} active={!season} />
              <Globe size={18} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm">Competição e temporada</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">País</label>
                <select value={country}
                  onChange={(e) => { setCountry(e.target.value); setApiLeague(null); setSeason(null); setTeamsData(null); setPreview(null); }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="">Selecione o país…</option>
                  {countryList.map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}
                </select>
              </div>

              {country && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Competição na API</label>
                  <select value={apiLeague?.name ?? ""}
                    onChange={(e) => { const l = leaguesOfCountry.find((x) => x.name === e.target.value); if (l) pickApiLeague(l); }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    <option value="">Selecione a competição…</option>
                    {leaguesOfCountry.map((l) => (
                      <option key={l.name} value={l.name}>
                        {l.name}{l.mappedLeague ? ` → ${l.mappedLeague.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {apiLeague && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Link2 size={12} /> Liga correspondente na plataforma
                    {savingLeague && <Loader2 size={12} className="animate-spin" />}
                  </label>
                  <select value={mappedLeagueId}
                    onChange={(e) => saveLeagueMapping(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    <option value="">— sem vínculo —</option>
                    {platformLeagues.map((p) => (
                      <option key={p.id_league} value={p.id_league}>
                        {p.name}{p.country ? ` (${p.country})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">O vínculo fica salvo — na próxima carga já vem selecionado.</p>
                </div>
              )}

              {apiLeague && mappedLeagueId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Temporada</label>
                  <select value={season?.id ?? ""}
                    onChange={(e) => { const s = apiLeague.seasons.find((x) => String(x.id) === e.target.value); if (s) pickSeason(s); }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    <option value="">Selecione a temporada…</option>
                    {apiLeague.seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ── ETAPA 2: Mapeamento de clubes ── */}
          {season && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <StepBadge n={2} done={teamsData && pendingTeams.length === 0} active={!!teamsData} />
                <Shield size={18} className="text-gray-400" />
                <h2 className="font-bold text-gray-900 text-sm">Mapeamento de clubes</h2>
                {teamsData && (
                  <span className="ml-auto text-xs text-gray-400">
                    {teamsData.teams.length} time(s) na API · {pendingTeams.length} pendente(s)
                  </span>
                )}
              </div>

              {teamsLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
                  <Loader2 className="animate-spin w-4 h-4" /> Buscando times da temporada…
                </div>
              ) : teamsData && (
                <>
                  <p className="text-sm text-gray-500">
                    Vincule cada time da API a um clube da plataforma. O vínculo grava o <code className="text-xs bg-gray-50 border border-gray-100 rounded px-1">ID do clube na API</code> no
                    cadastro — nas próximas cargas o time já vem vinculado automaticamente, sem depender do nome.
                  </p>

                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="max-h-[480px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50 z-10">
                          <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="text-left font-semibold py-2 px-4">Time na API</th>
                            <th className="text-left font-semibold py-2 px-3">Status</th>
                            <th className="text-left font-semibold py-2 px-3 w-[40%]">Clube na plataforma</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamsData.teams.map((t) => {
                            const choice = choices[t.apiId] ?? "";
                            const viaId = t.suggestion?.via === "api_id";
                            const meta = createMeta[t.apiId] ?? { name: t.cleanName || t.name, idCountry: teamsData.leagueCountryId ?? "" };
                            return (
                              <tr key={t.apiId} className="border-t border-gray-50 align-top">
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    {img(t.image) && <img src={img(t.image)} alt="" className="w-6 h-6 object-contain shrink-0" loading="lazy" />}
                                    <div>
                                      <div className="font-semibold text-gray-800">{t.name}</div>
                                      <div className="text-[11px] text-gray-400">ID API: {t.apiId}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  {viaId ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold whitespace-nowrap">
                                      <CheckCircle2 size={11} /> Vinculado por ID
                                    </span>
                                  ) : t.suggestion ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold whitespace-nowrap">
                                      Sugestão por nome
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold whitespace-nowrap">
                                      <AlertTriangle size={11} /> Sem correspondência
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 space-y-1.5">
                                  <select value={choice}
                                    onChange={(e) => setChoices((p) => ({ ...p, [t.apiId]: e.target.value }))}
                                    className={`w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${!choice ? "border-red-200 bg-red-50/40" : "border-gray-200 bg-gray-50/50"}`}>
                                    <option value="">— selecionar clube —</option>
                                    <option value={CREATE}>➕ Criar clube novo</option>
                                    {teamsData.clubs.map((c) => (
                                      <option key={c.id_club} value={c.id_club}>{c.name}</option>
                                    ))}
                                  </select>
                                  {choice === CREATE && (
                                    <div className="flex gap-1.5">
                                      <input value={meta.name}
                                        onChange={(e) => setCreateMeta((p) => ({ ...p, [t.apiId]: { ...meta, name: e.target.value } }))}
                                        placeholder="Nome do clube"
                                        className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                      <select value={meta.idCountry}
                                        onChange={(e) => setCreateMeta((p) => ({ ...p, [t.apiId]: { ...meta, idCountry: e.target.value } }))}
                                        className="w-36 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                                        <option value="">País…</option>
                                        {countries.map((c) => <option key={c.id_country} value={c.id_country}>{c.name}</option>)}
                                      </select>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {clubsMsg && (
                    <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${clubsMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {clubsMsg.type === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />} {clubsMsg.text}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button onClick={saveClubMappings} disabled={savingClubs}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-40">
                      {savingClubs ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                      Salvar mapeamentos
                    </button>
                    <button onClick={() => loadTeams()} disabled={teamsLoading}
                      className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
                      <RefreshCw size={14} /> Recarregar
                    </button>
                    {pendingTeams.length > 0 && (
                      <span className="text-xs text-amber-600 font-semibold">
                        {pendingTeams.length} time(s) ainda sem clube — o import fica bloqueado até resolver.
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ETAPA 3: O que importar + preview + run ── */}
          {season && teamsData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <StepBadge n={3} done={!!runResult?.ok} active />
                <FlaskConical size={18} className="text-gray-400" />
                <h2 className="font-bold text-gray-900 text-sm">Importar</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <span className="block text-xs font-semibold text-gray-500">O que importar</span>
                  {[
                    ["matches", "Partidas e resultados"],
                    ["teamStats", "Estatísticas dos clubes (classificação/stats)"],
                    ["players", "Jogadores e estatísticas"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={targets[key]}
                        onChange={(e) => { setTargets((p) => ({ ...p, [key]: e.target.checked })); setPreview(null); }}
                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                    <input type="checkbox" checked={includeIncomplete}
                      onChange={(e) => { setIncludeIncomplete(e.target.checked); setPreview(null); }}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400" />
                    <span className="text-sm text-gray-500">Incluir jogos ainda não finalizados</span>
                  </label>
                </div>

                <div className="space-y-2.5">
                  <span className="block text-xs font-semibold text-gray-500">Partidas que já existem na base</span>
                  {[
                    ["upsert", "Inserir novas e atualizar existentes", "Placar, status, data e público são atualizados."],
                    ["insert_only", "Só inserir novas", "Nunca toca em partida já cadastrada."],
                  ].map(([val, label, hint]) => (
                    <label key={val} className="flex items-start gap-2 cursor-pointer select-none">
                      <input type="radio" name="mode" checked={mode === val}
                        onChange={() => { setMode(val); setPreview(null); }}
                        className="w-4 h-4 mt-0.5 border-gray-300 text-violet-600 focus:ring-violet-400" />
                      <span className="text-sm text-gray-700">{label}
                        <span className="block text-[11px] text-gray-400">{hint}</span>
                      </span>
                    </label>
                  ))}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ano da temporada na plataforma</label>
                    <input value={seasonYear} onChange={(e) => { setSeasonYear(e.target.value.replace(/\D/g, "")); setPreview(null); }}
                      className="w-28 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    <p className="text-[11px] text-gray-400 mt-1">Temporada {season.label} da API → gravada como {seasonYear || "?"} aqui.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button onClick={handlePreview}
                  disabled={previewing || running || !selectedTargetsCount || !seasonYear}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-40">
                  {previewing ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />}
                  Pré-visualizar (não grava nada)
                </button>
                <button onClick={handleRun}
                  disabled={running || previewing || !preview?.ok || !preview?.canRun}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-40"
                  title={!preview ? "Rode a pré-visualização primeiro" : !preview.canRun ? "Há times sem mapeamento" : ""}>
                  {running ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                  Importar agora
                </button>
              </div>

              {/* Preview */}
              {preview && (
                <div className="space-y-3 pt-1">
                  {!preview.ok ? (
                    <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 bg-red-50 text-red-700">
                      <XCircle size={16} /> {preview.message}
                    </div>
                  ) : (
                    <>
                      {preview.unmappedTeams?.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
                            <AlertTriangle size={15} /> {preview.unmappedTeams.length} time(s) sem clube mapeado — resolva na etapa 2:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {preview.unmappedTeams.map((t) => (
                              <span key={t.apiId} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-amber-200 text-xs font-semibold text-gray-700">
                                {img(t.image) && <img src={img(t.image)} alt="" className="w-4 h-4 object-contain" />}
                                {t.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid sm:grid-cols-3 gap-3">
                        {preview.matches && (
                          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Trophy size={12} /> Partidas</div>
                            <div className="text-sm text-gray-700 space-y-0.5">
                              <div><b className="text-emerald-600">{preview.matches.toInsert}</b> nova(s)</div>
                              <div><b className={mode === "upsert" ? "text-blue-600" : "text-gray-400"}>{preview.matches.toUpdate}</b> já existem {mode === "upsert" ? "(serão atualizadas)" : "(serão mantidas)"}</div>
                              <div className="text-xs text-gray-400 pt-1">{preview.matches.totalApi} na API · {preview.matches.complete} finalizadas · {preview.matches.considered} consideradas</div>
                            </div>
                          </div>
                        )}
                        {preview.teamStats && (
                          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Shield size={12} /> Stats de clubes</div>
                            <div className="text-sm text-gray-700 space-y-0.5">
                              <div><b className="text-emerald-600">{preview.teamStats.withStats}</b> clube(s) com stats</div>
                              <div><b className="text-blue-600">{preview.teamStats.existingRows}</b> linha(s) já na base (upsert)</div>
                            </div>
                          </div>
                        )}
                        {preview.players && (
                          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Jogadores</div>
                            <div className="text-sm text-gray-700 space-y-0.5">
                              <div><b className="text-emerald-600">{preview.players.newPlayers}</b> novo(s)</div>
                              <div><b className="text-blue-600">{preview.players.matchedByApiId}</b> por ID · <b className="text-amber-600">{preview.players.matchedByName}</b> por nome</div>
                              <div className="text-xs text-gray-400 pt-1">{preview.players.totalApi} na API{preview.players.withoutClub ? ` · ${preview.players.withoutClub} sem clube` : ""}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      {preview.canRun && (
                        <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={15} /> Tudo mapeado — pode importar. A pré-visualização não gravou nada.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Resultado do run */}
              {runResult && (
                <div className="space-y-2 pt-1">
                  <div className={`flex items-center gap-2 text-sm font-semibold rounded-lg px-3 py-2.5 ${runResult.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {runResult.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {runResult.ok ? "Importação concluída." : runResult.message}
                  </div>
                  {runResult.ok && (
                    <ul className="text-sm text-gray-600 space-y-1 pl-1">
                      {runResult.matches && <li>• Partidas: <b>{runResult.matches.written}</b> gravada(s){runResult.matches.skippedIncomplete ? ` · ${runResult.matches.skippedIncomplete} não finalizadas fora` : ""}</li>}
                      {runResult.teamStats && <li>• Stats de clubes: <b>{runResult.teamStats.written}</b> linha(s)</li>}
                      {runResult.players && <li>• Jogadores: <b>{runResult.players.new}</b> novo(s) · {runResult.players.linkedExisting} vinculado(s) · {runResult.players.seasons} vínculo(s) de temporada · {runResult.players.stats} stats{runResult.players.skippedNoClub ? ` · ${runResult.players.skippedNoClub} sem clube (pulados)` : ""}</li>}
                    </ul>
                  )}
                  {runResult.unmappedTeams?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {runResult.unmappedTeams.map((t) => (
                        <span key={t.apiId} className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">{t.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
