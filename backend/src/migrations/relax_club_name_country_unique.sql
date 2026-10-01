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

-- Corrige 2 pares que vieram do import com os dois lados marcados "Atual"
-- (deveria ser 1 Atual + 1 Histórico, como já está correto no par Miami FC):
UPDATE clubs SET lifecycle_phase = 'Histórico' WHERE id_club = 34243; -- Airdrieonians 1878 (scotland_airdrieonians-1878)
UPDATE clubs SET lifecycle_phase = 'Histórico' WHERE id_club = 34891; -- Kuban Krasnodar 1928 (russia_kuban-1928)

DROP INDEX IF EXISTS uq_club_name_country;

CREATE UNIQUE INDEX uq_club_name_country ON public.clubs USING btree (lower((name)::text), id_country)
  WHERE lifecycle_phase = 'Atual';
