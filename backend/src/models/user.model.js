import { db } from "../config/db.js";

export async function findUserByEmail(email) {
  const query = "SELECT * FROM users WHERE email = $1 LIMIT 1";
  const values = [email];

  const result = await db.query(query, values);
  return result.rows[0];
}
