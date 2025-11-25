import { db } from "../config/db.js";
import multer from "multer";
import { importLeagueBalance } from "../utils/importLeagueBalance.service.js";

// Pegar o admin, mas nem faz nada isso agora
export const getAdminDashboard = (req, res) => {
  return res.json({
    message: "Admin dashboard (placeholder) funcionando",
  });
};

// Cata os países da base
export async function getAllCountries(req, res) {
  try {
    const result = await db.query(
      "SELECT id_country, name, flag_url FROM countries ORDER BY name ASC"
    );

    res.json({
      success: true,
      countries: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar países:", error);
    res.status(500).json({ error: "Erro ao obter países" });
  }
}



////// IMPORT DE XMLS 
// IMPORT LIGA
const upload = multer({ dest: "uploads/" });

export const uploadLeagueBalance = [
  upload.single("file"),

  async (req, res) => {
    try {
      const { countryId, leagueName } = req.body;
      const filePath = req.file?.path;

      if (!countryId || !leagueName || !filePath) {
        return res.status(400).json({
          success: false,
          error: "countryId, leagueName e file são obrigatórios.",
        });
      }

      const result = await importLeagueBalance({
        countryId: Number(countryId),
        leagueName,
        filePath,
      });

      return res.json({
        success: true,
        message: "Balanço da liga importado com sucesso.",
        ...result,
      });
    } catch (error) {
      console.error("Erro ao importar balanço:", error);
      return res.status(500).json({
        success: false,
        error: "Erro ao processar balanço da liga.",
      });
    }
  },
];
