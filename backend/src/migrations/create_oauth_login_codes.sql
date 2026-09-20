-- Código de troca de uso único pro callback do login com Google.
-- Em vez de mandar o JWT na URL do redirect (?token=...), o backend guarda
-- o JWT aqui associado a um código aleatório de vida curta; o front troca
-- o código pelo token via POST (não fica na URL, histórico ou logs).
CREATE TABLE IF NOT EXISTS oauth_login_codes (
  id          SERIAL PRIMARY KEY,
  code_hash   VARCHAR(64) NOT NULL UNIQUE,
  token       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_login_codes_expires_at ON oauth_login_codes (expires_at);
