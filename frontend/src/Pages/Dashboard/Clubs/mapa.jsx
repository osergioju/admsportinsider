import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { useState } from "react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const continentes = {
  mundo: { center: [0, 0], zoom: 1 },
  americaSul: { center: [-60, -15], zoom: 2.8 },
  americaNorte: { center: [-100, 40], zoom: 2.5 },
  europa: { center: [15, 50], zoom: 3 },
  africa: { center: [20, 5], zoom: 2.6 },
  asia: { center: [90, 30], zoom: 2.3 },
  oceania: { center: [140, -25], zoom: 3 }
};

const continentePorPais = {
  Brazil: "americaSul",
  Argentina: "americaSul",
  Chile: "americaSul",
  "United States of America": "americaNorte",
  Canada: "americaNorte",
  Mexico: "americaNorte",
  France: "europa",
  Germany: "europa",
  Italy: "europa",
  Spain: "europa",
  Nigeria: "africa",
  "South Africa": "africa",
  Egypt: "africa",
  China: "asia",
  Japan: "asia",
  India: "asia",
  Australia: "oceania",
  "New Zealand": "oceania"
};

const regioesUI = [
  { id: "mundo", label: "Mundo" },
  { id: "americaSul", label: "América do Sul" },
  { id: "americaNorte", label: "América do Norte" },
  { id: "europa", label: "Europa" },
  { id: "africa", label: "África" },
  { id: "asia", label: "Ásia" },
  { id: "oceania", label: "Oceania" }
];

const estadiosBrasil = [
  { nome: "Allianz Parque", coords: [-46.678, -23.527], emoji: "🟢" }, // Palmeiras
  { nome: "Morumbis", coords: [-46.720, -23.600], emoji: "🔴" }, // São Paulo
  { nome: "Maracanã", coords: [-43.230, -22.912], emoji: "⚫" }, // Flamengo
  { nome: "Castelão", coords: [-38.521, -3.807], emoji: "🔵" }, // Fortaleza
  { nome: "Arena do Grêmio", coords: [-51.194, -29.974], emoji: "⚪" },
  { nome: "Mané Garrincha", coords: [-47.899103, -15.783478], emoji: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Clube_de_Regatas_do_Flamengo_logo.svg/250px-Clube_de_Regatas_do_Flamengo_logo.svg.png" } // Grêmio
];

export default function MapaClubes() {
  const [continente, setContinente] = useState("mundo");
  const [paisSelecionado, setPaisSelecionado] = useState(null);
  const [posicao, setPosicao] = useState({ center: [0, 0], zoom: 1 });

  function isEmDestaque(nomePais) {
    return (
      continente === "mundo" ||
      continentePorPais[nomePais] === continente
    );
  }

  return (
    <div>
      {/* BOTÕES DE CONTINENTE */}
      <div className="flex flex-wrap gap-2 mb-4">
        {regioesUI.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setContinente(r.id);
              setPaisSelecionado(null);
              setPosicao({
                center: continentes[r.id].center,
                zoom: continentes[r.id].zoom
              });
            }}
            className={`px-4 py-1.5 rounded-full border transition
              ${
                continente === r.id
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* MAPA */}
      <ComposableMap projectionConfig={{ scale: 160 }}>
        <ZoomableGroup
          center={posicao.center}
          zoom={posicao.zoom}
          transitionDuration={1500}
          transitionTimingFunction="cubic-bezier(0.22, 1, 0.36, 1)"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const nome = geo.properties.name;
                const destaque = isEmDestaque(nome);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (nome === "Brazil") {
                        const centro = geoCentroid(geo);
                        setPaisSelecionado("Brazil");
                        setPosicao({ center: centro, zoom: 4 });
                      }
                    }}
                    style={{
                      default: {
                        fill: destaque ? "#4CAF50" : "#AAA",
                        opacity: destaque ? 1 : 0.15,
                        outline: "none",
                        transition: "all 0.6s ease"
                      },
                      hover: {
                        fill: destaque ? "#2E7D32" : "#AAA",
                        opacity: destaque ? 1 : 0.15,
                        outline: "none"
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* MARCADORES NOS ESTÁDIOS */}
          {paisSelecionado === "Brazil" &&
            estadiosBrasil.map((e) => (
              <Marker key={e.nome} coordinates={e.coords}>
                <image href={e.emoji} width={4} height={20} />
              </Marker>
            ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
