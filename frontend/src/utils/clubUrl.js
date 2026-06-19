import { federationLogo } from "./federationUrl";

const CDN = "https://pro.sportinsider.com.br";

export function clubUrl(id, slug) {
  if (!slug) return `/dashboard/clubs/${id}`;
  const idx = slug.indexOf("_");
  const urlSlug = idx >= 0 ? slug.slice(idx + 1) : slug;
  return `/dashboard/clubs/${id}/${urlSlug}`;
}

// Convenção do escudo reduzido por slug (mesmo padrão do uploadClubLogo):
// uploads/clubes/reduced/reduced_{slug}.webp
export function clubCrestBySlug(slug) {
  return slug ? `${CDN}/uploads/clubes/reduced/reduced_${slug}.webp` : null;
}

// Melhor URL ÚNICA do escudo do clube (1ª fonte candidata). Cobre crest_url URL
// completa (upload novo), crest_url legado (slug nu) e slug. Espelha leagueLogo.
export function clubLogo(crest_url, slug) {
  return teamCrestSources({ crest_url, slug })[0] ?? null;
}

// Lista ORDENADA de fontes candidatas do escudo, para o <img> cair de uma para a
// próxima via onError SEM checar 404 por fetch (que seria lento, N requisições).
// Cobre seleção (logo da federação → bandeira) e clube (crest_url → slug).
// Aceita objetos com { federation_slug, crest, crest_url, slug }.
export function teamCrestSources(t) {
  if (!t) return [];
  const out = [];
  if (t.federation_slug) out.push(federationLogo(t.federation_slug, "medium"));
  const crest = t.crest ?? t.crest_url;
  const crestStr = crest != null ? String(crest) : "";
  if (crestStr.startsWith("http")) out.push(crestStr);          // upload novo / migrado / externo
  if (t.slug) out.push(clubCrestBySlug(t.slug));                // convenção por slug
  // crest_url legado guardava só o SLUG NU (ex.: "mexico_leon") → reduced_{slug}.webp
  if (crestStr && !crestStr.startsWith("http")) out.push(clubCrestBySlug(crestStr));
  return [...new Set(out.filter(Boolean))];
}
