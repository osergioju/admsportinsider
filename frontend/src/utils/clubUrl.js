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

// Melhor URL ÚNICA do escudo do clube: crest_url salvo no banco tem prioridade;
// senão cai na convenção por slug. Espelha o leagueLogo(logo_url, slug).
export function clubLogo(crest_url, slug) {
  if (crest_url) return crest_url;
  return clubCrestBySlug(slug);
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
  if (crest && String(crest).startsWith("http")) out.push(crest);
  if (t.slug) out.push(clubCrestBySlug(t.slug));
  return [...new Set(out.filter(Boolean))];
}
