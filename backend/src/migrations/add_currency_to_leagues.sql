-- Adiciona coluna de moeda padrão nas ligas
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) REFERENCES currencies(code);
