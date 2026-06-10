-- Suporte a jogadores de seleções nacionais (ex: Copa do Mundo)
-- Cria country_league_seasons e estende player_seasons com alternativa a id_club.

-- Tabela análoga a club_league_seasons, mas para seleções nacionais
CREATE TABLE IF NOT EXISTS country_league_seasons (
    id_country_league_season SERIAL PRIMARY KEY,
    id_country INT NOT NULL REFERENCES countries(id_country),
    id_league  INT NOT NULL REFERENCES leagues(id_league),
    id_season  INT NOT NULL REFERENCES seasons(id_season),
    UNIQUE(id_country, id_league, id_season)
);

-- Torna id_club_league_season opcional (era NOT NULL)
ALTER TABLE player_seasons ALTER COLUMN id_club_league_season DROP NOT NULL;

-- Adiciona coluna alternativa para seleções nacionais
ALTER TABLE player_seasons
    ADD COLUMN IF NOT EXISTS id_country_league_season INT
    REFERENCES country_league_seasons(id_country_league_season);

-- Garante que pelo menos um dos dois está preenchido
ALTER TABLE player_seasons
    ADD CONSTRAINT ps_has_team
    CHECK (id_club_league_season IS NOT NULL OR id_country_league_season IS NOT NULL);

-- Remove unique constraint original (pode não existir se já usou índice)
ALTER TABLE player_seasons
    DROP CONSTRAINT IF EXISTS player_seasons_id_player_id_club_league_season_key;

-- Índices únicos parciais — um para modo clubes, outro para modo seleções
CREATE UNIQUE INDEX IF NOT EXISTS ps_unique_club
    ON player_seasons(id_player, id_club_league_season)
    WHERE id_club_league_season IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ps_unique_country
    ON player_seasons(id_player, id_country_league_season)
    WHERE id_country_league_season IS NOT NULL;
