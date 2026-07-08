-- Armazenamento genérico de configurações da aplicação (chave/valor em texto).
-- Primeiro uso: token da API do FootyStats (chave 'footystats_api_token'),
-- salvo pela tela de API no admin. Idempotente.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
