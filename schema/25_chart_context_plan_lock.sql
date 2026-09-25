-- 25_chart_context_plan_lock.sql
-- Gerador de gráficos: (1) trava por plano — quais planos podem ver o gráfico (NULL/vazio = todos);
-- (2) tipo "barras empilhadas". Gráfico "do clube da página" não precisa de coluna nova: usa
-- source_params.entity_mode = 'context' e filters_enabled {compare, period, currency, table}.
ALTER TABLE chart_definitions ADD COLUMN IF NOT EXISTS allowed_plan_ids INTEGER[];

ALTER TABLE chart_definitions DROP CONSTRAINT IF EXISTS chart_definitions_chart_type_check;
ALTER TABLE chart_definitions
  ADD CONSTRAINT chart_definitions_chart_type_check CHECK (chart_type IN ('line', 'bar', 'stacked_bar', 'gauge'));
