-- Fix: players_full_name_unique UNIQUE(full_name) is insufficient.
-- Two real players can share the same name (e.g. two "João Silva" in different clubs).
-- The correct natural key is (full_name, birthday).
-- Players with null birthday remain deduplicated only by name — acceptable for now.

-- Drop the existing single-column unique constraint
ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS players_full_name_unique;

-- Add composite unique constraint
-- NULLS NOT DISTINCT means two rows with the same full_name and birthday=NULL
-- are still considered duplicates (avoids ghost duplicates from missing DOB data).
ALTER TABLE public.players
  ADD CONSTRAINT uq_player_name_birthday
  UNIQUE NULLS NOT DISTINCT (full_name, birthday);
