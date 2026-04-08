-- Expand player_stats, match_stats, club_competition_stats and leagues
-- to accommodate all relevant columns from the CSV files (players, matches, teams).
-- Run after schema 04. All statements use IF NOT EXISTS for idempotency.

-- ─────────────────────────────────────────────────────────────────────────────
-- player_stats: add all missing performance columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.player_stats
  -- Minutes / appearances
  ADD COLUMN IF NOT EXISTS minutes_total    integer,
  ADD COLUMN IF NOT EXISTS matches_total    integer,
  ADD COLUMN IF NOT EXISTS matches_started  integer,

  -- Goals split
  ADD COLUMN IF NOT EXISTS goals_home  integer,
  ADD COLUMN IF NOT EXISTS goals_away  integer,

  -- Assists split
  ADD COLUMN IF NOT EXISTS assists_home  integer,
  ADD COLUMN IF NOT EXISTS assists_away  integer,

  -- Penalties
  ADD COLUMN IF NOT EXISTS penalties_scored  integer,
  ADD COLUMN IF NOT EXISTS penalties_missed  integer,

  -- Clean sheets (mainly for goalkeepers / defenders)
  ADD COLUMN IF NOT EXISTS clean_sheets_total  integer,
  ADD COLUMN IF NOT EXISTS clean_sheets_home   integer,
  ADD COLUMN IF NOT EXISTS clean_sheets_away   integer,

  -- Cards
  ADD COLUMN IF NOT EXISTS yellow_cards  integer,
  ADD COLUMN IF NOT EXISTS red_cards     integer,

  -- Shooting
  ADD COLUMN IF NOT EXISTS shot_accuracy_pct  numeric(5,2),

  -- Passing
  ADD COLUMN IF NOT EXISTS pass_completion_rate  numeric(5,2),
  ADD COLUMN IF NOT EXISTS short_passes          integer,
  ADD COLUMN IF NOT EXISTS long_passes           integer,
  ADD COLUMN IF NOT EXISTS key_passes            integer,

  -- Defensive / pressing
  ADD COLUMN IF NOT EXISTS interceptions  integer,
  ADD COLUMN IF NOT EXISTS crosses_total  integer,

  -- Dribbling
  ADD COLUMN IF NOT EXISTS dribbles_total       integer,
  ADD COLUMN IF NOT EXISTS dribbles_successful  integer,

  -- Duels
  ADD COLUMN IF NOT EXISTS duels_won_pct  numeric(5,2),

  -- Goalkeeping
  ADD COLUMN IF NOT EXISTS saves_total       integer,
  ADD COLUMN IF NOT EXISTS inside_box_saves  integer,

  -- Offsides / fouls
  ADD COLUMN IF NOT EXISTS offsides         integer,
  ADD COLUMN IF NOT EXISTS fouls_committed  integer;

-- ─────────────────────────────────────────────────────────────────────────────
-- match_stats: add pre-match xG and half-time goals
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.match_stats
  ADD COLUMN IF NOT EXISTS home_xg_pre    numeric(5,3),
  ADD COLUMN IF NOT EXISTS away_xg_pre    numeric(5,3),
  ADD COLUMN IF NOT EXISTS home_goals_ht  integer,
  ADD COLUMN IF NOT EXISTS away_goals_ht  integer;

-- ─────────────────────────────────────────────────────────────────────────────
-- club_competition_stats: half-time result columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.club_competition_stats
  ADD COLUMN IF NOT EXISTS ht_winning_total  integer,
  ADD COLUMN IF NOT EXISTS ht_winning_home   integer,
  ADD COLUMN IF NOT EXISTS ht_winning_away   integer,

  ADD COLUMN IF NOT EXISTS ht_drawing_total  integer,
  ADD COLUMN IF NOT EXISTS ht_drawing_home   integer,
  ADD COLUMN IF NOT EXISTS ht_drawing_away   integer,

  ADD COLUMN IF NOT EXISTS ht_losing_total  integer,
  ADD COLUMN IF NOT EXISTS ht_losing_home   integer,
  ADD COLUMN IF NOT EXISTS ht_losing_away   integer,

  ADD COLUMN IF NOT EXISTS ht_goals_scored_total  integer,
  ADD COLUMN IF NOT EXISTS ht_goals_scored_home   integer,
  ADD COLUMN IF NOT EXISTS ht_goals_scored_away   integer,

  ADD COLUMN IF NOT EXISTS ht_goals_conceded_total  integer,
  ADD COLUMN IF NOT EXISTS ht_goals_conceded_home   integer,
  ADD COLUMN IF NOT EXISTS ht_goals_conceded_away   integer;

-- ─────────────────────────────────────────────────────────────────────────────
-- leagues: organizer field
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS organizer varchar(200);
