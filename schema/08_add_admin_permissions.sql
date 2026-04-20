-- Adiciona coluna de permissões granulares para usuários com role = 'admin'
-- Tipo text[] (array nativo do Postgres) — cada item é uma chave de permissão
-- ex: '{gestao-dados,usuarios,insights-financeiro}'

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_permissions text[] NOT NULL DEFAULT '{}';
