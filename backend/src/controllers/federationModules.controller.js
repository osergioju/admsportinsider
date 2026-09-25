import { resolveFederationModuleData, listFederationIndicators } from "../services/federationModules.service.js";

// GET /dashboard/federations/:slug/module-data?codes=revenue,net_income&to=USD
export async function getFederationModuleData(req, res) {
  const codes = String(req.query.codes || "").split(",").map((c) => c.trim()).filter(Boolean);
  try {
    const data = await resolveFederationModuleData(req.params.slug, req.query.to, codes);
    if (!data) return res.status(404).json({ message: "Federação não encontrada" });
    return res.json(data);
  } catch (error) {
    console.error("Erro ao buscar dados dos módulos da federação:", error);
    return res.status(500).json({ message: "Erro ao buscar dados da federação" });
  }
}

// GET /admin/federation-modules/catalog
export async function getFederationModuleCatalog(req, res) {
  try {
    return res.json({ indicators: await listFederationIndicators() });
  } catch (error) {
    console.error("Erro ao buscar catálogo de indicadores da federação:", error);
    return res.status(500).json({ message: "Erro ao buscar catálogo" });
  }
}
