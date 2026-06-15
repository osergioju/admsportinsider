// Logos das Copas do Mundo (frontend/public/copas/)
// Regra do cliente (11/06/2026):
// - Falando de uma Copa específica (2002, 2006…2026) → logo oficial daquela edição
// - "Copa do Mundo" genericamente (ex.: logo da competição) → logo da mais recente (2026)
// - Edição sem logo oficial → taça neutra

const SPECIFIC_YEARS = new Set([2002, 2006, 2010, 2014, 2018, 2022, 2026, 2030]);

// Uso genérico ("Copa do Mundo" como competição)
export const WORLD_CUP_GENERIC_LOGO = "/copas/fifa_world-cup_2026.png";

export function worldCupLogo(year) {
  const y = Number(year);
  if (SPECIFIC_YEARS.has(y)) return `/copas/fifa_world-cup_${y}.png`;
  return "/copas/fifa_world-cup.png"; // edição específica sem logo oficial (ex.: 2030)
}
