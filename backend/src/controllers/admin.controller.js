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

// Pega o país pelo ID
export async function getAllCountriesById(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(
      "SELECT id_country, name, flag_url FROM countries WHERE id_country = $1",
      [id]
    );  

    res.json({
      success: true,
      countries: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar país:", error);
    res.status(500).json({ error: "Erro ao obter país" });
  }
}

// Cadastrar país
export async function createCountry(req, res) {
  const { codigo, flag, value } = req.body;

  try {
    await db.query(
      "INSERT INTO countries (name, flag_url) VALUES ($1, $2)",
      [value, flag]
    );

    return res.status(201).json({
      success: true,
      message: "País cadastrado com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao cadastrar país:", error);
    return res.status(500).json({
      error: "Erro ao cadastrar país"
    });
  }
}

// Deleta o país 
export async function deleteCountry(req, res) {
  const { id } = req.params;
  
  try {
    await db.query("DELETE FROM countries WHERE id_country = $1", [id]);
    return res.status(200).json({
      success: true,
      message: "País deletado com sucesso!"
    });
  } catch (error) {
    console.error("Erro ao deletar país:", error);
    return res.status(500).json({
      error: "Erro ao deletar país"
    });
  }
}


////////////
/*  GESTAO DE USUÁRIOS */
///////////
export async function getAllUsers(req, res) {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        p.name AS plan_name
      FROM users u
      LEFT JOIN plans p ON p.id = u.plan_id
      ORDER BY u.created_at DESC
    `);
    return res.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return res.status(500).json({
      error: "Erro ao obter usuários",
    });
  }
}

export async function getUserById(req, res) {
  const { id } = req.params;

    try {
        const result = await db.query(
            "SELECT * FROM users WHERE id = $1", [id]
        );  

        res.json({
            success: true,
            user: result.rows,
        });
    } catch (error) {
        console.error("Erro ao buscar país:", error);
        res.status(500).json({ error: "Erro ao obter país" });
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


