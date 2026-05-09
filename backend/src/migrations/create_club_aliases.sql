-- Aliases alternativos para clubes (ex: "Bayern München" → "Bayern de Munique")
-- alias_norm é o slug normalizado (slugify lowercase strict) — chave única
-- Garante que um mesmo alias só aponta para um clube

CREATE TABLE IF NOT EXISTS club_aliases (
  id         SERIAL PRIMARY KEY,
  id_club    INTEGER NOT NULL REFERENCES clubs(id_club) ON DELETE CASCADE,
  alias_raw  TEXT NOT NULL,
  alias_norm TEXT NOT NULL,
  UNIQUE(alias_norm)
);

CREATE INDEX IF NOT EXISTS idx_club_aliases_id_club ON club_aliases(id_club);
