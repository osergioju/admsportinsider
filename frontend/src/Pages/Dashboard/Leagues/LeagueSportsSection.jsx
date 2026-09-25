import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import { clubUrl, teamCrestSources } from "../../../utils/clubUrl";
import { Loader2, Trophy, ChevronsDown, ArrowRight, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, Calendar } from "lucide-react";
import { useTranslation } from "../../../context/TranslationContext";
import TeamCrest from "../../../components/uxui/TeamCrest";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ClubLink({ id, slug, hidden, className, children, federationSlug, isCountry, federationActive }) {
  if (hidden) return <span className={className}>{children}</span>;
  // Seleções: navega para a página da federação (CBF, DFB...) somente se ela está
  // ativa — federação desativada no modo manutenção não recebe link
  if (federationSlug && federationActive) return <Link to={`/dashboard/federations/${federationSlug}`} className={className}>{children}</Link>;
  if (isCountry || federationSlug) return <span className={className}>{children}</span>;
  return <Link to={clubUrl(id, slug)} className={className}>{children}</Link>;
}

// TeamCrest agora é compartilhado (utils/clubUrl + components/uxui/TeamCrest):
// resolve federação → crest_url → slug e cai de uma fonte p/ outra no onError,
// sem checagem de 404. Importado no topo do arquivo.

// Seletor de temporada: dropdown compacto que mostra o ano atual e abre um painel
// com os anos em grade (escala bem de 2 a 20+ temporadas, ex.: Intercontinental
// 2005-2025, sem virar uma régua horizontal interminável). Fecha ao clicar fora
// ou apertar Esc; abre já rolado até o ano selecionado.
function SeasonSelector({ seasons, season, onSelect }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const current = season ?? seasons[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    // Centraliza o ano ativo na abertura
    const raf = requestAnimationFrame(() => {
      listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!seasons?.length) return null;

  return (
    <div ref={wrapRef} className="relative shrink-0 pr-1.5 pl-1">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className={`flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg text-sm font-bold transition-colors
          ${open ? "bg-gray-100 text-gray-900" : "text-gray-900 hover:bg-gray-50"}`}>
        <Calendar size={15} className="text-gray-400 shrink-0" />
        <span className="tabular-nums">{current}</span>
        <ChevronDown size={15} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-[244px] rounded-xl border border-gray-200 bg-white shadow-xl p-2">
          <div className="px-1.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {seasons.length} temporadas
          </div>
          <div ref={listRef} className="grid grid-cols-3 gap-1 max-h-[236px] overflow-y-auto pr-0.5
            [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
            {seasons.map((y) => {
              const active = current === y;
              return (
                <button key={y} type="button" data-active={active} onClick={() => { onSelect(y); setOpen(false); }}
                  className={`px-2 py-1.5 rounded-lg text-sm font-bold tabular-nums transition-all
                    ${active ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const fmtDate = d => d
  ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" })
  : "—";

// ─── Stat-table helpers (Disciplinar / Ofensivo / Defensivo / Controle / etc) ──

const DASH = "—";
const fInt = (v) => (v == null ? DASH : String(v));
const fDec = (v, d = 2) => (v == null ? DASH : Number(v).toFixed(d));
const fPct = (v, d = 0) => (v == null ? DASH : `${Number(v).toFixed(d)}%`);
const fSigned = (v, d = 2) => (v == null ? DASH : `${v > 0 ? "+" : ""}${Number(v).toFixed(d)}`);
// Razão segura (null se denominador ausente ou zero)
const ratio = (a, b) => (a == null || b == null || b === 0 ? null : a / b);

function clubCell(row) {
  return (
    <ClubLink
      id={row.id} slug={row.slug} hidden={row.hidden} federationSlug={row.federation_slug} isCountry={row.is_country} federationActive={row.federation_active}
      className="flex items-center gap-2.5 hover:text-violet-700 transition-colors font-semibold text-gray-700"
    >
      <TeamCrest team={row} />
      <span className="truncate">{row.name}</span>
    </ClubLink>
  );
}

// Tabela genérica ordenável. `columns` define cada coluna além do ranking (#).
// Cada coluna: { key, label, align, width, sortable, value(row)→number, render(row), groupStart }
function SortableTable({ rows, columns, defaultSort, minWidth = "min-w-[640px]", emptyText }) {
  const [sort, setSort] = useState(defaultSort);
  const toggle = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));

  const col = columns.find((c) => c.key === sort.key);
  const sorted = useMemo(() => {
    if (!col?.value) return rows ?? [];
    return [...(rows ?? [])].sort((a, b) => {
      const av = col.value(a), bv = col.value(b);
      const an = av == null, bn = bv == null;
      if (an && bn) return 0;
      if (an) return 1;      // nulos sempre por último
      if (bn) return -1;
      return sort.dir === "desc" ? bv - av : av - bv;
    });
  }, [rows, col, sort.dir]);

  if (!rows?.length) return <p className="text-sm text-center text-gray-400 py-8">{emptyText}</p>;

  return (
    <div className="rounded-xl border border-gray-100 overflow-x-auto bg-white shadow-sm">
      <table className={`w-full text-sm table-fixed ${minWidth}`}>
        <thead>
          <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100 text-xs">
            <th className="py-3 px-3 text-center font-semibold w-10">#</th>
            {columns.map((c) => {
              const active = sort.key === c.key;
              return (
                <th key={c.key}
                  className={`py-3 px-2 font-semibold align-bottom ${c.align === "left" ? "text-left" : "text-center"} ${c.width ?? ""} ${c.groupStart ? "border-l border-gray-100" : ""}`}>
                  {c.sortable ? (
                    <button type="button" onClick={() => toggle(c.key)}
                      className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors ${active ? "text-gray-700" : "hover:text-gray-600"}`}>
                      <span className="leading-tight">{c.label}</span>
                      {active ? (sort.dir === "desc" ? <ArrowDown size={12} className="shrink-0" /> : <ArrowUp size={12} className="shrink-0" />)
                        : <ArrowUpDown size={12} className="shrink-0 opacity-40" />}
                    </button>
                  ) : (
                    <span className="leading-tight">{c.label}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.id ?? i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
              <td className="px-3 py-3 text-center font-semibold text-gray-400 tabular-nums">{i + 1}</td>
              {columns.map((c) => (
                <td key={c.key}
                  className={`px-2 py-3 ${c.align === "left" ? "" : "text-center tabular-nums"} ${c.tdClass ?? ""} ${c.groupStart ? "border-l border-gray-50" : ""}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Disciplinar ────────────────────────────────────────────────────────────

function DisciplinaryTable({ rows, t }) {
  const cardBadge = (value, color) => (
    <span className={`inline-flex items-center gap-1.5 font-bold ${color === "amber" ? "text-amber-600" : "text-red-600"}`}>
      <span className={`w-2.5 h-3.5 rounded-[2px] inline-block shrink-0 ${color === "amber" ? "bg-amber-400" : "bg-red-500"}`} />
      {fInt(value)}
    </span>
  );
  const columns = [
    { key: "club", label: "Clube", align: "left", render: clubCell },
    { key: "matches", label: "Jogos", width: "w-[110px]", render: (r) => <span className="text-gray-500">{fInt(r.matches)}</span> },
    { key: "fouls", label: "Faltas", width: "w-[110px]", sortable: true, value: (r) => r.fouls, render: (r) => <span className="text-gray-600 font-medium">{fInt(r.fouls)}</span> },
    { key: "yellow", label: "Amarelos", width: "w-[110px]", sortable: true, value: (r) => r.yellow, render: (r) => cardBadge(r.yellow, "amber") },
    { key: "red", label: "Vermelhos", width: "w-[110px]", sortable: true, value: (r) => r.red, render: (r) => cardBadge(r.red, "red") },
  ];
  return (
    <SortableTable rows={rows} columns={columns} defaultSort={{ key: "yellow", dir: "desc" }}
      minWidth="min-w-[560px]" emptyText={t("sports.no_discipline", "Sem dados disciplinares.")} />
  );
}

// ─── Ofensivo ───────────────────────────────────────────────────────────────

function OffensiveTable({ rows, t }) {
  const columns = [
    { key: "club", label: "Clube", align: "left", render: clubCell },
    { key: "matches_played", label: "Jogos", width: "w-[88px]", render: (r) => <span className="text-gray-500">{fInt(r.matches_played)}</span> },
    { key: "goals_scored", label: "Gols", width: "w-[88px]", sortable: true, value: (r) => r.goals_scored, render: (r) => <span className="font-bold text-gray-800">{fInt(r.goals_scored)}</span> },
    { key: "gpj", label: "Gols/Jogo", width: "w-[96px]", sortable: true, value: (r) => ratio(r.goals_scored, r.matches_played), render: (r) => <span className="text-gray-600">{fDec(ratio(r.goals_scored, r.matches_played))}</span> },
    { key: "shots", label: "Chutes", width: "w-[88px]", sortable: true, value: (r) => r.shots, groupStart: true, render: (r) => <span className="text-gray-500">{fInt(r.shots)}</span> },
    { key: "shots_on_target", label: "Chutes no Gol", width: "w-[110px]", sortable: true, value: (r) => r.shots_on_target, render: (r) => <span className="text-gray-600">{fInt(r.shots_on_target)}</span> },
    { key: "shots_pct", label: "Chutes no Gol (%)", width: "w-[120px]", sortable: true, value: (r) => ratio(r.shots_on_target, r.shots), render: (r) => { const v = ratio(r.shots_on_target, r.shots); return <span className="text-gray-600 font-medium">{v == null ? DASH : fPct(v * 100)}</span>; } },
    { key: "xg", label: "xG", width: "w-[80px]", sortable: true, value: (r) => r.xg_for, groupStart: true, render: (r) => <span className="text-violet-600 font-medium">{fDec(r.xg_for)}</span> },
    { key: "gpj2", label: "Gols/Jogo", width: "w-[96px]", sortable: true, value: (r) => r.goals_scored_per_match, render: (r) => <span className="text-gray-600">{fDec(r.goals_scored_per_match)}</span> },
    { key: "diff", label: "Diferença", width: "w-[96px]", sortable: true, value: (r) => (r.goals_scored_per_match == null || r.xg_for == null ? null : r.goals_scored_per_match - r.xg_for), render: (r) => { const v = (r.goals_scored_per_match == null || r.xg_for == null) ? null : r.goals_scored_per_match - r.xg_for; return <span className={`font-semibold ${v == null ? "text-gray-400" : v > 0 ? "text-emerald-600" : v < 0 ? "text-red-500" : "text-gray-500"}`}>{fSigned(v)}</span>; } },
  ];
  return (
    <SortableTable rows={rows} columns={columns} defaultSort={{ key: "goals_scored", dir: "desc" }}
      minWidth="min-w-[920px]" emptyText={t("sports.no_stats", "Sem estatísticas para esta temporada.")} />
  );
}

// ─── Defensivo ──────────────────────────────────────────────────────────────

function DefensiveTable({ rows, t }) {
  const columns = [
    { key: "club", label: "Clube", align: "left", render: clubCell },
    { key: "matches_played", label: "Jogos", width: "w-[88px]", render: (r) => <span className="text-gray-500">{fInt(r.matches_played)}</span> },
    { key: "goals_conceded", label: "Gols Sofridos", width: "w-[110px]", sortable: true, value: (r) => r.goals_conceded, render: (r) => <span className="font-bold text-gray-800">{fInt(r.goals_conceded)}</span> },
    { key: "gcpj", label: "Gols/Jogo", width: "w-[96px]", sortable: true, value: (r) => ratio(r.goals_conceded, r.matches_played), render: (r) => <span className="text-gray-600">{fDec(ratio(r.goals_conceded, r.matches_played))}</span> },
    { key: "clean_sheets", label: "Jogos Sem Sofrer Gols", width: "w-[150px]", sortable: true, value: (r) => r.clean_sheets, groupStart: true, render: (r) => <span className="text-emerald-600 font-semibold">{fInt(r.clean_sheets)}</span> },
    { key: "cs_pct", label: "(%)", width: "w-[80px]", sortable: true, value: (r) => r.clean_sheet_percentage, render: (r) => <span className="text-gray-600">{fPct(r.clean_sheet_percentage)}</span> },
    { key: "xg_against", label: "xG", width: "w-[80px]", sortable: true, value: (r) => r.xg_against, groupStart: true, render: (r) => <span className="text-violet-600 font-medium">{fDec(r.xg_against)}</span> },
    { key: "gcpm", label: "Gols Sofridos/Jogo", width: "w-[130px]", sortable: true, value: (r) => r.goals_conceded_per_match, render: (r) => <span className="text-gray-600">{fDec(r.goals_conceded_per_match)}</span> },
    { key: "diff", label: "Diferença", width: "w-[96px]", sortable: true, value: (r) => (r.goals_conceded_per_match == null || r.xg_against == null ? null : r.goals_conceded_per_match - r.xg_against), render: (r) => { const v = (r.goals_conceded_per_match == null || r.xg_against == null) ? null : r.goals_conceded_per_match - r.xg_against; return <span className={`font-semibold ${v == null ? "text-gray-400" : v < 0 ? "text-emerald-600" : v > 0 ? "text-red-500" : "text-gray-500"}`}>{fSigned(v)}</span>; } },
  ];
  return (
    <SortableTable rows={rows} columns={columns} defaultSort={{ key: "goals_conceded", dir: "asc" }}
      minWidth="min-w-[920px]" emptyText={t("sports.no_stats", "Sem estatísticas para esta temporada.")} />
  );
}

// ─── Controle ───────────────────────────────────────────────────────────────

function ControlTable({ rows, t }) {
  const columns = [
    { key: "club", label: "Clube", align: "left", render: clubCell },
    { key: "possession", label: "Posse de Bola", width: "w-[120px]", sortable: true, value: (r) => r.possession, render: (r) => <span className="font-bold text-gray-800">{fPct(r.possession)}</span> },
    { key: "first_to_score", label: "Primeiro a Fazer Gol", width: "w-[150px]", sortable: true, value: (r) => r.first_to_score, render: (r) => <span className="text-gray-600">{fInt(r.first_to_score)}</span> },
    { key: "leading_at_half_time", label: "Vencendo no Intervalo", width: "w-[150px]", sortable: true, value: (r) => r.leading_at_half_time, groupStart: true, render: (r) => <span className="text-emerald-600 font-semibold">{fInt(r.leading_at_half_time)}</span> },
    { key: "wins", label: "Vitórias", width: "w-[96px]", sortable: true, value: (r) => r.wins, render: (r) => <span className="text-gray-600">{fInt(r.wins)}</span> },
    { key: "draw_at_half_time", label: "Empatando no Intervalo", width: "w-[155px]", sortable: true, value: (r) => r.draw_at_half_time, groupStart: true, render: (r) => <span className="text-gray-500 font-semibold">{fInt(r.draw_at_half_time)}</span> },
    { key: "draws", label: "Empates", width: "w-[96px]", sortable: true, value: (r) => r.draws, render: (r) => <span className="text-gray-600">{fInt(r.draws)}</span> },
    { key: "losing_at_half_time", label: "Perdendo no Intervalo", width: "w-[150px]", sortable: true, value: (r) => r.losing_at_half_time, groupStart: true, render: (r) => <span className="text-red-500 font-semibold">{fInt(r.losing_at_half_time)}</span> },
    { key: "losses", label: "Derrotas", width: "w-[96px]", sortable: true, value: (r) => r.losses, render: (r) => <span className="text-gray-600">{fInt(r.losses)}</span> },
  ];
  return (
    <SortableTable rows={rows} columns={columns} defaultSort={{ key: "possession", dir: "desc" }}
      minWidth="min-w-[960px]" emptyText={t("sports.no_stats", "Sem estatísticas para esta temporada.")} />
  );
}

// ─── Artilharia / Assistências (jogadores) ──────────────────────────────────

function playerCell(row) {
  return (
    <Link to={`/dashboard/players/${row.id}`} className="font-semibold text-gray-700 hover:text-violet-700 transition-colors truncate block">
      {row.name}
    </Link>
  );
}
function playerClubCell(row) {
  const c = row.club ?? {};
  return (
    <ClubLink id={c.id} slug={c.slug} hidden={c.hidden} className="flex items-center gap-2 hover:text-violet-700 transition-colors text-gray-600">
      <TeamCrest team={{ ...c, crest: c.crest }} size="w-5 h-5" />
      <span className="truncate">{c.name}</span>
    </ClubLink>
  );
}

function ScorersTable({ rows, t }) {
  const columns = [
    { key: "player", label: "Nome", align: "left", render: playerCell },
    { key: "club", label: "Clube", align: "left", render: playerClubCell },
    { key: "minutes_played", label: "Minutos Jogados", width: "w-[120px]", sortable: true, value: (r) => r.minutes_played, render: (r) => <span className="text-gray-500">{fInt(r.minutes_played)}</span> },
    { key: "goals", label: "Gols", width: "w-[80px]", sortable: true, value: (r) => r.goals, render: (r) => <span className="font-bold text-gray-800">{fInt(r.goals)}</span> },
    { key: "penalty_goals", label: "Gols de Pênalti", width: "w-[110px]", sortable: true, value: (r) => r.penalty_goals, render: (r) => <span className="text-gray-600">{fInt(r.penalty_goals)}</span> },
    { key: "penalty_misses", label: "Pênaltis Perdidos", width: "w-[120px]", sortable: true, value: (r) => r.penalty_misses, render: (r) => <span className="text-gray-600">{fInt(r.penalty_misses)}</span> },
    { key: "g90", label: "Gols por 90 min", width: "w-[120px]", sortable: true, value: (r) => ratio(r.goals, ratio(r.minutes_played, 90)), render: (r) => <span className="text-violet-600 font-medium">{fDec(ratio(r.goals, ratio(r.minutes_played, 90)))}</span> },
  ];
  return (
    <SortableTable rows={rows} columns={columns} defaultSort={{ key: "goals", dir: "desc" }}
      minWidth="min-w-[860px]" emptyText={t("sports.no_scorers", "Sem dados de artilharia.")} />
  );
}

function AssistsTable({ rows, t }) {
  const columns = [
    { key: "player", label: "Nome", align: "left", render: playerCell },
    { key: "club", label: "Clube", align: "left", render: playerClubCell },
    { key: "minutes_played", label: "Minutos Jogados", width: "w-[120px]", sortable: true, value: (r) => r.minutes_played, render: (r) => <span className="text-gray-500">{fInt(r.minutes_played)}</span> },
    { key: "assists", label: "Assistências", width: "w-[110px]", sortable: true, value: (r) => r.assists, render: (r) => <span className="font-bold text-gray-800">{fInt(r.assists)}</span> },
    { key: "mpa", label: "Minutos por Assistência", width: "w-[160px]", sortable: true, value: (r) => ratio(r.minutes_played, r.assists), render: (r) => <span className="text-gray-600">{fDec(ratio(r.minutes_played, r.assists), 0)}</span> },
    { key: "gi90", label: "Envolvimento em Gols por 90 min", width: "w-[180px]", sortable: true, value: (r) => ratio((r.goals ?? 0) + (r.assists ?? 0), ratio(r.minutes_played, 90)), render: (r) => <span className="text-violet-600 font-medium">{fDec(ratio((r.goals ?? 0) + (r.assists ?? 0), ratio(r.minutes_played, 90)))}</span> },
  ];
  return (
    <SortableTable rows={rows} columns={columns} defaultSort={{ key: "assists", dir: "desc" }}
      minWidth="min-w-[920px]" emptyText={t("sports.no_assists", "Sem dados de assistências.")} />
  );
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

function SubTabs({ value, onChange, options }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5 self-start w-fit shrink-0">
      {options.map(({ key, label }) => (
        <button key={key} onClick={() => onChange(key)}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all
            ${value === key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}


// ─── Standings table ──────────────────────────────────────────────────────────

function StandingsTable({ rows, t, seasonConfig, legendContLabel }) {
  if (!rows?.length) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_classification", "Sem dados de classificação.")}</p>
  );

  const n = rows.length;

  // Use per-season config when available; fall back to heuristics
  const continentalSpots = seasonConfig?.continental_spots ?? (n >= 8 ? Math.ceil(n * 0.25) : 0);
  const relegationSpots = seasonConfig?.relegation_spots ?? Math.max(2, Math.ceil(n * 0.15));

  const zoneOf = (pos) => {
    if (pos === 1) return "champion";
    if (continentalSpots > 0 && pos > 1 && pos <= continentalSpots) return "continental";
    if (relegationSpots > 0 && pos > n - relegationSpots) return "relegation";
    return null;
  };

  const zoneBar = (pos) => {
    const z = zoneOf(pos);
    if (z === "champion") return "border-l-2 border-gray-900";
    if (z === "continental") return "border-l-2 border-emerald-400";
    if (z === "relegation") return "border-l-2 border-red-400";
    return "border-l-2 border-transparent";
  };

  return (
    <div className="mb-10 rounded-xl border border-gray-100 overflow-x-auto bg-white shadow-sm">
      <table className="w-full text-sm min-w-[540px]">
        <thead>
          <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <th className="py-3 px-3 text-center font-semibold w-10 sticky left-0 bg-gray-50 z-20">#</th>
            <th className="py-3 px-3 text-left font-semibold sticky left-[40px] bg-gray-50 z-20">Clube</th>
            <th className="py-3 px-2 text-center font-semibold text-violet-500">P</th>
            <th className="py-3 px-2 text-center font-semibold">J</th>
            <th className="py-3 px-2 text-center font-semibold text-emerald-500">V</th>
            <th className="py-3 px-2 text-center font-semibold">E</th>
            <th className="py-3 px-2 text-center font-semibold text-red-400">D</th>
            <th className="py-3 px-2 text-center font-semibold">GP</th>
            <th className="py-3 px-2 text-center font-semibold">GC</th>
            <th className="py-3 px-2 text-center font-semibold">SG</th>
            <th className="py-3 px-2 text-center font-semibold">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pos = row.pos ?? i + 1;
            return (
              <tr key={row.id ?? i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className={`px-3 py-3 sticky left-0 bg-white z-10 ${zoneBar(pos)}`}>
                  <span className={`text-sm font-bold block text-center tabular-nums ${pos === 1 ? "text-gray-900" : "text-gray-400"}`}>
                    {pos}
                  </span>
                </td>

                <td className="px-3 py-3 sticky left-[40px] bg-white z-10">
                  <ClubLink
                    id={row.id} slug={row.slug} hidden={row.hidden} federationSlug={row.federation_slug} isCountry={row.is_country} federationActive={row.federation_active}
                    className={`flex items-center gap-2.5 hover:text-violet-700 transition-colors ${pos === 1 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}
                  >
                    <TeamCrest team={row} />
                    <span className="truncate">{row.name}</span>
                  </ClubLink>
                </td>
                <td className={`px-2 py-3 text-center font-bold tabular-nums text-base ${pos === 1 ? "text-gray-900" : "text-gray-700"}`}>{row.pts}</td>
                <td className="px-2 py-3 text-center text-gray-500 tabular-nums">{row.j}</td>
                <td className="px-2 py-3 text-center font-semibold text-emerald-600 tabular-nums">{row.v}</td>
                <td className="px-2 py-3 text-center text-gray-500 tabular-nums">{row.e}</td>
                <td className="px-2 py-3 text-center text-red-400 tabular-nums">{row.d}</td>
                <td className="px-2 py-3 text-center text-gray-600 tabular-nums">{row.gp}</td>
                <td className="px-2 py-3 text-center text-gray-600 tabular-nums">{row.gc}</td>
                <td className={`px-2 py-3 text-center font-semibold tabular-nums ${row.sg > 0 ? "text-emerald-600" : row.sg < 0 ? "text-red-500" : "text-gray-400"}`}>
                  {row.sg > 0 ? `+${row.sg}` : row.sg}
                </td>
                <td className="px-2 py-3 text-center text-gray-500 tabular-nums">{row.pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {n >= 6 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-900 shrink-0" />Líder
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />{legendContLabel ?? "Zona continental"}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />Rebaixamento
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Two-group standings (apertura/clausura com grupos A e B) ────────────────

function GroupedStandings({ rows, groupClubs, classificados, t, seasonConfig }) {
  const entries = Object.entries(groupClubs);
  if (!entries.length) return <StandingsTable rows={rows} t={t} seasonConfig={seasonConfig} />;

  return (
    <div className={`grid gap-4 ${entries.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
      {entries.map(([groupKey, clubIds]) => {
        const groupRows = rows
          .filter(r => clubIds.includes(r.id))
          .sort((a, b) => (b.pts - a.pts) || (b.sg - a.sg) || (b.gp - a.gp))
          .map((r, i) => ({ ...r, pos: i + 1 }));
        const groupConfig = {
          continental_spots: classificados ?? 0,
          relegation_spots: 0,
        };
        return (
          <div key={groupKey} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-xs font-bold text-violet-700">{groupKey}</span>
              </div>
              <span className="text-sm font-bold text-gray-700">Grupo {groupKey}</span>
              {classificados > 0 && (
                <span className="text-xs text-gray-400 ml-1">{classificados} avançam</span>
              )}
            </div>
            <StandingsTable rows={groupRows} t={t} seasonConfig={groupConfig} legendContLabel="Avança" />
          </div>
        );
      })}
    </div>
  );
}

// ─── Confronto card ───────────────────────────────────────────────────────────

// Returns the score of `teamId` in a given leg (handles home/away swap)
function legScoreFor(leg, teamId) {
  if (leg.home_goals == null) return null;
  if (leg.home?.id === teamId) return leg.home_goals;
  if (leg.away?.id === teamId) return leg.away_goals;
  return null;
}

// Peças da tabela de confrontos — no nível do módulo (dentro do componente eram recriadas a cada render)
const ScoreBox = ({ score, href, dim }) => {
  const box = (
    <div className={`w-9 h-7 flex items-center justify-center rounded text-xs font-bold tabular-nums
      ${score == null
        ? "bg-gray-50 text-gray-200"
        : dim
          ? "bg-gray-50 text-gray-400"
          : "bg-gray-100 text-gray-700"}`}>
      {score ?? "–"}
    </div>
  );
  return href
    ? <Link to={href} className="hover:opacity-70 transition-opacity shrink-0">{box}</Link>
    : <div className="shrink-0">{box}</div>;
};

const AggBox = ({ score, isWinner }) => (
  <div className={`w-9 h-7 flex items-center justify-center rounded text-sm font-extrabold tabular-nums shrink-0
    ${score == null
      ? "bg-gray-50 text-gray-200"
      : isWinner
        ? "bg-gray-900 text-white"
        : "bg-gray-100 text-gray-400"}`}>
    {score ?? "–"}
  </div>
);

const TeamRow = ({ team, isWinner, isLoser, leg1, leg2, agg }) => {
  const s1 = legScoreFor(leg1, team.id);
  const s2 = legScoreFor(leg2, team.id);
  const aggScore = agg[team.id] ?? null;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-2.5 ${isLoser ? "opacity-100" : ""}`}>
      <TeamCrest team={team} />
      <ClubLink id={team.id} slug={team.slug} hidden={team.hidden} federationSlug={team.federation_slug} isCountry={team.is_country} federationActive={team.federation_active}
        className={`flex-1 min-w-0 text-sm truncate hover:underline transition-colors
          ${isWinner ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
        {team.name}
      </ClubLink>
      <ScoreBox score={s1} href={`/dashboard/matches/${leg1.id}`} dim={!isWinner} />
      <ScoreBox score={s2} href={`/dashboard/matches/${leg2.id}`} dim={!isWinner} />
      <AggBox score={aggScore} isWinner={isWinner} />
    </div>
  );
};

const SingleRow = ({ team, score, isWinner, isLoser }) => (
  <div className={`flex items-center gap-2.5 px-4 py-2.5 ${isLoser ? "opacity-35" : ""}`}>
    <TeamCrest team={team} />
    <ClubLink id={team.id} slug={team.slug} hidden={team.hidden} federationSlug={team.federation_slug} isCountry={team.is_country} federationActive={team.federation_active}
      className={`flex-1 min-w-0 text-sm truncate hover:underline transition-colors
        ${isWinner ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
      {team.name}
    </ClubLink>
    {score !== null && (
      <span className={`text-base tabular-nums font-extrabold shrink-0
        ${isWinner ? "text-gray-900" : "text-gray-400"}`}>
        {score}
      </span>
    )
    }
  </div >
);

function ConfrontoCard({ confronto }) {
  const { team1, team2, legs, agg } = confronto;
  const isDoubleLegged = legs.length === 2;

  const agg1 = agg[team1.id] ?? null;
  const agg2 = agg[team2.id] ?? null;
  const allFinished = legs.every(l => l.home_goals != null);
  const aggDone = allFinished && agg1 !== null && agg2 !== null;
  let winner = null;
  if (aggDone && agg1 !== agg2) winner = agg1 > agg2 ? team1.id : team2.id;
  // Empate no agregado: usa o vencedor definido no admin (pênaltis/critério manual)
  if (aggDone && winner === null) {
    const manual = [...legs].reverse().find(l => l.winner_id != null)?.winner_id ?? null;
    if (manual === team1.id || manual === team2.id) winner = manual;
  }

  // ── Double-legged (Ida / Volta / Agr) ──────────────────────────────────────
  if (isDoubleLegged) {
    const [leg1, leg2] = legs;

    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-colors">
        {/* Column headers */}
        <div className="flex items-center justify-end gap-1.5 px-3 pt-1.5 pb-1 border-b border-gray-50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 w-9 text-center">Ida</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 w-9 text-center">Volta</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 w-9 text-center">Agr</span>
        </div>
        <div className="py-0.5">
          <TeamRow leg1={leg1} leg2={leg2} agg={agg} team={team1} isWinner={winner === team1.id} isLoser={winner === team2.id} />
          <div className="mx-3 border-t border-gray-50" />
          <TeamRow leg1={leg1} leg2={leg2} agg={agg} team={team2} isWinner={winner === team2.id} isLoser={winner === team1.id} />
        </div>
      </div>
    );
  }

  // ── Single-legged ──────────────────────────────────────────────────────────
  const leg = legs[0];
  const s1 = leg ? legScoreFor(leg, team1.id) : null;
  const s2 = leg ? legScoreFor(leg, team2.id) : null;
  const finished = s1 !== null && s2 !== null;
  let singleWinner = null;
  if (finished && s1 !== s2) singleWinner = s1 > s2 ? team1.id : team2.id;
  // Empate: vencedor manual definido no admin (pênaltis)
  else if (finished && leg?.winner_id != null && (leg.winner_id === team1.id || leg.winner_id === team2.id)) {
    singleWinner = leg.winner_id;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-colors">
      {leg && (
        <div className="px-4 pt-2 pb-1.5 border-b border-gray-50 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-400">{fmtDate(leg.date)}</span>
          <Link to={`/dashboard/matches/${leg.id}`}
            className="flex items-center gap-1 text-[11px] font-bold text-violet-500 hover:text-violet-700 transition-colors shrink-0">
            Ver partida <ArrowRight size={11} />
          </Link>
        </div>
      )}
      <div className="py-1">
        <SingleRow team={team1} score={s1} isWinner={singleWinner === team1.id} isLoser={singleWinner === team2.id} />
        <div className="mx-4 border-t border-gray-50" />
        <SingleRow team={team2} score={s2} isWinner={singleWinner === team2.id} isLoser={singleWinner === team1.id} />
      </div>
    </div>
  );
}

// ─── Bracket helpers ──────────────────────────────────────────────────────────

function computeLeagueStandings(games) {
  const stats = {};
  for (const g of games) {
    for (const side of [g.home, g.away]) {
      if (!stats[side.id]) stats[side.id] = { id: side.id, name: side.name, crest: side.crest, slug: side.slug ?? null, hidden: side.hidden ?? false, federation_active: side.federation_active ?? false, is_country: side.is_country ?? false, federation_slug: side.federation_slug ?? null, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 };
    }
    if (g.home_goals == null || g.away_goals == null) continue;
    const h = stats[g.home.id], a = stats[g.away.id];
    h.j++; a.j++;
    h.gp += Number(g.home_goals); h.gc += Number(g.away_goals);
    a.gp += Number(g.away_goals); a.gc += Number(g.home_goals);
    if (Number(g.home_goals) > Number(g.away_goals)) { h.v++; h.pts += 3; a.d++; }
    else if (Number(g.home_goals) < Number(g.away_goals)) { a.v++; a.pts += 3; h.d++; }
    else { h.e++; a.e++; h.pts++; a.pts++; }
  }
  return Object.values(stats)
    .map(s => ({ ...s, sg: s.gp - s.gc, pct: s.j ? Math.round((s.pts / (s.j * 3)) * 100) : 0 }))
    .sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || b.v - a.v)
    .map((r, i) => ({ ...r, pos: i + 1 }));
}

// Infer group membership via BFS connected components, then compute standings
function computeGroupStandings(games) {
  if (!games.length) return [];
  const teamOpponents = new Map();
  const teamInfo = new Map();
  for (const g of games) {
    for (const side of [g.home, g.away]) {
      if (!teamOpponents.has(side.id)) teamOpponents.set(side.id, new Set());
      teamInfo.set(side.id, side);
    }
    teamOpponents.get(g.home.id).add(g.away.id);
    teamOpponents.get(g.away.id).add(g.home.id);
  }
  const visited = new Set();
  const groups = [];
  for (const teamId of teamOpponents.keys()) {
    if (visited.has(teamId)) continue;
    const group = [];
    const queue = [teamId];
    visited.add(teamId);
    while (queue.length) {
      const curr = queue.shift();
      group.push(curr);
      for (const opp of (teamOpponents.get(curr) ?? [])) {
        if (!visited.has(opp)) { visited.add(opp); queue.push(opp); }
      }
    }
    groups.push(group);
  }
  // Ordena os grupos pela data do primeiro jogo de cada um: o grupo do jogo de
  // abertura vira o Grupo A, e assim por diante (ex: Catar 2022 → Grupo A do Catar)
  const firstGameOf = (groupIds) => {
    const idSet = new Set(groupIds);
    let first = Infinity;
    for (const g of games) {
      if (!idSet.has(g.home.id) || !idSet.has(g.away.id)) continue;
      const t = new Date(g.date ?? 0).getTime();
      if (t && t < first) first = t;
    }
    return first;
  };
  groups.sort((a, b) => firstGameOf(a) - firstGameOf(b) || Math.min(...a) - Math.min(...b));
  return groups.map(groupIds => {
    const idSet = new Set(groupIds);
    const stats = {};
    for (const id of groupIds) {
      const info = teamInfo.get(id);
      stats[id] = { id, name: info?.name ?? "", crest: info?.crest ?? null, slug: info?.slug ?? null, hidden: info?.hidden ?? false, federation_active: info?.federation_active ?? false, is_country: info?.is_country ?? false, federation_slug: info?.federation_slug ?? null, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 };
    }
    for (const g of games) {
      if (!idSet.has(g.home.id) || !idSet.has(g.away.id)) continue;
      if (g.home_goals == null || g.away_goals == null) continue;
      const h = stats[g.home.id]; const a = stats[g.away.id];
      h.j++; a.j++;
      h.gp += g.home_goals; h.gc += g.away_goals;
      a.gp += g.away_goals; a.gc += g.home_goals;
      if (g.home_goals > g.away_goals) { h.v++; h.pts += 3; a.d++; }
      else if (g.home_goals < g.away_goals) { a.v++; a.pts += 3; h.d++; }
      else { h.e++; a.e++; h.pts++; a.pts++; }
    }
    const rows = Object.values(stats).map(s => ({ ...s, sg: s.gp - s.gc, pct: s.j ? Math.round((s.pts / (s.j * 3)) * 100) : 0 }));
    rows.sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || b.v - a.v);
    rows.forEach((r, i) => { r.pos = i + 1; });
    return rows;
  });
}

// maxLegs: 1 = turno_unico (cada jogo é confronto independente), 2 = ida_volta
function buildConfrontos(flatMatches, maxLegs = 2) {
  // Ordena por data para que as pernas sejam agrupadas cronologicamente
  const sorted = [...flatMatches].sort((a, b) => new Date(a.date ?? 0) - new Date(b.date ?? 0));

  const pairCount = new Map(); // pairKey → quantos jogos já foram vistos para esse par
  const confrontoMap = new Map(); // confrontoKey → { team1, team2, legs }

  for (const m of sorted) {
    const pairKey = [m.home.id, m.away.id].sort((a, b) => a - b).join("_");
    const seen = pairCount.get(pairKey) ?? 0;
    // Cada maxLegs jogos do mesmo par formam um novo confronto
    const confrontoIdx = Math.floor(seen / maxLegs);
    const confrontoKey = `${pairKey}_${confrontoIdx}`;

    if (!confrontoMap.has(confrontoKey)) {
      confrontoMap.set(confrontoKey, { team1: m.home, team2: m.away, legs: [] });
    }
    confrontoMap.get(confrontoKey).legs.push(m);
    pairCount.set(pairKey, seen + 1);
  }

  return [...confrontoMap.values()].map(({ team1, team2, legs }) => {
    const t1 = legs[0]?.home ?? team1;
    const t2 = legs[0]?.away ?? team2;
    const agg = {};
    for (const leg of legs) {
      if (leg.home_goals == null) continue;
      agg[leg.home.id] = (agg[leg.home.id] ?? 0) + leg.home_goals;
      agg[leg.away.id] = (agg[leg.away.id] ?? 0) + leg.away_goals;
    }
    return { team1: t1, team2: t2, legs, agg, firstDate: legs[0]?.date ?? null };
  });
}

// Group confrontos into temporal windows — gap > gapDays between consecutive firstDates = new phase
function temporalCluster(sorted, gapDays = 14) {
  if (!sorted.length) return [];
  const GAP_MS = gapDays * 24 * 3600 * 1000;
  const clusters = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].firstDate ?? 0).getTime();
    const curr = new Date(sorted[i].firstDate ?? 0).getTime();
    if (curr - prev > GAP_MS) clusters.push([]);
    clusters[clusters.length - 1].push(sorted[i]);
  }
  return clusters;
}

// Within a temporal cluster, a team appearing more than once means there are sub-phases.
// Greedily partition into rounds where each team plays at most once.
function splitIntoRounds(cluster) {
  let remaining = [...cluster];
  const rounds = [];
  while (remaining.length > 0) {
    const round = [];
    const used = new Set();
    const next = [];
    for (const c of remaining) {
      const id1 = c.team1?.id;
      const id2 = c.team2?.id;
      if (id1 != null && id2 != null && !used.has(id1) && !used.has(id2)) {
        round.push(c);
        used.add(id1);
        used.add(id2);
      } else {
        next.push(c);
      }
    }
    if (round.length === 0) { rounds.push(remaining); break; } // safety: no progress
    rounds.push(round);
    remaining = next;
  }
  return rounds;
}

function assignPhases(confrontos, flatGames, structure_json, season, fasesOverride) {
  if (!confrontos.length) return [];

  const sorted = [...confrontos].sort(
    (a, b) => new Date(a.firstDate ?? 0) - new Date(b.firstDate ?? 0)
  );

  const yearData = structure_json?.[String(season)];
  const fases = fasesOverride ?? yearData?.fases ?? [];

  const clusterAndExpand = (arr) => {
    const clusters = temporalCluster(arr, 14);
    const expanded = [];
    for (const cl of clusters) {
      for (const round of splitIntoRounds(cl)) expanded.push(round);
    }
    return expanded;
  };

  const mapExpandedToPhases = (expanded, phaseList) => {
    const N = phaseList.length;
    const result = new Array(N).fill(null).map(() => []);
    const offset = N - expanded.length;
    if (offset >= 0) {
      expanded.forEach((grp, i) => { result[offset + i] = grp; });
    } else {
      result[0] = expanded.slice(0, 1 - offset).flat();
      expanded.slice(1 - offset).forEach((grp, i) => { result[1 + i] = grp; });
    }
    return result;
  };

  if (fases.length > 0) {
    // Count leading mata_mata phases that have an explicit confrontos count
    let explicitPrefixLen = 0;
    for (const f of fases) {
      if (f.tipo === "mata_mata" && (f.confrontos ?? 0) > 0) explicitPrefixLen++;
      else break;
    }

    const phaseResults = new Array(fases.length).fill(null).map(() => []);
    let cursor = 0;

    // Sequential slicing for explicit-count prefix phases
    for (let i = 0; i < explicitPrefixLen; i++) {
      const n = fases[i].confrontos;
      phaseResults[i] = sorted.slice(cursor, cursor + n);
      cursor += n;
    }

    // Temporal clustering for remaining phases
    const remaining = sorted.slice(cursor);
    const unresolvedFases = fases.slice(explicitPrefixLen);
    if (unresolvedFases.length > 0 && remaining.length > 0) {
      const expanded = clusterAndExpand(remaining);
      const subResults = mapExpandedToPhases(expanded, unresolvedFases);
      for (let i = 0; i < unresolvedFases.length; i++) {
        phaseResults[explicitPrefixLen + i] = subResults[i] ?? [];
      }
    }

    return fases.map((f, i) => {
      const phaseConfrontos = phaseResults[i] ?? [];
      let games = [];
      if (f.tipo === "grupo" && phaseConfrontos.length > 0 && flatGames?.length) {
        const dates = phaseConfrontos.flatMap(c => c.legs.map(l => new Date(l.date ?? 0).getTime())).filter(Boolean);
        if (dates.length) {
          const minDate = Math.min(...dates);
          const maxDate = Math.max(...dates);
          games = flatGames.filter(g => {
            const t = new Date(g.date ?? 0).getTime();
            return t >= minDate - 86400000 && t <= maxDate + 86400000;
          });
        }
      }
      return { nome: f.nome ?? `Fase ${i + 1}`, tipo: f.tipo, faseConfig: f, confrontos: phaseConfrontos, games };
    }).filter(p => p.confrontos.length > 0 || p.tipo === "grupo");
  }

  // ── Fallback: no structure configured ────────────────────────────────────────
  const expanded = clusterAndExpand(sorted);

  const BRACKET_NAMES = [
    ["Final"],
    ["Semifinal", "Final"],
    ["Quartas de Final", "Semifinal", "Final"],
    ["Oitavas de Final", "Quartas de Final", "Semifinal", "Final"],
    ["16 avos de Final", "Oitavas de Final", "Quartas de Final", "Semifinal", "Final"],
    ["32 avos de Final", "16 avos de Final", "Oitavas de Final", "Quartas de Final", "Semifinal", "Final"],
  ];

  const n = Math.min(expanded.length, BRACKET_NAMES.length);
  const names = BRACKET_NAMES[n - 1] ?? ["Confrontos"];
  const off = names.length - expanded.length;

  return names
    .map((nome, i) => ({ nome, tipo: "mata_mata", faseConfig: {}, confrontos: expanded[i - off] ?? [], games: [] }))
    .filter(p => p.confrontos.length > 0);
}

// When any fase has an explicit `confrontos` count, sort ALL games by date and
// assign them sequentially: each counted fase claims exactly (confrontos × legs)
// games in chronological order; uncounted fases (e.g. pontos_corridos) absorb
// whatever remains. This prevents the same pair from bleeding across phases even
// when date gaps between phases are small (e.g. CL liga → eliminatórias = 13 d).
function buildPhasedBracket(flatGames, structure_json, season, fasesOverride) {
  if (!flatGames.length) return [];

  const yearData = structure_json?.[String(season)];
  const fases = fasesOverride ?? yearData?.fases ?? [];

  const anyExplicit = fases.some(f => (f.confrontos ?? 0) > 0);
  if (!fases.length || !anyExplicit) {
    const maxLegs = fases.some(f => f.tipo === "mata_mata" && f.formato === "ida_volta") ? 2 : 1;
    return assignPhases(buildConfrontos(flatGames, maxLegs), flatGames, structure_json, season, fasesOverride);
  }

  // Sort chronologically — phases are always date-ordered regardless of import order
  const byDate = [...flatGames].sort((a, b) => new Date(a.date ?? 0) - new Date(b.date ?? 0));

  const gameCounts = fases.map(f => {
    if ((f.confrontos ?? 0) <= 0) return -1; // uncounted
    return f.confrontos * (f.formato === "ida_volta" ? 2 : 1);
  });

  const totalExplicit = gameCounts.filter(c => c > 0).reduce((s, c) => s + c, 0);
  const uncountedCount = gameCounts.filter(c => c < 0).length;
  const leftover = Math.max(0, byDate.length - totalExplicit);
  const perUncounted = uncountedCount > 0 ? Math.floor(leftover / uncountedCount) : 0;

  const result = [];
  let cursor = 0;
  let uncountedUsed = 0;

  for (let i = 0; i < fases.length; i++) {
    const f = fases[i];
    let count;

    if (gameCounts[i] < 0) {
      // Last uncounted fase absorbs rounding remainder
      const trailingAllExplicit = fases.slice(i + 1).every((_, k) => gameCounts[i + 1 + k] >= 0);
      count = trailingAllExplicit ? leftover - uncountedUsed * perUncounted : perUncounted;
      uncountedUsed++;
    } else {
      count = gameCounts[i];
    }

    const phaseGames = byDate.slice(cursor, cursor + count);
    cursor += count;

    if (phaseGames.length === 0 && f.tipo !== "grupo") continue;

    const maxLegs = f.formato === "ida_volta" ? 2 : 1;
    const confrontos = buildConfrontos(phaseGames, maxLegs);

    result.push({ nome: f.nome ?? `Fase ${i + 1}`, tipo: f.tipo, faseConfig: f, confrontos, games: phaseGames });
  }

  return result.filter(p => p.confrontos.length > 0 || p.tipo === "grupo");
}

// ─── Group phase view ─────────────────────────────────────────────────────────

function GroupPhaseView({ phase, t, adminGroups }) {
  const bfsGroups = useMemo(() => computeGroupStandings(phase.games ?? []), [phase.games]);
  const advanceCount = phase.faseConfig?.classificados_por_grupo ?? 2;

  // Alinha grupos BFS com os rótulos do admin (A, B, ...) quando disponível
  const groups = useMemo(() => {
    if (!adminGroups || !Object.keys(adminGroups).length) {
      return bfsGroups.map((rows, i) => ({ label: String.fromCharCode(65 + i), rows }));
    }
    const adminEntries = Object.entries(adminGroups).sort(([a], [b]) => a.localeCompare(b));
    const used = new Set();
    return adminEntries.map(([label, clubIds]) => {
      const idSet = new Set(clubIds);
      let bestIdx = -1, bestOverlap = -1;
      for (let i = 0; i < bfsGroups.length; i++) {
        if (used.has(i)) continue;
        const overlap = bfsGroups[i].filter(r => idSet.has(r.id)).length;
        if (overlap > bestOverlap) { bestOverlap = overlap; bestIdx = i; }
      }
      if (bestIdx >= 0) used.add(bestIdx);
      return { label, rows: bestIdx >= 0 ? bfsGroups[bestIdx] : [] };
    });
  }, [bfsGroups, adminGroups]);

  if (!groups.length || groups.every(g => !g.rows.length)) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>
  );

  const cols = groups.length <= 2
    ? "grid-cols-1 sm:grid-cols-2"
    : groups.length <= 4
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-2";

  return (
    <div className={`grid gap-4 w-full ${cols}`}>
      {groups.map(({ label, rows }) => (
        <div key={label} className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Grupo {label}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[260px]">
              <thead>
                <tr className="text-gray-400 border-b border-gray-50">
                  <th className="py-1.5 px-2 text-center w-6">#</th>
                  <th className="py-1.5 px-2 text-left">Clube</th>
                  <th className="py-1.5 px-2 text-center font-bold text-violet-500">P</th>
                  <th className="py-1.5 px-2 text-center">J</th>
                  <th className="py-1.5 px-2 text-center text-emerald-500">V</th>
                  <th className="py-1.5 px-2 text-center">E</th>
                  <th className="py-1.5 px-2 text-center text-red-400">D</th>
                  <th className="py-1.5 px-2 text-center">SG</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  const advances = ri < advanceCount;
                  return (
                    <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className={`px-2 py-2 text-center font-bold text-gray-500 ${advances ? "border-l-2 border-emerald-400" : "border-l-2 border-transparent"}`}>
                        {row.pos}
                      </td>
                      <td className="px-2 py-2 max-w-[120px]">
                        <ClubLink id={row.id} slug={row.slug} hidden={row.hidden} federationSlug={row.federation_slug} isCountry={row.is_country} federationActive={row.federation_active} className="flex items-center gap-1.5 hover:text-violet-700 transition-colors">
                          <TeamCrest team={row} size="w-4 h-4" />
                          <span className={`truncate ${advances ? "font-semibold text-gray-800" : "font-medium text-gray-600"}`}>
                            {row.name}
                          </span>
                        </ClubLink>
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-gray-900 tabular-nums">{row.pts}</td>
                      <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{row.j}</td>
                      <td className="px-2 py-2 text-center font-semibold text-emerald-600 tabular-nums">{row.v}</td>
                      <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{row.e}</td>
                      <td className="px-2 py-2 text-center text-red-400 tabular-nums">{row.d}</td>
                      <td className={`px-2 py-2 text-center font-semibold tabular-nums ${row.sg > 0 ? "text-emerald-600" : row.sg < 0 ? "text-red-500" : "text-gray-400"}`}>
                        {row.sg > 0 ? `+${row.sg}` : row.sg}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {advanceCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-gray-50 bg-gray-50/50">
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                Avança ({advanceCount})
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Torneio panel view (apertura_clausura) ───────────────────────────────────
// Separa jogos de grupos dos jogos de mata-mata usando os grupos do admin,
// computa standings apenas dentro de cada grupo e exibe o bracket da fase K.O.

function TorneioPanelView({ matchesForPhase, adminGroups, activeStandings, grupoFaseConfig, activeTorneioConfig, t }) {
  const flatGames = useMemo(() => matchesForPhase.flatMap(w => w.games), [matchesForPhase]);

  // Índice de info de times (nome + crest) a partir dos standings ou jogos
  const teamInfo = useMemo(() => {
    const info = {};
    for (const r of (activeStandings ?? [])) info[r.id] = { name: r.name, crest: r.crest, slug: r.slug ?? null, federation_slug: r.federation_slug ?? null, federation_active: r.federation_active ?? false, is_country: r.is_country ?? false };
    for (const g of flatGames) {
      if (!info[g.home.id]) info[g.home.id] = { name: g.home.name, crest: g.home.crest, slug: g.home.slug ?? null, federation_slug: g.home.federation_slug ?? null, federation_active: g.home.federation_active ?? false, is_country: g.home.is_country ?? false };
      if (!info[g.away.id]) info[g.away.id] = { name: g.away.name, crest: g.away.crest, slug: g.away.slug ?? null, federation_slug: g.away.federation_slug ?? null, federation_active: g.away.federation_active ?? false, is_country: g.away.is_country ?? false };
    }
    return info;
  }, [activeStandings, flatGames]);

  // Separa jogos por fase: grupo vs mata-mata.
  // Usa a rodada (week) como critério primário porque times do mesmo grupo
  // podem se reencontrar nas eliminatórias (ex: duas equipes do Grupo A nas Quartas).
  // - Rodadas 1..maxGroupRound → fase de grupos
  // - Rodadas > maxGroupRound → interzonais/eliminatórias
  // - Rodada 0 (null) sem resultado → jogo agendado → grupo
  // - Rodada 0 (null) com resultado → jogo sem rodada = eliminatória tardia
  const { grupoGames, mataMataGames } = useMemo(() => {
    // maxGroupRound = número de rodadas da fase de grupos (times_por_grupo - 1 para turno_unico)
    const maxGroupRound = (grupoFaseConfig?.times_por_grupo ?? 0) - 1;

    if (maxGroupRound > 0) {
      const grupoIds = new Set();
      const mmIds = new Set();
      for (const { week, games } of matchesForPhase) {
        for (const g of games) {
          if (g.home_goals == null && g.away_goals == null) {
            grupoIds.add(g.id); // agendado → grupo
          } else if (week > 0 && week <= maxGroupRound) {
            grupoIds.add(g.id); // rodada de grupo explícita
          } else {
            mmIds.add(g.id); // rodada além do grupo ou sem rodada com resultado
          }
        }
      }
      return {
        grupoGames: flatGames.filter(g => grupoIds.has(g.id)),
        mataMataGames: flatGames.filter(g => mmIds.has(g.id)),
      };
    }

    // Fallback: usa pertencimento ao grupo (quando times_por_grupo não configurado)
    if (!adminGroups || !Object.keys(adminGroups).length) {
      return { grupoGames: flatGames, mataMataGames: [] };
    }
    const groupSets = Object.fromEntries(
      Object.entries(adminGroups).map(([k, ids]) => [k, new Set(ids)])
    );
    const grupo = [], mm = [];
    for (const g of flatGames) {
      const isGrupo = Object.values(groupSets).some(s => s.has(g.home.id) && s.has(g.away.id));
      (isGrupo ? grupo : mm).push(g);
    }
    return { grupoGames: grupo, mataMataGames: mm };
  }, [flatGames, matchesForPhase, adminGroups, grupoFaseConfig]);

  // Standings por grupo (apenas jogos dentro do grupo)
  const groupStandings = useMemo(() => {
    if (!adminGroups) return null;
    const result = {};
    for (const [gKey, clubIds] of Object.entries(adminGroups)) {
      const idSet = new Set(clubIds);
      const stats = Object.fromEntries(
        clubIds.map(id => [id, {
          id,
          name: teamInfo[id]?.name ?? '',
          crest: teamInfo[id]?.crest ?? null,
          slug: teamInfo[id]?.slug ?? null,
          federation_slug: teamInfo[id]?.federation_slug ?? null,
          federation_active: teamInfo[id]?.federation_active ?? false, is_country: teamInfo[id]?.is_country ?? false,
          j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0,
        }])
      );
      for (const g of grupoGames) {
        if (!idSet.has(g.home.id) || !idSet.has(g.away.id)) continue;
        if (g.home_goals == null || g.away_goals == null) continue;
        const h = stats[g.home.id]; const a = stats[g.away.id];
        if (!h || !a) continue;
        h.j++; a.j++;
        h.gp += Number(g.home_goals); h.gc += Number(g.away_goals);
        a.gp += Number(g.away_goals); a.gc += Number(g.home_goals);
        if (g.home_goals > g.away_goals) { h.v++; a.d++; }
        else if (g.home_goals < g.away_goals) { a.v++; h.d++; }
        else { h.e++; a.e++; }
      }
      result[gKey] = Object.values(stats)
        .map(c => ({ ...c, pts: c.v * 3 + c.e, sg: c.gp - c.gc }))
        .sort((a, b) => (b.pts - a.pts) || (b.sg - a.sg) || (b.gp - a.gp))
        .map((c, i) => ({ ...c, pos: i + 1 }));
    }
    return result;
  }, [adminGroups, grupoGames, teamInfo]);

  // Mata-mata: reagrupa por rodada para o BracketView
  const mataMataWeeks = useMemo(() => {
    if (!mataMataGames.length) return [];
    const mataMataIds = new Set(mataMataGames.map(g => g.id));
    return matchesForPhase
      .map(({ week, games }) => ({ week, games: games.filter(g => mataMataIds.has(g.id)) }))
      .filter(w => w.games.length > 0);
  }, [matchesForPhase, mataMataGames]);

  const classificados = grupoFaseConfig?.classificados_por_grupo ?? 2;
  const mataMataFases = activeTorneioConfig?.fases?.filter(f => f.tipo === "mata_mata") ?? [];
  const hasGroups = groupStandings && Object.keys(groupStandings).length > 0;
  const hasMataMata = mataMataWeeks.length > 0 && mataMataFases.length > 0;

  // Torneio de pontos corridos: sem grupos nem mata-mata, exibe tabela de classificação direta
  const isPontosCorreidos = !grupoFaseConfig
    && mataMataFases.length === 0
    && (activeTorneioConfig?.fases ?? []).some(f => f.tipo === "pontos_corridos");

  if (isPontosCorreidos) {
    const classificadosPc = activeTorneioConfig?.fases?.find(f => f.tipo === "pontos_corridos")?.classificados_por_grupo ?? 0;
    if (!activeStandings?.length) {
      return <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>;
    }
    return (
      <div className="w-full rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[300px]">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="py-2 px-3 text-center w-8">#</th>
                <th className="py-2 px-3 text-left">Clube</th>
                <th className="py-2 px-3 text-center font-bold text-violet-500">P</th>
                <th className="py-2 px-3 text-center">J</th>
                <th className="py-2 px-3 text-center text-emerald-500">V</th>
                <th className="py-2 px-3 text-center">E</th>
                <th className="py-2 px-3 text-center text-red-400">D</th>
                <th className="py-2 px-3 text-center">GP</th>
                <th className="py-2 px-3 text-center">GC</th>
                <th className="py-2 px-3 text-center">SG</th>
              </tr>
            </thead>
            <tbody>
              {activeStandings.map((row, ri) => {
                const advances = classificadosPc > 0 && ri < classificadosPc;
                return (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className={`px-3 py-2 text-center font-bold text-gray-500 ${advances ? "border-l-2 border-emerald-400" : "border-l-2 border-transparent"}`}>
                      {ri + 1}
                    </td>
                    <td className="px-3 py-2">
                      <ClubLink id={row.id} slug={row.slug} hidden={row.hidden} federationSlug={row.federation_slug} isCountry={row.is_country} federationActive={row.federation_active} className="flex items-center gap-1.5 hover:text-violet-700 transition-colors">
                        <TeamCrest team={row} size="w-4 h-4" />
                        <span className={`truncate ${advances ? "font-semibold text-gray-800" : "font-medium text-gray-600"}`}>{row.name}</span>
                      </ClubLink>
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-gray-900 tabular-nums">{row.points ?? row.pts ?? 0}</td>
                    <td className="px-3 py-2 text-center text-gray-500 tabular-nums">{row.played ?? row.j ?? 0}</td>
                    <td className="px-3 py-2 text-center font-semibold text-emerald-600 tabular-nums">{row.won ?? row.v ?? 0}</td>
                    <td className="px-3 py-2 text-center text-gray-500 tabular-nums">{row.drawn ?? row.e ?? 0}</td>
                    <td className="px-3 py-2 text-center text-red-400 tabular-nums">{row.lost ?? row.d ?? 0}</td>
                    <td className="px-3 py-2 text-center text-gray-500 tabular-nums">{row.goals_for ?? row.gp ?? 0}</td>
                    <td className="px-3 py-2 text-center text-gray-500 tabular-nums">{row.goals_against ?? row.gc ?? 0}</td>
                    <td className={`px-3 py-2 text-center font-semibold tabular-nums ${(row.goal_diff ?? row.sg ?? 0) > 0 ? "text-emerald-600" : (row.goal_diff ?? row.sg ?? 0) < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {(row.goal_diff ?? row.sg ?? 0) > 0 ? `+${row.goal_diff ?? row.sg}` : (row.goal_diff ?? row.sg ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {classificadosPc > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-gray-50 bg-gray-50/50">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              Avança ({classificadosPc})
            </span>
          </div>
        )}
      </div>
    );
  }

  if (!hasGroups && !hasMataMata) {
    const hasAnyGames = flatGames.length > 0;
    return (
      <p className="text-sm text-center text-gray-400 py-8">
        {hasAnyGames
          ? "Atribua os times aos grupos no painel de administração para visualizar o torneio."
          : t("sports.no_matches", "Nenhuma partida registrada.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* ── Fase de Grupos ── */}
      {hasGroups && (
        <div className="w-full">
          <div className="flex items-center gap-2.5 mb-4 px-1 justify-center">
            <span className="text-sm lg:text-xl font-bold text-gray-900 uppercase tracking-wide">
              {grupoFaseConfig?.nome ?? "Fase de Grupos"}
            </span>
            <span className="text-xs lg:text-xl text-gray-400">
              · {Object.keys(groupStandings).length} grupos
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(groupStandings).sort().map(([label, rows]) => (
              <div key={label} className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Grupo {label}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[260px]">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-50">
                        <th className="py-1.5 px-2 text-center w-6">#</th>
                        <th className="py-1.5 px-2 text-left">Clube</th>
                        <th className="py-1.5 px-2 text-center font-bold text-violet-500">P</th>
                        <th className="py-1.5 px-2 text-center">J</th>
                        <th className="py-1.5 px-2 text-center text-emerald-500">V</th>
                        <th className="py-1.5 px-2 text-center">E</th>
                        <th className="py-1.5 px-2 text-center text-red-400">D</th>
                        <th className="py-1.5 px-2 text-center">SG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => {
                        const advances = ri < classificados;
                        return (
                          <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                            <td className={`px-2 py-2 text-center font-bold text-gray-500 ${advances ? "border-l-2 border-emerald-400" : "border-l-2 border-transparent"}`}>
                              {row.pos}
                            </td>
                            <td className="px-2 py-2">
                              <ClubLink id={row.id} slug={row.slug} hidden={row.hidden} federationSlug={row.federation_slug} isCountry={row.is_country} federationActive={row.federation_active} className="flex items-center gap-1.5 hover:text-violet-700 transition-colors">
                                <TeamCrest team={row} size="w-4 h-4" />
                                <span className={`truncate ${advances ? "font-semibold text-gray-800" : "font-medium text-gray-600"}`}>
                                  {row.name}
                                </span>
                              </ClubLink>
                            </td>
                            <td className="px-2 py-2 text-center font-bold text-gray-900 tabular-nums">{row.pts}</td>
                            <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{row.j}</td>
                            <td className="px-2 py-2 text-center font-semibold text-emerald-600 tabular-nums">{row.v}</td>
                            <td className="px-2 py-2 text-center text-gray-500 tabular-nums">{row.e}</td>
                            <td className="px-2 py-2 text-center text-red-400 tabular-nums">{row.d}</td>
                            <td className={`px-2 py-2 text-center font-semibold tabular-nums ${row.sg > 0 ? "text-emerald-600" : row.sg < 0 ? "text-red-500" : "text-gray-400"}`}>
                              {row.sg > 0 ? `+${row.sg}` : row.sg}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {classificados > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-gray-50 bg-gray-50/50">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      Avança ({classificados})
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Conector ── */}
      {hasGroups && hasMataMata && (
        <div className="flex flex-col items-center my-6 text-gray-200">
          <div className="w-px h-6 bg-gray-200" />
          <ChevronsDown size={18} />
        </div>
      )}

      {/* ── Fases mata-mata ── */}
      {hasMataMata && (
        <BracketView
          matches={mataMataWeeks}
          structure_json={null}
          season={null}
          t={t}
          fasesOverride={mataMataFases}
        />
      )}
    </div>
  );
}

const phaseColumns = (n) => {
  if (n === 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-2";
  if (n === 3) return "grid-cols-3";
  return "grid-cols-2 sm:grid-cols-4";
};

const phaseMaxWidth = (n) => {
  if (n === 1) return "max-w-[280px]";
  if (n === 2) return "max-w-[560px]";
  if (n <= 4) return "max-w-[80%]";
  return "max-w-full";
};

function BracketView({ matches, structure_json, season, t, fasesOverride, groupClubs }) {
  const flatGames = useMemo(() => matches.flatMap(w => w.games), [matches]);
  const phases = useMemo(
    () => buildPhasedBracket(flatGames, structure_json, season, fasesOverride),
    [flatGames, structure_json, season, fasesOverride]
  );

  if (!phases.length) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>
  );

  // Champion is the winner of the last knockout (non-grupo) phase
  const knockoutPhases = phases.filter(p => p.tipo !== "grupo");
  const finalPhase = knockoutPhases[knockoutPhases.length - 1];
  const finalConf = finalPhase?.confrontos[0];
  const champion = finalConf ? (() => {
    const { team1, team2, agg, legs } = finalConf;
    const a1 = agg[team1.id] ?? null;
    const a2 = agg[team2.id] ?? null;
    if (a1 === null || a2 === null) return null;
    if (a1 > a2) return team1;
    if (a2 > a1) return team2;
    // Final empatada: campeão definido manualmente no admin (pênaltis)
    const manual = [...legs].reverse().find(l => l.winner_id != null)?.winner_id ?? null;
    if (manual === team1.id) return team1;
    if (manual === team2.id) return team2;
    return null;
  })() : null;

  // Exibição invertida: campeão e fases finais primeiro, fases iniciais por último
  const displayPhases = [...phases].reverse();

  return (
    <div className="flex flex-col items-center gap-0 w-full">
      {/* Champion no topo */}
      {champion && (
        <div className="flex flex-col items-center gap-3 w-full max-w-[280px] mb-6">
          <div className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-1 self-stretch rounded-full bg-gray-900 shrink-0" />
            <TeamCrest team={champion} size="w-10 h-10" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Campeão</p>
              <ClubLink id={champion.id} slug={champion.slug} hidden={champion.hidden} federationSlug={champion.federation_slug} isCountry={champion.is_country} federationActive={champion.federation_active}
                className="text-base font-bold text-gray-900 hover:text-violet-700 transition-colors truncate block">
                {champion.name}
              </ClubLink>
            </div>
          </div>
          <div className="flex flex-col items-center text-gray-200">
            <div className="w-px h-5 bg-gray-200" />
          </div>
        </div>
      )}
      {displayPhases.map((phase, pi) => {
        const isLast = pi === displayPhases.length - 1;

        // ── Group stage ───────────────────────────────────────────────────────
        if (phase.tipo === "grupo") {
          return (
            <div key={phase.nome} className="w-full flex flex-col items-center">
              <div className="justify-center w-full flex items-center gap-2.5 mb-4 px-1">
                <span className="text-sm lg:text-xl font-bold text-gray-900 uppercase tracking-wide">{phase.nome}</span>
                {(phase.faseConfig?.grupos ?? 0) > 0 && (
                  <span className="text-xs lg:text-xl text-gray-400">· {phase.faseConfig.grupos} grupos</span>
                )}
              </div>
              <GroupPhaseView phase={phase} t={t} adminGroups={groupClubs} />
              {!isLast && (
                <div className="flex flex-col items-center my-4 text-gray-200">
                  <div className="w-px h-5 bg-gray-200" />
                  <ChevronsDown size={16} />
                </div>
              )}
            </div>
          );
        }

        // ── Pontos corridos phase (dentro de misto) ───────────────────────────
        if (phase.tipo === "pontos_corridos") {
          const phaseGames = phase.confrontos.flatMap(c => c.legs);
          const rows = computeLeagueStandings(phaseGames);
          const classificados = phase.faseConfig?.classificados ?? 0;
          const rebaixados    = phase.faseConfig?.rebaixados ?? 0;
          const n = rows.length;
          const zoneBar = (pos) => {
            if (classificados > 0 && pos <= classificados) return "border-l-2 border-emerald-400";
            if (rebaixados > 0 && pos > n - rebaixados) return "border-l-2 border-red-400";
            return "border-l-2 border-transparent";
          };
          return (
            <div key={phase.nome} className="w-full flex flex-col items-center">
              <div className="justify-center w-full flex items-center gap-2.5 mb-4 px-1">
                <span className="text-sm lg:text-xl font-bold text-gray-900 uppercase tracking-wide">{phase.nome}</span>
                {n > 0 && <span className="text-xs lg:text-xl text-gray-400">· {n} times</span>}
              </div>
              {rows.length === 0
                ? <p className="text-sm text-center text-gray-400 py-8">Nenhuma partida registrada.</p>
                : (
                  <div className="w-full rounded-xl border border-gray-100 overflow-x-auto bg-white shadow-sm">
                    <table className="w-full text-sm min-w-[540px]">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100 text-xs">
                          <th className="py-3 px-3 text-center w-10">#</th>
                          <th className="py-3 px-3 text-left">Clube</th>
                          <th className="py-3 px-2 text-center text-violet-500">P</th>
                          <th className="py-3 px-2 text-center">J</th>
                          <th className="py-3 px-2 text-center text-emerald-500">V</th>
                          <th className="py-3 px-2 text-center">E</th>
                          <th className="py-3 px-2 text-center text-red-400">D</th>
                          <th className="py-3 px-2 text-center">GP</th>
                          <th className="py-3 px-2 text-center">GC</th>
                          <th className="py-3 px-2 text-center">SG</th>
                          <th className="py-3 px-2 text-center">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                            <td className={`px-3 py-2.5 ${zoneBar(row.pos)}`}>
                              <span className="text-sm font-bold text-gray-400 block text-center tabular-nums">{row.pos}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <ClubLink id={row.id} slug={row.slug} hidden={row.hidden} federationSlug={row.federation_slug} isCountry={row.is_country} federationActive={row.federation_active} className="flex items-center gap-2.5 hover:text-violet-700 transition-colors font-medium text-gray-700">
                                <TeamCrest team={row} />
                                <span className="truncate">{row.name}</span>
                              </ClubLink>
                            </td>
                            <td className="px-2 py-2.5 text-center font-bold tabular-nums text-gray-800">{row.pts}</td>
                            <td className="px-2 py-2.5 text-center text-gray-500 tabular-nums">{row.j}</td>
                            <td className="px-2 py-2.5 text-center font-semibold text-emerald-600 tabular-nums">{row.v}</td>
                            <td className="px-2 py-2.5 text-center text-gray-500 tabular-nums">{row.e}</td>
                            <td className="px-2 py-2.5 text-center text-red-400 tabular-nums">{row.d}</td>
                            <td className="px-2 py-2.5 text-center text-gray-600 tabular-nums">{row.gp}</td>
                            <td className="px-2 py-2.5 text-center text-gray-600 tabular-nums">{row.gc}</td>
                            <td className={`px-2 py-2.5 text-center font-semibold tabular-nums ${row.sg > 0 ? "text-emerald-600" : row.sg < 0 ? "text-red-500" : "text-gray-400"}`}>
                              {row.sg > 0 ? `+${row.sg}` : row.sg}
                            </td>
                            <td className="px-2 py-2.5 text-center text-gray-500 tabular-nums">{row.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(classificados > 0 || rebaixados > 0) && (
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                        {classificados > 0 && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />Avança ({classificados})
                          </span>
                        )}
                        {rebaixados > 0 && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />Rebaixado ({rebaixados})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              }
              {!isLast && (
                <div className="flex flex-col items-center my-4 text-gray-200">
                  <div className="w-px h-5 bg-gray-200" />
                  <ChevronsDown size={16} />
                </div>
              )}
            </div>
          );
        }

        // ── Knockout phase ────────────────────────────────────────────────────
        const cols = phaseColumns(phase.confrontos.length);
        const mw = phaseMaxWidth(phase.confrontos.length);

        return (
          <div key={phase.nome} className="w-full flex flex-col items-center">
            {/* Phase header */}
            <div className="justify-center w-full flex items-center gap-2.5 mb-4 px-1">
              <span className="text-sm lg:text-xl font-bold text-gray-900 uppercase tracking-wide">{phase.nome}</span>
              <span className="text-xs lg:text-xl text-gray-400">
                · {phase.confrontos.length} confronto{phase.confrontos.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className={`w-full ${mw} grid ${cols} gap-3`}>
              {phase.confrontos.map((c, i) => <ConfrontoCard key={i} confronto={c} />)}
            </div>

            {!isLast && (
              <div className="flex flex-col items-center my-4 text-gray-200">
                <div className="w-px h-5 bg-gray-200" />
                <ChevronsDown size={16} />
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ m }) {
  const finished = m.home_goals != null && m.away_goals != null;
  return (
    <Link to={`/dashboard/matches/${m.id}`}
      className="flex items-center gap-2 py-3 px-4 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-sm font-medium text-gray-700 truncate group-hover:text-violet-700 transition-colors">{m.home.name}</span>
        <TeamCrest team={m.home} />
      </div>
      <div className="flex flex-col items-center shrink-0 min-w-[64px]">
        {finished
          ? <span className="text-base font-extrabold text-gray-900 tabular-nums">{m.home_goals} – {m.away_goals}</span>
          : <span className="text-sm font-semibold text-gray-400">{fmtDate(m.date)}</span>
        }
        {finished && m.home_goals_ht != null && (
          <span className="text-xs text-gray-400 tabular-nums">
            <span className="font-semibold text-gray-300 mr-0.5">1T</span>{m.home_goals_ht}–{m.away_goals_ht}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <TeamCrest team={m.away} />
        <span className="text-sm font-medium text-gray-700 truncate group-hover:text-violet-700 transition-colors">{m.away.name}</span>
      </div>
    </Link>
  );
}

function RoundRobinMatches({ matches, t }) {
  const [openWeeks, setOpenWeeks] = useState({});
  useEffect(() => {
    if (matches?.length) setOpenWeeks({ [matches[0].week]: true });
  }, [matches]);
  const toggle = w => setOpenWeeks(p => ({ ...p, [w]: !p[w] }));

  if (!matches?.length) return (
    <p className="text-sm text-center text-gray-400 py-8">{t("sports.no_matches", "Nenhuma partida registrada.")}</p>
  );
  return (
    <>
      {matches.map(({ week, games }) => (
        <div key={week} className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm mb-2">
          <button onClick={() => toggle(week)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors">
            <span className="text-sm font-semibold text-gray-700">
              {week > 0 ? `${t("sports.round", "Rodada")} ${week}` : t("sports.no_round", "Sem rodada")}
            </span>
            <span className="text-xs text-gray-400">{games.length} {t("sports.games_suffix", "jogos")}</span>
          </button>
          {openWeeks[week] && (
            <div className="divide-y divide-gray-50">
              {games.map(m => <MatchCard key={m.id} m={m} />)}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// ─── Format labels ────────────────────────────────────────────────────────────

const FORMAT_LABELS = {
  pontos_corridos: "Pontos corridos",
  mata_mata: "Mata-mata",
  grupos: "Fase de grupos",
  grupos_mata_mata: "Grupos + Mata-mata",
  misto: "Misto",
  apertura_clausura: "Apertura/Clausura",
  personalizado: "Personalizado",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LeagueSportsSection({ leagueId }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(null);
  const [mainTab, setMainTab] = useState(null);
  const [split, setSplit] = useState("total");

  useEffect(() => { load(season); }, [leagueId, season]);

  async function load(s) {
    setLoading(true);
    try {
      const params = s ? `?season=${s}` : "";
      const { data: res } = await api.get(`/dashboard/leagues/${leagueId}/sports${params}`);
      setData(res);
      if (!season && res.season) setSeason(res.season);
      if (mainTab === null) {
        const resSeason = s ?? res.season;
        const resCfg = res.league?.structure_json?.[String(resSeason)];
        const resFmt = resCfg?.tipo || res.league?.format || "pontos_corridos";
        const isKo = resFmt !== "pontos_corridos" && resFmt !== "pontos_corridos_turno_unico" && resFmt !== "grupos" && resFmt !== "apertura_clausura";
        setMainTab(isKo ? "chaveamento" : "classificacao");
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading && !data) return (
    <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
      <Loader2 className="animate-spin w-5 h-5" />
      <span className="text-sm">{t("ui.loading", "Carregando...")}</span>
    </div>
  );
  if (!data) return null;

  const { league, seasons, standings, matches, discipline, groupClubs, teamStats, players } = data;
  const seasonConfig = league.structure_json?.[String(season)] ?? null;
  const fmt = seasonConfig?.tipo || league.format || "pontos_corridos";
  const isKnockout = fmt !== "pontos_corridos" && fmt !== "pontos_corridos_turno_unico" && fmt !== "grupos" && fmt !== "apertura_clausura";
  const isAperturaClausura = fmt === "apertura_clausura";
  const totalRounds = matches?.length ?? 0;

  // Para apertura_clausura: deriva as sub-tabs dos torneios configurados (novo formato)
  const acTorneios = seasonConfig?.torneios ?? null;
  const acSplitOptions = isAperturaClausura
    ? (acTorneios
      ? acTorneios.map(t => ({ key: t.key, label: t.nome }))
      : [{ key: "apertura", label: "Apertura" }, { key: "clausura", label: "Clausura" }])
    : [
      { key: "total", label: t("sports.total", "Total") },
      { key: "home", label: t("sports.home", "Casa") },
      { key: "away", label: t("sports.away", "Fora") },
    ];

  const splitKeys = acSplitOptions.map(o => o.key);
  const activeSplit = splitKeys.includes(split) ? split : splitKeys[0];

  // Partidas filtradas pela fase ativa (apertura_clausura)
  // Filtra também os jogos dentro de cada rodada para não misturar apertura/clausura
  const matchesForPhase = isAperturaClausura
    ? (matches ?? [])
      .map(w => ({ ...w, games: w.games.filter(g => g.phase === activeSplit) }))
      .filter(w => w.games.length > 0)
    : (matches ?? []);

  // Líder da fase ativa
  const activeStandings = standings?.[activeSplit] ?? [];
  const leader = activeStandings[0] ?? null;

  // Grupos do torneio ativo (apertura_clausura com fase de grupos)
  const activeTorneioConfig = acTorneios?.find(t => t.key === activeSplit) ?? null;
  const grupoFaseConfig = activeTorneioConfig?.fases?.find(f => f.tipo === "grupo") ?? null;
  const grupoPhaseKey = grupoFaseConfig
    ? `${activeSplit}_${grupoFaseConfig.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`
    : null;
  const activeGroupClubs = grupoPhaseKey ? (groupClubs?.[grupoPhaseKey] ?? null) : null;


  const tabs = [];
  if (isAperturaClausura) {
    tabs.push({ key: "torneio", label: "Torneio" });
  } else if (isKnockout) {
    tabs.push({ key: "chaveamento", label: "Chaveamento" });
  } else {
    tabs.push({ key: "classificacao", label: "Classificação" });
  }
  if (!isKnockout) tabs.push({ key: "partidas", label: "Rodadas", badge: totalRounds });
  tabs.push({ key: "disciplinar", label: "Disciplinar" });

  // Abas de estatísticas — só aparecem quando há dados na temporada
  const hasTeamStats = (teamStats ?? []).some(s => s.matches_played != null);
  const scorers = (players ?? []).filter(p => (p.goals ?? 0) > 0);
  const assisters = (players ?? []).filter(p => (p.assists ?? 0) > 0);
  if (hasTeamStats) {
    tabs.push({ key: "ofensivo", label: "Ofensivo" });
    tabs.push({ key: "defensivo", label: "Defensivo" });
    tabs.push({ key: "controle", label: "Controle" });
  }
  if (scorers.length) tabs.push({ key: "artilharia", label: "Artilharia" });
  if (assisters.length) tabs.push({ key: "assistencias", label: "Assistências" });

  const activeTab = (mainTab && tabs.some(t => t.key === mainTab)) ? mainTab : tabs[0]?.key;

  return (
    <div className="space-y-4">

      {/* Unified toolbar: main tabs + season selector */}
      {/* sem overflow-hidden no wrapper: o dropdown de temporada precisa transbordar.
          O clipping dos cantos arredondados fica no container das abas. */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm relative">
        <div className="flex items-center justify-between gap-2">
          {/* Main tabs */}
          <div className="flex items-center overflow-x-auto rounded-l-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setMainTab(tab.key)}
                className={`relative px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap shrink-0
                  ${activeTab === tab.key
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
                {tab.label}
                {tab.badge > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold
                    ${activeTab === tab.key ? "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-400"}`}>
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t" />
                )}
              </button>
            ))}
          </div>
          {/* Season selector — strip rolável com setinhas no overflow (mobile) */}
          {(seasons ?? []).length > 0 && (
            <SeasonSelector
              seasons={seasons}
              season={season}
              onSelect={(y) => { setSeason(y); setMainTab(null); }}
            />
          )}
        </div>
      </div>

      {/* ── TORNEIO (apertura_clausura) — grupos + eliminatórias numa só view ── */}
      {activeTab === "torneio" && (
        <>
          <div className="flex items-center justify-end gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <SubTabs value={activeSplit} onChange={val => setSplit(val)} options={acSplitOptions} />
          </div>
          {loading
            ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
            : <TorneioPanelView
              matchesForPhase={matchesForPhase}
              adminGroups={activeGroupClubs}
              activeStandings={activeStandings}
              grupoFaseConfig={grupoFaseConfig}
              activeTorneioConfig={activeTorneioConfig}
              t={t}
            />
          }
        </>
      )}

      {/* ── CLASSIFICAÇÃO (outros formatos) ── */}
      {activeTab === "classificacao" && (
        <>
          <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            {!loading && leader ? (
              <ClubLink id={leader.id} slug={leader.slug} hidden={leader.hidden} federationSlug={leader.federation_slug} isCountry={leader.is_country} federationActive={leader.federation_active}
                className="flex items-center gap-2 min-w-0 group">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 hidden lg:block">CAMPEÃO</span>
                {teamCrestSources(leader).length
                  ? <TeamCrest team={leader} />
                  : <Trophy size={16} className="text-gray-300 shrink-0" />
                }
                <span className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors truncate">
                  {leader.name}
                </span>
                <span className="text-sm font-extrabold tabular-nums text-gray-900 shrink-0">{leader.pts}</span>
                <span className="text-xs text-gray-400 shrink-0">pts</span>
              </ClubLink>
            ) : <div />}
            <SubTabs value={split} onChange={val => setSplit(val)} options={acSplitOptions} />
          </div>
          {loading
            ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
            : <StandingsTable rows={activeStandings} t={t} seasonConfig={seasonConfig} />
          }
        </>
      )}

      {/* ── CHAVEAMENTO (mata-mata puro) ── */}
      {activeTab === "chaveamento" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <BracketView matches={matches ?? []} structure_json={league.structure_json} season={season} t={t} />
      )}

      {/* ── PARTIDAS ── */}
      {activeTab === "partidas" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <RoundRobinMatches matches={matchesForPhase} t={t} />
      )}

      {/* ── DISCIPLINAR ── */}
      {activeTab === "disciplinar" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <DisciplinaryTable rows={discipline ?? []} t={t} />
      )}

      {/* ── OFENSIVO ── */}
      {activeTab === "ofensivo" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <OffensiveTable rows={teamStats ?? []} t={t} />
      )}

      {/* ── DEFENSIVO ── */}
      {activeTab === "defensivo" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <DefensiveTable rows={teamStats ?? []} t={t} />
      )}

      {/* ── CONTROLE ── */}
      {activeTab === "controle" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <ControlTable rows={teamStats ?? []} t={t} />
      )}

      {/* ── ARTILHARIA ── */}
      {activeTab === "artilharia" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <ScorersTable rows={scorers} t={t} />
      )}

      {/* ── ASSISTÊNCIAS ── */}
      {activeTab === "assistencias" && (
        loading
          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin w-5 h-5 text-gray-400" /></div>
          : <AssistsTable rows={assisters} t={t} />
      )}
    </div>
  );
}
