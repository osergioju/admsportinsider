-- Permite que club_competition_stats armazene seleções nacionais como países
-- ao invés de clubes (necessário para Copa do Mundo e competições similares).

-- Torna id_club nullable (era NOT NULL)
ALTER TABLE club_competition_stats ALTER COLUMN id_club DROP NOT NULL;

-- Adiciona id_country como alternativa a id_club
ALTER TABLE club_competition_stats ADD COLUMN IF NOT EXISTS id_country INT REFERENCES countries(id_country);

-- Remove constraint unique original (usa nome gerado pelo Postgres)
ALTER TABLE club_competition_stats DROP CONSTRAINT IF EXISTS club_competition_stats_id_competition_season_id_club_key;

-- Índices únicos parciais: um para modo clubes, outro para modo países
CREATE UNIQUE INDEX IF NOT EXISTS ccs_unique_club
    ON club_competition_stats(id_competition_season, id_club)
    WHERE id_club IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ccs_unique_country
    ON club_competition_stats(id_competition_season, id_country)
    WHERE id_country IS NOT NULL;

-- Garante que pelo menos um identificador de time está preenchido
ALTER TABLE club_competition_stats
    ADD CONSTRAINT ccs_has_team
    CHECK (id_club IS NOT NULL OR id_country IS NOT NULL);
