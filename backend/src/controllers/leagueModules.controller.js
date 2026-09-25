import { resolveLeagueModuleData, listLeagueIndicators } from "../services/leagueModules.service.js";

// GET /dashboard/leagues/:id/module-data?codes=revenue,prizes_total   (:id = slug ou id)
export async function getLeagueModuleData(req, res) {
  const codes = String(req.query.codes || "").split(",").map((c) => c.trim()).filter(Boolean);
  try {
    const data = await resolveLeagueModuleData(req.params.id, codes);
    if (!data) return res.status(404).json({ message: "Competição não encontrada" });
    return res.json(data);
  } catch (error) {
    console.error("Erro ao buscar dados dos módulos da competição:", error);
    return res.status(500).json({ message: "Erro ao buscar dados da competição" });
  }
}

// GET /admin/league-modules/catalog
export async function getLeagueModuleCatalog(req, res) {
  try {
    return res.json({ indicators: await listLeagueIndicators() });
  } catch (error) {
    console.error("Erro ao buscar catálogo de indicadores da competição:", error);
    return res.status(500).json({ message: "Erro ao buscar catálogo" });
  }
}
