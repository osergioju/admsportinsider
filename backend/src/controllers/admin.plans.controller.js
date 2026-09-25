import db from "../config/db.js";
import stripe from "../config/stripe.js";

// Pega planos 
export async function getAllPlans(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const query = await db.query(`
      SELECT *
      FROM plans
      ORDER BY id ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const count = await db.query("SELECT COUNT(*) FROM plans");

    return res.json({
      plans: query.rows,
      pagination: {
        page,
        total: parseInt(count.rows[0].count),
        totalPages: Math.ceil(count.rows[0].count / limit)
      }
    });

  } catch (err) {
    console.error("Erro ao listar planos:", err);
    return res.status(500).json({ message: "Erro ao listar planos" });
  }
}


export async function getPlanById(req, res) {
  const { id } = req.params;

  try {
    const query = await db.query(
      "SELECT * FROM plans WHERE id = $1",
      [id]
    );

    if (query.rows.length === 0) {
      return res.status(404).json({ message: "Plano não encontrado" });
    }

    return res.json({ plan: query.rows[0] });

  } catch (err) {
    console.error("Erro ao buscar plano:", err);
    return res.status(500).json({ message: "Erro ao buscar plano" });
  }
}

// Moeda/periodicidade/preço reais vêm do Price do Stripe (é ele quem cobra) — assim o cadastro
// nunca diverge da cobrança. Sem Price ID do Stripe (ex.: plano Free), usa o que o admin informou.
// ID colado costuma vir com espaço/quebra de linha nas pontas — o Stripe rejeita isso como "No such price".
const cleanPriceId = (raw) => String(raw ?? "").trim();

async function resolvePlanBilling({ pagarme_plan_id, price, currency, billing_interval }) {
  pagarme_plan_id = cleanPriceId(pagarme_plan_id);
  let resolved = {
    price: price ?? 0,
    currency: String(currency || "BRL").toUpperCase(),
    billing_interval: billing_interval || "month",
  };

  if (pagarme_plan_id && String(pagarme_plan_id).startsWith("price_")) {
    let stripePrice;
    try {
      stripePrice = await stripe.prices.retrieve(pagarme_plan_id);
    } catch (stripeErr) {
      console.error(`Stripe prices.retrieve(${pagarme_plan_id}) falhou:`, stripeErr.type, stripeErr.message);
      const e = new Error(
        `Stripe não encontrou esse Price ID (${stripeErr.message}). Confira o ID e se a chave do Stripe do backend é do mesmo ambiente (teste ou produção).`
      );
      e.status = 400;
      throw e;
    }
    const rec = stripePrice.recurring;
    if (!rec || !["month", "year"].includes(rec.interval) || rec.interval_count !== 1) {
      const e = new Error("O Price do Stripe precisa ser recorrente, cobrado a cada 1 mês ou a cada 1 ano.");
      e.status = 400;
      throw e;
    }
    resolved = {
      price: stripePrice.unit_amount != null ? stripePrice.unit_amount / 100 : resolved.price,
      currency: stripePrice.currency.toUpperCase(),
      billing_interval: rec.interval,
    };
  }

  if (!/^[A-Z]{3}$/.test(resolved.currency) || !["month", "year"].includes(resolved.billing_interval)) {
    const e = new Error("Moeda ou periodicidade inválida.");
    e.status = 400;
    throw e;
  }
  return resolved;
}

export async function createPlan(req, res) {
  const { name, benefits, pagarme_plan_id, active, is_featured } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Nome do plano é obrigatório" });
  }

  let billing;
  try {
    billing = await resolvePlanBilling(req.body);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    // Só 1 plano em destaque: ao destacar este, remove o destaque dos outros
    if (is_featured === true) await client.query("UPDATE plans SET is_featured = false WHERE is_featured");

    const insert = await client.query(`
      INSERT INTO plans (name, price, benefits, pagarme_plan_id, active, is_featured, currency, billing_interval)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      name,
      billing.price,
      Array.isArray(benefits) ? JSON.stringify(benefits) : "[]",
      cleanPriceId(pagarme_plan_id) || null,
      active !== undefined ? active : true,
      is_featured === true,
      billing.currency,
      billing.billing_interval,
    ]);
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Plano criado com sucesso",
      plan: insert.rows[0],
    });

  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Erro ao criar plano:", err);
    return res.status(500).json({ message: "Erro ao criar plano" });
  } finally {
    client.release();
  }
}

export async function updatePlan(req, res) {
  const { id } = req.params;
  const { name, benefits, pagarme_plan_id, active, is_featured } = req.body;

  let billing;
  try {
    billing = await resolvePlanBilling(req.body);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    // Só 1 plano em destaque: ao destacar este, remove o destaque dos outros
    if (is_featured === true) await client.query("UPDATE plans SET is_featured = false WHERE is_featured AND id <> $1", [id]);

    const update = await client.query(`
      UPDATE plans
      SET name             = $1,
          price            = $2,
          benefits         = $3::jsonb,
          pagarme_plan_id  = $4,
          active           = $5,
          is_featured      = COALESCE($7, is_featured),
          currency         = $8,
          billing_interval = $9
      WHERE id = $6
      RETURNING *
    `, [
      name,
      billing.price,
      JSON.stringify(benefits ?? []), // garante string válida pro cast jsonb
      cleanPriceId(pagarme_plan_id) || null,
      active,
      id,
      typeof is_featured === "boolean" ? is_featured : null,
      billing.currency,
      billing.billing_interval,
    ]);

    if (!update.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Plano não encontrado" });
    }

    await client.query("COMMIT");
    return res.json({
      message: "Plano atualizado com sucesso",
      plan: update.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Erro ao atualizar plano:", err);
    return res.status(500).json({ message: "Erro ao atualizar plano" });
  } finally {
    client.release();
  }
}


export async function disablePlan(req, res) {
  const { id } = req.params;

  try {
    await db.query(`
      UPDATE plans
      SET active = false
      WHERE id = $1
    `, [id]);

    return res.json({ message: "Plano desativado com sucesso" });

  } catch (err) {
    console.error("Erro ao desativar plano:", err);
    return res.status(500).json({ message: "Erro ao desativar plano" });
  }
}

// Exclusão definitiva. O plano 1 (Free) é o fallback do webhook ao encerrar assinaturas,
// e plano com usuários vinculados não pode sumir — nesses casos o admin deve desativar.
export async function deletePlan(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "ID de plano inválido" });
  }

  if (id === 1) {
    return res.status(409).json({ message: "O plano gratuito é o padrão do sistema e não pode ser excluído." });
  }

  try {
    const inUse = await db.query("SELECT COUNT(*)::int AS total FROM users WHERE plan_id = $1", [id]);
    if (inUse.rows[0].total > 0) {
      return res.status(409).json({
        message: `Este plano tem ${inUse.rows[0].total} usuário(s) vinculado(s). Desative-o em vez de excluir.`,
      });
    }

    const del = await db.query("DELETE FROM plans WHERE id = $1 RETURNING id", [id]);
    if (!del.rows.length) {
      return res.status(404).json({ message: "Plano não encontrado" });
    }

    return res.json({ message: "Plano excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir plano:", err);
    return res.status(500).json({ message: "Erro ao excluir plano" });
  }
}
