-- Migration: suporte ao editor de ligas personalizadas
-- Tabela de atribuição de clubes a grupos/fases
-- Colunas opcionais em matches para rastreamento de fase/grupo

-- 1. Atribuição de clube a uma fase/grupo da competição personalizada
CREATE TABLE IF NOT EXISTS competition_group_clubs (
  id          SERIAL PRIMARY KEY,
  id_league   INTEGER NOT NULL REFERENCES leagues(id_league) ON DELETE CASCADE,
  id_season   INTEGER NOT NULL REFERENCES seasons(id_season) ON DELETE CASCADE,
  phase_key   TEXT    NOT NULL,   -- "nome" da fase no structure_json
  group_key   TEXT,               -- "A", "B", ... ou NULL p/ fases sem grupos
  id_club     INTEGER NOT NULL REFERENCES clubs(id_club) ON DELETE CASCADE,
  slot_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (id_league, id_season, phase_key, id_club)
);

CREATE INDEX IF NOT EXISTS idx_cgc_league_season
  ON competition_group_clubs (id_league, id_season);

-- 2. Colunas de contexto em matches (nullable — não afeta dados existentes)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS phase_key TEXT,
  ADD COLUMN IF NOT EXISTS group_key TEXT;
