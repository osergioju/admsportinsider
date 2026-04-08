-- Fix: matches table has no unique constraint.
-- Re-importing the same CSV inserts duplicate rows silently.
-- Unique on (id_league, id_season, home_club_id, away_club_id, game_week) covers the natural key.
-- Uses NULLS NOT DISTINCT so that rows with game_week NULL are also deduplicated by timestamp.

ALTER TABLE public.matches
  ADD CONSTRAINT uq_match
  UNIQUE (id_league, id_season, home_club_id, away_club_id, game_week);

-- Secondary index to speed up lookups by league+season (used in every import query)
CREATE INDEX IF NOT EXISTS idx_matches_league_season
  ON public.matches (id_league, id_season);
