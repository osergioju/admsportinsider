const BASE = "https://pro.sportinsider.com.br";

export function federationLogo(slug, size = "medium") {
  if (!slug) return null;
  return `${BASE}/uploads/federacoes/${size}/${slug}.webp`;
}
