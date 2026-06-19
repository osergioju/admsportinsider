import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { ArrowLeft, Users, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import TeamCrest from "../../../components/uxui/TeamCrest";
import PageLoader from "../../../components/uxui/PageLoader";

/* ─── Helpers ──────────────────────────────────────────────────── */

function hexToRgb(hex) {
    if (!hex) return null;
    const c = hex.replace("#", "");
    const full = c.length === 3 ? c.split("").map(x => x + x).join("") : c;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const fmtInt = v => v == null ? "—" : Math.round(v).toLocaleString("pt-BR");
const fmtUsdM = v => v == null ? "—" : `US$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} milhões`;
const fmtUsd2 = v => v == null ? "—" : `US$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* Big numbers exibidos — chave normalizada do indicador (sem prefixo da competição) */
const METRICS = [
    { key: "attendance-total", label: "Público total", fmt: fmtInt, hero: true },
    { key: "attendance-paying", label: "Pagantes", fmt: fmtInt, hero: true },
    { key: "attendance-freebies", label: "Gratuidades", fmt: fmtInt, hero: true },
    { key: "number-matches", label: "Jogos", fmt: v => v == null ? "—" : String(Math.round(v)), hero: true },
    { key: "attendance-average", label: "Média de público", fmt: fmtInt },
    { key: "attendance-average-paying", label: "Média de pagantes", fmt: fmtInt },
    { key: "ticketing-revenue", label: "Renda bruta", fmt: fmtUsdM },
    { key: "ticketing-average-price", label: "Tíquete médio", fmt: fmtUsd2 },
];

function TeamCell({ name, crest, federationSlug, align = "left" }) {
    return (
        <div className={`flex items-center gap-2 min-w-0 ${align === "right" ? "justify-end" : ""}`}>
            {align === "right" && <span className="text-sm text-gray-700 truncate">{name}</span>}
            <TeamCrest team={{ crest, federation_slug: federationSlug }} size="w-5 h-5" />
            {align === "left" && <span className="text-sm text-gray-700 truncate">{name}</span>}
        </div>
    );
}

const fmtDate = d => d
    ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

function SortIcon({ col, sortKey, sortDir }) {
    if (sortKey !== col) return <ArrowUpDown size={11} className="opacity-40" />;
    return sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
}

/* ─── Componente principal ─────────────────────────────────────── */

export default function DashLeagueAttendance() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [league, setLeague] = useState(null);
    const [data, setData] = useState(null);          // { seasons, indicators }
    const [matches, setMatches] = useState([]);
    const [season, setSeason] = useState(null);
    const [compareYear, setCompareYear] = useState(null);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [sortKey, setSortKey] = useState("date");  // date | attendance
    const [sortDir, setSortDir] = useState("asc");

    /* Carrega liga + dados iniciais */
    useEffect(() => {
        async function load() {
            try {
                const { data: info } = await api.get(`/dashboard/leagues/${slug}/info`);
                const lg = info.league;
                setLeague(lg);
                const { data: att } = await api.get(`/dashboard/leagues/${lg.id_league}/attendance`);
                setData(att);
                // Default: edição mais recente COM dados de público
                const withData = att.seasons.filter(y => att.indicators[y]?.["attendance-total"] != null);
                setSeason(withData[0] ?? att.seasons[0] ?? null);
            } catch (e) { console.error(e); }
        }
        load();
    }, [slug]);

    /* Carrega partidas quando a temporada muda */
    useEffect(() => {
        if (!league || !season) return;
        setLoadingMatches(true);
        api.get(`/dashboard/leagues/${league.id_league}/attendance?season=${season}`)
            .then(({ data: att }) => setMatches(att.matches ?? []))
            .catch(console.error)
            .finally(() => setLoadingMatches(false));
    }, [league, season]);

    const sortedMatches = useMemo(() => {
        const arr = [...matches];
        if (sortKey === "attendance") {
            arr.sort((a, b) => ((a.attendance ?? -1) - (b.attendance ?? -1)) * (sortDir === "asc" ? 1 : -1));
        } else {
            arr.sort((a, b) => (new Date(a.match_date ?? 0) - new Date(b.match_date ?? 0)) * (sortDir === "asc" ? 1 : -1));
        }
        return arr;
    }, [matches, sortKey, sortDir]);

    if (!league || !data) return <PageLoader />;

    const lg = league;
    const c1 = lg.primary_color || lg.fed_color1 || "#001F5B";
    const c2 = lg.secondary_color || lg.fed_color2 || c1;
    const rgb1 = hexToRgb(c1);
    const lum1 = rgb1 ? (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255 : 0;
    const textColor = lum1 > 0.5 ? "#0A0A0A" : "#FFFFFF";
    // Cor de destaque legível sobre fundo branco (primária clara → usa secundária)
    const isDark = (hex) => {
        const rgb = hexToRgb(hex);
        return rgb ? (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 < 0.82 : false;
    };
    const accent = isDark(c1) ? c1 : isDark(c2) ? c2 : "#0A0A0A";

    const current = data.indicators[season] ?? {};
    const compare = compareYear ? (data.indicators[compareYear] ?? {}) : null;
    const compareOptions = data.seasons.filter(y => y !== season && data.indicators[y]);

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir(key === "attendance" ? "desc" : "asc"); }
    };

    const deltaPct = (cur, prev) => {
        if (cur == null || prev == null || prev === 0) return null;
        return ((cur - prev) / Math.abs(prev)) * 100;
    };

    return (
        <div className="w-full overflow-hidden">

            {/* ── HEADER ───────────────────────────────────────── */}
            <div
                className="rounded-2xl mb-4 relative overflow-hidden px-5 sm:px-8 pt-5 pb-6"
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
            >
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.08), rgba(0,0,0,0.38))" }} />
                <div className="relative z-10 flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/dashboard/competitions/${slug}`)}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full"
                        style={{ background: "rgba(255,255,255,0.15)", color: textColor }}
                    >
                        <ArrowLeft size={15} />
                    </button>
                    {(lg.logo_url_negative || lg.logo_url || lg.slug) && (
                        <img src={lg.logo_url_negative || lg.logo_url || `https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${lg.slug}.webp`}
                            alt={lg.name}
                            className="w-10 h-10 object-contain"
                            style={{ filter: "" }}
                            onError={e => e.currentTarget.style.display = "none"} />
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl font-light leading-tight" style={{ color: textColor }}>
                            {lg.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Users size={12} style={{ color: textColor, opacity: 0.65 }} />
                            <span className="text-xs font-light" style={{ color: textColor, opacity: 0.75 }}>
                                Público e renda
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BIG NUMBERS ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl mb-4 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">Números da edição</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Valores oficiais por edição da competição</p>
                    </div>
                    {/* Comparar com */}
                    <div className="flex items-center gap-2">
                        {compareYear ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-600">
                                Comparando com {compareYear}
                                <button onClick={() => setCompareYear(null)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                            </span>
                        ) : (
                            <select
                                value=""
                                onChange={e => setCompareYear(Number(e.target.value) || null)}
                                className="text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none cursor-pointer"
                            >
                                <option value="">Comparar com…</option>
                                {compareOptions.map(y => <option key={y} value={y}>Copa de {y}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* Pills de temporada */}
                <div className="flex flex-wrap gap-2 pb-4 mb-5 border-b border-gray-100">
                    {data.seasons.map(yr => (
                        <button
                            key={yr}
                            onClick={() => { setSeason(yr); if (compareYear === yr) setCompareYear(null); }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${season === yr
                                ? "bg-gray-900 text-white"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
                        >
                            {yr}
                        </button>
                    ))}
                </div>

                {/* Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {METRICS.map(m => {
                        const val = current[m.key];
                        const cmpVal = compare ? compare[m.key] : null;
                        const pct = compare ? deltaPct(val, cmpVal) : null;
                        return (
                            <div key={m.key}
                                className={`rounded-2xl border p-4 ${m.hero ? "border-gray-200 bg-gray-50/60" : "border-gray-100"}`}>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{m.label}</p>
                                <p className={`mt-1 tabular-nums font-light text-gray-900 ${m.hero ? "text-2xl lg:text-3xl" : "text-xl"}`}>
                                    {m.fmt(val)}
                                </p>
                                {compare && (
                                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs text-gray-400 tabular-nums">{compareYear}: {m.fmt(cmpVal)}</span>
                                        {pct != null && (
                                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${pct >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                                                {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── PARTIDAS: PÚBLICO POR JOGO ───────────────────── */}
            <div className="bg-white rounded-2xl mb-4 overflow-hidden">
                <div className="px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">Público por partida — {season}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Clique em "Público" ou "Data" para ordenar</p>
                    </div>
                    <span className="text-xs text-gray-400">{matches.length} partidas</span>
                </div>

                {loadingMatches ? (
                    <p className="text-sm text-center text-gray-300 py-12">Carregando…</p>
                ) : sortedMatches.length === 0 ? (
                    <p className="text-sm text-center text-gray-300 py-12">Nenhuma partida registrada para {season}.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[760px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100 text-[11px]">
                                    <th className="py-3 px-4 text-left font-semibold cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort("date")}>
                                        <span className="inline-flex items-center gap-1">Data <SortIcon col="date" sortKey={sortKey} sortDir={sortDir} /></span>
                                    </th>
                                    <th className="py-3 px-3 text-right font-semibold">Casa</th>
                                    <th className="py-3 px-2 text-center font-semibold">Placar</th>
                                    <th className="py-3 px-3 text-left font-semibold">Visitante</th>
                                    <th className="py-3 px-4 text-right font-semibold cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort("attendance")}>
                                        <span className="inline-flex items-center gap-1">Público <SortIcon col="attendance" sortKey={sortKey} sortDir={sortDir} /></span>
                                    </th>
                                    <th className="py-3 px-4 text-left font-semibold">Estádio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedMatches.map(m => (
                                    <tr key={m.id_match} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                                        <td className="py-2.5 px-4 text-xs text-gray-500 whitespace-nowrap">{fmtDate(m.match_date)}</td>
                                        <td className="py-2.5 px-3 max-w-[180px]">
                                            <TeamCell name={m.home_name} crest={m.home_crest} federationSlug={m.home_federation_slug} align="right" />
                                        </td>
                                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                            <span className="font-bold text-gray-900 tabular-nums">{m.home_goals ?? "–"} x {m.away_goals ?? "–"}</span>
                                        </td>
                                        <td className="py-2.5 px-3 max-w-[180px]">
                                            <TeamCell name={m.away_name} crest={m.away_crest} federationSlug={m.away_federation_slug} />
                                        </td>
                                        <td className="py-2.5 px-4 text-right">
                                            <span className="inline-block px-2.5 py-1 rounded-lg font-bold tabular-nums text-sm"
                                                style={{ background: `${accent}14`, color: accent }}>
                                                {m.attendance != null ? Number(m.attendance).toLocaleString("pt-BR") : "—"}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-xs text-gray-500 max-w-[220px] truncate">
                                            {m.stadium_name ? m.stadium_name.split("(")[0].trim() : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
