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