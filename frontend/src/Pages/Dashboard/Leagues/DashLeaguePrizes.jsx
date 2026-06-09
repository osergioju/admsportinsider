import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { ArrowLeft, X, Plus, Award } from "lucide-react";

/* ─── Helpers de cor ───────────────────────────────────────────── */

function hexToRgb(hex) {
    if (!hex) return null;
    const c = hex.replace("#", "");
    const full = c.length === 3 ? c.split("").map(x => x + x).join("") : c;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function fmtMoney(v, currency = "USD") {
    if (v == null) return "—";
    const abs = Math.abs(v);
    const prefix = currency ? `${currency} ` : "";
    if (abs >= 1_000_000_000) return `${prefix}${(v / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000)     return `${prefix}${(v / 1_000_000).toFixed(0)}M`;
    if (abs >= 1_000)         return `${prefix}${(v / 1_000).toFixed(0)}K`;
    return `${prefix}${v}`;
}

/* Sem prefixo de moeda — para células da tabela */
function fmtVal(v, convertFn) {
    return fmtMoney(convertFn(v), "");
}

function flagSrc(code) {
    return code ? `https://flagcdn.com/32x24/${code}.png` : null;
}

/* ─── Avatar de bandeira (círculo) ────────────────────────────── */
function FlagAvatar({ code, size = 26, title = "" }) {
    return (
        <div
            title={title}
            className="rounded-full overflow-hidden border-2 border-white shrink-0 bg-gray-100"
            style={{ width: size, height: size }}
        >
            {code ? (
                <img
                    src={flagSrc(code)}
                    alt={code}
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.opacity = "0"; }}
                />
            ) : (
                <div className="w-full h-full bg-gray-200" />
            )}
        </div>
    );
}

/* ─── Lista de países com bandeira + nome ──────────────────────── */
function CountryList({ positions, max = 4, compact = false }) {
    const visible = positions.slice(0, max);
    const extra = positions.length - max;
    return (
        <div className={compact ? "flex flex-col gap-0.5 mt-1.5" : "flex flex-col gap-1 mt-1.5"}>
            {visible.map((pos, i) => (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                    <div
                        className="rounded-sm overflow-hidden shrink-0 bg-gray-100"
                        style={{ width: compact ? 14 : 18, height: compact ? 10 : 13 }}
                    >
                        {pos.code && (
                            <img
                                src={flagSrc(pos.code)}
                                alt={pos.code}
                                className="w-full h-full object-cover"
                                onError={e => { e.currentTarget.style.opacity = "0"; }}
                            />
                        )}
                    </div>
                    <span className={`truncate leading-none ${compact ? "text-xs text-gray-500" : "text-xs text-gray-600"}`}>
                        {pos.country || "—"}
                    </span>
                </div>
            ))}
            {extra > 0 && (
                <span className="text-[10px] text-gray-400 pl-0.5">+{extra} países</span>
            )}
        </div>
    );
}

/* ─── Mock: prêmios por posição ────────────────────────────────── */
const MOCK_PRIZES = [
    { position_order: 1,  position_label: "1º Colocado",       2002: 20_000_000, 2006: 25_000_000, 2010: 30_000_000, 2014: 35_000_000, 2018: 38_000_000, 2022: 42_000_000, 2026: 45_000_000 },
    { position_order: 2,  position_label: "2º Colocado",       2002: 17_000_000, 2006: 20_000_000, 2010: 24_000_000, 2014: 28_000_000, 2018: 28_000_000, 2022: 32_000_000, 2026: 35_000_000 },
    { position_order: 3,  position_label: "3º Colocado",       2002: 14_000_000, 2006: 16_000_000, 2010: 20_000_000, 2014: 22_000_000, 2018: 24_000_000, 2022: 28_000_000, 2026: 30_000_000 },
    { position_order: 4,  position_label: "4º Colocado",       2002: 13_000_000, 2006: 15_000_000, 2010: 18_000_000, 2014: 20_000_000, 2018: 22_000_000, 2022: 25_000_000, 2026: 27_000_000 },
    { position_order: 5,  position_label: "5º ao 8º (cada)",   2002:  9_000_000, 2006:  9_000_000, 2010: 12_000_000, 2014: 14_000_000, 2018: 16_000_000, 2022: 18_000_000, 2026: 20_000_000 },
    { position_order: 9,  position_label: "9º ao 16º (cada)",  2002:  5_000_000, 2006:  6_000_000, 2010:  8_000_000, 2014:  8_000_000, 2018: 12_000_000, 2022: 13_000_000, 2026: 14_000_000 },
    { position_order: 17, position_label: "17º ao 32º (cada)", 2002:       null, 2006:  4_000_000, 2010:  5_000_000, 2014:  6_000_000, 2018:  8_000_000, 2022:  9_000_000, 2026: 10_000_000 },
    { position_order: 99, position_label: "Pool total",        2002: 200_000_000, 2006: 250_000_000, 2010: 300_000_000, 2014: 350_000_000, 2018: 400_000_000, 2022: 440_000_000, 2026: 500_000_000 },
];

const MOCK_YEARS = [2002, 2006, 2010, 2014, 2018, 2022, 2026];

/*
  prize_order: corresponde ao position_order da tabela de prêmios acima
  (1 = campeão, 2 = vice, 3 = 3º, 4 = 4º, 5 = quartas, 9 = oitavas, 17 = fase de grupos)
*/
const MOCK_EDITIONS = {
    2002: {
        name: "Coreia/Japão 2002",
        countries: [
            { prize_order: 1,  country: "Brasil",        code: "br" },
            { prize_order: 2,  country: "Alemanha",      code: "de" },
            { prize_order: 3,  country: "Turquia",       code: "tr" },
            { prize_order: 4,  country: "Coreia do Sul", code: "kr" },
            { prize_order: 5,  country: "Espanha",       code: "es" },
            { prize_order: 5,  country: "Senegal",       code: "sn" },
            { prize_order: 5,  country: "Japão",         code: "jp" },
            { prize_order: 5,  country: "Estados Unidos",code: "us" },
            { prize_order: 9,  country: "Inglaterra",    code: "gb" },
            { prize_order: 9,  country: "Suécia",        code: "se" },
            { prize_order: 9,  country: "Dinamarca",     code: "dk" },
            { prize_order: 9,  country: "México",        code: "mx" },
            { prize_order: 9,  country: "Irlanda",       code: "ie" },
            { prize_order: 9,  country: "Uruguai",       code: "uy" },
            { prize_order: 9,  country: "Bélgica",       code: "be" },
            { prize_order: 9,  country: "Paraguai",      code: "py" },
        ],
    },
    2006: {
        name: "Alemanha 2006",
        countries: [
            { prize_order: 1,  country: "Itália",        code: "it" },
            { prize_order: 2,  country: "França",        code: "fr" },
            { prize_order: 3,  country: "Alemanha",      code: "de" },
            { prize_order: 4,  country: "Portugal",      code: "pt" },
            { prize_order: 5,  country: "Brasil",        code: "br" },
            { prize_order: 5,  country: "Argentina",     code: "ar" },
            { prize_order: 5,  country: "Inglaterra",    code: "gb" },
            { prize_order: 5,  country: "Espanha",       code: "es" },
            { prize_order: 9,  country: "Suíça",         code: "ch" },
            { prize_order: 9,  country: "Ucrânia",       code: "ua" },
            { prize_order: 9,  country: "Austrália",     code: "au" },
            { prize_order: 9,  country: "Equador",       code: "ec" },
            { prize_order: 9,  country: "Gana",          code: "gh" },
            { prize_order: 9,  country: "EUA",           code: "us" },
            { prize_order: 9,  country: "Japão",         code: "jp" },
            { prize_order: 9,  country: "México",        code: "mx" },
            { prize_order: 17, country: "República Tcheca", code: "cz" },
            { prize_order: 17, country: "Costa do Marfim",  code: "ci" },
            { prize_order: 17, country: "Irã",              code: "ir" },
            { prize_order: 17, country: "Arábia Saudita",   code: "sa" },
            { prize_order: 17, country: "Argélia",          code: "dz" },
            { prize_order: 17, country: "Polônia",          code: "pl" },
            { prize_order: 17, country: "Camarões",         code: "cm" },
        ],
    },
    2010: {
        name: "África do Sul 2010",
        countries: [
            { prize_order: 1,  country: "Espanha",       code: "es" },
            { prize_order: 2,  country: "Holanda",       code: "nl" },
            { prize_order: 3,  country: "Alemanha",      code: "de" },
            { prize_order: 4,  country: "Uruguai",       code: "uy" },
            { prize_order: 5,  country: "Argentina",     code: "ar" },
            { prize_order: 5,  country: "Brasil",        code: "br" },
            { prize_order: 5,  country: "Gana",          code: "gh" },
            { prize_order: 5,  country: "Paraguai",      code: "py" },
            { prize_order: 9,  country: "Chile",         code: "cl" },
            { prize_order: 9,  country: "Japão",         code: "jp" },
            { prize_order: 9,  country: "EUA",           code: "us" },
            { prize_order: 9,  country: "México",        code: "mx" },
            { prize_order: 9,  country: "Coreia do Sul", code: "kr" },
            { prize_order: 9,  country: "Portugal",      code: "pt" },
            { prize_order: 9,  country: "Eslováquia",    code: "sk" },
            { prize_order: 9,  country: "Inglaterra",    code: "gb" },
            { prize_order: 17, country: "Argélia",       code: "dz" },
            { prize_order: 17, country: "Camarões",      code: "cm" },
            { prize_order: 17, country: "Nigéria",       code: "ng" },
            { prize_order: 17, country: "Costa do Marfim", code: "ci" },
            { prize_order: 17, country: "França",        code: "fr" },
            { prize_order: 17, country: "Itália",        code: "it" },
            { prize_order: 17, country: "Suíça",         code: "ch" },
            { prize_order: 17, country: "Honduras",      code: "hn" },
        ],
    },
    2014: {
        name: "Brasil 2014",
        countries: [
            { prize_order: 1,  country: "Alemanha",      code: "de" },
            { prize_order: 2,  country: "Argentina",     code: "ar" },
            { prize_order: 3,  country: "Holanda",       code: "nl" },
            { prize_order: 4,  country: "Brasil",        code: "br" },
            { prize_order: 5,  country: "Colômbia",      code: "co" },
            { prize_order: 5,  country: "Bélgica",       code: "be" },
            { prize_order: 5,  country: "França",        code: "fr" },
            { prize_order: 5,  country: "Costa Rica",    code: "cr" },
            { prize_order: 9,  country: "Chile",         code: "cl" },
            { prize_order: 9,  country: "Grécia",        code: "gr" },
            { prize_order: 9,  country: "Suíça",         code: "ch" },
            { prize_order: 9,  country: "Argélia",       code: "dz" },
            { prize_order: 9,  country: "México",        code: "mx" },
            { prize_order: 9,  country: "EUA",           code: "us" },
            { prize_order: 9,  country: "Nigéria",       code: "ng" },
            { prize_order: 9,  country: "Uruguai",       code: "uy" },
            { prize_order: 17, country: "Espanha",       code: "es" },
            { prize_order: 17, country: "Itália",        code: "it" },
            { prize_order: 17, country: "Equador",       code: "ec" },
            { prize_order: 17, country: "Japão",         code: "jp" },
            { prize_order: 17, country: "Camarões",      code: "cm" },
            { prize_order: 17, country: "Costa do Marfim", code: "ci" },
        ],
    },
    2018: {
        name: "Rússia 2018",
        countries: [
            { prize_order: 1,  country: "França",        code: "fr" },
            { prize_order: 2,  country: "Croácia",       code: "hr" },
            { prize_order: 3,  country: "Bélgica",       code: "be" },
            { prize_order: 4,  country: "Inglaterra",    code: "gb" },
            { prize_order: 5,  country: "Brasil",        code: "br" },
            { prize_order: 5,  country: "Uruguai",       code: "uy" },
            { prize_order: 5,  country: "Suécia",        code: "se" },
            { prize_order: 5,  country: "Rússia",        code: "ru" },
            { prize_order: 9,  country: "Argentina",     code: "ar" },
            { prize_order: 9,  country: "Portugal",      code: "pt" },
            { prize_order: 9,  country: "Espanha",       code: "es" },
            { prize_order: 9,  country: "Dinamarca",     code: "dk" },
            { prize_order: 9,  country: "México",        code: "mx" },
            { prize_order: 9,  country: "Japão",         code: "jp" },
            { prize_order: 9,  country: "Suíça",         code: "ch" },
            { prize_order: 9,  country: "Colômbia",      code: "co" },
            { prize_order: 17, country: "Alemanha",      code: "de" },
            { prize_order: 17, country: "Marrocos",      code: "ma" },
            { prize_order: 17, country: "Irã",           code: "ir" },
            { prize_order: 17, country: "Tunísia",       code: "tn" },
            { prize_order: 17, country: "Nigéria",       code: "ng" },
            { prize_order: 17, country: "Senegal",       code: "sn" },
            { prize_order: 17, country: "Panamá",        code: "pa" },
            { prize_order: 17, country: "Egito",         code: "eg" },
            { prize_order: 17, country: "Arábia Saudita", code: "sa" },
            { prize_order: 17, country: "Austrália",     code: "au" },
            { prize_order: 17, country: "Costa Rica",    code: "cr" },
        ],
    },
    2022: {
        name: "Qatar 2022",
        countries: [
            { prize_order: 1,  country: "Argentina",     code: "ar" },
            { prize_order: 2,  country: "França",        code: "fr" },
            { prize_order: 3,  country: "Croácia",       code: "hr" },
            { prize_order: 4,  country: "Marrocos",      code: "ma" },
            { prize_order: 5,  country: "Holanda",       code: "nl" },
            { prize_order: 5,  country: "Brasil",        code: "br" },
            { prize_order: 5,  country: "Portugal",      code: "pt" },
            { prize_order: 5,  country: "Inglaterra",    code: "gb" },
            { prize_order: 9,  country: "Espanha",       code: "es" },
            { prize_order: 9,  country: "EUA",           code: "us" },
            { prize_order: 9,  country: "Senegal",       code: "sn" },
            { prize_order: 9,  country: "Japão",         code: "jp" },
            { prize_order: 9,  country: "Polônia",       code: "pl" },
            { prize_order: 9,  country: "Austrália",     code: "au" },
            { prize_order: 9,  country: "Suíça",         code: "ch" },
            { prize_order: 9,  country: "Coreia do Sul", code: "kr" },
            { prize_order: 17, country: "Alemanha",      code: "de" },
            { prize_order: 17, country: "Bélgica",       code: "be" },
            { prize_order: 17, country: "México",        code: "mx" },
            { prize_order: 17, country: "Uruguai",       code: "uy" },
            { prize_order: 17, country: "Dinamarca",     code: "dk" },
            { prize_order: 17, country: "Tunísia",       code: "tn" },
            { prize_order: 17, country: "Camarões",      code: "cm" },
            { prize_order: 17, country: "Sérvia",        code: "rs" },
            { prize_order: 17, country: "Gana",          code: "gh" },
            { prize_order: 17, country: "Costa Rica",    code: "cr" },
            { prize_order: 17, country: "Equador",       code: "ec" },
            { prize_order: 17, country: "Catar",         code: "qa" },
            { prize_order: 17, country: "Arábia Saudita", code: "sa" },
            { prize_order: 17, country: "Irã",           code: "ir" },
            { prize_order: 17, country: "Canadá",        code: "ca" },
            { prize_order: 17, country: "Gales",         code: "gb-wls" },
        ],
    },
    2026: {
        name: "EUA/Canadá/México 2026",
        countries: [
            { prize_order: 1,  country: "A definir", code: null },
            { prize_order: 2,  country: "A definir", code: null },
            { prize_order: 3,  country: "A definir", code: null },
            { prize_order: 4,  country: "A definir", code: null },
        ],
    },
};

const MOCK_LEAGUE = {
    name: "Copa do Mundo",
    description: "FIFA World Cup",
    logo_url: "https://pro.sportinsider.com.br/uploads/ligas/reduced/reduced_copa-do-mundo.webp",
    primary_color: "#001F5B",
    secondary_color: "#B90C2C",
};

/* ─── Taxas de câmbio (base USD) ───────────────────────────────── */
const RATES = { USD: 1, BRL: 5.75, EUR: 0.92, GBP: 0.79, ARS: 970 };
const CURRENCY_LABELS = { USD: "USD — Dólar", BRL: "BRL — Real", EUR: "EUR — Euro", GBP: "GBP — Libra", ARS: "ARS — Peso arg." };

/* ─── Componente principal ─────────────────────────────────────── */

export default function DashLeaguePrizes() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [league, setLeague] = useState(null);
    const [activeYear, setActiveYear] = useState(null);
    const [compared, setCompared] = useState([2022, 2018]);
    const [addYear, setAddYear] = useState("");
    const [currency, setCurrency] = useState("USD");

    useEffect(() => {
        api.get(`/dashboard/leagues/${slug}/info`)
            .then(r => setLeague(r.data.league))
            .catch(() => setLeague(MOCK_LEAGUE));
    }, [slug]);

    const lg = league || MOCK_LEAGUE;
    const prizes = MOCK_PRIZES;
    const years = MOCK_YEARS;

    function convert(v) {
        if (v == null) return null;
        return v * (RATES[currency] ?? 1);
    }

    const c1 = lg.primary_color || "#001F5B";
    const c2 = lg.secondary_color || c1;
    const rgb1 = hexToRgb(c1);
    const lum1 = rgb1 ? (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255 : 0;
    const textColor = lum1 > 0.5 ? "#0A0A0A" : "#FFFFFF";

    const totalRow = prizes.find(r => r.position_order === 99);
    const bodyRows = prizes.filter(r => r.position_order !== 99);
    const visibleYears = activeYear ? [activeYear] : years;

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
                    {lg.logo_url && (
                        <img src={lg.logo_url} alt={lg.name}
                            className="w-10 h-10 object-contain drop-shadow"
                            onError={e => e.currentTarget.style.display = "none"} />
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl font-light leading-tight" style={{ color: textColor }}>
                            {lg.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Award size={12} style={{ color: textColor, opacity: 0.65 }} />
                            <span className="text-xs font-light" style={{ color: textColor, opacity: 0.75 }}>
                                Premiações por edição
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
                        <p className="text-xs text-gray-400 mt-0.5">Valores em {currency} · Dados por edição</p>
                    </div>

                    {/* Pills de filtro */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-100">
                        <button
                            onClick={() => setActiveYear(null)}
                            className="text-xs px-3.5 py-1.5 rounded-full font-medium transition-all border"
                            style={!activeYear
                                ? { background: c1, color: textColor, borderColor: c1 }
                                : { background: "transparent", color: "#6b7280", borderColor: "#e5e7eb" }}
                        >
                            Todas
                        </button>
                        {years.map(yr => (
                            <button
                                key={yr}
                                onClick={() => setActiveYear(prev => prev === yr ? null : yr)}
                                className="text-xs px-3.5 py-1.5 rounded-full font-medium transition-all border"
                                style={activeYear === yr
                                    ? { background: c1, color: textColor, borderColor: c1 }
                                    : { background: "transparent", color: "#6b7280", borderColor: "#e5e7eb" }}
                            >
                                {yr}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse"
                        style={{ minWidth: `${190 + visibleYears.length * 140}px` }}>
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="sticky left-0 z-10 bg-gray-50 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-3 px-6 min-w-[190px] border-r border-gray-100">
                                    Posição
                                </th>
                                {visibleYears.map(yr => {
                                    const ed = MOCK_EDITIONS[yr];
                                    /* top 5 para exibir no stack */
                                    const top5 = (ed?.countries ?? [])
                                        .filter(c => c.prize_order <= 4)
                                        .slice(0, 5);
                                    return (
                                        <th key={yr} className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-3 px-4 min-w-[140px] align-top">
                                            <span className="block">{yr}</span>
                                            {ed && (
                                                <span className="block text-[10px] text-gray-300 font-normal normal-case tracking-normal mt-0.5 mb-1.5">
                                                    {ed.name}
                                                </span>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {bodyRows.map((row, i) => {
                                const bg = i % 2 === 0 ? "bg-white" : "bg-gray-50/40";
                                return (
                                    <tr key={row.position_order} className={`${bg} border-b border-gray-50 hover:bg-blue-50/20 transition-colors`}>
                                        <td className={`sticky left-0 z-10 ${bg} text-xs font-medium text-gray-600 py-3 px-6 border-r border-gray-100 whitespace-nowrap`}>
                                            {row.position_label}
                                        </td>
                                        {visibleYears.map(yr => {
                                            const val = row[yr];
                                            const tier = (MOCK_EDITIONS[yr]?.countries ?? [])
                                                .filter(c => c.prize_order === row.position_order);
                                            return (
                                                <td key={yr} className="py-3 px-4 text-xs tabular-nums whitespace-nowrap">
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        {val != null ? (
                                                            <span className="inline-block px-2.5 py-1.5 rounded-lg bg-gray-100/70 font-mono text-gray-700 text-sm font-medium">
                                                                {fmtVal(val, convert)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-200 text-sm">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}

                            {/* Pool total */}
                            {totalRow && (
                                <tr className="border-t-2 border-gray-200" style={{ background: c1 }}>
                                    <td className="sticky left-0 z-10 text-[11px] font-bold py-3.5 px-6 border-r whitespace-nowrap"
                                        style={{ background: c1, color: textColor, borderColor: "rgba(255,255,255,0.12)" }}>
                                        {totalRow.position_label}
                                    </td>
                                    {visibleYears.map(yr => (
                                        <td key={yr} className="text-center py-3.5 px-4 text-sm font-bold tabular-nums whitespace-nowrap" style={{ color: textColor }}>
                                            {totalRow[yr] != null ? fmtVal(totalRow[yr], convert) : "—"}
                                        </td>
                                    ))}
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="px-6 py-3 text-[11px] text-gray-300 italic">
                    Dados mockados — serão substituídos após importação do CSV
                </p>
            </div>

            {/* ── COMPARATIVO ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl mb-4 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">Comparativo de edições</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Compare até 4 edições lado a lado · todos os países participantes</p>
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
                                    <option key={y} value={y}>{y} — {MOCK_EDITIONS[y]?.name ?? y}</option>
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
                    <div className={`grid gap-4 ${
                        compared.length === 1 ? "grid-cols-1 max-w-sm"
                        : compared.length === 2 ? "sm:grid-cols-2"
                        : compared.length === 3 ? "sm:grid-cols-3"
                        : "grid-cols-2 lg:grid-cols-4"
                    }`}>
                        {compared.map(yr => {
                            const edition = MOCK_EDITIONS[yr] ?? { name: String(yr), countries: [] };
                            const pool = totalRow?.[yr];

                            /* top-5 para o stack do header */
                            const top5 = edition.countries.filter(c => c.prize_order <= 4).slice(0, 5);

                            /* agrupar países por prize_order */
                            const tiers = [];
                            const seen = new Set();
                            for (const c of edition.countries) {
                                if (!seen.has(c.prize_order)) {
                                    seen.add(c.prize_order);
                                    tiers.push(c.prize_order);
                                }
                            }
                            tiers.sort((a, b) => a - b);

                            return (
                                <div key={yr} className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col">

                                    {/* Header */}
                                    <div className="relative px-4 pt-4 pb-14"
                                        style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}>
                                        <button
                                            onClick={() => removeFromCompare(yr)}
                                            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                                            style={{ color: textColor }}
                                        >
                                            <X size={12} />
                                        </button>
                                        <p className="text-[11px] mb-0.5" style={{ color: textColor, opacity: 0.6 }}>
                                            {edition.name}
                                        </p>
                                        <span className="text-2xl font-light" style={{ color: textColor }}>{yr}</span>
                                        {pool != null && (
                                            <p className="text-[11px] mt-1 font-light" style={{ color: textColor, opacity: 0.65 }}>
                                                Total: {fmtMoney(convert(pool), currency)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Logo da competição sobrepondo o header */}
                                    <div className="mx-4 -mt-7 mb-3 relative z-10 bg-white rounded-xl shadow-sm px-3 py-2 border border-gray-100 flex items-center gap-3">
                                        {lg.logo_url && (
                                            <img
                                                src={lg.logo_url}
                                                alt={lg.name}
                                                className="w-10 h-10 object-contain shrink-0"
                                                onError={e => e.currentTarget.style.display = "none"}
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-gray-700 leading-tight truncate">{lg.name}</p>
                                            <p className="text-[11px] text-gray-400 leading-tight">{edition.name}</p>
                                        </div>
                                    </div>

                                    {/* Lista de países por faixa */}
                                    <div className="px-4 pb-4 flex-1 space-y-3 overflow-y-auto max-h-80">
                                        {tiers.map(tier => {
                                            const prizeRow = prizes.find(r => r.position_order === tier);
                                            const tierCountries = edition.countries.filter(c => c.prize_order === tier);
                                            const prizeVal = prizeRow?.[yr];
                                            const label = prizeRow?.position_label ?? `Pos. ${tier}`;

                                            return (
                                                <div key={tier}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                                                        {prizeVal != null && (
                                                            <span className="text-xs font-mono text-gray-600 tabular-nums">
                                                                {fmtVal(prizeVal, convert)}
                                                                {tierCountries.length > 1 ? " cada" : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        {tierCountries.map((c, ci) => (
                                                            <div key={ci} className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-100 shrink-0 bg-gray-50">
                                                                    {c.code && (
                                                                        <img
                                                                            src={flagSrc(c.code)}
                                                                            alt={c.code}
                                                                            className="w-full h-full object-cover"
                                                                            onError={e => { e.currentTarget.style.opacity = "0"; }}
                                                                        />
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-gray-600 leading-none">{c.country}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
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
