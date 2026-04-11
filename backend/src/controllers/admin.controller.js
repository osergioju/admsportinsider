import db from "../config/db.js";
import XLSX from "xlsx";
import { reSendMail } from "../utils/mailer.js";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import allCountries from "world-countries";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const COLS_PER_ROW = 11;
const BATCH_SIZE = 500;

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
      SELECT id_country, name, flag_url FROM countries
      where active = true
      ORDER BY name ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countQuery = await db.query(`SELECT COUNT(*) FROM countries WHERE active = true`);

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
      l.format,
      l.structure_json,
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
  const { id_country, name, description, logo_url, format } = req.body;

  if (!id_country || !name) {
    return res.status(400).json({ message: "Campos obrigatórios faltando." });
  }

  try {
    await db.query(`
      INSERT INTO leagues (id_country, name, description, logo_url, format)
      VALUES ($1, $2, $3, $4, $5)
    `, [id_country, name, description, logo_url, format || null]);

    return res.status(201).json({ message: "Liga cadastrada com sucesso!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao cadastrar liga" });
  }
}

export async function updateLeague(req, res) {
  const { id } = req.params;
  const { id_country, name, description, logo_url, format } = req.body;

  try {
    await db.query(`
      UPDATE leagues
      SET
        id_country = $1,
        name = $2,
        description = $3,
        logo_url = $4,
        format = $5
      WHERE id_league = $6
    `, [id_country, name, description, logo_url, format || null, id]);

    return res.json({ message: "Liga atualizada com sucesso!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar liga" });
  }
}

export async function saveLeagueStructure(req, res) {
  const { id } = req.params;
  const { structure } = req.body;

  if (!structure || typeof structure !== "object") {
    return res.status(400).json({ message: "Estrutura inválida." });
  }

  try {
    const result = await db.query(
      `UPDATE leagues SET structure_json = $1 WHERE id_league = $2 RETURNING id_league`,
      [JSON.stringify(structure), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Liga não encontrada." });
    }

    return res.json({ message: "Estrutura salva com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao salvar estrutura da liga" });
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
      c.primary_color,
      c.secondary_color,
      c.active,
      c.created_at,
      c.location,
      co.id_country,
      co.name AS country_name,
      co.flag_url

    FROM clubs c
    JOIN countries co 
      ON co.id_country = c.id_country

    WHERE c.active = TRUE
    ORDER BY c.name ASC
    LIMIT $1 OFFSET $2;
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

export async function clubsSearch(req, res) {
  try {
    const { name, country } = req.body;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const values = [];
    let whereClause = `WHERE c.active = TRUE`;
    let idx = 1;

    if (name) {
      whereClause += ` AND unaccent(c.name) ILIKE unaccent($${idx})`;
      values.push(`%${name}%`);
      idx++;
    }

    if (country) {
      whereClause += ` AND c.id_country = $${idx}`;
      values.push(country);
      idx++;
    }

    // Query principal
    const clubsQuery = await db.query(
      `
      SELECT 
        c.id_club,
        c.name,
        c.description,
        c.crest_url,
        c.primary_color,
        c.secondary_color,
        c.active,
        c.created_at,
        c.location,
        co.id_country,
        co.name AS country_name,
        co.flag_url

      FROM clubs c
      JOIN countries co 
        ON co.id_country = c.id_country

      ${whereClause}
      ORDER BY c.name ASC
      LIMIT $${idx} OFFSET $${idx + 1};
      `,
      [...values, limit, offset]
    );

    // Contagem total (mesmos filtros)
    const countQuery = await db.query(
      `
      SELECT COUNT(*) 
      FROM clubs c
      ${whereClause};
      `,
      values
    );

    const total = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      clubs: clubsQuery.rows,
      pagination: { total, page, totalPages }
    });

  } catch (err) {
    console.error("Erro ao buscar clubes:", err);
    return res.status(500).json({ message: "Erro ao buscar clubes" });
  }
}

export async function clubsGroupedByCountry(req, res) {
  try {
    const result = await db.query(`
      SELECT 
        co.id_country,
        co.name AS country_name,
        co.flag_url,
        c.id_club,
        c.name,
        c.crest_url,
        c.primary_color,
        c.secondary_color
      FROM countries co
      JOIN clubs c 
        ON c.id_country = co.id_country
      WHERE c.active = TRUE
      ORDER BY co.name ASC, c.name ASC;
    `);

    const grouped = {};

    result.rows.forEach(row => {
      if (!grouped[row.id_country]) {
        grouped[row.id_country] = {
          id_country: row.id_country,
          country_name: row.country_name,
          flag_url: row.flag_url,
          clubs: []
        };
      }

      grouped[row.id_country].clubs.push({
        id_club: row.id_club,
        name: row.name,
        crest_url: row.crest_url,
        primary_color: row.primary_color,
        secondary_color: row.secondary_color
      });
    });

    return res.json(Object.values(grouped));

  } catch (err) {
    console.error("Erro ao buscar clubes agrupados:", err);
    return res.status(500).json({ message: "Erro ao buscar clubes" });
  }
}


export async function leaguesSearch(req, res) {
  try {
    const { name, country } = req.body;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const values = [];
    let whereClause = `WHERE l.active = TRUE`;
    let idx = 1;

    if (name) {
      whereClause += ` AND unaccent(l.name) ILIKE unaccent($${idx})`;
      values.push(`%${name}%`);
      idx++;
    }

    if (country) {
      whereClause += ` AND l.id_country = $${idx}`;
      values.push(country);
      idx++;
    }

    // Query principal
    const leaguesQuery = await db.query(
      `
      SELECT 
        l.id_league,
        l.name,
        l.description,
        l.logo_url,
        l.active,
        l.created_at,

        co.id_country,
        co.name AS country_name,
        co.flag_url

      FROM leagues l
      JOIN countries co 
        ON co.id_country = l.id_country

      ${whereClause}
      ORDER BY l.name ASC
      LIMIT $${idx} OFFSET $${idx + 1};
      `,
      [...values, limit, offset]
    );

    // Contagem total (mesmos filtros)
    const countQuery = await db.query(
      `
      SELECT COUNT(*) 
      FROM leagues l
      ${whereClause};
      `,
      values
    );

    const total = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      leagues: leaguesQuery.rows,
      pagination: { total, page, totalPages }
    });

  } catch (err) {
    console.error("Erro ao buscar ligas:", err);
    return res.status(500).json({ message: "Erro ao buscar ligas" });
  }
}


export async function getClubById(req, res) {
  const { id } = req.params;

  try {
    // Buscar o clube + país
    const clubResult = await db.query(`
      SELECT 
        c.*,
        co.id_country,
        co.name AS country_name,
        co.flag_url
      FROM clubs c
      JOIN countries co 
        ON co.id_country = c.id_country
      WHERE c.id_club = $1
    `, [id]);

    if (clubResult.rows.length === 0) {
      return res.status(404).json({ message: "Clube não encontrado" });
    }

    const club = clubResult.rows[0];

    // Buscar atributos dinâmicos
    const attrResult = await db.query(`
      SELECT 
        key,
        value,
        value_type
      FROM club_attributes
      WHERE id_club = $1
      ORDER BY key ASC
    `, [id]);

    return res.json({
      club,
      attributes: attrResult.rows
    });

  } catch (err) {
    console.error("Erro ao buscar clube:", err);
    return res.status(500).json({ message: "Erro ao buscar clube" });
  }
}


export async function getAttributeKeys(req, res) {
  try {
    const result = await db.query(`
            SELECT DISTINCT key
            FROM club_attributes
            ORDER BY key ASC
        `);

    return res.json({ keys: result.rows.map(r => r.key) });

  } catch (err) {
    console.error("Erro ao carregar chaves de atributos:", err);
    return res.status(500).json({ message: "Erro ao carregar chaves" });
  }
}


export async function createClub(req, res) {
  const {
    id_country,
    name,
    description,
    crest_url,
    founded_at,
    stadium_name,
    ownership_model,
    location,
    attributes = [] // array vindo do front
  } = req.body;

  if (!id_country || !name) {
    return res.status(400).json({ message: "Liga e nome são obrigatórios." });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ INSERT CLUB
    const insertClub = await client.query(
      `
      INSERT INTO clubs (
        id_country, name, description, crest_url,
        founded_at, stadium_name, ownership_model, location
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id_club
      `,
      [
        id_country,
        name,
        description,
        crest_url,
        founded_at || null,
        stadium_name || null,
        ownership_model || null,
        location || null
      ]
    );

    const id_club = insertClub.rows[0].id_club;

    // 2️⃣ INSERT ATRIBUTOS DINÂMICOS
    if (attributes.length > 0) {
      const insertAttrQuery = `
        INSERT INTO club_attributes (id_club, key, value, value_type)
        VALUES ($1, $2, $3, $4)
      `;

      for (const attr of attributes) {
        await client.query(insertAttrQuery, [
          id_club,
          attr.key,
          attr.value,
          attr.type || "string"
        ]);
      }
    }

    await client.query("COMMIT");
    return res.status(201).json({ message: "Clube cadastrado com sucesso!" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Erro ao cadastrar clube" });

  } finally {
    client.release();
  }
}


export async function updateClub(req, res) {
  const id = req.params.id;

  const {
    name,
    description,
    crest_url,
    founded_at,
    stadium_name,
    ownership_model,
    primary_color,
    secondary_color,
    tertiary_color,
    location,
    attributes = [] // array de atributos novos/atualizados
  } = req.body;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ UPDATE CLUB
    await client.query(
      `
      UPDATE clubs SET
        name = $1,
        description = $2,
        crest_url = $3,
        founded_at = $4,
        stadium_name = $5,
        ownership_model = $6,
        primary_color = $7,
        secondary_color = $8,
        tertiary_color = $9,
        location = $10
      WHERE id_club = $11
      `,
      [
        name,
        description,
        crest_url,
        founded_at || null,
        stadium_name || null,
        ownership_model || null,
        primary_color || null,
        secondary_color || null,
        tertiary_color || null,
        location || null,
        id
      ]
    );

    // 2️⃣ Limpa atributos antigos
    await client.query("DELETE FROM club_attributes WHERE id_club = $1", [id]);

    // 3️⃣ Insere novos atributos
    if (attributes.length > 0) {
      const insertAttrQuery = `
        INSERT INTO club_attributes (id_club, key, value, value_type)
        VALUES ($1, $2, $3, $4)
      `;

      for (const attr of attributes) {
        await client.query(insertAttrQuery, [
          id,
          attr.key,
          attr.value,
          attr.type || "string"
        ]);
      }
    }

    await client.query("COMMIT");
    return res.json({ message: "Clube atualizado com sucesso!" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Erro ao atualizar clube" });

  } finally {
    client.release();
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

// Editar país
export async function updateCountry(req, res) {
  const { id } = req.params;
  const { name, flag_url } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Nome é obrigatório." });
  }

  try {
    await db.query(
      "UPDATE countries SET name = $1, flag_url = $2 WHERE id_country = $3",
      [name, flag_url, id]
    );
    return res.json({ success: true, message: "País atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar país:", error);
    return res.status(500).json({ error: "Erro ao atualizar país" });
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

  const PRICE_IDS = {
    2: "price_1ScyEsGpvzwsEpHhVnmLViFU", // Premium
    3: "price_1ScyFiGpvzwsEpHh70blpgpx", // Business
  };

  try {
    // verifica plano
    const check = await db.query("SELECT id FROM plans WHERE id = $1", [plan_id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Plano não encontrado" });
    }

    // pega usuário
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (!user.stripe_subscription_id) {
      return res.status(400).json({
        error: "Usuário não possui assinatura Stripe para atualizar"
      });
    }

    // PEGA O ITEM DA ASSINATURA
    const subscription = await stripe.subscriptions.retrieve(
      user.stripe_subscription_id
    );

    const subscriptionItemId = subscription.items.data[0].id;

    // ALTERA O PLANO NO STRIPE
    await stripe.subscriptionItems.update(subscriptionItemId, {
      price: PRICE_IDS[plan_id],
      proration_behavior: "always_invoice" // ou "none"
    });

    // **NÃO** precisa atualizar seu banco aqui!
    // O webhook customer.subscription.updated fará isso automático
    // Atualiza o plano do usuário
    await db.query(
      "UPDATE users SET plan_id = $1 WHERE id = $2",
      [plan_id, id]
    );

    return res.json({
      success: true,
      message: "Plano atualizado no Stripe com sucesso!"
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


export async function createUser(req, res) {
  const { name, email, password, role, plan_id } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Nome, email e senha são obrigatórios."
    });
  }

  try {
    // Verifica se e-mail já existe
    const exists = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Email já cadastrado." });
    }

    // Criptografa senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criação
    await db.query(
      `INSERT INTO users (name, email, password_hash, role, plan_id, email_verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [name, email, hashedPassword, role, plan_id || null, true]
    );

    return res.status(201).json({
      message: "Usuário criado com sucesso!"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao criar usuário."
    });
  }
}

/*
export async function uploadClubXlsx(req, res) {
  const { id_country } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "Arquivo XLSX não enviado" });
  }

  if (!id_country) {
    return res.status(400).json({ error: "País não informado" });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      return res.status(400).json({ error: "Arquivo vazio" });
    }

    // 🔍 Validação mínima
    const requiredColumns = ["name", "primary_color"];
    const missingColumns = requiredColumns.filter(
      (col) => !(col in rows[0])
    );

    if (missingColumns.length) {
      return res.status(400).json({
        error: "Colunas obrigatórias ausentes",
        missingColumns
      });
    }

    let inserted = 0;
    let skipped = 0;

    await db.query("BEGIN");

    for (const row of rows) {
      if (!row.name) {
        skipped++;
        continue;
      }

      // evita duplicidade
      const exists = await db.query(
        `
        SELECT 1
        FROM clubs
        WHERE name ILIKE $1
          AND id_country = $2
        `,
        [row.name, id_country]
      );

      if (exists.rows.length) {
        skipped++;
        continue;
      }

      await db.query(
        `
        INSERT INTO clubs (
          id_country,
          name,
          description,
          crest_url,
          primary_color,
          secondary_color,
          active,
          founded_at,
          stadium_name,
          ownership_model, 
          location
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `,
        [
          id_country,
          row.name,
          row.description || null,
          row.crest_url || null,
          row.primary_color || null,
          row.secondary_color || null,
          row.active !== "" ? row.active : true,
          row.founded_at || null,
          row.stadium_name || null,
          row.ownership_model || null,
          row.location || null
        ]
      );

      inserted++;
    }

    await db.query("COMMIT");

    return res.json({
      message: "Importação concluída",
      inserted,
      skipped
    });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Erro ao importar XLSX:", err);

    return res.status(500).json({
      error: "Erro ao importar clubes"
    });
  }
}
*/

// FAQ 
/**
 * LISTAR (admin vê tudo)
 */
export async function getAllFaqs(req, res) {
  try {
    const result = await db.query(`
      SELECT id, question, answer, is_active, sort_order
      FROM faqs
      ORDER BY sort_order ASC, id ASC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar FAQs:", error);
    return res.status(500).json({ message: "Erro ao listar FAQs" });
  }
}

/**
 * CRIAR
 */
export async function createFaq(req, res) {
  const { question, answer, sort_order = 0, is_active = true } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ message: "Pergunta e resposta são obrigatórias" });
  }

  try {
    const result = await db.query(
      `
      INSERT INTO faqs (question, answer, sort_order, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [question, answer, sort_order, is_active]
    );

    return res.status(201).json({
      message: "FAQ criado com sucesso",
      id: result.rows[0].id
    });
  } catch (error) {
    console.error("Erro ao criar FAQ:", error);
    return res.status(500).json({ message: "Erro ao criar FAQ" });
  }
}

/**
 * ATUALIZAR
 */
export async function updateFaq(req, res) {
  const { id } = req.params;
  const { question, answer, sort_order, is_active } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ message: "Pergunta e resposta são obrigatórias" });
  }

  try {
    await db.query(
      `
      UPDATE faqs
      SET question = $1,
          answer = $2,
          sort_order = $3,
          is_active = $4,
          updated_at = NOW()
      WHERE id = $5
      `,
      [question, answer, sort_order, is_active, id]
    );

    return res.json({ message: "FAQ atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar FAQ:", error);
    return res.status(500).json({ message: "Erro ao atualizar FAQ" });
  }
}

/**
 * DELETAR (soft delete)
 */
export async function deleteFaq(req, res) {
  const { id } = req.params;

  try {
    await db.query(
      `
      UPDATE faqs
      SET is_active = false,
          updated_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    return res.json({ message: "FAQ desativado com sucesso" });
  } catch (error) {
    console.error("Erro ao remover FAQ:", error);
    return res.status(500).json({ message: "Erro ao remover FAQ" });
  }
}

/**
 * ATUALIZAR ORDEM (para drag & drop)
 * Espera:
 * [
 *   { id: 3, sort_order: 1 },
 *   { id: 5, sort_order: 2 }
 * ]
 */
export async function updateFaqOrder(req, res) {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ message: "Formato inválido" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    for (const item of items) {
      await client.query(
        `
        UPDATE faqs
        SET sort_order = $1,
            updated_at = NOW()
        WHERE id = $2
        `,
        [item.sort_order, item.id]
      );
    }

    await client.query("COMMIT");

    return res.json({ message: "Ordem atualizada com sucesso" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao reordenar FAQ:", error);
    return res.status(500).json({ message: "Erro ao atualizar ordem" });
  } finally {
    client.release();
  }
}


// ---------------------------------------------------------------------------
// Helper: dado um nome em pt-BR vindo do Excel, tenta achar o país no banco.
// Estratégia em camadas:
//   1. Match direto pelo nome do banco (case-insensitive)
//   2. Match pelo nome pt-BR do world-countries → pega o cca2 → busca no banco
//      pelo nome em inglês (name.common) do mesmo pacote
// ---------------------------------------------------------------------------
function resolveCountry(fileNamePtBr, dbCountries) {
  const normalized = fileNamePtBr.toLowerCase().trim();

  // 1. Match direto (funciona se o banco já tiver o nome em pt-BR)
  const direct = dbCountries.find((c) => c.name.toLowerCase() === normalized);
  if (direct) return { id_country: direct.id_country, name: direct.name };

  // 2. Procura no world-countries pelo nome pt-BR
  const wcEntry = allCountries.find((wc) => {
    const ptbr = wc.translations?.por?.common?.toLowerCase() ?? "";
    const ptbrOfficial = wc.translations?.por?.official?.toLowerCase() ?? "";
    return ptbr === normalized || ptbrOfficial === normalized;
  });

  if (!wcEntry) return null;

  // Tenta achar no banco pelo nome em inglês (common ou official)
  const engNames = [
    wcEntry.name.common.toLowerCase(),
    wcEntry.name.official.toLowerCase(),
  ];

  const byEng = dbCountries.find((c) =>
    engNames.includes(c.name.toLowerCase())
  );

  if (byEng) return { id_country: byEng.id_country, name: byEng.name };

  // Não está no banco — devolve os dados do world-countries para o
  // frontend poder cadastrar o país inline
  return null;
}

// ---------------------------------------------------------------------------
// Helper: monta o payload de sugestão de cadastro para países não encontrados
// (usado pelo frontend para pré-preencher o mini-modal de criação)
// ---------------------------------------------------------------------------
function buildSuggestionPayload(fileNamePtBr) {
  const normalized = fileNamePtBr.toLowerCase().trim();

  const wcEntry = allCountries.find((wc) => {
    const ptbr = wc.translations?.por?.common?.toLowerCase() ?? "";
    const ptbrOfficial = wc.translations?.por?.official?.toLowerCase() ?? "";
    const common = wc.name.common?.toLowerCase() ?? "";

    return (
      ptbr === normalized ||
      ptbrOfficial === normalized ||
      common === normalized // 👈 ESSA LINHA SALVA O PERU
    );
  });

  if (!wcEntry) return null;

  const flag = `https://flagcdn.com/${wcEntry.cca2.toLowerCase()}.svg`;

  return {
    namePtBr: wcEntry.translations?.por?.common ?? wcEntry.name.common,
    nameEn: wcEntry.name.common,
    cca2: wcEntry.cca2,
    flag,
  };
}

// ---------------------------------------------------------------------------
// POST /admin/preview-import
// Body (multipart): file, sheetName? (opcional — sem ela, só lista as abas)
// ---------------------------------------------------------------------------
export async function previewClubImport(req, res) {
  try {
    const { sheetName } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    // STEP 1 — listar abas
    if (!sheetName) {
      return res.json({ sheets: workbook.SheetNames });
    }

    // STEP 2 — ler aba escolhida
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return res.status(400).json({ error: "Aba inválida" });
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!rows.length) {
      return res.status(400).json({ error: "Aba vazia" });
    }

    // Remove header se a segunda coluna contiver "nome"
    if (
      rows[0][1] &&
      typeof rows[0][1] === "string" &&
      rows[0][1].toLowerCase().includes("nome")
    ) {
      rows.shift();
    }

    const countriesInFile = [
      ...new Set(rows.map((r) => r[0]).filter(Boolean)),
    ];

    const { rows: dbRows } = await db.query(
      `SELECT id_country, name, flag_url FROM countries ORDER BY name ASC`
    );

    const result = countriesInFile.map((fileCountry) => {
      const resolved = resolveCountry(fileCountry, dbRows);

      if (resolved) {
        return {
          file: fileCountry,
          resolved,
          status: "ok",
          registerSuggestion: null,
        };
      }

      // Não está no banco — tenta montar sugestão de cadastro
      const registerSuggestion = buildSuggestionPayload(fileCountry);

      return {
        file: fileCountry,
        resolved: null,
        // "unknown" = nem no banco nem no world-countries
        // "unregistered" = achou no world-countries mas não no banco
        status: registerSuggestion ? "unregistered" : "unknown",
        registerSuggestion,
      };
    });

    return res.json({ countries: result, dbCountries: dbRows });
  } catch (err) {
    console.error("Erro preview:", err);
    return res.status(500).json({ error: "Erro ao processar preview" });
  }
}

// ---------------------------------------------------------------------------
// uploadClubXlsx — sem alterações (contrato de country_map não mudou)
// ---------------------------------------------------------------------------
const toSlug = (str) => {
  if (!str) return null;
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
};

const parseDate = (raw) => {
  if (raw == null || raw === "") return null;

  // Excel serial number
  if (typeof raw === "number" && raw > 0 && raw < 3_000_000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + raw * 86_400_000);
  }

  const str = String(raw).trim();

  // Ano puro: "1902" → 1902-01-01
  if (/^\d{4}$/.test(str)) {
    const year = parseInt(str, 10);
    return year >= 1800 && year <= 2100 ? new Date(Date.UTC(year, 0, 1)) : null;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/** Normaliza hex expandindo shorthand #ABC → #AABBCC */
const normalizeHex = (value) => {
  const v = (value == null ? "" : String(value).trim()).toUpperCase();
  const m3 = v.match(/^#([0-9A-F])([0-9A-F])([0-9A-F])$/);
  if (m3) return `#${m3[1]}${m3[1]}${m3[2]}${m3[2]}${m3[3]}${m3[3]}`;
  return /^#[0-9A-F]{6}$/.test(v) ? v : null;
};

/** Insere um batch de tuples. Retorna rowCount real (pós ON CONFLICT). */
const insertClubBatch = async (client, batchTuples) => {
  if (!batchTuples.length) return 0;

  const flat = [];
  const phs = [];
  let idx = 1;

  for (const tuple of batchTuples) {
    const ph = tuple.map(() => `$${idx++}`);
    phs.push(`(${ph.join(",")})`);
    flat.push(...tuple);
  }

  const { rowCount } = await client.query(
    `INSERT INTO clubs (
       id_country, name, description, crest_url, location,
       founded_at, stadium_name, ownership_model,
       primary_color, secondary_color, tertiary_color
     )
     VALUES ${phs.join(",")}
     ON CONFLICT (LOWER(name), id_country) DO NOTHING`,
    flat
  );

  return rowCount;
};

// ── Função principal ────────────────────────────────────────────────────────
export async function uploadClubXlsx(req, res) {
  // ── Validação de input ────────────────────────────────────────────────
  if (!req.file) {
    return res.status(400).json({ error: "Arquivo XLSX não enviado" });
  }

  const { sheetName } = req.body;
  if (!sheetName) {
    return res.status(400).json({ error: "Aba não informada" });
  }

  let country_map;
  try {
    country_map = JSON.parse(req.body.country_map || "{}");
  } catch {
    return res.status(400).json({ error: "country_map não é JSON válido" });
  }

  // ── Leitura XLSX ──────────────────────────────────────────────────────
  let rows;
  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return res.status(400).json({
        error: `Aba "${sheetName}" não encontrada. Disponíveis: ${workbook.SheetNames.join(", ")}`,
      });
    }

    rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  } catch {
    return res.status(400).json({ error: "Falha ao ler arquivo XLSX" });
  }

  if (!rows.length) {
    return res.status(400).json({ error: "Aba vazia" });
  }

  // Remove header
  if (
    rows[0][1] &&
    typeof rows[0][1] === "string" &&
    rows[0][1].toLowerCase().includes("nome")
  ) {
    rows.shift();
  }

  // ── Country lookup pré-computado (O(1) por row) ──────────────────────
  const countryLookup = new Map();
  for (const [key, value] of Object.entries(country_map)) {
    if (key && value) countryLookup.set(key.toLowerCase().trim(), value);
  }

  // ── Parse de todas as rows ────────────────────────────────────────────
  const toStr = (val) => (val == null ? "" : String(val).trim());

  const validTuples = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const countryName = toStr(row[0]);
    const name = toStr(row[1]);

    if (!name) {
      errors.push({ row: i + 1, reason: "nome_vazio" });
      continue;
    }

    const countryId = countryLookup.get(countryName.toLowerCase());
    if (!countryId) {
      errors.push({ row: i + 1, reason: "pais_nao_encontrado", detail: countryName || "(vazio)" });
      continue;
    }

    validTuples.push([
      countryId,
      name,
      toStr(row[3]) || null,   // description
      toStr(row[2]) || null,   // crest_url
      toStr(row[4]) || null,   // location
      parseDate(row[5]),       // founded_at
      toStr(row[6]) || null,   // stadium_name
      toStr(row[14]) || null,  // ownership_model
      normalizeHex(row[9]),    // primary_color
      normalizeHex(row[11]),   // secondary_color
      normalizeHex(row[13]),   // tertiary_color
    ]);
  }

  if (!validTuples.length) {
    return res.json({
      message: "Nenhuma linha válida para importar.",
      inserted: 0,
      skipped: errors.length,
      sample_errors: errors.slice(0, 50),
    });
  }

  // ── Insert em batches (evita estourar 65535 params do PG) ─────────────
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    let totalInserted = 0;
    for (let off = 0; off < validTuples.length; off += BATCH_SIZE) {
      totalInserted += await insertClubBatch(
        client,
        validTuples.slice(off, off + BATCH_SIZE)
      );
    }

    await client.query("COMMIT");

    // ── Log dos ignorados no console ────────────────────────────────
    if (errors.length > 0) {
      console.log(`\n⚠️  ${errors.length} linha(s) ignorada(s) na importação:`);
      console.table(errors);
    }

    if (totalInserted < validTuples.length) {
      const dupes = validTuples.length - totalInserted;
      console.log(`\n🔁 ${dupes} linha(s) ignorada(s) por duplicata (ON CONFLICT).`);
    }

    return res.json({
      message: "Importação em massa concluída 🚀",
      total_processadas: rows.length,
      inserted: totalInserted,
      duplicatas_ignoradas: validTuples.length - totalInserted,
      skipped: errors.length,
      ...(errors.length > 0 && {
        sample_errors: errors.slice(0, 50),
        total_errors: errors.length,
      }),
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => { });
    console.error("[uploadClubXlsx] Erro na transação:", err);
    return res.status(500).json({
      error: "Erro ao importar clubes",
      ...(process.env.NODE_ENV !== "production" && { detail: err.message }),
    });
  } finally {
    client.release(); // ← SEMPRE devolve ao pool
  }
}
