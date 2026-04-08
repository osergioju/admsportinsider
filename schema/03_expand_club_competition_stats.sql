-- Expand club_competition_stats to accommodate the teams.csv columns.
-- The current table covers ~30 columns; the CSV provides ~250.
-- This migration adds the most analytically relevant missing fields.
-- Existing columns are left untouched.

ALTER TABLE public.club_competition_stats

  -- Points per game
  ADD COLUMN IF NOT EXISTS points_per_game       numeric(4,2),
  ADD COLUMN IF NOT EXISTS points_per_game_home  numeric(4,2),
  ADD COLUMN IF NOT EXISTS points_per_game_away  numeric(4,2),

  -- Corners
  ADD COLUMN IF NOT EXISTS corners_total  integer,
  ADD COLUMN IF NOT EXISTS corners_home   integer,
  ADD COLUMN IF NOT EXISTS corners_away   integer,

  -- Cards breakdown (yellow and red separately; current table only has yellow+red combined)
  ADD COLUMN IF NOT EXISTS yellow_cards_home integer,
  ADD COLUMN IF NOT EXISTS yellow_cards_away integer,
  ADD COLUMN IF NOT EXISTS red_cards_home    integer,
  ADD COLUMN IF NOT EXISTS red_cards_away    integer,

  -- BTTS (both teams to score)
  ADD COLUMN IF NOT EXISTS btts_count       integer,
  ADD COLUMN IF NOT EXISTS btts_count_home  integer,
  ADD COLUMN IF NOT EXISTS btts_count_away  integer,
  ADD COLUMN IF NOT EXISTS btts_percentage  numeric(5,2),

  -- Over/Under goal lines
  ADD COLUMN IF NOT EXISTS over15_count  integer,
  ADD COLUMN IF NOT EXISTS over25_count  integer,
  ADD COLUMN IF NOT EXISTS over35_count  integer,
  ADD COLUMN IF NOT EXISTS over15_percentage  numeric(5,2),
  ADD COLUMN IF NOT EXISTS over25_percentage  numeric(5,2),
  ADD COLUMN IF NOT EXISTS over35_percentage  numeric(5,2),

  -- xG
  ADD COLUMN IF NOT EXISTS xg_for_avg     numeric(5,3),
  ADD COLUMN IF NOT EXISTS xg_against_avg numeric(5,3),

  -- Per-match averages
  ADD COLUMN IF NOT EXISTS goals_scored_per_match    numeric(4,2),
  ADD COLUMN IF NOT EXISTS goals_conceded_per_match  numeric(4,2),
  ADD COLUMN IF NOT EXISTS corners_per_match         numeric(4,2),

  -- Win / draw / loss percentages
  ADD COLUMN IF NOT EXISTS win_percentage  numeric(5,2),
  ADD COLUMN IF NOT EXISTS draw_percentage numeric(5,2),
  ADD COLUMN IF NOT EXISTS loss_percentage numeric(5,2),

  -- Clean sheet percentage
  ADD COLUMN IF NOT EXISTS clean_sheet_percentage numeric(5,2),

  -- Performance rank (redundant with club_league_seasons but kept here for direct stats queries)
  ADD COLUMN IF NOT EXISTS performance_rank integer;
