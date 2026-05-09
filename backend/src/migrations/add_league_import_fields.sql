ALTER TABLE leagues ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE leagues ADD CONSTRAINT IF NOT EXISTS leagues_slug_unique UNIQUE (slug);

CREATE TABLE IF NOT EXISTS league_translations (
  id         SERIAL PRIMARY KEY,
  id_league  INT NOT NULL REFERENCES leagues(id_league) ON DELETE CASCADE,
  locale     VARCHAR(5) NOT NULL,
  name       TEXT NOT NULL,
  UNIQUE (id_league, locale)
);
