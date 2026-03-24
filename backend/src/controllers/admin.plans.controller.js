import db from  "../config/db.js";

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

export async function createPlan(req, res) {
  const { name, price, benefits, pagarme_plan_id, active } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Nome do plano é obrigatório" });
  }

  try {
    const insert = await db.query(`
      INSERT INTO plans (name, price, benefits, pagarme_plan_id, active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      name,
      price || 0,
      Array.isArray(benefits) ? JSON.stringify(benefits) : "[]",
      pagarme_plan_id || null,
      active !== undefined ? active : true,
    ]);

    return res.status(201).json({
      message: "Plano criado com sucesso",
      plan: insert.rows[0],
    });

  } catch (err) {
    console.error("Erro ao criar plano:", err);
    return res.status(500).json({ message: "Erro ao criar plano" });
  }
}

export async function updatePlan(req, res) {
  const { id } = req.params;
  const { name, price, benefits, pagarme_plan_id, active } = req.body;

  try {
    const update = await db.query(`
      UPDATE plans
      SET name            = $1,
          price           = $2,
          benefits        = $3::jsonb,
          pagarme_plan_id = $4,
          active          = $5
      WHERE id = $6
      RETURNING *
    `, [
      name,
      price,
      JSON.stringify(benefits ?? []), // garante string válida pro cast jsonb
      pagarme_plan_id ?? null,
      active,
      id,
    ]);

    if (!update.rows.length) {
      return res.status(404).json({ message: "Plano não encontrado" });
    }

    return res.json({
      message: "Plano atualizado com sucesso",
      plan: update.rows[0],
    });
  } catch (err) {
    console.error("Erro ao atualizar plano:", err);
    return res.status(500).json({ message: "Erro ao atualizar plano" });
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
