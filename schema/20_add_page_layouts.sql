-- 20_add_page_layouts.sql
-- Substitui o modelo de "page_slots" (linhas planas, span 1/2) por uma árvore
-- JSON por página+zona — permite grid aninhada (linhas com N colunas, e
-- qualquer coluna pode virar uma grid dentro dela), estilo Elementor.

CREATE TABLE IF NOT EXISTS page_layouts (
  id          SERIAL PRIMARY KEY,
  page_key    VARCHAR(30) NOT NULL CHECK (page_key IN ('home', 'clubs', 'competitions', 'federations')),
  zone        VARCHAR(30) NOT NULL DEFAULT 'default',
  tree        JSONB NOT NULL DEFAULT '{"type":"stack","direction":"column","children":[]}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page_key, zone)
);

-- page_slots foi a primeira versão (só nesta sessão), com uma única linha real
-- (hero da Home). Substituída por page_layouts — o hero é recriado manualmente
-- na árvore nova depois desta migration.
DROP TABLE IF EXISTS page_slots;
