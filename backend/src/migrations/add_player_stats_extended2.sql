-- Migration: adiciona colunas estendidas de stats de jogadores
-- Novos campos: minutos casa/fora, partidas casa/fora, min/jogo,
--               chutes a gol por 90, percentil precisão chute,
--               percentil passes certos, interceptações por 90

ALTER TABLE player_stats
  ADD COLUMN IF NOT EXISTS minutes_home              INTEGER,
  ADD COLUMN IF NOT EXISTS minutes_away              INTEGER,
  ADD COLUMN IF NOT EXISTS minutes_per_match         NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS matches_home              INTEGER,
  ADD COLUMN IF NOT EXISTS matches_away              INTEGER,
  ADD COLUMN IF NOT EXISTS shots_on_target_per90     NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS shots_on_target_per90_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS pass_completion_rate_pct  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS interceptions_per90       NUMERIC(6,3);

-- Translations (common_terms)
INSERT INTO common_terms (code, name_pt) VALUES
  ('player.stat.minutes_home',              'Min. Casa'),
  ('player.stat.minutes_away',              'Min. Fora'),
  ('player.stat.minutes_per_match',         'Min./Jogo'),
  ('player.stat.matches_home',              'Jogos Casa'),
  ('player.stat.matches_away',              'Jogos Fora'),
  ('player.stat.shots_on_target_per90',     'Chutes a gol/90'),
  ('player.stat.shots_on_target_per90_pct', 'Precisão Chute %'),
  ('player.stat.pass_completion_rate_pct',  'Passes Certos %'),
  ('player.stat.interceptions_per90',       'Interc./90')
ON CONFLICT (code) DO NOTHING;
