-- Biblioteca de mídias (aba "Mídias" do admin). Todo upload de imagem do sistema
-- vira uma linha aqui; os arquivos ficam em uploads/media/ (original + large/medium/small/xsmall).
CREATE TABLE IF NOT EXISTS media (
  id            SERIAL PRIMARY KEY,
  file_name     TEXT        NOT NULL UNIQUE,          -- nome normalizado, sem extensão
  original_name TEXT        NOT NULL,                 -- nome como o usuário enviou
  ext           VARCHAR(5)  NOT NULL,                 -- jpg | png | gif | webp
  mime_type     VARCHAR(50) NOT NULL,
  size_bytes    INTEGER     NOT NULL,
  width         INTEGER     NOT NULL,
  height        INTEGER     NOT NULL,
  sizes         JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- { large: {width,height,bytes}, medium: ..., small: ..., xsmall: ... }
  title         TEXT,
  alt_text      TEXT,
  uploaded_by   UUID,                                 -- users.id
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_created_at ON media (created_at DESC, id DESC);
