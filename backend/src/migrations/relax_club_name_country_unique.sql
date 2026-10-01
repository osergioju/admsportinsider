-- A unique index uq_club_name_country (lower(name), id_country) impedia clubes
-- diferentes que legitimamente compartilham nome+país (clube antigo inativo +
-- refundação com o mesmo nome, ex: Airdrieonians 1878 vs 2002, Miami FC 2006
-- vs atual). `slug` continua sendo a unicidade de verdade (unique index
-- próprio, não afetado por esta migration).
--
-- IMPORTANTE: o índice deve ser condicionado a `lifecycle_phase = 'Atual'`,
-- NUNCA a `active` — `active` é só visibilidade no site (toggle de Modo
-- Manutenção, que faz cascata país/federação → clubs), não o status real do
-- clube (extinto/refundado). Usar `active` aqui fazia o bulk "ativar todos"
-- de um país quebrar com violação de unique constraint sempre que esse país
-- tinha um par histórico+atual, porque a cascata liga os dois de uma vez.

-- OBS: a tabela clubs foi zerada e reimportada em 2026-10 antes de rodar esta
-- migration, então os 2 pares que vieram errados do import antigo (dois lados
-- marcados "Atual" em vez de 1 Atual + 1 Histórico, ex: Kuban Krasnodar e
-- Airdrieonians) não existem mais com esses id_club — se o novo import repetir
-- o mesmo erro, corrigir lifecycle_phase manualmente pelo admin para o par
-- duplicado antes de ativar o país em massa, senão esse índice barra o bulk
-- toggle de novo.

DROP INDEX IF EXISTS uq_club_name_country;

CREATE UNIQUE INDEX uq_club_name_country ON public.clubs USING btree (lower((name)::text), id_country)
  WHERE lifecycle_phase = 'Atual';
