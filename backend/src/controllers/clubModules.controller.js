import { resolveClubModuleData } from "../services/clubModules.service.js";

// GET /dashboard/clubs/:id/module-data?codes=revenue,net_income
// Usado pela pré-visualização do admin (layout ainda não salvo). A página pública recebe
// os mesmos dados embutidos em /dashboard/clubs/:id/layout.
export async function getClubModuleData(req, res) {
  const clubId = Number(req.params.id);
  if (!Number.isInteger(clubId) || clubId <= 0) return res.status(400).json({ message: "Clube inválido" });

  const codes = String(req.query.codes || "").split(",").map((c) => c.trim()).filter(Boolean);

  try {
    const data = await resolveClubModuleData(clubId, codes);
    if (!data) return res.status(404).json({ message: "Clube não encontrado" });
    return res.json(data);
  } catch (error) {
    console.error("Erro ao buscar dados dos módulos do clube:", error);
    return res.status(500).json({ message: "Erro ao buscar dados do clube" });
  }
}
