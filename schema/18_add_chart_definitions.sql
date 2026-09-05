-- 18_add_chart_definitions.sql
-- Gerador automático de gráficos (módulo "Publicações"): catálogo de gráficos
-- reutilizáveis, criados a partir dos indicadores financeiros já existentes
-- (financial_indicators + club_financials/unified_league_financials).
--
-- Nota: club_metrics/league_metrics existem no schema mas estão vazios em
-- produção hoje — não são usados como fonte de dado aqui.

CREATE TABLE IF NOT EXISTS chart_definitions (
  id                 SERIAL PRIMARY KEY,
  title              VARCHAR(200)  NOT NULL,
  description        TEXT,
  chart_type         VARCHAR(20)   NOT NULL CHECK (chart_type IN ('line', 'bar', 'gauge')),
  source_type        VARCHAR(30)   NOT NULL DEFAULT 'financial_indicator'
                       CHECK (source_type IN ('financial_indicator')),
  source_params      JSONB         NOT NULL DEFAULT '{}',
  -- ex.: {"scope": "club", "entity_id": 123, "indicator_codes": ["revenue","wages"], "year_from": 2018, "year_to": 2026}
  -- ex.: {"scope": "league", "entity_id": 45, "indicator_codes": ["revenue"]}
  -- ex.: {"scope": "federation", "entity_id": 7, "indicator_codes": ["revenue"]}
  -- ex. gauge: acrescenta {"target_max": 100}
  filters_enabled    JSONB         NOT NULL DEFAULT '{}',
  is_embeddable      BOOLEAN       NOT NULL DEFAULT FALSE,
  embed_token        UUID          NOT NULL DEFAULT gen_random_uuid(),
  status             VARCHAR(20)   NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by_user_id INTEGER,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_chart_definitions_embed_token ON chart_definitions (embed_token);
CREATE INDEX IF NOT EXISTS idx_chart_definitions_embeddable ON chart_definitions (embed_token) WHERE is_embeddable = true;
