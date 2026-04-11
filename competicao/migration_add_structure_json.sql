-- Migration: adicionar coluna structure_json à tabela leagues
-- Executar no banco de produção/desenvolvimento

ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS structure_json jsonb NULL;

-- Comentário: esta coluna armazena a estrutura completa da competição
-- em formato JSON, incluindo tipo, fases, formatos e regras de cada fase.
-- Exemplo de valor:
-- {
--   "nome": "Copa do Brasil",
--   "tipo": "mata_mata",
--   "fases": [
--     { "nome": "1ª Fase", "tipo": "mata_mata", "formato": "turno_unico", "jogos_por_confronto": 1, "desempate": "penalties" },
--     { "nome": "Final",   "tipo": "mata_mata", "formato": "ida_volta",   "jogos_por_confronto": 2, "desempate": "gol_fora" }
--   ]
-- }
