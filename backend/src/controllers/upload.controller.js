import { supabase } from "../utils/supabase.js";

export async function uploadClubLogo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    const file = req.file;
    const ext = file.originalname.split(".").pop();
    const filename = `club_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("assets")
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao enviar arquivo." });
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
