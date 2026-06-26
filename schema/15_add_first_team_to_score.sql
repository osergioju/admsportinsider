-- Adiciona contagem de "primeiro a marcar" por clube/temporada.
-- Coluna vem do CSV de teams (first_team_to_score_count) e alimenta a aba
-- "Controle" da página de competições. Idempotente.

ALTER TABLE public.club_competition_stats
  ADD COLUMN IF NOT EXISTS first_team_to_score_count integer;
