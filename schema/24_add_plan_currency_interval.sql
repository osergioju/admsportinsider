-- Moeda e periodicidade de cobrança do plano.
-- Quando o plano tem Price ID do Stripe, o controller sobrescreve estes valores com os do Stripe
-- (fonte da verdade da cobrança); aqui ficam para exibição e para planos sem Price ID (ex.: Free).
ALTER TABLE plans ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'BRL';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(10) NOT NULL DEFAULT 'month';
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_billing_interval_chk;
ALTER TABLE plans ADD CONSTRAINT plans_billing_interval_chk CHECK (billing_interval IN ('month', 'year'));
