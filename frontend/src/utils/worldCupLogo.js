// Logos das Copas do Mundo (frontend/public/copas/)
// Copa específica (2002, 2006…) usa o logo oficial; sem logo específico, usa a taça genérica.

const SPECIFIC_YEARS = new Set([2002, 2006, 2010, 2014, 2018, 2022, 2026]);

export function worldCupLogo(year) {
  const y = Number(year);
  if (SPECIFIC_YEARS.has(y)) return `/copas/fifa_world-cup_${y}.png`;
  return "/copas/fifa_world-cup.png";
}
