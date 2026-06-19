import { useState, useMemo } from "react";
import { teamCrestSources } from "../../utils/clubUrl";

/**
 * Escudo de time (clube ou seleção) resiliente e performático.
 * - Resolve a melhor fonte primeiro (federação → crest_url → slug) e, se ela
 *   falhar (404, link externo morto), cai para a próxima via onError. NÃO faz
 *   checagem de 404 por fetch — deixa o browser tentar e só troca em erro.
 * - loading="lazy" + decoding="async": não trava listas grandes.
 * - Sem fonte válida (ou todas falharam) → placeholder cinza.
 *
 * Aceita `team` com { federation_slug?, crest? | crest_url?, slug? }.
 */
export default function TeamCrest({ team, size = "w-5 h-5", className = "" }) {
  const sources = useMemo(() => teamCrestSources(team), [team]);
  const [idx, setIdx] = useState(0);

  // Reset da fonte quando o time muda — padrão "ajustar estado no render"
  // (sem useEffect, sem render em cascata).
  const firstSrc = sources[0];
  const [prevFirst, setPrevFirst] = useState(firstSrc);
  if (prevFirst !== firstSrc) {
    setPrevFirst(firstSrc);
    setIdx(0);
  }

  if (!sources.length || idx >= sources.length) {
    return <div className={`${size} rounded-full bg-gray-100 shrink-0 ${className}`} />;
  }

  return (
    <img
      src={sources[idx]}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${size} object-contain shrink-0 ${className}`}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}
