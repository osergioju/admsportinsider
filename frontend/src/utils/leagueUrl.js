const BASE = "https://pro.sportinsider.com.br/uploads/ligas/reduced";

export function leagueLogo(logo_url, slug) {
  if (logo_url) return logo_url;
  if (slug) return `${BASE}/reduced_${slug}.webp`;
  return null;
}
