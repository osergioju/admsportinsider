import db from  from "../config/db.js";
import bcrypt from "bcryptjs";


export const getProfile = (req, res) => {
  return res.json({
    message: "Profile (placeholder) funcionando",
    user: null,
  });
};

export async function updateProfile(req, res) {
  const userId = req.user.id;
  const { name, email } = req.body;

  try {
    /* =========================
       Fetch current user
    ========================= */
    const { rows } = await db.query(
      `
      SELECT email, provider
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    const fields = [];
    const values = [];
    let index = 1;

    /* =========================
       Name
    ========================= */
    if (typeof name === "string" && name.trim() !== "") {
      fields.push(`name = $${index++}`);
      values.push(name.trim());
    }

    /* =========================
       Email
    ========================= */
    if (email && email !== user.email) {
      if (user.provider === "google") {
        return res.status(403).json({
          error: "Google users cannot change email"
        });
      }

      // 🔍 verifica se email já existe
      const emailCheck = await db.query(
        `
        SELECT id
        FROM users
        WHERE email = $1
          AND id <> $2
        LIMIT 1
        `,
        [email, userId]
      );

      if (emailCheck.rows.length) {
        return res.status(409).json({
          error: "Email already in use"
        });
      }

      fields.push(`email = $${index++}`);
      values.push(email);

      fields.push(`email_verified = $${index++}`);
      values.push(false);
    }

    /* =========================
       Nothing to update
    ========================= */
    if (!fields.length) {
      return res.json({ message: "Nothing to update" });
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${index}
      RETURNING
        id,
        name,
        email,
        provider,
        email_verified,
        avatar_url
    `;

    const { rows: updated } = await db.query(query, values);

    return res.json(updated[0]);
  } catch (err) {
    console.error("updateProfile error:", err);

    // 🛟 fallback caso a constraint UNIQUE dispare
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Email already in use"
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}


/*
export async function getPreferences(req, res) {
  const userId = req.user.id;

  try {
    const { rows } = await db.query(
      `
      SELECT preferences
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(rows[0].preferences);
  } catch (err) {
    console.error("getPreferences error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}


export async function updatePreferences(req, res) {
  const userId = req.user.id;
  const updates = req.body;

  try {
    // valida payload básico
    const allowedKeys = [
      "email_notifications",
      "product_updates",
      "language"
    ];

    const cleanUpdates = {};

    for (const key of allowedKeys) {
      if (key in updates) {
        cleanUpdates[key] = updates[key];
      }
    }

    if (!Object.keys(cleanUpdates).length) {
      return res.json({ message: "Nothing to update" });
    }

    const { rows } = await db.query(
      `
      UPDATE users
      SET preferences = preferences || $1::jsonb,
          updated_at = NOW()
      WHERE id = $2
      RETURNING
        id,
        preferences
      `,
      [JSON.stringify(cleanUpdates), userId]
    );

    return res.json(rows[0]);
  } catch (err) {
    console.error("updatePreferences error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
*/

// Agora sim, atualiza as coisas
export const addPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { region_id, currency_id } = req.body;

    if (!region_id || !currency_id) {
      return res.status(400).json({
        error: "region_id e currency_id são obrigatórios"
      });
    }

    await db.query(
      `
      INSERT INTO user_preferences (
        user_id,
        region_id,
        currency_id,
        first_login_completed
      )
      VALUES ($1, $2, $3, TRUE)
      ON CONFLICT (user_id)
      DO UPDATE SET
        region_id = EXCLUDED.region_id,
        currency_id = EXCLUDED.currency_id,
        first_login_completed = TRUE,
        updated_at = NOW();
      `,
      [userId, region_id, currency_id]
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar preferências:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      region_id,
      currency_id,
      email_notifications,
      product_updates
    } = req.body;

    if (
      !region_id &&
      !currency_id &&
      email_notifications === undefined &&
      product_updates === undefined
    ) {
      return res.status(400).json({
        error: "Nenhuma preferência enviada para atualização"
      });
    }

    await db.query(
      `
      UPDATE user_preferences
      SET
        region_id = COALESCE($2, region_id),
        currency_id = COALESCE($3, currency_id),
        email_notifications = COALESCE($4, email_notifications),
        product_updates = COALESCE($5, product_updates),
        updated_at = NOW()
      WHERE user_id = $1;
      `,
      [
        userId,
        region_id || null,
        currency_id || null,
        email_notifications,
        product_updates
      ]
    );

    // Retorna preferências já enriquecidas
    const result = await db.query(
      `
      SELECT
        up.first_login_completed,

        r.id   AS region_id,
        r.code AS region_code,
        r.name AS region_name,

        c.id   AS currency_id,
        c.code AS currency_code,
        c.name AS currency_name,
        c.symbol AS currency_symbol,

        up.email_notifications,
        up.product_updates

      FROM user_preferences up
      LEFT JOIN regions r ON r.id = up.region_id
      LEFT JOIN currencies c ON c.id = up.currency_id
      WHERE up.user_id = $1;
      `,
      [userId]
    );

    const row = result.rows[0];

    const preferences = {
      first_login_completed: row.first_login_completed,

      email_notifications: row.email_notifications,
      product_updates: row.product_updates,

      region_id: row.region_id,
      region: row.region_id
        ? {
            id: row.region_id,
            code: row.region_code,
            name: row.region_name
          }
        : null,

      currency_id: row.currency_id,
      currency: row.currency_id
        ? {
            id: row.currency_id,
            code: row.currency_code,
            name: row.currency_name,
            symbol: row.currency_symbol
          }
        : null
    };

    return res.json({ preferences });

  } catch (error) {
    console.error("Erro ao atualizar preferências:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

// Pega currency e regiao
export const getRegions = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT id, code, name
      FROM regions
      WHERE active = TRUE
      ORDER BY name;
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar regiões:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

export const getCurrencies = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT id, code, name, symbol
      FROM currencies
      WHERE active = TRUE
      ORDER BY name;
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar moedas:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};



export async function updatePassword(req, res) {
  const userId = req.user.id;
  const { current_password, new_password } = req.body;

  try {
    if (!current_password || !new_password) {
      return res.status(400).json({
        error: "Missing fields"
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters"
      });
    }

    // Busca senha atual
    const { rows } = await db.query(
      `
      SELECT password_hash, provider
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    if (user.provider === "google") {
      return res.status(403).json({
        error: "Google users cannot change password"
      });
    }

    // Verifica senha atual
    const valid = await bcrypt.compare(
      current_password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        error: "Current password is incorrect"
      });
    }

    // Gera novo hash
    const newHash = await bcrypt.hash(new_password, 10);

    await db.query(
      `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [newHash, userId]
    );

    return res.json({
      message: "Password updated successfully"
    });
  } catch (err) {
    console.error("updatePassword error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}