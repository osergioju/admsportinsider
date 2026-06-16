-- Padroniza os códigos de idioma (locale): remove o sufixo de região.
--   pt-BR → pt   |   en-US → en   |   ES → es   |   es-ES → es
--
-- Afeta o code da tabela `regions` (= locale) e a coluna `locale` de TODAS as
-- tabelas de tradução, em lockstep, pra as traduções continuarem casando.
--
-- Idempotente: split_part(lower('pt'),'-',1) = 'pt' (rodar de novo não muda nada).
-- Usuários não quebram: users.region_id é FK por id, não pelo code.

BEGIN;

UPDATE regions                          SET code   = split_part(lower(code),   '-', 1);
UPDATE club_translations                SET locale = split_part(lower(locale), '-', 1);
UPDATE country_translations             SET locale = split_part(lower(locale), '-', 1);
UPDATE league_translations              SET locale = split_part(lower(locale), '-', 1);
UPDATE common_term_translations         SET locale = split_part(lower(locale), '-', 1);
UPDATE financial_indicator_translations SET locale = split_part(lower(locale), '-', 1);

COMMIT;
