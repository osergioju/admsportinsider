import countries from "world-countries";

// Camada de dados dos estádios. Hoje é um mock local (POC); o formato foi
// desenhado para ser substituído por uma chamada de API sem mudar quem
// consome (StadiumPage / StadiumGlobe só leem o objeto "stadium").
//
// Shape de cada estádio:
// {
//   slug, name, shortName, city, state, country, countryCode,
//   latitude, longitude, capacity, founded,
//   club: { name, country, crest_url, slug }
// }

export function slugify(str) {
    if (!str) return "";
    return String(str)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

const STADIUMS_BY_SLUG = {
    morumbi: {
        slug: "morumbi",
        name: "Estádio do Morumbi",
        shortName: "MorumBIS",
        city: "São Paulo",
        state: "São Paulo",
        country: "Brasil",
        countryCode: "BR",
        latitude: -23.6003,
        longitude: -46.7200,
        capacity: 66795,
        founded: 1960,
        aliases: ["estadio-do-morumbi", "morumbis", "morumbi-morumbis"],
        club: {
            name: "São Paulo FC",
            country: "Brasil",
        },
    },
    "allianz-parque": {
        slug: "allianz-parque",
        name: "Allianz Parque",
        city: "São Paulo",
        state: "São Paulo",
        country: "Brasil",
        countryCode: "BR",
        latitude: -23.5273,
        longitude: -46.6788,
        capacity: 43713,
        founded: 2014,
        club: { name: "Palmeiras", country: "Brasil" },
    },
    maracana: {
        slug: "maracana",
        name: "Estádio Jornalista Mário Filho (Maracanã)",
        shortName: "Maracanã",
        city: "Rio de Janeiro",
        state: "Rio de Janeiro",
        country: "Brasil",
        countryCode: "BR",
        latitude: -22.9121,
        longitude: -43.2302,
        capacity: 78838,
        founded: 1950,
        aliases: ["estadio-jornalista-mario-filho-maracana"],
        club: { name: "Flamengo", country: "Brasil" },
    },
    castelao: {
        slug: "castelao",
        name: "Arena Castelão",
        city: "Fortaleza",
        state: "Ceará",
        country: "Brasil",
        countryCode: "BR",
        latitude: -3.8071,
        longitude: -38.5220,
        capacity: 63903,
        founded: 1973,
        club: { name: "Fortaleza", country: "Brasil" },
    },
    "arena-do-gremio": {
        slug: "arena-do-gremio",
        name: "Arena do Grêmio",
        city: "Porto Alegre",
        state: "Rio Grande do Sul",
        country: "Brasil",
        countryCode: "BR",
        latitude: -29.9739,
        longitude: -51.1940,
        capacity: 55225,
        founded: 2012,
        club: { name: "Grêmio", country: "Brasil" },
    },
    "mane-garrincha": {
        slug: "mane-garrincha",
        name: "Estádio Mané Garrincha",
        city: "Brasília",
        state: "Distrito Federal",
        country: "Brasil",
        countryCode: "BR",
        latitude: -15.7835,
        longitude: -47.8992,
        capacity: 72788,
        founded: 2013,
        club: { name: "Brasília", country: "Brasil" },
    },
};

const ALIAS_TO_SLUG = Object.values(STADIUMS_BY_SLUG).reduce((acc, stadium) => {
    (stadium.aliases || []).forEach((alias) => { acc[alias] = stadium.slug; });
    acc[slugify(stadium.name)] = stadium.slug;
    return acc;
}, {});

/** Busca um estádio já cadastrado no mock, pelo slug da URL (aceita aliases). */
export function getStadiumBySlug(slug) {
    if (!slug) return null;
    if (STADIUMS_BY_SLUG[slug]) return STADIUMS_BY_SLUG[slug];
    const canonical = ALIAS_TO_SLUG[slug];
    return canonical ? STADIUMS_BY_SLUG[canonical] : null;
}

/** Resolve o slug canônico a usar num link (ex.: para o nome do estádio no clube). */
export function getStadiumSlug(stadiumName) {
    const raw = slugify(stadiumName);
    return ALIAS_TO_SLUG[raw] || raw;
}

function findCountryCentroid(countryName, countryCode) {
    const country = countries.find((c) => {
        if (countryCode && c.cca2?.toLowerCase() === String(countryCode).toLowerCase()) return true;
        if (!countryName) return false;
        const name = countryName.toLowerCase();
        return (
            c.name?.common?.toLowerCase() === name ||
            c.name?.official?.toLowerCase() === name ||
            c.translations?.por?.common?.toLowerCase() === name
        );
    });
    if (!country?.latlng) return null;
    return { latitude: country.latlng[0], longitude: country.latlng[1], countryCode: country.cca2 };
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Busca a localização real do estádio pelo nome na Search Box API do Mapbox
 * (mesmo token do globo — sem custo/config extra; é a API que indexa POIs tipo
 * estádio, diferente da Geocoding API "estrutural" que só resolve endereços).
 * Usado como refinamento assíncrono pra estádios fora do mock local: a página
 * já renderiza com o fallback de centróide do país e troca pra coordenada
 * exata assim que (e se) a busca responder, antes do globo animar.
 *
 * `country` + `proximity` (nesta ordem de importância) são o que faz a busca
 * por nome acertar o estádio certo em vez de um bar/loja homônimo — por isso
 * usamos o próprio centróide do país (já calculado no fallback) como bias
 * geográfico, mesmo sem saber ainda a coordenada exata.
 */
export async function geocodeStadium(stadium) {
    if (!MAPBOX_TOKEN || !stadium?.name) return null;

    const params = new URLSearchParams({
        q: stadium.name,
        access_token: MAPBOX_TOKEN,
        limit: "1",
        language: "pt",
        types: "poi",
    });
    if (stadium.countryCode) params.set("country", stadium.countryCode);
    if (stadium.longitude != null && stadium.latitude != null) {
        params.set("proximity", `${stadium.longitude},${stadium.latitude}`);
    }

    try {
        const res = await fetch(`https://api.mapbox.com/search/searchbox/v1/forward?${params}`);
        if (!res.ok) return null;
        const data = await res.json();
        const feature = data?.features?.[0];
        const coords = feature?.geometry?.coordinates;
        if (!coords) return null;

        const [longitude, latitude] = coords;
        const ctx = feature.properties?.context || {};

        return {
            ...stadium,
            latitude,
            longitude,
            city: stadium.city || ctx.place?.name || null,
            country: stadium.country || ctx.country?.name || null,
            countryCode: stadium.countryCode || ctx.country?.country_code?.toUpperCase() || null,
            approximate: false,
            geocoded: true,
        };
    } catch {
        return null;
    }
}

/**
 * Monta os dados de um estádio combinando (em ordem de prioridade):
 * 1. Registro mockado (fonte "oficial" enquanto não há API);
 * 2. Dados de contexto vindos da navegação (clube de origem);
 * 3. Fallback geográfico (centróide do país) quando não há coordenada exata
 *    — depois refinado por geocodeStadium(), se possível.
 *
 * Sempre retorna um objeto com o mesmo formato, ou null se não houver dado
 * mínimo (nome do estádio) para exibir a página.
 */
export function resolveStadiumData(slug, clubHint) {
    const known = getStadiumBySlug(slug);
    if (known) {
        return {
            ...known,
            club: {
                ...known.club,
                ...(clubHint ? {
                    name: clubHint.name || known.club.name,
                    crest_url: clubHint.crest_url,
                    slug: clubHint.slug,
                    country: clubHint.country || known.club.country,
                } : {}),
            },
        };
    }

    if (!clubHint?.stadium_name) return null;

    const centroid = findCountryCentroid(clubHint.country, clubHint.countryCode);

    return {
        slug,
        name: clubHint.stadium_name,
        city: clubHint.city || null,
        state: clubHint.state || null,
        country: clubHint.country || null,
        countryCode: centroid?.countryCode || clubHint.countryCode || null,
        latitude: clubHint.latitude ?? centroid?.latitude ?? 0,
        longitude: clubHint.longitude ?? centroid?.longitude ?? 0,
        approximate: clubHint.latitude == null,
        capacity: clubHint.stadium_capacity || null,
        founded: clubHint.stadium_founded || null,
        club: {
            name: clubHint.name,
            crest_url: clubHint.crest_url,
            slug: clubHint.slug,
            country: clubHint.country,
        },
    };
}
