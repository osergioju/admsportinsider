// Mapa oficial da página de estádio — Google Maps Embed API (place mode).
// Decisão do cliente: só Embed API daqui pra frente (sem Mapbox, sem o
// iframe "output=embed" sem key). Não dá pra estilizar (sem roxo, sem
// animação cinematográfica, sem marker/card próprios), mas não exige
// faturamento pra funcionar — só uma API key com "Maps Embed API" habilitada
// no Cloud Console, restrita por HTTP referrer.
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Resolve o valor do parâmetro `q` do embed: coordenada exata quando
 * conhecida (mock local ou cache já gravado no clube), ou uma busca textual
 * (nome + cidade + país) quando só temos localização aproximada — a própria
 * Embed API geocodifica o texto no lado do Google, sem precisarmos de uma
 * chamada de geocoding separada.
 */
export function buildStadiumMapQuery(stadium) {
    if (!stadium) return null;
    if (!stadium.approximate && stadium.latitude != null && stadium.longitude != null) {
        return `${stadium.latitude},${stadium.longitude}`;
    }
    return [stadium.name, stadium.city, stadium.country].filter(Boolean).join(", ") || null;
}

// Zoom por tipo: o Embed API não deixa esconder POI/labels vizinhos, então o
// único jeito de reduzir a poluição visual é fechar o enquadramento em cima
// do estádio — no satélite dá pra fechar mais porque não depende de texto.
const DEFAULT_ZOOM = { roadmap: 17, satellite: 18 };

export default function StadiumMap({ query, stadiumName, mapType = "roadmap", zoom, className = "" }) {
    if (!API_KEY) {
        return (
            <div className={`${className} flex items-center justify-center text-center px-6`}
                style={{ background: "radial-gradient(circle at 50% 40%, #2A1050 0%, #0A0616 70%)" }}>
                <p className="text-xs text-white/40 font-light tracking-wide">
                    Mapa indisponível: defina VITE_GOOGLE_MAPS_API_KEY no .env do frontend.
                </p>
            </div>
        );
    }

    if (!query) return null;

    const params = new URLSearchParams({
        key: API_KEY,
        q: query,
        maptype: mapType,
        zoom: String(zoom ?? DEFAULT_ZOOM[mapType] ?? 17),
        language: "pt-BR",
    });

    return (
        <div className={className}>
            <iframe
                title={stadiumName || "Mapa do estádio"}
                src={`https://www.google.com/maps/embed/v1/place?${params}`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
            />
        </div>
    );
}
