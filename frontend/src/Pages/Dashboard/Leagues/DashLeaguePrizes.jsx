import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { ArrowLeft, X, Plus, Award, Loader2 } from "lucide-react";
import { federationLogo } from "../../../utils/federationUrl";
import { worldCupLogo } from "../../../utils/worldCupLogo";
import PageLoader from "../../../components/uxui/PageLoader";

/* ─── Helpers ──────────────────────────────────────────────────── */

function hexToRgb(hex) {
    if (!hex) return null;
    const c = hex.replace("#", "");
    const full = c.length === 3 ? c.split("").map(x => x + x).join("") : c;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/* Valores da planilha estão em MILHÕES de USD */
function fmtMi(v, prefix = "") {
    if (v == null) return "—";
    if (Math.abs(v) >= 1000) return `${prefix}${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} bi`;
    return `${prefix}${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}`;
}

/* Quadrinhos da tabela: apenas o número, sem "mi" */
function fmtNumOnly(v) {
    if (v == null) return "—";
    return v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

/* Linha de somatória: "US$ 28 milhões" por extenso */
function fmtFull(v, prefix = "") {
    if (v == null) return "—";
    if (Math.abs(v) >= 1000) return `${prefix}${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} bilhões`;
    return `${prefix}${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} milhões`;
}

/* Escudo do time da premiação: federação (webp da federação), ou clube.
   Para clubes o backend manda o SLUG do escudo em flag_url (ex.: "brazil_gremio"),
   não uma URL pronta — então montamos a URL do clube aqui. */
const CLUB_CREST_BASE = "https://pro.sportinsider.com.br/uploads/clubes/reduced/reduced_plus/reduced_reduced_";
function teamImg(t) {
    if (t.federation_slug) return federationLogo(t.federation_slug, "medium");
    if (t.id_club && t.flag_url) return `${CLUB_CREST_BASE}${t.flag_url}.webp`;
    return (t.flag_url && t.flag_url.startsWith("http")) ? t.flag_url : null;
}
/* Borda branca sólida (contorno via drop-shadow em 4 direções, sem blur) */
const LOGO_SHADOW = "drop-shadow(rgb(255, 255, 255) 0.5px 0.5px 0px) drop-shadow(rgb(255, 255, 255) -0.5px -0.5px 0px) drop-shadow(rgb(255, 255, 255) 0.5px -0.5px 0px) drop-shadow(rgb(255, 255, 255) -0.5px 0.5px 0px)";

/* ─── Ordem das linhas da tabela (chaves normalizadas) ─────────── */
const POSITION_KEYS = [
    ["performance-champion_per-position", "Campeão"],
    ["performance-runner-up_per-position", "Vice-campeão"],
    ["performance-3rd-place_per-position", "3º lugar"],
    ["performance-4th-place_per-position", "4º lugar"],
    ["performance-5th-to-8th-place_per-position", "5º a 8º lugar (cada)"],
    ["performance-9th-to-16th-place_per-position", "9º a 16º lugar (cada)"],
    ["performance-17th-to-32th-place_per-position", "17º a 32º lugar (cada)"],
    ["performance-33th-to-48th-place_per-position", "33º a 48º lugar (cada)"],
    ["preparation-fee_per-position", "Preparação (cada)"],
];
const TOTAL_KEY = "prizes_total";

/* ─── Taxas de câmbio (base USD) ───────────────────────────────── */
const RATES = { USD: 1, BRL: 5.75, EUR: 0.92, GBP: 0.79 };
const CURRENCY_LABELS = { USD: "USD — Dólar", BRL: "BRL — Real", EUR: "EUR — Euro", GBP: "GBP — Libra" };
const CURRENCY_PREFIX = { USD: "US$ ", BRL: "R$ ", EUR: "€ ", GBP: "£ " };

/* ─── Componente principal ─────────────────────────────────────── */

export default function DashLeaguePrizes() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [league, setLeague] = useState(null);
    const [data, setData] = useState(null);
    const [activeYear, setActiveYear] = useState(null);
    const [compared, setCompared] = useState([]);
    const [addYear, setAddYear] = useState("");
    const [currency, setCurrency] = useState("USD");

    useEffect(() => {
        async function load() {
            try {
                const { data: info } = await api.get(`/dashboard/leagues/${slug}/info`);
                setLeague(info.league);
                const { data: prizes } = await api.get(`/dashboard/leagues/${info.league.id_league}/prizes`);
                setData(prizes);
                // Comparação inicial: as duas edições mais recentes com dados de times
                const withTeams = prizes.years.filter(y => (prizes.teams[y] ?? []).some(t => (t.total ?? 0) > 0));
                setCompared(withTeams.slice(-2));
            } catch (e) { console.error(e); }
        }
        load();
    }, [slug]);

    if (!league || !data) return <PageLoader />;

    const lg = league;
    const years = data.years;
    const sj = lg.structure_json ?? {};

    const convert = v => v == null ? null : v * (RATES[currency] ?? 1);
    const prefix = CURRENCY_PREFIX[currency] ?? "";

    /* Logo da edição: config da temporada > logo oficial da Copa daquele ano > liga */
    const leagueLogo = lg.logo_url || (lg.slug ? `https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_${lg.slug}.webp` : null);
    const isWorldCup = lg.slug === "world-cup";
    const editionLogoOf = (yr) => sj[String(yr)]?.edition_logo || (isWorldCup ? worldCupLogo(yr) : leagueLogo);

    const c1 = lg.primary_color || lg.fed_color1 || "#001F5B";
    const c2 = lg.secondary_color || lg.fed_color2 || c1;
    const rgb1 = hexToRgb(c1);
    const lum1 = rgb1 ? (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255 : 0;
    const textColor = lum1 > 0.5 ? "#0A0A0A" : "#FFFFFF";

    const visibleYears = activeYear ? [activeYear] : years;
    const labelOf = (key, fallback) => data.labels[key] ?? fallback;
    const valueOf = (yr, key) => data.indicators[yr]?.[key] ?? null;

    /* Linhas da tabela: lista fixa (Copa do Mundo) + chaves por posição/fase de
       outras competições (Intercontinental usa 1st-place, Copa de Clubes per-phase),
       ordenadas por valor decrescente — réplica do ranking de posições */
    const fixedKeys = new Set(POSITION_KEYS.map(([k]) => k));
    // Último valor REAL (não-zero) — edições futuras/sem dados gravam 0 e não
    // podem zerar o ranking (senão todas as posições empatam e a ordem embaralha)
    const latestVal = (k) => {
        for (let i = years.length - 1; i >= 0; i--) {
            const v = valueOf(years[i], k);
            if (v != null && v !== 0) return v;
        }
        return -Infinity;
    };
    const allPosKeys = Object.keys(data.labels ?? {})
        .filter(k => /(_per-position|_per-phase|_groups)$/.test(k) && !k.startsWith("prizes_"));
    // Competição com posições numéricas (1º, 2º, …, Nº) — ex.: Intercontinental.
    // Os códigos 3rd/4th-place coincidem com a lista fixa da Copa do Mundo, então
    // NÃO usamos POSITION_KEYS aqui: ordenamos TODAS as posições por valor desc.
    const usesNumericPositions = allPosKeys.some(k => /performance-1st-place_per-position$/.test(k));

    let positionRows;
    if (usesNumericPositions) {
        positionRows = allPosKeys
            .sort((a, b) => latestVal(b) - latestVal(a))
            .map(k => [k, labelOf(k, k)]);
    } else {
        // Copa do Mundo: ordem curada (POSITION_KEYS) + demais chaves por valor
        const dynamicKeys = allPosKeys
            .filter(k => !fixedKeys.has(k))
            .sort((a, b) => latestVal(b) - latestVal(a));
        positionRows = [...POSITION_KEYS, ...dynamicKeys.map(k => [k, labelOf(k, k)])];
    }

    function addToCompare(yr) {
        const y = Number(yr);
        if (!y || compared.includes(y) || compared.length >= 4) return;
        setCompared(prev => [...prev, y].sort((a, b) => a - b));
        setAddYear("");
    }
    function removeFromCompare(yr) {
        setCompared(prev => prev.filter(y => y !== yr));
    }

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
                    {leagueLogo && (
                        <img src={leagueLogo} alt={lg.name}
                            className="w-10 h-10 object-contain"
                            style={{ filter: LOGO_SHADOW }}
                            onError={e => e.currentTarget.style.display = "none"} />
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl font-light leading-tight" style={{ color: textColor }}>
                            {lg.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Award size={12} style={{ color: textColor, opacity: 0.65 }} />
                            <span className="text-xs font-light" style={{ color: textColor, opacity: 0.75 }}>
                                Premiações
                            </span>
                        </div>
                    </div>
                    {/* Seletor de moeda */}
                    <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        className="shrink-0 text-xs font-semibold rounded-xl px-3 py-2 border focus:outline-none cursor-pointer"
                        style={{
                            background: "rgba(255,255,255,0.15)",
                            color: textColor,
                            borderColor: "rgba(255,255,255,0.3)",
                        }}
                    >
                        {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
                            <option key={code} value={code} style={{ background: "#1a1a2e", color: "#fff" }}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── TABELA ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl mb-4 overflow-hidden">
                <div className="px-6 pt-5 pb-0">
                    <div className="mb-3">
                        <h2 className="text-base font-semibold text-gray-800">Tabela de premiações</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Valores em milhões ({currency}) · por seleção, conforme a posição final</p>
                    </div>

                    {/* Pills de filtro */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-100">
                        <button
                            onClick={() => setActiveYear(null)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${!activeYear
                                ? "bg-gray-900 text-white"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
                        >
                            Todas
                        </button>
                        {years.map(yr => (
                            <button
                                key={yr}
                                onClick={() => setActiveYear(prev => prev === yr ? null : yr)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeYear === yr
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
                            >
                                {yr}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse"
                        style={{ minWidth: `${190 + visibleYears.length * 130}px` }}>
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="sticky left-0 z-10 bg-gray-50 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-3 px-6 min-w-[190px] border-r border-gray-100">
                                    Posição
                                </th>
                                {visibleYears.map(yr => (
                                    <th key={yr} className="text-center text-[11px] lg:text-[14px] font-semibold text-gray-400 uppercase tracking-wide py-3 px-4 min-w-[120px] align-top">
                                        <span className="block">{yr}</span>
                                        {data.editions[yr]?.name && (
                                            <span className="block text-[10px] text-gray-300 font-normal normal-case tracking-normal mt-0.5">
                                                {data.editions[yr].name}
                                            </span>
                                        )}
                                        {isWorldCup && (
                                            <img
                                                src={worldCupLogo(yr)}
                                                alt={`Copa do Mundo ${yr}`}
                                                className="h-8 w-10 object-contain mx-auto mt-1.5"
                                                onError={e => { e.currentTarget.style.display = "none"; }}
                                            />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {positionRows.map(([key, fallback], i) => {
                                const bg = i % 2 === 0 ? "bg-white" : "bg-[#fcfcfd]";
                                // pula linhas que não têm valor em nenhuma edição visível
                                if (!years.some(yr => valueOf(yr, key) != null)) return null;
                                return (
                                    <tr key={key} className={`${bg} border-b border-gray-50 hover:bg-blue-50/20 transition-colors`}>
                                        <td className={`sticky left-0 z-10 ${bg} text-xs font-medium text-gray-600 py-3 px-6 border-r border-gray-100 whitespace-nowrap`}>
                                            {labelOf(key, fallback)}
                                        </td>
                                        {visibleYears.map(yr => {
                                            const val = valueOf(yr, key);
                                            return (
                                                <td key={yr} className="py-3 px-4 text-xs tabular-nums whitespace-nowrap text-center">
                                                    {val != null && val !== 0 ? (
                                                        <span className="inline-block px-2.5 py-1.5 rounded-lg bg-gray-100/70 text-gray-700 text-sm font-medium tabular-nums">
                                                            {fmtNumOnly(convert(val))}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-200 text-sm">—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}

                            {/* Pool total */}
                            <tr className="border-t-2 border-gray-200" style={{ background: c1 }}>
                                <td className="sticky left-0 z-10 text-[11px] font-bold py-3.5 px-6 border-r whitespace-nowrap"
                                    style={{ background: c1, color: textColor, borderColor: "rgba(255,255,255,0.12)" }}>
                                    Total
                                </td>
                                {visibleYears.map(yr => (
                                    <td key={yr} className="text-center py-3.5 px-4 text-sm font-bold tabular-nums whitespace-nowrap" style={{ color: textColor }}>
                                        {valueOf(yr, TOTAL_KEY) != null ? fmtFull(convert(valueOf(yr, TOTAL_KEY)), prefix) : "—"}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="h-3" />
            </div>

            {/* ── COMPARATIVO ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl mb-4 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="lg:flex items-center gap-4">
                        <h2 className="text-base font-semibold text-gray-800">Comparativo de temporadas</h2>
                        <span className="w-1 h-1 inline-block bg-black rounded-full"></span>
                        <p className="text-sm text-gray-800">Compare até quatro edições</p>
                    </div>
                    {years.filter(y => !compared.includes(y)).length > 0 && compared.length < 4 && (
                        <div className="flex items-center gap-2">
                            <select
                                value={addYear}
                                onChange={e => setAddYear(e.target.value)}
                                className="text-sm border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none"
                            >
                                <option value="">Selecionar edição...</option>
                                {years.filter(y => !compared.includes(y)).map(y => (
                                    <option key={y} value={y}>{y}{data.editions[y]?.name ? ` — ${data.editions[y].name}` : ""}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => addToCompare(addYear)}
                                disabled={!addYear}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                                style={{ background: c1, color: textColor }}
                            >
                                <Plus size={13} />
                                Adicionar
                            </button>
                        </div>
                    )}
                </div>

                {compared.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-300 text-sm gap-2">
                        <Award size={28} strokeWidth={1.5} />
                        Selecione ao menos uma edição para comparar
                    </div>
                ) : (
                    <div className={`grid gap-4 ${compared.length === 1 ? "grid-cols-1 max-w-sm"
                        : compared.length === 2 ? "sm:grid-cols-2"
                            : compared.length === 3 ? "sm:grid-cols-3"
                                : "grid-cols-2 lg:grid-cols-4"
                        }`}>

                        {compared.map(yr => {
                            const edition = data.editions[yr] ?? { name: String(yr) };
                            const pool = valueOf(yr, TOTAL_KEY);
                            const teams = (data.teams[yr] ?? [])
                                .filter(t => (t.total ?? 0) > 0)
                                .sort((a, b) => (a.standing ?? 999) - (b.standing ?? 999) || (b.total ?? 0) - (a.total ?? 0));


                            return (
                                <div key={yr} className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col">

                                    {/* Header */}
                                    <div className="relative px-4 pt-4 pb-14"
                                        style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}>
                                        <button
                                            type="button"
                                            aria-label={`Remover ${yr} da comparação`}
                                            onClick={() => removeFromCompare(yr)}
                                            className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-white/20 transition-colors"
                                            style={{ color: textColor }}
                                        >
                                            <X size={15} />
                                        </button>
                                        <p className="text-[11px] mb-0.5" style={{ color: textColor, opacity: 0.6 }}>
                                            {edition.name}
                                        </p>
                                        <span className="text-2xl font-light" style={{ color: textColor }}>{yr}</span><br></br>
                                        <p style={{ color: textColor, opacity: 0.6, fontSize: "12px" }}>em milhões ({currency})</p>
                                        {pool != null && (
                                            <p className="text-[11px] mt-1 font-light" style={{ color: textColor, opacity: 0.65 }}>
                                                Total: {fmtFull(convert(pool), prefix)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Logo da edição sobrepondo o header */}
                                    <div className="mx-4 -mt-7 mb-3 relative z-10 bg-white rounded-xl shadow-sm px-3 py-2 border border-gray-100 flex items-center gap-3">
                                        {editionLogoOf(yr) && (
                                            <img
                                                src={editionLogoOf(yr)}
                                                alt={`${lg.name} ${yr}`}
                                                className="w-10 h-10 object-contain shrink-0"
                                                onError={e => e.currentTarget.style.display = "none"}
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-gray-700 leading-tight truncate">{lg.name}</p>
                                            <p className="text-[11px] text-gray-400 leading-tight">{edition.name ?? yr}</p>
                                        </div>
                                    </div>

                                    {/* Seleções e valores recebidos */}
                                    <div className="px-4 pb-4 flex-1 overflow-y-auto max-h-80">
                                        {teams.length === 0 ? (
                                            <p className="text-xs text-gray-300 text-center py-6">Sem dados por time</p>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {teams.map((t, ti) => (
                                                    <div key={t.federation_slug ?? ti} className="flex items-center gap-2">
                                                        <span className="w-6 text-[10px] font-bold text-gray-300 tabular-nums text-right shrink-0">
                                                            {t.standing ?? "—"}º
                                                        </span>
                                                        <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-100 shrink-0 bg-gray-50 flex items-center justify-center">
                                                            <img
                                                                src={teamImg(t) ?? ""}
                                                                alt=""
                                                                className="w-full h-full object-contain"
                                                                onError={e => {
                                                                    const flag = t.flag_url && t.flag_url.startsWith("http") ? t.flag_url : null;
                                                                    if (flag && e.currentTarget.src !== flag) e.currentTarget.src = flag;
                                                                    else e.currentTarget.style.opacity = "0";
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="flex-1 text-xs text-gray-600 leading-none truncate">{t.name}</span>
                                                        <span className="text-xs font-medium text-gray-700 tabular-nums shrink-0">
                                                            {t.total}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
