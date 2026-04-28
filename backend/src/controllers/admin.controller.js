import db from "../config/db.js";
import XLSX from "xlsx";
import { reSendMail } from "../utils/mailer.js";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import allCountries from "world-countries";
import slugify from "slugify";

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
      l.slug,
      l.description,
      l.logo_url,
      l.format,
      l.structure_json,
      l.primary_color,
      l.created_at,
      l.id_country,
      l.id_continent,
      c.name AS country_name,
      c.flag_url,
      ct.name AS continent_name,
      ct.logo_url AS continent_logo_url
    FROM leagues l
    LEFT JOIN countries c ON c.id_country = l.id_country
    LEFT JOIN continents ct ON ct.id_continent = l.id_continent
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
      c.flag_url,
      ct.name AS continent_name,
      ct.logo_url AS continent_logo_url
    FROM leagues l
    LEFT JOIN countries c ON c.id_country = l.id_country
    LEFT JOIN continents ct ON ct.id_continent = l.id_continent
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
  const { id_country, id_continent, name, description, logo_url, format, primary_color, secondary_color } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Nome é obrigatório." });
  }
  if (!id_country && !id_continent) {
    return res.status(400).json({ message: "Selecione um país ou continente." });
  }

  try {
    await db.query(`
      INSERT INTO leagues (id_country, id_continent, name, description, logo_url, format, primary_color, secondary_color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id_country || null, id_continent || null, name, description, logo_url, format || null, primary_color || null, secondary_color || null]);

    return res.status(201).json({ message: "Liga cadastrada com sucesso!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao cadastrar liga" });
  }
}

export async function updateLeague(req, res) {
  const { id } = req.params;
  const { id_country, id_continent, name, description, logo_url, format, primary_color, secondary_color } = req.body;

  try {
    await db.query(`
      UPDATE leagues
      SET
        id_country = $1,
        id_continent = $2,
        name = $3,
        description = $4,
        logo_url = $5,
        format = $6,
        primary_color = $7,
        secondary_color = $8
      WHERE id_league = $9
    `, [id_country || null, id_continent || null, name, description, logo_url, format || null, primary_color || null, secondary_color || null, id]);

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
        c.slug,
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
      LEFT JOIN countries co
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
      LEFT JOIN countries co ON co.id_country = l.id_country
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


export async function getContinentalLeagues(req, res) {
  try {
    const result = await db.query(`
      SELECT id_league, name, logo_url, slug, active, structure_json
      FROM leagues
      WHERE active = TRUE AND id_country IS NULL
      ORDER BY name ASC
    `);
    return res.json({ leagues: result.rows });
  } catch (err) {
    console.error("Erro ao buscar ligas continentais:", err);
    return res.status(500).json({ message: "Erro ao buscar ligas continentais" });
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
      SELECT key, value, value_type
      FROM club_attributes
      WHERE id_club = $1
      ORDER BY key ASC
    `, [id]);

    // Buscar proprietários
    const ownersResult = await db.query(`
      SELECT id, name, ownership_pct
      FROM club_owners
      WHERE id_club = $1
      ORDER BY ownership_pct DESC NULLS LAST, name ASC
    `, [id]);

    // Buscar hospitalidade do estádio (se o clube tiver estádio cadastrado)
    let hospitality = null;
    if (club.stadium_name) {
      const hospResult = await db.query(`
        SELECT id, hospitality_url, description
        FROM stadium_hospitality
        WHERE LOWER(stadium_name) = LOWER($1)
        LIMIT 1
      `, [club.stadium_name]);
      if (hospResult.rows.length > 0) hospitality = hospResult.rows[0];
    }

    return res.json({
      club,
      attributes: attrResult.rows,
      owners: ownersResult.rows,
      hospitality,
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
    short_name,
    description,
    crest_url,
    founded_at,
    stadium_name,
    stadium_capacity,
    stadium_ownership,
    ownership_model,
    location,
    attributes = [],
    owners = [],
  } = req.body;

  if (!id_country || !name) {
    return res.status(400).json({ message: "Liga e nome são obrigatórios." });
  }

  const slug = slugify(name, { lower: true, strict: true });
  const finalCrestUrl = slug; // só o slug, URL construída no frontend

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ INSERT CLUB
    const insertClub = await client.query(
      `
      INSERT INTO clubs (
        id_country, name, short_name, description, crest_url,
        founded_at, stadium_name, stadium_capacity, stadium_ownership,
        ownership_model, location, slug
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id_club
      `,
      [
        id_country,
        name,
        short_name || null,
        description,
        finalCrestUrl,
        founded_at || null,
        stadium_name || null,
        stadium_capacity ? Number(stadium_capacity) : null,
        stadium_ownership || null,
        ownership_model || null,
        location || null,
        slug,
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

    // 3️⃣ INSERT OWNERS
    if (owners.length > 0) {
      for (const owner of owners) {
        if (!owner.name) continue;
        await client.query(
          `INSERT INTO club_owners (id_club, name, ownership_pct) VALUES ($1,$2,$3)`,
          [id_club, owner.name, owner.pct ? Number(owner.pct) : null]
        );
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
    short_name,
    description,
    crest_url,
    founded_at,
    stadium_name,
    stadium_capacity,
    stadium_ownership,
    ownership_model,
    primary_color,
    secondary_color,
    tertiary_color,
    location,
    attributes = [],
    owners = [],
  } = req.body;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ UPDATE CLUB
    await client.query(
      `
      UPDATE clubs SET
        name = $1,
        short_name = $2,
        description = $3,
        crest_url = $4,
        founded_at = $5,
        stadium_name = $6,
        stadium_capacity = $7,
        stadium_ownership = $8,
        ownership_model = $9,
        primary_color = $10,
        secondary_color = $11,
        tertiary_color = $12,
        location = $13
      WHERE id_club = $14
      `,
      [
        name,
        short_name || null,
        description,
        crest_url,
        founded_at || null,
        stadium_name || null,
        stadium_capacity ? Number(stadium_capacity) : null,
        stadium_ownership || null,
        ownership_model || null,
        primary_color || null,
        secondary_color || null,
        tertiary_color || null,
        location || null,
        id,
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

    // 4️⃣ Substitui owners
    await client.query("DELETE FROM club_owners WHERE id_club = $1", [id]);
    if (owners.length > 0) {
      for (const owner of owners) {
        if (!owner.name) continue;
        await client.query(
          `INSERT INTO club_owners (id_club, name, ownership_pct) VALUES ($1,$2,$3)`,
          [id, owner.name, owner.pct ? Number(owner.pct) : null]
        );
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



// ─── CONTINENTES ─────────────────────────────────────────────────────────────

export async function getAllContinents(req, res) {
  try {
    const result = await db.query(
      "SELECT id_continent, name, logo_url FROM continents WHERE active = true ORDER BY name ASC"
    );
    return res.json({ continents: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar continentes" });
  }
}

export async function createContinent(req, res) {
  const { name, logo_url } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Nome é obrigatório." });
  try {
    await db.query(
      "INSERT INTO continents (name, logo_url) VALUES ($1, $2)",
      [name.trim(), logo_url || null]
    );
    return res.status(201).json({ message: "Continente criado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar continente" });
  }
}

export async function updateContinent(req, res) {
  const { id } = req.params;
  const { name, logo_url } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Nome é obrigatório." });
  try {
    await db.query(
      "UPDATE continents SET name = $1, logo_url = $2 WHERE id_continent = $3",
      [name.trim(), logo_url || null, id]
    );
    return res.json({ message: "Continente atualizado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar continente" });
  }
}

export async function disableContinent(req, res) {
  const { id } = req.params;
  try {
    await db.query("UPDATE continents SET active = false WHERE id_continent = $1", [id]);
    return res.json({ message: "Continente desativado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao desativar continente" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

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
            u.admin_permissions,
            p.name AS plan_name
          FROM users u
          LEFT JOIN plans p ON p.id = u.plan_id
          WHERE u.id = $1
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
  console.log(req);
  const { id } = req.params;             // ID do usuário sendo atualizado
  const editorId = req.user.id;          // ID do usuário logado (vem do JWT)
  const editorRole = req.user.role;      // role do usuário logado

  const { name, email, role, admin_permissions } = req.body;

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

    // 🔒 2. Apenas admin_master pode alterar role e permissões de outros
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

    // Permissões só se admin_master estiver salvando um admin
    const permissions = editorRole === "admin_master" && role === "admin" && Array.isArray(admin_permissions)
      ? admin_permissions
      : null; // null = manter valor atual via COALESCE

    // 🔧 4. Atualiza
    const result = await db.query(
      `UPDATE users
             SET name = $1,
                 email = $2,
                 role = COALESCE($3, role),
                 admin_permissions = COALESCE($5, admin_permissions)
             WHERE id = $4
             RETURNING id, name, email, role, plan_id, active, admin_permissions, created_at`,
      [name, email, role ?? null, id, permissions]
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
  const { name, email, password, role, plan_id, admin_permissions } = req.body;

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

    // Permissões só fazem sentido para role 'admin'
    const permissions = role === "admin" && Array.isArray(admin_permissions)
      ? admin_permissions
      : [];

    // Criação
    await db.query(
      `INSERT INTO users (name, email, password_hash, role, plan_id, email_verified, admin_permissions, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [name, email, hashedPassword, role, plan_id || null, true, permissions]
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

  // 1. Match direto no banco (qualquer idioma, case-insensitive)
  const direct = dbCountries.find((c) => c.name.toLowerCase() === normalized);
  if (direct) return { id_country: direct.id_country, name: direct.name };

  // 2. Procura no world-countries (PT-BR, inglês ou oficial)
  const wcEntry = allCountries.find((wc) => {
    const ptbr    = wc.translations?.por?.common?.toLowerCase()     ?? "";
    const ptbrOff = wc.translations?.por?.official?.toLowerCase()   ?? "";
    const common  = wc.name.common?.toLowerCase()                   ?? "";
    const official= wc.name.official?.toLowerCase()                 ?? "";
    return ptbr === normalized || ptbrOff === normalized
        || common === normalized || official === normalized;
  });

  if (!wcEntry) return null;

  // Tenta achar no banco por qualquer variante de nome do país
  const candidates = [
    wcEntry.name.common?.toLowerCase(),
    wcEntry.name.official?.toLowerCase(),
    wcEntry.translations?.por?.common?.toLowerCase(),
    wcEntry.translations?.por?.official?.toLowerCase(),
  ].filter(Boolean);

  const byAny = dbCountries.find((c) => candidates.includes(c.name.toLowerCase()));
  if (byAny) return { id_country: byAny.id_country, name: byAny.name };

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

    // Remove header (coluna 0 = "Slug" ou coluna 1 = string com "nome")
    if (
      rows[0] &&
      (String(rows[0][0] || "").toLowerCase() === "slug" ||
        (typeof rows[0][1] === "string" && rows[0][1].toLowerCase().includes("nome")))
    ) {
      rows.shift();
    }

    // Lê país da coluna 2 (formato planilha: Slug | Escudo | País | Nome ...)
    // Fallback: extrai prefixo do slug na coluna 0 (formato legado)
    const countriesInFile = [
      ...new Set(rows.map((r) => {
        const col2 = String(r[2] || "").trim();
        if (col2 && col2.toLowerCase() !== "país") return col2;
        const val = String(r[0] || "").trim();
        const idx = val.indexOf("_");
        return idx > 0 ? val.slice(0, idx) : val;
      }).filter(Boolean)),
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
       id_country, name, slug, crest_url,
       description, location, founded_at,
       stadium_name, stadium_capacity, stadium_ownership, ownership_model,
       primary_color, secondary_color, tertiary_color
     )
     VALUES ${phs.join(",")}
     ON CONFLICT DO NOTHING`,
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

  // Remove header (coluna 0 = "Slug" ou coluna 1 string com "nome")
  if (
    rows[0] &&
    (String(rows[0][0] || "").toLowerCase() === "slug" ||
      (typeof rows[0][1] === "string" && rows[0][1].toLowerCase().includes("nome")))
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

    // Formato planilha: col0=Slug | col1=Escudo | col2=País | col3=Nome | col4=Status
    //   col5=Nome completo | col6=Cidade | col7=Fundação | col10=Estádio | col11=Capacidade
    //   col13=Hex primário | col15=Hex secundário | col17=Hex terciário
    //   col18=Estrutura empresarial | col19=Propriedade do estádio
    const fullSlug   = toStr(row[0]); // ex: "argentina_boca-juniors"
    const countryRaw = toStr(row[2]); // "Argentina"
    const name       = toStr(row[3]); // "Boca Juniors"

    if (!name) {
      errors.push({ row: i + 1, reason: "nome_vazio" });
      continue;
    }

    // Resolve país: tenta coluna 2 primeiro, fallback ao prefixo do slug
    let countryKey = countryRaw.toLowerCase();
    if (!countryLookup.has(countryKey)) {
      const idx = fullSlug.indexOf("_");
      if (idx > 0) countryKey = fullSlug.slice(0, idx).toLowerCase();
    }

    const countryId = countryLookup.get(countryKey);
    if (!countryId) {
      errors.push({ row: i + 1, reason: "pais_nao_encontrado", detail: countryRaw || fullSlug });
      continue;
    }

    const clubSlug = fullSlug; // usa o slug completo da planilha (ex: "uruguay_liverpool") — único por design
    const crestUrl = fullSlug;

    validTuples.push([
      countryId,
      name,
      clubSlug,                           // slug (só nome, sem país)
      crestUrl,                           // crest_url (usa slug completo com país)
      toStr(row[5]) || null,              // description (nome completo)
      toStr(row[6]) || null,              // location (cidade)
      parseDate(row[7]),                  // founded_at
      toStr(row[10]) || null,             // stadium_name
      row[11] ? (parseInt(String(row[11]).replace(/[.,\s]/g, ""), 10) || null) : null, // stadium_capacity
      toStr(row[19]) || null,             // stadium_ownership
      toStr(row[18]) || null,             // ownership_model
      normalizeHex(row[13]),              // primary_color
      normalizeHex(row[15]),              // secondary_color
      normalizeHex(row[17]),              // tertiary_color
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/thesportsdb/team?name=Palmeiras
// Proxy para TheSportsDB — retorna dados de escudo, cores e estádio
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchTeamFromSportsDB(req, res) {
  const name = req.query.name?.trim();
  if (!name) return res.status(400).json({ error: "Parâmetro name obrigatório" });

  try {
    const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: "Erro ao consultar TheSportsDB" });

    const json = await response.json();
    const team = json?.teams?.[0] ?? null;
    if (!team) return res.json({ found: false });

    res.json({
      found:             true,
      crest_url:         team.strBadge   || null,
      logo_url:          team.strLogo    || null,
      primary_color:     team.strColour1 || null,
      secondary_color:   team.strColour2 || null,
      stadium_name:      team.strStadium || null,
      stadium_capacity:  team.intStadiumCapacity ? Number(team.intStadiumCapacity) : null,
      short_name:        team.strTeamShort || null,
      country:           team.strCountry  || null,
      founded:           team.intFormedYear || null,
    });
  } catch (err) {
    console.error("[fetchTeamFromSportsDB]", err);
    res.status(500).json({ error: "Erro interno ao buscar escudo" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/thesportsdb/player?name=Neymar
// Proxy para TheSportsDB — retorna foto, posição, nacionalidade e data de nascimento
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchPlayerFromSportsDB(req, res) {
  const name = req.query.name?.trim();
  if (!name) return res.status(400).json({ error: "Parâmetro name obrigatório" });

  try {
    const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: "Erro ao consultar TheSportsDB" });

    const json = await response.json();
    const player = json?.player?.[0] ?? null;
    if (!player) return res.json({ found: false });

    res.json({
      found:       true,
      photo_url:   player.strThumb  || player.strCutout || null,
      cutout_url:  player.strCutout || null,
      nationality: player.strNationality || null,
      position:    player.strPosition   || null,
      born:        player.dateBorn      || null,
      team:        player.strTeam       || null,
      name:        player.strPlayer     || null,
    });
  } catch (err) {
    console.error("[fetchPlayerFromSportsDB]", err);
    res.status(500).json({ error: "Erro interno ao buscar jogador" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET  /admin/players?search=&page=
// Lista paginada de jogadores para o painel admin
// ─────────────────────────────────────────────────────────────────────────────
export async function adminGetPlayers(req, res) {
  const search = (req.query.search || "").trim();
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const limit  = 30;
  const offset = (page - 1) * limit;

  try {
    const [dataRes, countRes] = await Promise.all([
      db.query(
        `SELECT p.id_player, p.full_name, p.photo_url, p.position, p.birthday,
                co.name AS nationality, co.flag_url
         FROM players p
         LEFT JOIN countries co ON co.id_country = p.nationality
         WHERE ($1 = '' OR p.full_name ILIKE '%' || $1 || '%')
         ORDER BY p.full_name ASC
         LIMIT $2 OFFSET $3`,
        [search, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*) FROM players p
         WHERE ($1 = '' OR p.full_name ILIKE '%' || $1 || '%')`,
        [search]
      ),
    ]);

    res.json({
      players:    dataRes.rows,
      total:      parseInt(countRes.rows[0].count),
      page,
      totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
    });
  } catch (err) {
    console.error("[adminGetPlayers]", err);
    res.status(500).json({ error: "Erro ao listar jogadores" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /admin/players/:id/photo
// Atualiza somente a foto de um jogador
// ─────────────────────────────────────────────────────────────────────────────
export async function updatePlayerPhoto(req, res) {
  const { id } = req.params;
  const { photo_url } = req.body;
  if (!photo_url) return res.status(400).json({ error: "photo_url obrigatório" });

  try {
    await db.query(
      `UPDATE players SET photo_url = $1 WHERE id_player = $2`,
      [photo_url, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[updatePlayerPhoto]", err);
    res.status(500).json({ error: "Erro ao atualizar foto" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM LEAGUE EDITOR — grupos e partidas manuais
// ─────────────────────────────────────────────────────────────────────────────

// Resolve id_season a partir do ano (cria se não existir)
async function ensureSeason(client, year) {
  const r = await client.query(
    `INSERT INTO seasons (year) VALUES ($1)
     ON CONFLICT (year) DO UPDATE SET year = EXCLUDED.year
     RETURNING id_season`,
    [Number(year)]
  );
  return r.rows[0].id_season;
}

// POST /admin/leagues/:id/seasons/:year/clubs
// Adiciona um clube à temporada (cria club_league_seasons + club_seasons)
export async function addClubToSeason(req, res) {
  const { id, year } = req.params;
  const idLeague = Number(id);
  const idClub   = Number(req.body.id_club);
  if (!idClub) return res.status(400).json({ error: "id_club obrigatório" });

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const idSeason = await ensureSeason(client, year);

    await client.query(`
      INSERT INTO competition_seasons (id_league, id_season)
      VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [idLeague, idSeason]);

    await client.query(`
      INSERT INTO club_seasons (id_club, id_league, year, division)
      VALUES ($1, $2, $3, '1') ON CONFLICT (id_club, id_league, year) DO NOTHING
    `, [idClub, idLeague, Number(year)]);

    await client.query(`
      INSERT INTO club_league_seasons (id_club, id_league, id_season)
      VALUES ($1, $2, $3) ON CONFLICT DO NOTHING
    `, [idClub, idLeague, idSeason]);

    await client.query("COMMIT");

    const clubRes = await db.query(`
      SELECT c.id_club, c.name, c.crest_url, co.name AS country_name
      FROM clubs c
      LEFT JOIN countries co ON co.id_country = c.id_country
      WHERE c.id_club = $1
    `, [idClub]);

    res.status(201).json({ club: clubRes.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[addClubToSeason]", err);
    res.status(500).json({ error: "Erro ao adicionar clube" });
  } finally {
    client.release();
  }
}

// DELETE /admin/leagues/:id/seasons/:year/clubs/:clubId
// Remove um clube da temporada (e suas atribuições de grupo)
export async function removeClubFromSeason(req, res) {
  const { id, year, clubId } = req.params;
  const idLeague = Number(id);
  const idClub   = Number(clubId);

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const seasonRes = await client.query(
      `SELECT id_season FROM seasons WHERE year = $1`, [Number(year)]
    );
    const idSeason = seasonRes.rows[0]?.id_season;
    if (!idSeason) { await client.query("ROLLBACK"); return res.json({ ok: true }); }

    // Remove atribuições de grupo
    await client.query(
      `DELETE FROM competition_group_clubs WHERE id_league=$1 AND id_season=$2 AND id_club=$3`,
      [idLeague, idSeason, idClub]
    );
    // Remove da temporada
    await client.query(
      `DELETE FROM club_league_seasons WHERE id_club=$1 AND id_league=$2 AND id_season=$3`,
      [idClub, idLeague, idSeason]
    );

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[removeClubFromSeason]", err);
    res.status(500).json({ error: "Erro ao remover clube" });
  } finally {
    client.release();
  }
}

// GET /admin/leagues/:id/seasons/:year/editor
// Retorna: clubes da temporada + grupos salvos + partidas da temporada
export async function getCustomEditorData(req, res) {
  const { id, year } = req.params;
  const idLeague = Number(id);
  try {
    const seasonRes = await db.query(
      `SELECT id_season FROM seasons WHERE year = $1`, [Number(year)]
    );
    const idSeason = seasonRes.rows[0]?.id_season ?? null;

    // Clubes vinculados à temporada
    const clubsRes = idSeason ? await db.query(`
      SELECT c.id_club, c.name, c.crest_url, co.name AS country_name
      FROM club_league_seasons cls
      JOIN clubs c ON c.id_club = cls.id_club
      LEFT JOIN countries co ON co.id_country = c.id_country
      WHERE cls.id_league = $1 AND cls.id_season = $2
      ORDER BY c.name ASC
    `, [idLeague, idSeason]) : { rows: [] };

    // Atribuições a grupos
    const groupsRes = idSeason ? await db.query(`
      SELECT phase_key, group_key, id_club, slot_order
      FROM competition_group_clubs
      WHERE id_league = $1 AND id_season = $2
      ORDER BY phase_key, group_key, slot_order
    `, [idLeague, idSeason]) : { rows: [] };

    // Partidas da temporada (com contexto de fase/grupo)
    const matchesRes = idSeason ? await db.query(`
      SELECT
        m.id_match, m.match_date, m.status, m.game_week,
        m.home_goals, m.away_goals, m.phase_key, m.group_key,
        hc.name AS home_name, hc.crest_url AS home_crest,
        ac.name AS away_name, ac.crest_url AS away_crest
      FROM matches m
      JOIN clubs hc ON hc.id_club = m.home_club_id
      JOIN clubs ac ON ac.id_club = m.away_club_id
      WHERE m.id_league = $1 AND m.id_season = $2
      ORDER BY m.phase_key, m.group_key, m.match_date NULLS LAST, m.id_match
    `, [idLeague, idSeason]) : { rows: [] };

    // Todos os clubes disponíveis no sistema (para o seletor de adição)
    const allClubsRes = await db.query(`
      SELECT c.id_club, c.name, c.crest_url, co.name AS country_name
      FROM clubs c
      LEFT JOIN countries co ON co.id_country = c.id_country
      WHERE c.active = true
      ORDER BY co.name ASC, c.name ASC
    `);

    res.json({
      idSeason,
      clubs:    clubsRes.rows,
      groups:   groupsRes.rows,
      matches:  matchesRes.rows,
      allClubs: allClubsRes.rows,
    });
  } catch (err) {
    console.error("[getCustomEditorData]", err);
    res.status(500).json({ error: "Erro ao carregar dados do editor" });
  }
}

// PUT /admin/leagues/:id/seasons/:year/groups
// Body: { assignments: [{ phase_key, group_key, id_club, slot_order }] }
export async function saveGroupAssignments(req, res) {
  const { id, year } = req.params;
  const idLeague = Number(id);
  const { assignments = [] } = req.body;

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const idSeason = await ensureSeason(client, year);

    // Garante competition_seasons
    await client.query(`
      INSERT INTO competition_seasons (id_league, id_season)
      VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [idLeague, idSeason]);

    // Replace total das atribuições da temporada
    await client.query(
      `DELETE FROM competition_group_clubs WHERE id_league = $1 AND id_season = $2`,
      [idLeague, idSeason]
    );

    for (const a of assignments) {
      await client.query(`
        INSERT INTO competition_group_clubs (id_league, id_season, phase_key, group_key, id_club, slot_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id_league, id_season, phase_key, id_club) DO UPDATE
          SET group_key = EXCLUDED.group_key, slot_order = EXCLUDED.slot_order
      `, [idLeague, idSeason, a.phase_key, a.group_key ?? null, Number(a.id_club), a.slot_order ?? 0]);
    }

    await client.query("COMMIT");
    res.json({ ok: true, saved: assignments.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[saveGroupAssignments]", err);
    res.status(500).json({ error: "Erro ao salvar atribuições" });
  } finally {
    client.release();
  }
}

// POST /admin/leagues/:id/seasons/:year/matches
// Body: { home_club_id, away_club_id, match_date?, phase_key?, group_key?, game_week? }
export async function createCustomMatch(req, res) {
  const { id, year } = req.params;
  const idLeague = Number(id);
  const { home_club_id, away_club_id, match_date, phase_key, group_key, game_week } = req.body;

  if (!home_club_id || !away_club_id) {
    return res.status(400).json({ error: "home_club_id e away_club_id são obrigatórios" });
  }
  if (Number(home_club_id) === Number(away_club_id)) {
    return res.status(400).json({ error: "Time mandante e visitante não podem ser iguais" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const idSeason = await ensureSeason(client, year);

    await client.query(`
      INSERT INTO competition_seasons (id_league, id_season)
      VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [idLeague, idSeason]);

    const r = await client.query(`
      INSERT INTO matches (
        id_league, id_season, home_club_id, away_club_id,
        match_date, status, phase_key, group_key, game_week
      ) VALUES ($1,$2,$3,$4,$5,'scheduled',$6,$7,$8)
      RETURNING id_match
    `, [
      idLeague, idSeason,
      Number(home_club_id), Number(away_club_id),
      match_date || null,
      phase_key || null,
      group_key || null,
      game_week ? Number(game_week) : null,
    ]);

    await client.query("COMMIT");

    // Busca dados completos para retornar ao front
    const full = await db.query(`
      SELECT m.id_match, m.match_date, m.status, m.game_week,
             m.home_goals, m.away_goals, m.phase_key, m.group_key,
             hc.name AS home_name, hc.crest_url AS home_crest,
             ac.name AS away_name, ac.crest_url AS away_crest
      FROM matches m
      JOIN clubs hc ON hc.id_club = m.home_club_id
      JOIN clubs ac ON ac.id_club = m.away_club_id
      WHERE m.id_match = $1
    `, [r.rows[0].id_match]);

    res.status(201).json({ match: full.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[createCustomMatch]", err);
    res.status(500).json({ error: "Erro ao criar partida" });
  } finally {
    client.release();
  }
}

// PUT /admin/matches/:id
// Body: { match_date?, home_goals?, away_goals?, status?, phase_key?, group_key?, game_week? }
export async function updateCustomMatch(req, res) {
  const idMatch = Number(req.params.id);
  const { match_date, home_goals, away_goals, status, phase_key, group_key, game_week } = req.body;

  try {
    await db.query(`
      UPDATE matches SET
        match_date  = COALESCE($1, match_date),
        home_goals  = $2,
        away_goals  = $3,
        status      = COALESCE($4, status),
        phase_key   = $5,
        group_key   = $6,
        game_week   = $7
      WHERE id_match = $8
    `, [
      match_date ?? null,
      home_goals != null ? Number(home_goals) : null,
      away_goals != null ? Number(away_goals) : null,
      status ?? null,
      phase_key ?? null,
      group_key ?? null,
      game_week != null ? Number(game_week) : null,
      idMatch,
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error("[updateCustomMatch]", err);
    res.status(500).json({ error: "Erro ao atualizar partida" });
  }
}

// DELETE /admin/matches/:id
export async function deleteCustomMatch(req, res) {
  const idMatch = Number(req.params.id);
  try {
    await db.query(`DELETE FROM match_stats WHERE id_match = $1`, [idMatch]);
    await db.query(`DELETE FROM matches WHERE id_match = $1`, [idMatch]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[deleteCustomMatch]", err);
    res.status(500).json({ error: "Erro ao excluir partida" });
  }
}

// POST /admin/leagues/:id/seasons/:year/matches/generate
// Gera partidas automaticamente baseado nas atribuições de grupos (modo assistido)
export async function generateMatchesFromGroups(req, res) {
  const { id, year } = req.params;
  const idLeague = Number(id);
  const { phase_key, formato = "ida_volta", overwrite = false } = req.body;

  if (!phase_key) return res.status(400).json({ error: "phase_key obrigatório" });

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const seasonRes = await client.query(
      `SELECT id_season FROM seasons WHERE year = $1`, [Number(year)]
    );
    const idSeason = seasonRes.rows[0]?.id_season;
    if (!idSeason) return res.status(404).json({ error: "Temporada não encontrada" });

    // Busca clubes da fase/grupos
    const clubsRes = await client.query(`
      SELECT id_club, group_key, slot_order
      FROM competition_group_clubs
      WHERE id_league = $1 AND id_season = $2 AND phase_key = $3
      ORDER BY group_key, slot_order
    `, [idLeague, idSeason, phase_key]);

    if (!clubsRes.rows.length) {
      return res.status(400).json({ error: "Nenhum clube atribuído a esta fase" });
    }

    if (overwrite) {
      await client.query(
        `DELETE FROM matches WHERE id_league = $1 AND id_season = $2 AND phase_key = $3`,
        [idLeague, idSeason, phase_key]
      );
    }

    // Agrupa por group_key
    const byGroup = new Map();
    for (const r of clubsRes.rows) {
      const key = r.group_key ?? "__none__";
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(r.id_club);
    }

    let created = 0;
    for (const [groupKey, clubIds] of byGroup) {
      const gk = groupKey === "__none__" ? null : groupKey;
      // Todos contra todos dentro do grupo
      for (let i = 0; i < clubIds.length; i++) {
        for (let j = i + 1; j < clubIds.length; j++) {
          await client.query(`
            INSERT INTO matches (id_league, id_season, home_club_id, away_club_id, status, phase_key, group_key)
            VALUES ($1,$2,$3,$4,'scheduled',$5,$6)
            ON CONFLICT DO NOTHING
          `, [idLeague, idSeason, clubIds[i], clubIds[j], phase_key, gk]);
          created++;

          if (formato === "ida_volta") {
            await client.query(`
              INSERT INTO matches (id_league, id_season, home_club_id, away_club_id, status, phase_key, group_key)
              VALUES ($1,$2,$3,$4,'scheduled',$5,$6)
              ON CONFLICT DO NOTHING
            `, [idLeague, idSeason, clubIds[j], clubIds[i], phase_key, gk]);
            created++;
          }
        }
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true, created });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[generateMatchesFromGroups]", err);
    res.status(500).json({ error: "Erro ao gerar partidas" });
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/leagues/:id/seasons/:year/tournament-suggestions
// Analisa as partidas importadas (sem phase_key) e sugere atribuição a torneios/fases
// baseado na estrutura configurada (structure_json) usando clustering temporal.
// ─────────────────────────────────────────────────────────────────────────────
export async function getTournamentSuggestions(req, res) {
  const { id, year } = req.params;
  const idLeague = Number(id);

  try {
    // Busca configuração da liga
    const leagueRes = await db.query(
      `SELECT structure_json FROM leagues WHERE id_league = $1`, [idLeague]
    );
    if (!leagueRes.rows.length) return res.status(404).json({ error: "Liga não encontrada" });
    const structure = leagueRes.rows[0].structure_json ?? {};
    const seasonCfg = structure[String(year)] ?? null;

    // Busca id_season
    const seasonRes = await db.query(
      `SELECT id_season FROM seasons WHERE year = $1`, [Number(year)]
    );
    const idSeason = seasonRes.rows[0]?.id_season ?? null;

    // Fases configuradas — fonte de verdade
    const configuredFases = (seasonCfg?.fases ?? []).map((f, i) => ({
      key: f.nome
        ? f.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
        : `fase_${i + 1}`,
      nome: f.nome || `Fase ${i + 1}`,
      tipo: f.tipo,
      formato: f.formato,
    }));

    if (!idSeason) {
      return res.json({ configuredFases, clusters: [], alreadyAssigned: 0, total: 0 });
    }

    // Busca partidas — separadas entre "já atribuídas" e "sem atribuição"
    const matchesRes = await db.query(`
      SELECT m.id_match, m.match_date, m.phase_key,
             hc.name AS home_name, ac.name AS away_name
      FROM matches m
      JOIN clubs hc ON hc.id_club = m.home_club_id
      JOIN clubs ac ON ac.id_club = m.away_club_id
      WHERE m.id_league = $1 AND m.id_season = $2
      ORDER BY m.match_date ASC NULLS LAST, m.id_match ASC
    `, [idLeague, idSeason]);

    const allMatches = matchesRes.rows;
    // Cluster ALL matches that have a date (assigned or not)
    const withDate = allMatches.filter(m => m.match_date);
    const noDate   = allMatches.filter(m => !m.match_date);

    // Clustering temporal: gap > GAP_DAYS entre partidas consecutivas = novo cluster
    const GAP_DAYS = 14;
    const GAP_MS = GAP_DAYS * 24 * 3600 * 1000;
    const rawClusters = [];
    let current = [];

    for (let i = 0; i < withDate.length; i++) {
      if (i === 0) { current.push(withDate[i]); continue; }
      const prev = new Date(withDate[i - 1].match_date).getTime();
      const curr = new Date(withDate[i].match_date).getTime();
      if (curr - prev > GAP_MS) { rawClusters.push(current); current = []; }
      current.push(withDate[i]);
    }
    if (current.length > 0) rawClusters.push(current);

    // Sugere mapeamento posicional: cluster[i] → configuredFases[i]
    // currentPhaseKey: o phase_key mais frequente dentro do cluster (pode ser null)
    const configuredKeys = new Set(configuredFases.map(f => f.key));

    const suggestions = rawClusters.map((cluster, i) => {
      const suggested = configuredFases[i] ?? null;
      const dates = cluster.map(m => m.match_date).filter(Boolean).sort();

      // Frequência de phase_key no cluster
      const freq = {};
      for (const m of cluster) {
        if (m.phase_key) freq[m.phase_key] = (freq[m.phase_key] ?? 0) + 1;
      }
      const dominantKey = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0] ?? null;
      // Só usa como currentPhaseKey se bate com uma fase configurada (ignora chaves legadas)
      const currentPhaseKey = dominantKey && configuredKeys.has(dominantKey) ? dominantKey : null;

      return {
        clusterId: i,
        matchCount: cluster.length,
        dateStart: dates[0] ?? null,
        dateEnd: dates[dates.length - 1] ?? null,
        currentPhaseKey,          // fase já atribuída e válida (ou null)
        legacyPhaseKey: dominantKey && !configuredKeys.has(dominantKey) ? dominantKey : null,
        suggestedPhaseKey: suggested?.key ?? null,
        suggestedPhaseName: suggested?.nome ?? null,
        matches: cluster.map(m => ({
          id: m.id_match,
          date: m.match_date,
          home: m.home_name,
          away: m.away_name,
          phaseKey: m.phase_key ?? null,
        })),
      };
    });

    // Partidas já atribuídas agrupadas por phase_key (para info no header)
    const assignedByPhase = {};
    for (const m of allMatches.filter(m => m.phase_key)) {
      assignedByPhase[m.phase_key] = (assignedByPhase[m.phase_key] ?? 0) + 1;
    }
    const alreadyAssigned = allMatches.filter(m => m.phase_key).length;

    res.json({
      configuredFases,
      clusters: suggestions,
      alreadyAssigned,
      assignedByPhase,
      total: allMatches.length,
      noDateCount: noDate.length,
      unassignedCount: allMatches.filter(m => !m.phase_key).length,
    });
  } catch (err) {
    console.error("[getTournamentSuggestions]", err);
    res.status(500).json({ error: "Erro ao gerar sugestões" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/leagues/:id/seasons/:year/assign-phases
// Body: { assignments: [{ clusterId: 0, phaseKey: "apertura" }, ...] }
//    OU: { assignments: [{ matchIds: [1,2,3], phaseKey: "apertura" }, ...] }
// Salva phase_key nas partidas confirmadas pelo usuário.
// ─────────────────────────────────────────────────────────────────────────────
export async function bulkAssignPhases(req, res) {
  const { id, year } = req.params;
  const idLeague = Number(id);
  const { assignments = [], clearFirst = false } = req.body;

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return res.status(400).json({ error: "assignments obrigatório e não pode ser vazio" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const seasonRes = await client.query(
      `SELECT id_season FROM seasons WHERE year = $1`, [Number(year)]
    );
    const idSeason = seasonRes.rows[0]?.id_season;
    if (!idSeason) return res.status(404).json({ error: "Temporada não encontrada" });

    if (clearFirst) {
      await client.query(
        `UPDATE matches SET phase_key = NULL WHERE id_league = $1 AND id_season = $2`,
        [idLeague, idSeason]
      );
    }

    let updated = 0;
    for (const a of assignments) {
      const phaseKey = a.phaseKey ?? null;
      const matchIds = Array.isArray(a.matchIds) ? a.matchIds.map(Number).filter(Boolean) : [];

      if (!matchIds.length) continue;

      const placeholders = matchIds.map((_, i) => `$${i + 3}`).join(",");
      const r = await client.query(
        `UPDATE matches SET phase_key = $1
         WHERE id_league = $2 AND id_match IN (${placeholders})`,
        [phaseKey, idLeague, ...matchIds]
      );
      updated += r.rowCount;
    }

    await client.query("COMMIT");
    res.json({ ok: true, updated });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[bulkAssignPhases]", err);
    res.status(500).json({ error: "Erro ao atribuir fases" });
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/leagues/:id/seasons/:year/group-clubs
// Retorna os clubes da liga/temporada e as atribuições de grupo atuais.
// ─────────────────────────────────────────────────────────────────────────────
export async function getGroupClubs(req, res) {
  const { id, year } = req.params;
  const idLeague = Number(id);

  try {
    // id_season (pode não existir na tabela seasons — não bloqueia a query de clubes)
    const seasonRes = await db.query(`SELECT id_season FROM seasons WHERE year = $1`, [Number(year)]);
    const idSeason = seasonRes.rows[0]?.id_season ?? null;

    // Busca clubes direto das partidas fazendo JOIN com seasons.year
    // Isso funciona mesmo que id_season não tenha sido encontrado acima
    let clubsRes = await db.query(`
      SELECT DISTINCT c.id_club, c.name, c.crest_url FROM (
        SELECT m.home_club_id AS id_club
        FROM matches m
        JOIN seasons s ON s.id_season = m.id_season AND s.year = $2
        WHERE m.id_league = $1
        UNION
        SELECT m.away_club_id AS id_club
        FROM matches m
        JOIN seasons s ON s.id_season = m.id_season AND s.year = $2
        WHERE m.id_league = $1
      ) ids
      JOIN clubs c ON c.id_club = ids.id_club
      ORDER BY c.name
    `, [idLeague, Number(year)]);

    // Fallback: club_league_seasons (se tiver id_season e a query de partidas vier vazia)
    if (clubsRes.rows.length === 0 && idSeason) {
      clubsRes = await db.query(`
        SELECT DISTINCT c.id_club, c.name, c.crest_url
        FROM club_league_seasons cls
        JOIN clubs c ON c.id_club = cls.id_club
        WHERE cls.id_league = $1 AND cls.id_season = $2
        ORDER BY c.name
      `, [idLeague, idSeason]);
    }

    // Atribuições existentes (só se tiver id_season)
    const assignRes = idSeason ? await db.query(`
      SELECT phase_key, group_key, id_club, slot_order
      FROM competition_group_clubs
      WHERE id_league = $1 AND id_season = $2
      ORDER BY phase_key, group_key, slot_order
    `, [idLeague, idSeason]) : { rows: [] };

    res.json({ clubs: clubsRes.rows, assignments: assignRes.rows });
  } catch (err) {
    console.error("[getGroupClubs]", err);
    res.status(500).json({ error: "Erro ao carregar grupos" });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/leagues/:id/seasons/:year/group-clubs
// Body: { assignments: [{ phaseKey, groupKey, clubIds: [] }] }
// Substitui todas as atribuições da liga/temporada.
// ─────────────────────────────────────────────────────────────────────────────
export async function saveGroupClubs(req, res) {
  const { id, year } = req.params;
  const idLeague = Number(id);
  const { assignments = [] } = req.body;

  const client = await db.connect();
  try {
    const seasonRes = await client.query(`SELECT id_season FROM seasons WHERE year = $1`, [Number(year)]);
    const idSeason = seasonRes.rows[0]?.id_season ?? null;
    if (!idSeason) return res.status(404).json({ error: "Temporada não encontrada" });

    await client.query("BEGIN");
    await client.query(
      `DELETE FROM competition_group_clubs WHERE id_league = $1 AND id_season = $2`,
      [idLeague, idSeason]
    );

    let inserted = 0;
    for (const { phaseKey, groupKey, clubIds } of assignments) {
      if (!phaseKey || !groupKey || !Array.isArray(clubIds)) continue;
      for (let i = 0; i < clubIds.length; i++) {
        await client.query(`
          INSERT INTO competition_group_clubs (id_league, id_season, phase_key, group_key, id_club, slot_order)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [idLeague, idSeason, phaseKey, groupKey, clubIds[i], i + 1]);
        inserted++;
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true, inserted });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[saveGroupClubs]", err);
    res.status(500).json({ error: "Erro ao salvar grupos" });
  } finally {
    client.release();
  }
}

// ─── Hospitalidade ────────────────────────────────────────────────────────────

export async function searchStadiums(req, res) {
  const { q = "" } = req.query;
  try {
    const { rows } = await db.query(`
      SELECT
        c.stadium_name,
        COUNT(c.id_club)::int                       AS clubs_count,
        ARRAY_AGG(c.name ORDER BY c.name)           AS clubs,
        sh.id                                       AS hospitality_id,
        sh.hospitality_url,
        sh.description,
        sh.active                                   AS hospitality_active
      FROM clubs c
      LEFT JOIN stadium_hospitality sh
             ON LOWER(sh.stadium_name) = LOWER(c.stadium_name)
      WHERE c.stadium_name IS NOT NULL
        AND c.active = TRUE
        AND c.stadium_name ILIKE $1
      GROUP BY c.stadium_name, sh.id, sh.hospitality_url, sh.description, sh.active
      ORDER BY c.stadium_name ASC
      LIMIT 25
    `, [`%${q}%`]);
    res.json({ stadiums: rows });
  } catch (err) {
    console.error("[searchStadiums]", err);
    res.status(500).json({ error: "Erro ao buscar estádios" });
  }
}

export async function listHospitality(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT
        sh.*,
        COUNT(c.id_club)::int        AS clubs_count,
        ARRAY_AGG(c.name ORDER BY c.name) AS clubs
      FROM stadium_hospitality sh
      LEFT JOIN clubs c ON LOWER(c.stadium_name) = LOWER(sh.stadium_name) AND c.active = TRUE
      GROUP BY sh.id
      ORDER BY sh.stadium_name ASC
    `);
    res.json({ records: rows });
  } catch (err) {
    console.error("[listHospitality]", err);
    res.status(500).json({ error: "Erro ao listar hospitalidade" });
  }
}

export async function upsertHospitality(req, res) {
  const { stadium_name, hospitality_url, description } = req.body;
  if (!stadium_name) return res.status(400).json({ error: "stadium_name obrigatório" });
  try {
    const { rows } = await db.query(`
      INSERT INTO stadium_hospitality (stadium_name, hospitality_url, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (LOWER(stadium_name))
      DO UPDATE SET
        hospitality_url = EXCLUDED.hospitality_url,
        description     = EXCLUDED.description,
        updated_at      = NOW()
      RETURNING *
    `, [stadium_name, hospitality_url || null, description || null]);
    res.json({ record: rows[0] });
  } catch (err) {
    console.error("[upsertHospitality]", err);
    res.status(500).json({ error: "Erro ao salvar hospitalidade" });
  }
}

export async function deleteHospitality(req, res) {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM stadium_hospitality WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[deleteHospitality]", err);
    res.status(500).json({ error: "Erro ao remover hospitalidade" });
  }
}
