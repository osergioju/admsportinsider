-- Clubes ocultos: usados apenas para marcação em importações
-- Não aparecem em listagens/busca pública, mas têm página acessível por ID

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- Permite clubs ocultos sem país associado
ALTER TABLE clubs ALTER COLUMN id_country DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clubs_hidden ON clubs(hidden) WHERE hidden = TRUE;
