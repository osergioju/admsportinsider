import { Router } from "express";
import { sendContact } from "../controllers/contact.controller.js";
import { getPublicSystemFeatures } from "../controllers/maintenance.controller.js";
import { getPublicLegalSections } from "../controllers/legal.controller.js";
import db from "../config/db.js";

const router = Router();

router.post("/contact", sendContact);

// Feature flags de páginas/menus (Manutenção do Sistema) — sem auth
router.get("/system-features", getPublicSystemFeatures);

// Seções da página /legal — sem auth (página pública)
router.get("/legal", getPublicLegalSections);

// Traduções públicas — sem auth, locale via query param (?locale=en-US)
router.get("/translations", async (req, res) => {
  const locale = req.query.locale || "pt-BR";
  try {
    const result = await db.query(
      `SELECT ct.code, COALESCE(ctt.name, ct.name_pt) AS text
       FROM common_terms ct
       LEFT JOIN common_term_translations ctt
         ON ctt.common_term_id = ct.id AND ctt.locale = $1`,
      [locale]
    );
    const map = {};
    for (const row of result.rows) map[row.code] = row.text;
    return res.json(map);
  } catch (err) {
    console.error("Erro ao buscar traduções públicas:", err);
    return res.status(500).json({});
  }
});

export default router;