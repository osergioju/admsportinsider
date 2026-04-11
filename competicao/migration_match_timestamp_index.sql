-- Migration: índice parcial para deduplicar partidas sem game_week (mata-mata, copa, etc.)
-- Executar no banco antes de importar competições sem rodada definida (ex: Copa do Brasil)

CREATE UNIQUE INDEX IF NOT EXISTS uq_match_by_timestamp
  ON public.matches (id_league, id_season, home_club_id, away_club_id, match_timestamp)
  WHERE game_week IS NULL AND match_timestamp IS NOT NULL;
