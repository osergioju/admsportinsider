import { MediaError } from "./media.errors.js";

// SVG é XML e pode carregar script. Como /uploads é servido no MESMO domínio do app, um SVG
// com <script>/onload aberto direto na URL executaria código com a origem do site (XSS).
// Por isso NÃO tentamos "limpar": qualquer coisa executável ou externa REJEITA o arquivo.

const REJECT = (msg) => { throw new MediaError(`SVG recusado: ${msg}`, 415); };

// Decodifica entidades numéricas (&#106; &#x6a;) antes de checar, p/ não burlar os filtros.
function decodeNumericEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16) || 32))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(parseInt(d, 10) || 32));
}

const SAFE_REF = /^(#|data:image\/(png|jpe?g|gif|webp);base64,)/i;

export function assertSafeSvg(buffer) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    REJECT("o arquivo não é texto UTF-8 válido.");
  }
  text = text.replace(/^﻿/, "");
  const s = decodeNumericEntities(text);

  // Raiz precisa ser <svg> (depois de declaração XML e comentários).
  const head = s.replace(/^\s*(<\?xml[^>]*\?>\s*|<!--[\s\S]*?-->\s*)*/i, "");
  if (!/^<svg[\s>]/i.test(head)) REJECT("o conteúdo não começa com <svg>.");

  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(s)) REJECT("DOCTYPE/ENTITY não são permitidos.");
  if (/<\s*(script|foreignObject|iframe|object|embed|applet|audio|video|canvas|link|meta|base|form|input|animate|set)\b/i.test(s)) {
    REJECT("contém elementos não permitidos (script, foreignObject, etc.).");
  }
  if (/[\s"'/]on[a-z]+\s*=/i.test(s)) REJECT("contém atributos de evento (onload, onclick…).");
  if (/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:|v\s*b\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i.test(s)) REJECT("contém javascript:.");
  if (/expression\s*\(|@import|-moz-binding|behavior\s*:/i.test(s)) REJECT("CSS com recurso externo/executável.");

  // href / xlink:href só podem apontar p/ âncora interna (#id) ou raster embutido em base64.
  for (const m of s.matchAll(/(?:xlink:)?href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    if (!SAFE_REF.test((m[1] ?? m[2] ?? "").trim())) REJECT("referência externa em href.");
  }
  // url(...) só para #id ou raster embutido.
  for (const m of s.matchAll(/url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi)) {
    if (!SAFE_REF.test(m[2].trim())) REJECT("url() externa.");
  }
}
