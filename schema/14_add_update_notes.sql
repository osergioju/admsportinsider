-- Tabela de "Notas de atualização" (/update-notes), editável pelo admin.
-- Mesma estrutura de legal_sections (CRUD + ordenação + is_active + body_html).

CREATE TABLE IF NOT EXISTS update_notes (
  id          SERIAL PRIMARY KEY,
  tag         TEXT        NOT NULL,                 -- título da nota (ex.: "v2.4 — Junho/2026")
  paragraphs  JSONB       NOT NULL DEFAULT '[]',    -- legado/fallback
  body_html   TEXT,                                 -- conteúdo rico (WYSIWYG)
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE update_notes ADD COLUMN IF NOT EXISTS body_html TEXT;
