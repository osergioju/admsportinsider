-- Escudo alternativo (versão negativa) — usado APENAS na página individual
-- de cada liga/federação quando existir.
ALTER TABLE leagues     ADD COLUMN IF NOT EXISTS logo_url_negative TEXT;
ALTER TABLE federations ADD COLUMN IF NOT EXISTS logo_url_negative TEXT;
