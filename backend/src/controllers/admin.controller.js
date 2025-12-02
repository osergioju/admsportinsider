import { db } from "../config/db.js";
import multer from "multer";
import { importLeagueBalance } from "../utils/importLeagueBalance.service.js";
import { reSendMail } from "../utils/mailer.js";

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
          `SELECT 
            u.id,
            u.name,
            u.email,
            u.role,
            u.created_at,
            u.plan_id,
            u.active,
            p.name AS plan_name
          FROM users u
          LEFT JOIN plans p ON p.id = u.plan_id
          where u.id = $1
          ORDER BY u.created_at DESC`, [id]
        )
        res.json({
            success: true,
            user: result.rows,
        });
    } catch (error) {
        console.error("Erro ao buscar país:", error);
        res.status(500).json({ error: "Erro ao obter país" });
    }
}

// DESATIVAR USUÁRIO
export async function disableUser(req, res) {
    const { id } = req.params;

    try {
        await db.query(
            "UPDATE users SET active = FALSE WHERE id = $1",
            [id]
        );

        return res.json({
            success: true,
            message: "Usuário desativado com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao desativar usuário:", error);
        return res.status(500).json({
            error: "Erro ao desativar usuário"
        });
    }
}

export async function enableUser(req, res) {
    const { id } = req.params;

    try {
        await db.query(
            "UPDATE users SET active = TRUE WHERE id = $1",
            [id]
        );

        return res.json({
            success: true,
            message: "Usuário reativado com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao reativar usuário:", error);
        return res.status(500).json({
            error: "Erro ao reativar usuário"
        });
    }
}

// Troca o plan 
export async function changeUserPlan(req, res) {
    const { id } = req.params;
    const { plan_id } = req.body;

    if (!plan_id) {
        return res.status(400).json({
            success: false,
            error: "plan_id não enviado"
        });
    }

    try {
        // Verifica se o plano existe
        const check = await db.query("SELECT id FROM plans WHERE id = $1", [plan_id]);
        if (check.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Plano não encontrado"
            });
        }

        // Atualiza o plano do usuário
        await db.query(
            "UPDATE users SET plan_id = $1 WHERE id = $2",
            [plan_id, id]
        );

        return res.json({
            success: true,
            message: "Plano atualizado com sucesso!"
        });

    } catch (error) {
        console.error("Erro ao trocar plano:", error);
        return res.status(500).json({
            success: false,
            error: "Erro ao trocar plano"
        });
    }
}

//Reenviar email de confirmação
export async function resendConfirmationEmail(req, res) {
    const { id } = req.params;

    try {
        // 1. Buscar o e-mail do usuário
        const result = await db.query(
            "SELECT email FROM users WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Usuário não encontrado"
            });
        }

        const email = result.rows[0].email;

        // 2. Enviar o e-mail usando seu serviço
        await reSendMail(email);

        return res.json({
            success: true,
            message: "E-mail de confirmação reenviado!"
        });

    } catch (error) {
        console.error("Erro ao reenviar confirmação:", error);
        return res.status(500).json({
            success: false,
            error: "Erro ao reenviar e-mail de confirmação"
        });
    }
}

// Pega planos 
export async function getAllPlans(req, res) {
    try {
        const result = await db.query("SELECT id, name FROM plans ORDER BY id ASC");
        return res.json({ success: true, plans: result.rows });
    } catch (error) {
        console.error("Erro ao buscar planos:", error);
        return res.status(500).json({ error: "Erro ao buscar planos" });
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


