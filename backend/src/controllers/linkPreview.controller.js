import axios from "axios";
import * as cheerio from "cheerio";

function meta($, ...names) {
  for (const name of names) {
    const content =
      $(`meta[property="${name}"]`).attr("content") || $(`meta[name="${name}"]`).attr("content");
    if (content) return content;
  }
  return null;
}

export async function getLinkPreview(req, res) {
  const { url } = req.body;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ message: "URL inválida" });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ message: "Use uma URL http(s)" });
  }

  try {
    const response = await axios.get(parsed.toString(), {
      timeout: 10000,
      maxContentLength: 2 * 1024 * 1024, // 2MB — só precisamos do <head>
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SportInsiderBot/1.0)" },
    });

    const $ = cheerio.load(response.data);
    const title = meta($, "og:title", "twitter:title") || $("title").first().text() || null;
    const image_url = meta($, "og:image", "twitter:image");
    const source_label = meta($, "og:site_name") || parsed.hostname.replace(/^www\./, "");

    return res.json({ title, image_url, source_label });
  } catch (error) {
    console.error("Erro ao buscar prévia do link:", error.message);
    return res.status(400).json({ message: "Não foi possível buscar a prévia dessa URL" });
  }
}
