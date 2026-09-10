import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { clubLogo as resolveClubLogo, handleCrestRetry } from "../../utils/clubUrl";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const STYLE_ID = "stadium-globe-styles";

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
        .stadium-globe-canvas .mapboxgl-ctrl-attrib {
            background: transparent;
            opacity: 0.35;
            transition: opacity 0.2s ease;
            font-size: 10px;
        }
        .stadium-globe-canvas .mapboxgl-ctrl-attrib:hover { opacity: 0.8; }
        .stadium-globe-canvas .mapboxgl-ctrl-bottom-right { z-index: 2; }
        .stadium-globe-canvas canvas:focus { outline: none; }

        .stadium-marker {
            position: relative;
            width: 2px;
            height: 40px;
            pointer-events: none;
        }
        .stadium-marker-beam {
            position: absolute;
            bottom: 4px;
            left: 50%;
            width: 1px;
            height: 100%;
            transform: translateX(-50%) scaleY(0);
            transform-origin: bottom;
            background: linear-gradient(to top, rgba(255,255,255,0.7), rgba(255,255,255,0));
            transition: transform 1.1s cubic-bezier(.22,.8,.2,1) 0.05s;
        }
        .stadium-marker-dot {
            position: absolute;
            bottom: 0;
            left: 50%;
            width: 7px;
            height: 7px;
            margin-left: -3.5px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 0 10px 3px rgba(255,255,255,0.9), 0 0 24px 9px rgba(160,110,240,0.55);
            transform: scale(0);
            transition: transform 0.6s cubic-bezier(.34,1.56,.64,1) 0.5s;
        }
        .stadium-marker-pulse {
            position: absolute;
            bottom: -3.5px;
            left: 50%;
            width: 7px;
            height: 7px;
            margin-left: -3.5px;
            border-radius: 50%;
            background: rgba(160,110,240,0.55);
            opacity: 0;
        }
        .stadium-marker.is-visible .stadium-marker-beam { transform: translateX(-50%) scaleY(1); }
        .stadium-marker.is-visible .stadium-marker-dot { transform: scale(1); }
        .stadium-marker.is-visible .stadium-marker-pulse {
            animation: stadiumGlobePulse 2.6s ease-out 0.6s infinite;
        }
        @keyframes stadiumGlobePulse {
            0%   { transform: translateX(-50%) scale(1); opacity: 0.65; }
            100% { transform: translateX(-50%) scale(6.5); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
            .stadium-marker-beam, .stadium-marker-dot { transition: none; }
            .stadium-marker.is-visible .stadium-marker-pulse { animation: none; opacity: 0.35; }
        }

        .stadium-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 16px 10px 10px;
            border-radius: 16px;
            background: rgba(30,16,50,0.55);
            backdrop-filter: blur(16px) saturate(140%);
            -webkit-backdrop-filter: blur(16px) saturate(140%);
            border: 1px solid rgba(180,140,255,0.14);
            box-shadow: 0 12px 34px rgba(0,0,0,0.4);
            opacity: 0;
            transform: translate(-8px, 8px) scale(0.96);
            transition: opacity 0.8s ease 0.75s, transform 0.8s cubic-bezier(.2,.8,.2,1) 0.75s;
            white-space: nowrap;
            pointer-events: none;
        }
        .stadium-card.is-visible { opacity: 1; transform: translate(0,0) scale(1); }
        .stadium-card-crest {
            width: 28px;
            height: 28px;
            object-fit: contain;
            flex-shrink: 0;
        }
        .stadium-card-text { display: flex; flex-direction: column; gap: 2px; }
        .stadium-card-title {
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-weight: 600;
            color: #fff;
        }
        .stadium-card-sub {
            font-size: 11px;
            color: rgba(255,255,255,0.55);
        }
    `;
    document.head.appendChild(el);
}

const START_CENTER = [-28, 18];

export default function StadiumGlobe({
    latitude,
    longitude,
    stadiumName,
    city,
    country,
    club,
    clubLogo,
    approximate = false,
    className = "",
}) {
    const containerRef = useRef(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        injectStyles();
        if (!MAPBOX_TOKEN || !containerRef.current) return undefined;

        let cancelled = false;
        let interrupted = false;
        let map = null;
        let resizeObserver = null;
        const timers = [];
        const wait = (ms) => new Promise((resolve) => { timers.push(setTimeout(resolve, ms)); });

        const prefersReducedMotion = typeof window !== "undefined"
            && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

        import("mapbox-gl").then((mod) => {
            if (cancelled || !containerRef.current) return;
            const gl = mod.default || mod;
            gl.accessToken = MAPBOX_TOKEN;

            map = new gl.Map({
                container: containerRef.current,
                style: "mapbox://styles/mapbox/dark-v11",
                projection: "globe",
                center: START_CENTER,
                zoom: 0.35,
                bearing: 6,
                pitch: 0,
                attributionControl: false,
                antialias: true,
            });

            map.addControl(new gl.AttributionControl({ compact: true }), "bottom-right");

            const markUserInteraction = () => { interrupted = true; };
            map.on("dragstart", markUserInteraction);
            map.on("wheel", markUserInteraction);
            map.on("touchstart", markUserInteraction);

            let markerEl = null;
            let cardEl = null;

            map.on("style.load", () => {
                if (cancelled) return;

                map.setFog({
                    range: [0.6, 10],
                    color: "rgba(42,16,80,0.9)",
                    "high-color": "rgba(127,51,217,0.45)",
                    "horizon-blend": 0.025,
                    "space-color": "rgb(8,4,16)",
                    "star-intensity": 0.35,
                });

                try {
                    const layers = map.getStyle()?.layers || [];
                    layers.forEach((layer) => {
                        if (layer.type === "symbol") {
                            map.setLayoutProperty(layer.id, "visibility", "none");
                        }
                    });
                } catch {
                    // estilo ainda não totalmente pronto — segue sem esconder labels
                }

                // Marker minimalista (ponto + feixe) e card flutuante, adicionados
                // "invisíveis" desde já; a classe is-visible dispara o fade/scale via CSS
                // quando a câmera termina de chegar (ver finish()).
                markerEl = document.createElement("div");
                markerEl.className = "stadium-marker";
                markerEl.innerHTML = `
                    <span class="stadium-marker-beam"></span>
                    <span class="stadium-marker-pulse"></span>
                    <span class="stadium-marker-dot"></span>
                `;
                new gl.Marker({ element: markerEl, anchor: "bottom" })
                    .setLngLat([longitude, latitude])
                    .addTo(map);

                cardEl = document.createElement("div");
                cardEl.className = "stadium-card";
                const crestSrc = clubLogo || (club?.crest_url ? resolveClubLogo(club.crest_url, club.slug) : null);
                cardEl.innerHTML = `
                    ${crestSrc ? `<img class="stadium-card-crest" src="${crestSrc}" alt="" />` : ""}
                    <span class="stadium-card-text">
                        <span class="stadium-card-title">${stadiumName || ""}</span>
                        <span class="stadium-card-sub">${[city, country].filter(Boolean).join(" · ")}${approximate ? " (aprox.)" : ""}</span>
                    </span>
                `;
                if (crestSrc) {
                    cardEl.querySelector("img")?.addEventListener("error", handleCrestRetry);
                }
                new gl.Marker({ element: cardEl, anchor: "left", offset: [14, -34] })
                    .setLngLat([longitude, latitude])
                    .addTo(map);

                if (!cancelled) setReady(true);
                runCinematic();
            });

            function flyToStep(opts) {
                return new Promise((resolve) => {
                    if (cancelled || interrupted) { resolve(); return; }
                    map.once("moveend", resolve);
                    map.flyTo({ essential: true, ...opts });
                });
            }

            function finish() {
                if (cancelled) return;
                markerEl?.classList.add("is-visible");
                cardEl?.classList.add("is-visible");
            }

            async function runCinematic() {
                if (prefersReducedMotion) {
                    map.jumpTo({
                        center: [longitude, latitude],
                        zoom: approximate ? 4.6 : 14.6,
                        pitch: approximate ? 0 : 48,
                        bearing: -14,
                    });
                    finish();
                    return;
                }

                await wait(500);
                if (cancelled || interrupted) { finish(); return; }

                // 1) Uma pequena rotação inicial, elegante — o planeta "acorda".
                await flyToStep({
                    center: [longitude * 0.4, Math.min(Math.max(latitude * 0.3 + 8, -60), 60)],
                    zoom: 1.15,
                    bearing: -20,
                    duration: 2600,
                    easing: (t) => t * (2 - t),
                });
                if (cancelled) return;
                if (interrupted) { finish(); return; }

                // 2) Aproxima até a região/país.
                await flyToStep({
                    center: [longitude, latitude],
                    zoom: approximate ? 4.4 : 3.6,
                    pitch: approximate ? 0 : 18,
                    bearing: -10,
                    duration: 3200,
                    curve: 1.4,
                    easing: (t) => t * (2 - t),
                });
                if (cancelled) return;
                if (interrupted || approximate) { finish(); return; }

                // 3) Chega na localização exata do estádio.
                await flyToStep({
                    center: [longitude, latitude],
                    zoom: 14.6,
                    pitch: 52,
                    bearing: -18,
                    duration: 3000,
                    curve: 1.42,
                    easing: (t) => t * (2 - t),
                });
                finish();
            }

            resizeObserver = new ResizeObserver(() => map?.resize());
            resizeObserver.observe(containerRef.current);
        });

        return () => {
            cancelled = true;
            timers.forEach(clearTimeout);
            resizeObserver?.disconnect();
            map?.remove();
        };
    }, [latitude, longitude, stadiumName]);

    if (!MAPBOX_TOKEN) {
        return (
            <div className={`stadium-globe-fallback flex items-center justify-center text-center px-8 overflow-hidden ${className}`}
                style={{ background: "radial-gradient(circle at 50% 40%, #2A1050 0%, #0A0616 70%)", color: "rgba(255,255,255,0.5)" }}>
                <p className="text-sm font-light">
                    Globo indisponível: defina VITE_MAPBOX_TOKEN no .env do frontend.
                </p>
            </div>
        );
    }

    return (
        <div className={`h-full stadium-globe-canvas relative overflow-hidden ${className}`}>
            <div ref={containerRef} className="h-full absolute inset-0" />
            <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-700"
                style={{ opacity: ready ? 0 : 1, background: "radial-gradient(circle at 50% 40%, #2A1050 0%, #0A0616 70%)" }}
            />
        </div>
    );
}
