-- Vínculo explícito clube ↔ imagem da biblioteca (aba Mídias).
-- crest_url continua sendo preenchido (URL da versão média) p/ o front atual seguir funcionando;
-- crest_media_id permite substituir o escudo sem acumular arquivos e saber quem usa cada mídia.
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS crest_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_clubs_crest_media_id ON clubs (crest_media_id) WHERE crest_media_id IS NOT NULL;
