-- Suporte a partidas de seleções nacionais (ex: Copa do Mundo)
-- Adiciona home_country_id / away_country_id como alternativa a home_club_id / away_club_id

ALTER TABLE matches ALTER COLUMN home_club_id DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN away_club_id DROP NOT NULL;

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS home_country_id INT REFERENCES countries(id_country);
ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS away_country_id INT REFERENCES countries(id_country);

ALTER TABLE matches
    ADD CONSTRAINT matches_has_home
    CHECK (home_club_id IS NOT NULL OR home_country_id IS NOT NULL);
ALTER TABLE matches
    ADD CONSTRAINT matches_has_away
    CHECK (away_club_id IS NOT NULL OR away_country_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS uq_country_match_gw
    ON matches(id_league, id_season, home_country_id, away_country_id, game_week)
    WHERE home_country_id IS NOT NULL AND away_country_id IS NOT NULL;
