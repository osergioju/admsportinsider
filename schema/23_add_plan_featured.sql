-- Plano em destaque ("Recomendado") exibido nas telas de assinatura.
-- Regra de negócio: no máximo 1 plano em destaque (garantido no controller e por índice parcial).
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS plans_single_featured_idx ON plans (is_featured) WHERE is_featured;
