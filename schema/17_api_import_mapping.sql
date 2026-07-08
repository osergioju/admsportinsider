-- 17_api_import_mapping.sql
-- Vínculos com a API FootyStats para o import via API (tela /admin/api/importar).
--
-- clubs.api_club_id     → id do time no FootyStats (homeID/awayID/club_team_id/teams.id).
--                         Mapeou uma vez, os próximos imports resolvem por ID (não por nome).
-- players.api_player_id → id do jogador no FootyStats (league-players.id).
-- leagues.api_league_name/api_league_country → vínculo da liga com a competição da API.
--                         O FootyStats NÃO tem id fixo de liga (só ids por temporada),
--                         então a chave estável é (name, country) do /league-list.

ALTER TABLE public.clubs   ADD COLUMN IF NOT EXISTS api_club_id   int4;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS api_player_id int4;
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS api_league_name    varchar(200);
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS api_league_country varchar(100);

-- Únicos parciais: cada id da API aponta para no máximo um registro nosso.
CREATE UNIQUE INDEX IF NOT EXISTS uq_clubs_api_club_id
  ON public.clubs (api_club_id) WHERE api_club_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_players_api_player_id
  ON public.players (api_player_id) WHERE api_player_id IS NOT NULL;

-- Uma competição da API só pode alimentar UMA liga da plataforma.
CREATE UNIQUE INDEX IF NOT EXISTS uq_leagues_api_league
  ON public.leagues (api_league_name, api_league_country)
  WHERE api_league_name IS NOT NULL;
