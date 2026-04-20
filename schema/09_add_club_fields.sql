-- Campos extras de clube: nome curto, capacidade e tipo de propriedade do estádio
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS short_name VARCHAR(50);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS stadium_capacity INT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS stadium_ownership VARCHAR(100);

-- Tabela de proprietários do clube com % de participação
CREATE TABLE IF NOT EXISTS club_owners (
  id            SERIAL PRIMARY KEY,
  id_club       INT NOT NULL REFERENCES clubs(id_club) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  ownership_pct NUMERIC(5,2),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_owners_club ON club_owners(id_club);
