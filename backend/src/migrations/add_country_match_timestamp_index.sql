-- Variante de uq_match_by_timestamp para partidas de seleções (home/away_country_id).
-- Sem este índice, reimportar um arquivo de Copa duplicava as partidas de mata-mata
-- (game_week NULL): o ON CONFLICT DO NOTHING não tinha índice único para conflitar.

CREATE UNIQUE INDEX IF NOT EXISTS uq_country_match_by_timestamp
    ON matches (id_league, id_season, home_country_id, away_country_id, match_timestamp)
    WHERE game_week IS NULL AND match_timestamp IS NOT NULL
      AND home_country_id IS NOT NULL AND away_country_id IS NOT NULL;
