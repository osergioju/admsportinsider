import { supabase } from "../utils/supabase.js";
import db from  "../config/db.js";

export async function uploadBannerImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    const file = req.file;
    const ext = file.originalname.split(".").pop();
    const filename = `banner_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("assets")
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao enviar imagem." });
    }

    const { data: publicUrl } = supabase.storage
      .from("assets")
      .getPublicUrl(filename);

    return res.status(200).json({
      message: "Upload realizado com sucesso!",
      url: publicUrl.publicUrl,
    });

  } catch (error) {
    console.error("Erro no upload:", error);
    return res.status(500).json({ message: "Erro interno no upload." });
  }
}


export async function createBanner(req, res) {
  const {
    title,
    image_desktop_url,
    image_mobile_url,
    link_url,
    start_at,
    end_at,
    status
  } = req.body;

  if (!title || !image_desktop_url || !image_mobile_url) {
    return res.status(400).json({
      message: "Título e imagens são obrigatórios."
    });
  }

  try {
    await db.query(`
      INSERT INTO banners (
        title,
        image_desktop_url,
        image_mobile_url,
        link_url,
        start_at,
        end_at,
        status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [
      title,
      image_desktop_url,
      image_mobile_url,
      link_url || null,
      start_at || null,
      end_at || null,
      status || "draft"
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
      ORDER BY created_at DESC
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
    status
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
        updated_at = NOW()
      WHERE id_banner = $8
    `, [
      title,
      image_desktop_url,
      image_mobile_url,
      link_url || null,
      start_at || null,
      end_at || null,
      status,
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
