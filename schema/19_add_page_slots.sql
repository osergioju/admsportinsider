-- 19_add_page_slots.sql
-- Sistema de "Publicações": páginas modulares (Home, Clubes, Competições,
-- Federações) montadas em slots. Cada slot ocupa 1 (meia página no desktop,
-- página inteira no mobile) ou 2 (página inteira) posições.

CREATE TABLE IF NOT EXISTS page_slots (
  id            SERIAL PRIMARY KEY,
  page_key      VARCHAR(30) NOT NULL CHECK (page_key IN ('home', 'clubs', 'competitions', 'federations')),
  zone          VARCHAR(30) NOT NULL DEFAULT 'default', -- 'hero' | 'body' | 'finance' (só home) | 'default'
  span          SMALLINT NOT NULL CHECK (span IN (1, 2)),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  block_type    VARCHAR(20) NOT NULL CHECK (block_type IN ('text', 'chart', 'external_link', 'number', 'ad')),
  status        VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
  content       JSONB NOT NULL DEFAULT '{}',
  -- text: {title, body_html} | number: {value, caption}
  -- external_link: {url, title, image_url, source_label, is_manual_override}
  -- chart / ad: {} (dado vem das FKs abaixo)
  chart_id      INTEGER NULL REFERENCES chart_definitions(id) ON DELETE SET NULL,
  banner_id     INTEGER NULL REFERENCES banners(id_banner) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_slots_page_zone ON page_slots (page_key, zone, sort_order);

-- Reaproveita a coluna banners.format (existe, mas nunca foi usada/preenchida)
-- para marcar o formato do banner: 'horizontal' (2 slots) ou 'square' (1 slot).
UPDATE banners SET format = 'horizontal' WHERE format IS NULL;
ALTER TABLE banners ALTER COLUMN format SET DEFAULT 'horizontal';
ALTER TABLE banners ALTER COLUMN format SET NOT NULL;
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_format_check;
ALTER TABLE banners ADD CONSTRAINT banners_format_check CHECK (format IN ('horizontal', 'square'));
