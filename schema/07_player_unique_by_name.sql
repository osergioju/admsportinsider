-- ============================================================
-- Migration 07: Troca a chave única de players de
--   (full_name, birthday)  →  (full_name)
--
-- Motivo: birthday vinha em formatos diferentes entre CSVs de anos
-- distintos, causando players duplicados quando a birthday ficava NULL
-- ou era parseada errado. Como a probabilidade de dois jogadores com
-- exatamente o mesmo full_name no Brasileirão é mínima, usar só o
-- nome como chave é mais robusto.
--
-- O campo birthday continua existindo para exibição — só sai da chave.
-- ============================================================

BEGIN;

-- 1. Remove a constraint composta antiga
ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS uq_player_name_birthday;

-- Remove também a constraint simples de nome, se ainda existir
ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS players_full_name_unique;

-- 2. Antes de criar a nova constraint, mescla quaisquer duplicatas
--    por nome (pode restar alguma do import antigo):
--    mantém o de menor id, redireciona player_seasons, deleta os outros.

-- 2a. Remove player_seasons do duplicado quando já existe no keeper
DELETE FROM player_seasons ps_dup
USING (
  SELECT MIN(id_player) AS keep_id, MAX(id_player) AS dup_id
  FROM players
  GROUP BY full_name
  HAVING COUNT(*) > 1
) d
WHERE ps_dup.id_player = d.dup_id
  AND EXISTS (
    SELECT 1 FROM player_seasons ps_keep
    WHERE ps_keep.id_player             = d.keep_id
      AND ps_keep.id_club_league_season = ps_dup.id_club_league_season
  );

-- 2b. Redireciona player_seasons restantes
UPDATE player_seasons ps_dup
SET id_player = d.keep_id
FROM (
  SELECT MIN(id_player) AS keep_id, MAX(id_player) AS dup_id
  FROM players
  GROUP BY full_name
  HAVING COUNT(*) > 1
) d
WHERE ps_dup.id_player = d.dup_id;

-- 2c. Atualiza birthday no keeper se estiver NULL e o duplicado tiver valor
UPDATE players p_keep
SET birthday = p_dup.birthday
FROM (
  SELECT MIN(id_player) AS keep_id, MAX(id_player) AS dup_id
  FROM players
  GROUP BY full_name
  HAVING COUNT(*) > 1
) d
JOIN players p_dup ON p_dup.id_player = d.dup_id
WHERE p_keep.id_player = d.keep_id
  AND p_keep.birthday IS NULL
  AND p_dup.birthday IS NOT NULL;

-- 2d. Deleta os duplicados
DELETE FROM players
WHERE id_player IN (
  SELECT MAX(id_player)
  FROM players
  GROUP BY full_name
  HAVING COUNT(*) > 1
);

-- 3. Cria nova constraint apenas por full_name
ALTER TABLE public.players
  ADD CONSTRAINT uq_player_full_name UNIQUE (full_name);

-- Verificação (deve retornar 0):
-- SELECT full_name, COUNT(*) FROM players GROUP BY full_name HAVING COUNT(*) > 1;

COMMIT;
