-- ============================================================
-- Migration 06: Mescla jogadores duplicados causados pelo
-- bug de formato de data (birthday_GMT) no import.
--
-- Causa do bug:
--   CSV 2025 → "19/04/2004" (DD/MM/YYYY) → correto
--   CSV 2024 → "1989/07/08" (YYYY/MM/DD) → normalizeDate
--              interpretava como DD/MM/YYYY e gerava data errada
--              → mesmo jogador recebia dois id_player distintos
--
-- Estratégia:
--   1. Para jogadores com mesmo full_name → guarda o menor id_player
--   2. Redireciona player_seasons do duplicado para o keeper
--      (se já existir player_season igual, deleta o do duplicado)
--   3. Deleta os registros duplicados de players
--
-- RODAR APENAS UMA VEZ. Idempotente por design (SELECT ... HAVING COUNT > 1).
-- ============================================================

BEGIN;

-- ── Passo 1: Remove player_seasons do duplicado quando o keeper
--             já tem o mesmo id_club_league_season (evita conflito de PK).
DELETE FROM player_seasons ps_dup
USING (
  SELECT
    MIN(id_player) AS keep_id,
    MAX(id_player) AS dup_id   -- assume no máximo 2 duplicatas por nome
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

-- ── Passo 2: Redireciona player_seasons restantes do duplicado → keeper
UPDATE player_seasons ps_dup
SET id_player = d.keep_id
FROM (
  SELECT
    MIN(id_player) AS keep_id,
    MAX(id_player) AS dup_id
  FROM players
  GROUP BY full_name
  HAVING COUNT(*) > 1
) d
WHERE ps_dup.id_player = d.dup_id;

-- ── Passo 3: Deleta os jogadores duplicados (agora sem player_seasons)
DELETE FROM players
WHERE id_player IN (
  SELECT MAX(id_player)
  FROM players
  GROUP BY full_name
  HAVING COUNT(*) > 1
);

-- ── Verificação final (deve retornar 0 linhas)
-- SELECT full_name, COUNT(*) FROM players GROUP BY full_name HAVING COUNT(*) > 1;

COMMIT;
