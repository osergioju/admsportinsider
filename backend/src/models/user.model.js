import db from  "../config/db.js";

export async function findUserByEmail(email) {
  const query = "SELECT * FROM users WHERE email = $1 LIMIT 1";
  const values = [email];

  const result = await db.query(query, values);
  return result.rows[0];
}

export async function createPublicUser({ nome, email, passwordHash }) {
  const query = `
    INSERT INTO users (
      name,
      email,
      password_hash,
      role,
      plan_id,
      active,
      email_verified,
      provider,
      last_login,
      created_at,
      updated_at,
      country,
      provider_id,
      avatar_url,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id,
      subscription_status,
      subscription_current_period_end,
      cancel_at_period_end
    )
    VALUES (
      $1, $2, $3,
      'user',
      1,
      true,
      false,
      'email',
      NOW(),
      NOW(),
      NOW(),
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      false
    )
    RETURNING
      id, name, email, role, plan_id, active, email_verified, provider, last_login, created_at;
  `;

  const values = [nome, email, passwordHash];
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