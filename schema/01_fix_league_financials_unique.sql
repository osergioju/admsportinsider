-- Fix: league_financials lacks UNIQUE(id_league, id_indicator, year)
-- Without this, ON CONFLICT (id_league, id_indicator, year) in upload.controller.js fails at runtime.

ALTER TABLE public.league_financials
  ADD CONSTRAINT uq_league_financials
  UNIQUE (id_league, id_indicator, year);
