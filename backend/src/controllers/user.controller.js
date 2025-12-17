import { db } from "../config/db.js";
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