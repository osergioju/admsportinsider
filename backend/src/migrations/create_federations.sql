-- Tabela de federações (FIFA, UEFA, CONMEBOL, AFC, CAF, CONCACAF, OFC)
CREATE TABLE IF NOT EXISTS federations (
  id_federation SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  acronym       VARCHAR(20)  NOT NULL UNIQUE,
  logo_url      TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 99,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FIFA sempre vem primeiro (sort_order = 0)
INSERT INTO federations (name, acronym, sort_order) VALUES
  ('FIFA',      'FIFA',     0),
  ('UEFA',      'UEFA',     1),
  ('CONMEBOL',  'CONMEBOL', 2),
  ('CONCACAF',  'CONCACAF', 3),
  ('AFC',       'AFC',      4),
  ('CAF',       'CAF',      5),
  ('OFC',       'OFC',      6)
ON CONFLICT (acronym) DO NOTHING;

-- FK em leagues
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS id_federation INTEGER REFERENCES federations(id_federation);
