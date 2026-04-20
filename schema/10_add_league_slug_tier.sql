-- Adiciona slug e tier à tabela leagues
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS slug varchar(100);
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS tier varchar(10);
