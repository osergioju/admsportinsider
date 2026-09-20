import db from  "../config/db.js";

export async function createBanner(req, res) {
  const {
    title,
    image_desktop_url,
    image_mobile_url,
    link_url,
    start_at,
    end_at,
    status,
    format
  } = req.body;

  if (!title || !image_desktop_url || !image_mobile_url) {
    return res.status(400).json({
      message: "Título e imagens são obrigatórios."
    });
  }

  try {
    // sort_order = max atual + 1 para novos banners irem ao final
    const maxRes = await db.query(`SELECT COALESCE(MAX(sort_order), 0) AS max FROM banners`);
    const nextOrder = maxRes.rows[0].max + 1;

    await db.query(`
      INSERT INTO banners (
        title,
        image_desktop_url,
        image_mobile_url,
        link_url,
        start_at,
        end_at,
        status,
        sort_order,
        format
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [
      title,
      image_desktop_url,
      image_mobile_url,
      link_url || null,
      start_at || null,
      end_at || null,
      status || "draft",
      nextOrder,
      format === "square" ? "square" : "horizontal"
    ]);

    return res.status(201).json({
      message: "Banner criado com sucesso!"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Erro ao criar banner"
    });
  }
}


export async function getAllBanners(req, res) {
  try {
    const result = await db.query(`
      SELECT *
      FROM banners
      WHERE status != 'draft'
      ORDER BY sort_order ASC, created_at DESC
    `);

    return res.json({
      banners: result.rows
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Erro ao listar banners"
    });
  }
}

export async function getBannerById(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(
      "SELECT * FROM banners WHERE id_banner = $1",
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: "Banner não encontrado"
      });
    }

    return res.json({
      banner: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Erro ao buscar banner"
    });
  }
}


export async function updateBanner(req, res) {
  const { id } = req.params;
  const {
    title,
    image_desktop_url,
    image_mobile_url,
    link_url,
    start_at,
    end_at,
    status,
    format
  } = req.body;

  try {
    await db.query(`
      UPDATE banners SET
        title = $1,
        image_desktop_url = $2,
        image_mobile_url = $3,
        link_url = $4,
        start_at = $5,
        end_at = $6,
        status = $7,
        format = $8,
        updated_at = NOW()
      WHERE id_banner = $9
    `, [
      title,
      image_desktop_url,
      image_mobile_url,
      link_url || null,
      start_at || null,
      end_at || null,
      status,
      format === "square" ? "square" : "horizontal",
      id
    ]);

    return res.json({
      message: "Banner atualizado com sucesso!"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Erro ao atualizar banner"
    });
  }
}

export async function reorderBanners(req, res) {
  // body: [{ id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }, ...]
  const { order } = req.body;

  if (!Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ message: "Lista de ordenação inválida." });
  }

  try {
    await Promise.all(
      order.map(({ id, sort_order }) =>
        db.query(`UPDATE banners SET sort_order = $1 WHERE id_banner = $2`, [sort_order, id])
      )
    );
    return res.json({ message: "Ordem atualizada com sucesso!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao reordenar banners." });
  }
}

export async function deleteBanner(req, res) {
  const { id } = req.params;

  try {
    await db.query(`
      UPDATE banners
      SET status = 'draft'
      WHERE id_banner = $1
    `, [id]);

    return res.json({
      message: "Banner desativado"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Erro ao remover banner"
    });
  }
}
