import { db } from "../config/db.js";

export async function findUserByEmail(email) {
  const query = "SELECT * FROM users WHERE email = $1 LIMIT 1";
  const values = [email];

  const result = await db.query(query, values);
  return result.rows[0];
}

export async function createPublicUser({ name, email, passwordHash }) {
  const query = `
    INSERT INTO users (
      name, 
      email, 
      password_hash, 
      role, 
      active, 
      email_verified, 
      created_at, 
      updated_at,
      provider
    )
    VALUES ($1, $2, $3, 'user', true, false, NOW(), NOW(), 'email')
    RETURNING id, name, email, role, created_at;
  `;
  
  // role 'user' é o padrão para quem se cadastra pelo site
  // email_verified false obriga o usuário a confirmar o email depois
  
  const values = [name, email, passwordHash];
  const result = await db.query(query, values);
  return result.rows[0];
}

// Atualizar dados do próprio usuário
export async function updateUserProfile(id, { name, email }) {
  // COALESCE garante que se o campo vier nulo/undefined, mantém o valor atual do banco
  const query = `
    UPDATE users
    SET 
      name = COALESCE($1, name),
      email = COALESCE($2, email),
      updated_at = NOW()
    WHERE id = $3
    RETURNING id, name, email, role, active, avatar_url, created_at, updated_at;
  `;

  const values = [name, email, id];
  const result = await db.query(query, values);
  return result.rows[0];
}