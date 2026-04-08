-- public.club_metrics definition

-- Drop table

-- DROP TABLE public.club_metrics;

CREATE TABLE public.club_metrics (
	id_metric serial4 NOT NULL,
	metric_name varchar(200) NOT NULL,
	metric_category varchar(100) NULL,
	metric_order int4 NULL,
	CONSTRAINT club_metrics_metric_name_key UNIQUE (metric_name),
	CONSTRAINT club_metrics_pkey PRIMARY KEY (id_metric)
);


-- public.countries definition

-- Drop table

-- DROP TABLE public.countries;

CREATE TABLE public.countries (
	id_country serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	flag_url text NULL,
	active bool NULL DEFAULT true,
	CONSTRAINT countries_name_key UNIQUE (name),
	CONSTRAINT countries_pkey PRIMARY KEY (id_country)
);


-- public.league_metrics definition

-- Drop table

-- DROP TABLE public.league_metrics;

CREATE TABLE public.league_metrics (
	id_metric serial4 NOT NULL,
	metric_name varchar(200) NOT NULL,
	metric_category varchar(100) NULL,
	metric_order int4 NULL,
	CONSTRAINT league_metrics_metric_name_key UNIQUE (metric_name),
	CONSTRAINT league_metrics_pkey PRIMARY KEY (id_metric)
);


-- public.seasons definition

-- Drop table

-- DROP TABLE public.seasons;

CREATE TABLE public.seasons (
	id_season serial4 NOT NULL,
	"year" int4 NOT NULL,
	created_at timestamp NULL DEFAULT now(),
	CONSTRAINT seasons_pkey PRIMARY KEY (id_season),
	CONSTRAINT seasons_year_key UNIQUE (year)
);


-- public.clubs definition

-- Drop table

-- DROP TABLE public.clubs;

CREATE TABLE public.clubs (
	id_club serial4 NOT NULL,
	"name" varchar(150) NOT NULL,
	description text NULL,
	crest_url text NULL,
	active bool NULL DEFAULT true,
	created_at timestamp NULL DEFAULT now(),
	founded_at date NULL,
	stadium_name varchar(255) NULL,
	ownership_model varchar(100) NULL,
	primary_color varchar(7) NULL,
	secondary_color varchar(7) NULL,
	id_country int4 NOT NULL,
	slug varchar(100) NULL,
	"location" varchar(255) NULL,
	tertiary_color varchar(7) NULL DEFAULT '#FFFFFF'::character varying,
	CONSTRAINT clubs_pkey PRIMARY KEY (id_club),
	CONSTRAINT fk_clubs_country FOREIGN KEY (id_country) REFERENCES public.countries(id_country)
);
CREATE UNIQUE INDEX clubs_slug_unique ON public.clubs USING btree (slug) WHERE (slug IS NOT NULL);
CREATE UNIQUE INDEX uq_club_name_country ON public.clubs USING btree (lower((name)::text), id_country);
CREATE UNIQUE INDEX uq_clubs_slug ON public.clubs USING btree (slug);


-- public.competitions definition

-- Drop table

-- DROP TABLE public.competitions;

CREATE TABLE public.competitions (
	id_competition serial4 NOT NULL,
	"name" varchar(150) NOT NULL,
	id_country int4 NOT NULL,
	"format" varchar(50) NULL,
	organizer varchar(150) NULL,
	active bool NULL DEFAULT true,
	created_at timestamp NULL DEFAULT now(),
	CONSTRAINT competitions_pkey PRIMARY KEY (id_competition),
	CONSTRAINT competitions_id_country_fkey FOREIGN KEY (id_country) REFERENCES public.countries(id_country)
);


-- public.leagues definition

-- Drop table

-- DROP TABLE public.leagues;

CREATE TABLE public.leagues (
	id_league serial4 NOT NULL,
	id_country int4 NOT NULL,
	"name" varchar(150) NOT NULL,
	description text NULL,
	logo_url text NULL,
	active bool NULL DEFAULT true,
	created_at timestamp NULL DEFAULT now(),
	primary_color varchar(200) NULL,
	"format" varchar(30) NULL,
	CONSTRAINT leagues_name_id_country_key UNIQUE (name, id_country),
	CONSTRAINT leagues_pkey PRIMARY KEY (id_league),
	CONSTRAINT leagues_id_country_fkey FOREIGN KEY (id_country) REFERENCES public.countries(id_country) ON DELETE RESTRICT
);


-- public.matches definition

-- Drop table

-- DROP TABLE public.matches;

CREATE TABLE public.matches (
	id_match serial4 NOT NULL,
	id_league int4 NOT NULL,
	id_season int4 NOT NULL,
	home_club_id int4 NOT NULL,
	away_club_id int4 NOT NULL,
	match_timestamp int8 NULL,
	match_date timestamp NULL,
	status varchar(50) NULL,
	attendance int4 NULL,
	referee varchar(150) NULL,
	stadium_name varchar(255) NULL,
	game_week int4 NULL,
	home_goals int4 NULL,
	away_goals int4 NULL,
	created_at timestamp NULL DEFAULT now(),
	CONSTRAINT matches_pkey PRIMARY KEY (id_match),
	CONSTRAINT uq_match UNIQUE (id_league, id_season, home_club_id, away_club_id, game_week),
	CONSTRAINT fk_match_away_club FOREIGN KEY (away_club_id) REFERENCES public.clubs(id_club),
	CONSTRAINT fk_match_home_club FOREIGN KEY (home_club_id) REFERENCES public.clubs(id_club),
	CONSTRAINT fk_match_league FOREIGN KEY (id_league) REFERENCES public.leagues(id_league),
	CONSTRAINT fk_match_season FOREIGN KEY (id_season) REFERENCES public.seasons(id_season)
);
CREATE INDEX idx_matches_away ON public.matches USING btree (away_club_id);
CREATE INDEX idx_matches_home ON public.matches USING btree (home_club_id);
CREATE INDEX idx_matches_league ON public.matches USING btree (id_league);
CREATE INDEX idx_matches_league_season ON public.matches USING btree (id_league, id_season);
CREATE INDEX idx_matches_season ON public.matches USING btree (id_season);


-- public.players definition

-- Drop table

-- DROP TABLE public.players;

CREATE TABLE public.players (
	id_player serial4 NOT NULL,
	full_name varchar(200) NOT NULL,
	birthday date NULL,
	nationality int4 NULL,
	"position" varchar(50) NULL,
	created_at timestamp NULL DEFAULT now(),
	CONSTRAINT players_pkey PRIMARY KEY (id_player),
	CONSTRAINT uq_player_name_birthday UNIQUE NULLS NOT DISTINCT (full_name, birthday),
	CONSTRAINT fk_players_country FOREIGN KEY (nationality) REFERENCES public.countries(id_country)
);
CREATE INDEX idx_players_name ON public.players USING btree (full_name);


-- public.club_attributes definition

-- Drop table

-- DROP TABLE public.club_attributes;

CREATE TABLE public.club_attributes (
	id_attribute serial4 NOT NULL,
	id_club int4 NOT NULL,
	"key" varchar(100) NOT NULL,
	value text NOT NULL,
	value_type varchar(20) NOT NULL DEFAULT 'string'::character varying,
	created_at timestamp NULL DEFAULT now(),
	CONSTRAINT club_attributes_pkey PRIMARY KEY (id_attribute),
	CONSTRAINT club_attributes_id_club_fkey FOREIGN KEY (id_club) REFERENCES public.clubs(id_club) ON DELETE CASCADE
);
CREATE INDEX idx_club_attributes_id_club ON public.club_attributes USING btree (id_club);
CREATE INDEX idx_club_attributes_key ON public.club_attributes USING btree (key);


-- public.club_league_seasons definition

-- Drop table

-- DROP TABLE public.club_league_seasons;

CREATE TABLE public.club_league_seasons (
	id_club_league_season serial4 NOT NULL,
	id_club int4 NOT NULL,
	id_league int4 NOT NULL,
	id_season int4 NOT NULL,
	league_position int4 NULL,
	performance_rank int4 NULL,
	created_at timestamp NULL DEFAULT now(),
	CONSTRAINT club_league_seasons_pkey PRIMARY KEY (id_club_league_season),
	CONSTRAINT uq_club_league_season UNIQUE (id_club, id_league, id_season),
	CONSTRAINT fk_cls_club FOREIGN KEY (id_club) REFERENCES public.clubs(id_club) ON DELETE CASCADE,
	CONSTRAINT fk_cls_league FOREIGN KEY (id_league) REFERENCES public.leagues(id_league) ON DELETE CASCADE,
	CONSTRAINT fk_cls_season FOREIGN KEY (id_season) REFERENCES public.seasons(id_season) ON DELETE CASCADE
);
CREATE INDEX idx_cls_club ON public.club_league_seasons USING btree (id_club);
CREATE INDEX idx_cls_league ON public.club_league_seasons USING btree (id_league);
CREATE INDEX idx_cls_season ON public.club_league_seasons USING btree (id_season);


-- public.club_seasons definition

-- Drop table

-- DROP TABLE public.club_seasons;

CREATE TABLE public.club_seasons (
	id bigserial NOT NULL,
	id_club int4 NOT NULL,
	id_league int4 NOT NULL,
	"year" int4 NOT NULL,
	division varchar(10) NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT club_seasons_pkey PRIMARY KEY (id),
	CONSTRAINT uq_club_season UNIQUE (id_club, id_league, year),
	CONSTRAINT fk_club_seasons_club FOREIGN KEY (id_club) REFERENCES public.clubs(id_club) ON DELETE CASCADE,
	CONSTRAINT fk_club_seasons_league FOREIGN KEY (id_league) REFERENCES public.leagues(id_league) ON DELETE CASCADE
);


-- public.club_statements definition

-- Drop table

-- DROP TABLE public.club_statements;

CREATE TABLE public.club_statements (
	id_statement serial4 NOT NULL,
	id_club int4 NOT NULL,
	id_metric int4 NOT NULL,
	"year" int4 NOT NULL,
	value numeric NULL,
	CONSTRAINT club_statements_id_club_id_metric_year_key UNIQUE (id_club, id_metric, year),
	CONSTRAINT club_statements_pkey PRIMARY KEY (id_statement),
	CONSTRAINT club_statements_id_club_fkey FOREIGN KEY (id_club) REFERENCES public.clubs(id_club) ON DELETE CASCADE,
	CONSTRAINT club_statements_id_metric_fkey FOREIGN KEY (id_metric) REFERENCES public.club_metrics(id_metric) ON DELETE CASCADE
);
CREATE INDEX idx_club_year ON public.club_statements USING btree (id_club, year);
CREATE INDEX idx_metric_year ON public.club_statements USING btree (id_metric, year);
CREATE INDEX idx_year ON public.club_statements USING btree (year);


-- public.competition_seasons definition

-- Drop table

-- DROP TABLE public.competition_seasons;

CREATE TABLE public.competition_seasons (
	id_competition_season serial4 NOT NULL,
	id_league int4 NOT NULL,
	id_season int4 NOT NULL,
	CONSTRAINT competition_seasons_id_league_id_season_key UNIQUE (id_league, id_season),
	CONSTRAINT competition_seasons_pkey PRIMARY KEY (id_competition_season),
	CONSTRAINT competition_seasons_id_league_fkey FOREIGN KEY (id_league) REFERENCES public.leagues(id_league) ON DELETE CASCADE
);


-- public.league_statements definition

-- Drop table

-- DROP TABLE public.league_statements;

CREATE TABLE public.league_statements (
	id_statement serial4 NOT NULL,
	id_league int4 NOT NULL,
	id_metric int4 NOT NULL,
	"year" int4 NOT NULL,
	value numeric NULL,
	CONSTRAINT league_statements_id_league_id_metric_year_key UNIQUE (id_league, id_metric, year),
	CONSTRAINT league_statements_pkey PRIMARY KEY (id_statement),
	CONSTRAINT league_statements_id_league_fkey FOREIGN KEY (id_league) REFERENCES public.leagues(id_league) ON DELETE CASCADE,
	CONSTRAINT league_statements_id_metric_fkey FOREIGN KEY (id_metric) REFERENCES public.league_metrics(id_metric) ON DELETE CASCADE
);
CREATE INDEX idx_lg_metric_year ON public.league_statements USING btree (id_metric, year);
CREATE INDEX idx_lg_only_year ON public.league_statements USING btree (year);
CREATE INDEX idx_lg_year ON public.league_statements USING btree (id_league, year);


-- public.match_stats definition

-- Drop table

-- DROP TABLE public.match_stats;

CREATE TABLE public.match_stats (
	id_match_stat serial4 NOT NULL,
	id_match int4 NOT NULL,
	home_shots int4 NULL,
	away_shots int4 NULL,
	home_shots_on_target int4 NULL,
	away_shots_on_target int4 NULL,
	home_possession numeric(5, 2) NULL,
	away_possession numeric(5, 2) NULL,
	home_corners int4 NULL,
	away_corners int4 NULL,
	home_fouls int4 NULL,
	away_fouls int4 NULL,
	home_yellow_cards int4 NULL,
	away_yellow_cards int4 NULL,
	home_red_cards int4 NULL,
	away_red_cards int4 NULL,
	created_at timestamp NULL DEFAULT now(),
	CONSTRAINT match_stats_pkey PRIMARY KEY (id_match_stat),
	CONSTRAINT uq_match_stats UNIQUE (id_match),
	CONSTRAINT fk_match_stats_match FOREIGN KEY (id_match) REFERENCES public.matches(id_match) ON DELETE CASCADE
);
CREATE INDEX idx_match_stats_match ON public.match_stats USING btree (id_match);


-- public.player_season_stats definition

-- Drop table

-- DROP TABLE public.player_season_stats;

CREATE TABLE public.player_season_stats (
	id_stat serial4 NOT NULL,
	id_player int4 NOT NULL,
	id_club int4 NOT NULL,
	id_competition_season int4 NOT NULL,
	minutes_total int4 NULL,
	minutes_home int4 NULL,
	minutes_away int4 NULL,
	matches_total int4 NULL,
	matches_home int4 NULL,
	matches_away int4 NULL,
	goals_total int4 NULL,
	goals_home int4 NULL,
	goals_away int4 NULL,
	assists_total int4 NULL,
	assists_home int4 NULL,
	assists_away int4 NULL,
	penalties_scored int4 NULL,
	penalties_missed int4 NULL,
	shots int4 NULL,
	shots_on_target int4 NULL,
	passes_total int4 NULL,
	passes_accuracy numeric(5, 2) NULL,
	dribbles_total int4 NULL,
	duels_won int4 NULL,
	yellow_cards int4 NULL,
	red_cards int4 NULL,
	CONSTRAINT player_season_stats_id_player_id_club_id_competition_season_key UNIQUE (id_player, id_club, id_competition_season),
	CONSTRAINT player_season_stats_pkey PRIMARY KEY (id_stat),
	CONSTRAINT player_season_stats_id_club_fkey FOREIGN KEY (id_club) REFERENCES public.clubs(id_club),
	CONSTRAINT player_season_stats_id_competition_season_fkey FOREIGN KEY (id_competition_season) REFERENCES public.competition_seasons(id_competition_season)
);


-- public.player_seasons definition

-- Drop table

-- DROP TABLE public.player_seasons;

CREATE TABLE public.player_seasons (
	id_player_season serial4 NOT NULL,
	id_player int4 NOT NULL,
	id_club_league_season int4 NOT NULL,
	shirt_number int4 NULL,
	market_value numeric(14, 2) NULL,
	salary numeric(14, 2) NULL,
	created_at timestamp NULL DEFAULT now(),
	CONSTRAINT player_seasons_pkey PRIMARY KEY (id_player_season),
	CONSTRAINT uq_player_season UNIQUE (id_player, id_club_league_season),
	CONSTRAINT fk_ps_cls FOREIGN KEY (id_club_league_season) REFERENCES public.club_league_seasons(id_club_league_season) ON DELETE CASCADE,
	CONSTRAINT fk_ps_player FOREIGN KEY (id_player) REFERENCES public.players(id_player) ON DELETE CASCADE
);
CREATE INDEX idx_ps_cls ON public.player_seasons USING btree (id_club_league_season);
CREATE INDEX idx_ps_player ON public.player_seasons USING btree (id_player);


-- public.player_stats definition

-- Drop table

-- DROP TABLE public.player_stats;

CREATE TABLE public.player_stats (
	id_player_stat serial4 NOT NULL,
	id_player_season int4 NOT NULL,
	goals int4 NULL,
	assists int4 NULL,
	shots int4 NULL,
	shots_on_target int4 NULL,
	passes int4 NULL,
	tackles int4 NULL,
	duels int4 NULL,
	xg numeric(8, 3) NULL,
	rating numeric(4, 2) NULL,
	created_at timestamp NULL DEFAULT now(),
	CONSTRAINT player_stats_pkey PRIMARY KEY (id_player_stat),
	CONSTRAINT uq_player_stats UNIQUE (id_player_season),
	CONSTRAINT fk_player_stats_ps FOREIGN KEY (id_player_season) REFERENCES public.player_seasons(id_player_season) ON DELETE CASCADE
);
CREATE INDEX idx_player_stats_ps ON public.player_stats USING btree (id_player_season);


-- public.club_competition_stats definition

-- Drop table

-- DROP TABLE public.club_competition_stats;

CREATE TABLE public.club_competition_stats (
	id_stat serial4 NOT NULL,
	id_competition_season int4 NOT NULL,
	id_club int4 NOT NULL,
	position_total int4 NULL,
	position_home int4 NULL,
	position_away int4 NULL,
	points int4 NULL,
	matches_total int4 NULL,
	matches_home int4 NULL,
	matches_away int4 NULL,
	wins_total int4 NULL,
	wins_home int4 NULL,
	wins_away int4 NULL,
	draws_total int4 NULL,
	draws_home int4 NULL,
	draws_away int4 NULL,
	losses_total int4 NULL,
	losses_home int4 NULL,
	losses_away int4 NULL,
	goals_for_total int4 NULL,
	goals_for_home int4 NULL,
	goals_for_away int4 NULL,
	goals_against_total int4 NULL,
	goals_against_home int4 NULL,
	goals_against_away int4 NULL,
	goal_difference int4 NULL,
	shots_total int4 NULL,
	shots_home int4 NULL,
	shots_away int4 NULL,
	shots_on_target_total int4 NULL,
	shots_on_target_home int4 NULL,
	shots_on_target_away int4 NULL,
	possession_total numeric(5, 2) NULL,
	possession_home numeric(5, 2) NULL,
	possession_away numeric(5, 2) NULL,
	clean_sheets_total int4 NULL,
	clean_sheets_home int4 NULL,
	clean_sheets_away int4 NULL,
	fouls_total int4 NULL,
	fouls_home int4 NULL,
	fouls_away int4 NULL,
	yellow_cards int4 NULL,
	red_cards int4 NULL,
	points_per_game numeric(4, 2) NULL,
	points_per_game_home numeric(4, 2) NULL,
	points_per_game_away numeric(4, 2) NULL,
	corners_total int4 NULL,
	corners_home int4 NULL,
	corners_away int4 NULL,
	yellow_cards_home int4 NULL,
	yellow_cards_away int4 NULL,
	red_cards_home int4 NULL,
	red_cards_away int4 NULL,
	btts_count int4 NULL,
	btts_count_home int4 NULL,
	btts_count_away int4 NULL,
	btts_percentage numeric(5, 2) NULL,
	over15_count int4 NULL,
	over25_count int4 NULL,
	over35_count int4 NULL,
	over15_percentage numeric(5, 2) NULL,
	over25_percentage numeric(5, 2) NULL,
	over35_percentage numeric(5, 2) NULL,
	xg_for_avg numeric(5, 3) NULL,
	xg_against_avg numeric(5, 3) NULL,
	goals_scored_per_match numeric(4, 2) NULL,
	goals_conceded_per_match numeric(4, 2) NULL,
	corners_per_match numeric(4, 2) NULL,
	win_percentage numeric(5, 2) NULL,
	draw_percentage numeric(5, 2) NULL,
	loss_percentage numeric(5, 2) NULL,
	clean_sheet_percentage numeric(5, 2) NULL,
	performance_rank int4 NULL,
	CONSTRAINT club_competition_stats_id_competition_season_id_club_key UNIQUE (id_competition_season, id_club),
	CONSTRAINT club_competition_stats_pkey PRIMARY KEY (id_stat),
	CONSTRAINT club_competition_stats_id_club_fkey FOREIGN KEY (id_club) REFERENCES public.clubs(id_club),
	CONSTRAINT club_competition_stats_id_competition_season_fkey FOREIGN KEY (id_competition_season) REFERENCES public.competition_seasons(id_competition_season)
);


-- public.club_financials definition

-- Drop table

-- DROP TABLE public.club_financials;

CREATE TABLE public.club_financials (
	id bigserial NOT NULL,
	id_club int8 NOT NULL,
	id_indicator int8 NOT NULL,
	"year" int4 NOT NULL,
	value numeric(15, 2) NOT NULL,
	created_at timestamptz NULL DEFAULT now(),
	updated_at timestamp NULL DEFAULT now(),
	CONSTRAINT club_financials_pkey PRIMARY KEY (id),
	CONSTRAINT uq_club_financials UNIQUE (id_club, id_indicator, year)
);


-- public.club_financials foreign keys

ALTER TABLE public.club_financials ADD CONSTRAINT fk_club_financials_club FOREIGN KEY (id_club) REFERENCES public.clubs(id_club) ON DELETE CASCADE;
ALTER TABLE public.club_financials ADD CONSTRAINT fk_club_financials_indicator FOREIGN KEY (id_indicator) REFERENCES public.financial_indicators(id) ON DELETE RESTRICT;