import { db } from "../config/db.js";
import multer from "multer";
import { importLeagueBalance } from "../utils/importLeagueBalance.service.js";
import { reSendMail } from "../utils/mailer.js";
import bcrypt from "bcryptjs";

// Pegar o admin, mas nem faz nada isso agora
export const getAdminDashboard = (req, res) => {
  return res.json({
    message: "Admin dashboard (placeholder) funcionando",
  });
};

// Cata os países da base
export async function getAllCountries(req, res) {
   try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countriesQuery = await db.query(`
      SELECT id_country, name, flag_url FROM countries ORDER BY name ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countQuery = await db.query(`SELECT COUNT(*) FROM countries`);

    const total = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      countries: countriesQuery.rows,
      pagination: {
        total,
        page,
        totalPages
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar usuários" });
  }
}

export async function getAllLeagues(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const leaguesQuery = await db.query(`
    SELECT 
      l.id_league,
      l.name,
      l.description,
      l.logo_url,
      l.created_at,
      l.id_country,
      c.name AS country_name,
      c.flag_url
    FROM leagues l
    LEFT JOIN countries c ON c.id_country = l.id_country
    WHERE l.active = true
    ORDER BY l.name ASC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

    const countQuery = await db.query(`SELECT COUNT(*) FROM leagues`);

    const total = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      leagues: leaguesQuery.rows,
      pagination: {
        total,
        page,
        totalPages
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar ligas" });
  }
}


export async function getLeagueById(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(`
    SELECT 
      l.*,
      c.name AS country_name,
      c.flag_url
    FROM leagues l
    LEFT JOIN countries c ON c.id_country = l.id_country
    WHERE id_league = $1
  `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Liga não encontrada" });
    }

    return res.json({ league: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar liga" });
  }
}

export async function createLeague(req, res) {
  const { id_country, name, description, logo_url } = req.body;

  if (!id_country || !name) {
    return res.status(400).json({ message: "Campos obrigatórios faltando." });
  }

  try {
    await db.query(`
      INSERT INTO leagues (id_country, name, description, logo_url)
      VALUES ($1, $2, $3, $4)
    `, [id_country, name, description, logo_url]);

    return res.status(201).json({ message: "Liga cadastrada com sucesso!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao cadastrar liga" });
  }
}

export async function updateLeague(req, res) {
  const { id } = req.params;
  const { id_country, name, description, logo_url } = req.body;

  try {
    await db.query(`
      UPDATE leagues 
      SET 
        id_country = $1,
        name = $2,
        description = $3,
        logo_url = $4
      WHERE id_league = $5
    `, [id_country, name, description, logo_url, id]);

    return res.json({ message: "Liga atualizada com sucesso!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar liga" });
  }
}

export async function disableLeague(req, res) {
  const { id } = req.params;

  try {
    await db.query(`
      UPDATE leagues
      SET active = false
      WHERE id_league = $1
    `, [id]);

    return res.json({ message: "Liga desativada com sucesso!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao desativar liga" });
  }
}

export async function getAllClubs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Listar clubes com JOIN da liga
    const clubsQuery = await db.query(`
      SELECT 
        c.id_club,
        c.name,
        c.description,
        c.crest_url,
        c.id_league,
        c.active,
        c.created_at,
        l.name AS league_name
      FROM clubs c
      LEFT JOIN leagues l ON l.id_league = c.id_league
      WHERE c.active = TRUE
      ORDER BY c.name ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Contagem total p/ paginação
    const countQuery = await db.query(`
      SELECT COUNT(*) FROM clubs WHERE active = TRUE
    `);

    const total = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      clubs: clubsQuery.rows,
      pagination: { total, page, totalPages }
    });

  } catch (err) {
    console.error("Erro ao listar clubes:", err);
    return res.status(500).json({ message: "Erro ao listar clubes" });
  }
}

export async function getClubById(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        c.*,
        l.name AS league_name
      FROM clubs c
      LEFT JOIN leagues l ON l.id_league = c.id_league
      WHERE c.id_club = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Clube não encontrado" });
    }

    return res.json({ club: result.rows[0] });

  } catch (err) {
    console.error("Erro ao buscar clube:", err);
    return res.status(500).json({ message: "Erro ao buscar clube" });
  }
}

export async function createClub(req, res) {
  const { id_league, name, description, crest_url } = req.body;

  // Valida campos obrigatórios
  if (!id_league || !name) {
    return res.status(400).json({
      message: "Liga e nome do clube são obrigatórios."
    });
  }

  try {
    await db.query(`
      INSERT INTO clubs (id_league, name, description, crest_url)
      VALUES ($1, $2, $3, $4)
    `, [id_league, name, description, crest_url]);

    return res.status(201).json({ message: "Clube cadastrado com sucesso!" });

  } catch (err) {
    console.error("Erro ao criar clube:", err);
    return res.status(500).json({ message: "Erro ao cadastrar clube" });
  }
}

export async function updateClub(req, res) {
  const { id } = req.params;
  const { id_league, name, description, crest_url } = req.body;

  try {
    await db.query(`
      UPDATE clubs
      SET 
        id_league = $1,
        name = $2,
        description = $3,
        crest_url = $4
      WHERE id_club = $5
    `, [id_league, name, description, crest_url, id]);

    return res.json({ message: "Clube atualizado com sucesso!" });

  } catch (err) {
    console.error("Erro ao atualizar clube:", err);
    return res.status(500).json({ message: "Erro ao atualizar clube" });
  }
}

export async function disableClub(req, res) {
  const { id } = req.params;

  try {
    await db.query(`
      UPDATE clubs
      SET active = FALSE
      WHERE id_club = $1
    `, [id]);

    return res.json({ message: "Clube desativado com sucesso!" });

  } catch (err) {
    console.error("Erro ao desativar clube:", err);
    return res.status(500).json({ message: "Erro ao desativar clube" });
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
export async function disableCountry(req, res) {
  const { id } = req.params;

  try {
    await db.query(
      "UPDATE countries SET active = false WHERE id_country = $1",
      [id]
    );

    return res.json({
      success: true,
      message: "País desativado com sucesso!"
    });
  } catch (error) {
    console.error("Erro ao desativar país:", error);
    return res.status(500).json({
      error: "Erro ao desativar país"
    });
  }
}



////////////
/*  GESTAO DE USUÁRIOS */
///////////
export async function getAllUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const usersQuery = await db.query(`
      SELECT users.*, plans.name AS plan_name
      FROM users
      LEFT JOIN plans ON plans.id = users.plan_id
      ORDER BY users.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countQuery = await db.query(`SELECT COUNT(*) FROM users`);

    const total = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      users: usersQuery.rows,
      pagination: {
        total,
        page,
        totalPages
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar usuários" });
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

// Salvar as alterações do módulo central 
export async function updateUser(req, res) {
    const { id } = req.params;             // ID do usuário sendo atualizado
    const editorId = req.user.id;          // ID do usuário logado (vem do JWT)
    const editorRole = req.user.role;      // role do usuário logado

    const { name, email, role } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: "Nome e email são obrigatórios."
        });
    }

    try {
        // 🔒 1. Impedir editar o próprio role
        if (editorId === id && role !== undefined) {
            return res.status(403).json({
                success: false,
                message: "Você não pode alterar a sua própria função."
            });
        }

        // 🔒 2. Apenas admin_master pode alterar role de outros
        if (role && editorRole !== "admin_master") {
            return res.status(403).json({
                success: false,
                message: "Você não possui permissão para alterar a função deste usuário."
            });
        }

        // 🔒 3. Validar e-mail único
        const emailExists = await db.query(
            `SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1`,
            [email, id]
        );

        if (emailExists.rowCount > 0) {
            return res.status(409).json({
                success: false,
                message: "Já existe um usuário usando este e-mail."
            });
        }

        // 🔧 4. Atualiza (role só se tiver permissão)
        const result = await db.query(
            `UPDATE users
             SET name = $1,
                 email = $2,
                 role = COALESCE($3, role)
             WHERE id = $4
             RETURNING id, name, email, role, plan_id, active, created_at`,
            [name, email, role ?? null, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado."
            });
        }

        return res.json({
            success: true,
            message: "Usuário atualizado com sucesso!",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno ao atualizar usuário."
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

export async function updateUserPassword(req, res) {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: "Senha inválida." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
        await db.query(
            "UPDATE users SET password_hash = $1 WHERE id = $2",
            [passwordHash, id]
        );

        return res.json({ message: "Senha atualizada com sucesso!" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao atualizar senha." });
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


