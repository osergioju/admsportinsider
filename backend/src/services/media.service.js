import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  MEDIA_DIR,
  MEDIA_URL_PATH,
  ALLOWED_FORMATS,
  ALLOWED_EXTENSIONS,
  MEDIA_SIZES,
  MEDIA_MAX_PIXELS,
  MEDIA_NAME_MAX,
  uploadsBaseUrl,
} from "../config/media.js";
import { MediaError } from "./media.errors.js";
import { assertSafeSvg } from "./svg.js";

export { MediaError };

// Nome de arquivo seguro p/ importação e URL: sem acento, minúsculo, só [a-z0-9-].
// "Escudo Grêmio (novo)_v2.PNG" → "escudo-gremio-novo-v2" (a extensão é tratada à parte).
export function normalizeFileName(input, fallback = "imagem") {
  const base = String(input ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MEDIA_NAME_MAX)
    .replace(/-+$/g, "");
  return base || fallback;
}

// Tira só a extensão final do nome ORIGINAL enviado pelo usuário.
export function stripExtension(fileName) {
  return path.basename(String(fileName ?? "")).replace(/\.[^.]*$/, "");
}

function pathsFor(base, ext) {
  if (ext === "svg") return { original: path.join(MEDIA_DIR, `${base}.svg`) }; // vetorial: sem versões
  return {
    original: path.join(MEDIA_DIR, `${base}.${ext}`),
    ...Object.fromEntries(Object.keys(MEDIA_SIZES).map((s) => [s, path.join(MEDIA_DIR, `${base}-${s}.webp`)])),
  };
}

// Reserva um nome livre. O nome-base é ÚNICO na biblioteca independente da extensão
// (media.file_name é UNIQUE): "aalen.png" e "aalen.svg" NÃO podem coexistir. Por isso o nome só é
// aceito se (a) nenhum arquivo com esse base existir no disco, em qualquer extensão/versão, e
// (b) `isNameTaken` (consulta ao banco) disser que está livre.
// O original é criado com flag "wx" (atômico) p/ duas requisições simultâneas não pegarem o mesmo nome.
async function claimBase(desired, ext, isNameTaken) {
  for (let i = 0; i < 1000; i++) {
    const suffix = i === 0 ? "" : `-${i}`;
    const base = `${desired.slice(0, MEDIA_NAME_MAX - suffix.length)}${suffix}`;
    const onDisk = [...ALLOWED_EXTENSIONS, ...Object.keys(MEDIA_SIZES).map(() => "webp")].some((e) => fs.existsSync(path.join(MEDIA_DIR, `${base}.${e}`)))
      || Object.keys(MEDIA_SIZES).some((s) => fs.existsSync(path.join(MEDIA_DIR, `${base}-${s}.webp`)));
    if (onDisk) continue;
    if (isNameTaken && (await isNameTaken(base))) continue;
    const p = pathsFor(base, ext);
    try {
      fs.closeSync(fs.openSync(p.original, "wx"));
      return { base, paths: p };
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    }
  }
  throw new MediaError("Não foi possível gerar um nome de arquivo único.", 500);
}

export function mediaUrls(record) {
  const root = `${uploadsBaseUrl()}${MEDIA_URL_PATH}`;
  const urls = { original: `${root}/${record.file_name}.${record.ext}` };
  for (const size of Object.keys(MEDIA_SIZES)) {
    // svg não tem versões: todos os tamanhos apontam pro próprio original (quem consome não precisa tratar caso especial).
    urls[size] = record.ext === "svg" ? urls.original : `${root}/${record.file_name}-${size}.webp`;
  }
  return urls;
}

/**
 * Valida (pelo conteúdo real) e processa uma imagem: grava o original e as versões
 * large/medium/small/xsmall em MEDIA_DIR. Devolve os metadados p/ o registro em `media`.
 * Qualquer arquivo que não seja jpeg/png/gif/webp de verdade é recusado antes de tocar o disco.
 */
export async function processImage(buffer, { originalName = "", nameHint = "", isNameTaken } = {}) {
  let meta;
  try {
    // Texto que começa com "<" é candidato a SVG/XML: valida ANTES de qualquer parser de imagem.
    if (startsLikeXml(buffer)) assertSafeSvg(buffer);
    meta = await sharp(buffer, { limitInputPixels: MEDIA_MAX_PIXELS }).metadata();
    // Barreira final e autoritativa: se o parser de imagem tratou como SVG, o validador TEM que ter passado
    // (cobre SVG que não "parecia" XML no começo, ex.: BOM/lixo antes do <svg>).
    if (meta.format === "svg") assertSafeSvg(buffer);
  } catch (err) {
    if (err instanceof MediaError) throw err;
    throw new MediaError("O arquivo não é uma imagem válida.", 415);
  }

  const ext = ALLOWED_FORMATS[meta.format];
  if (!ext) {
    throw new MediaError("Formato não permitido. Envie apenas jpeg, jpg, png, gif, webp ou svg.", 415);
  }
  if (!meta.width || !meta.height) throw new MediaError("Imagem sem dimensões válidas.", 415);

  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const isSvg = ext === "svg";

  const desired = normalizeFileName(nameHint || stripExtension(originalName));
  const { base, paths } = await claimBase(desired, ext, isNameTaken);
  const written = [paths.original];

  try {
    fs.writeFileSync(paths.original, buffer);

    const sizes = {};
    for (const [size, max] of isSvg ? [] : Object.entries(MEDIA_SIZES)) {
      // Sem `animated`: gif vira webp estático (1º quadro). rotate() aplica a orientação EXIF.
      const info = await sharp(buffer, { limitInputPixels: MEDIA_MAX_PIXELS })
        .rotate()
        .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(paths[size]);
      written.push(paths[size]);
      sizes[size] = { width: info.width, height: info.height, bytes: info.size };
    }

    return {
      file_name: base,
      original_name: path.basename(String(originalName || "")).slice(0, 255) || `${base}.${ext}`,
      ext,
      mime_type: isSvg ? "image/svg+xml" : `image/${meta.format}`,
      size_bytes: buffer.length,
      width: meta.width,
      height: meta.height,
      sizes,
    };
  } catch (err) {
    removeFiles(written); // não deixa arquivo órfão se algo falhar no meio
    throw err;
  }
}

function startsLikeXml(buffer) {
  return /^(\uFEFF)?\s*</.test(buffer.subarray(0, 64).toString("utf8"));
}

function removeFiles(files) {
  for (const f of files) {
    try { fs.unlinkSync(f); } catch (err) { if (err.code !== "ENOENT") console.error("Falha ao remover", f, err.message); }
  }
}

export function deleteMediaFiles(record) {
  removeFiles(Object.values(pathsFor(record.file_name, record.ext)));
}
