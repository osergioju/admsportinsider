-- Suporte à planilha de Identificação (Tier 1/2/3, Países, Cidades,
-- Federações, Estádios, Competições). Cria o que não existia (cities,
-- stadiums) e adapta o que já existia às colunas novas da planilha.
-- "O que é?", "Escudo" e "Check" da aba Clubes não viram coluna: são
-- fórmula/QA da própria planilha, não dado a persistir.

-- 1) Países: slug (chave de ponte) e continente
ALTER TABLE countries
    ADD COLUMN IF NOT EXISTS slug VARCHAR(120),
    ADD COLUMN IF NOT EXISTS id_continent INTEGER REFERENCES continents(id_continent);

CREATE UNIQUE INDEX IF NOT EXISTS uq_countries_slug ON countries (slug) WHERE slug IS NOT NULL;

-- 2) Cidades (não existia)
CREATE TABLE IF NOT EXISTS cities (
    id_city     SERIAL PRIMARY KEY,
    slug        VARCHAR(160) NOT NULL,
    name        VARCHAR(160) NOT NULL,
    name_en     VARCHAR(160),
    name_pt     VARCHAR(160),
    name_es     VARCHAR(160),
    id_country  INTEGER NOT NULL REFERENCES countries(id_country),
    created_at  TIMESTAMP DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cities_slug ON cities (slug);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities (id_country);

-- 3) Estádios (não existia; hoje é só texto solto em clubs.stadium_*)
CREATE TABLE IF NOT EXISTS stadiums (
    id_stadium      SERIAL PRIMARY KEY,
    slug            VARCHAR(180) NOT NULL,
    name            VARCHAR(200),
    formal_name     VARCHAR(200),
    popular_name    VARCHAR(200),
    commercial_name VARCHAR(200),
    id_country      INTEGER REFERENCES countries(id_country),
    id_city         INTEGER REFERENCES cities(id_city),
    address         TEXT,
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    built_at        DATE,
    built_year      SMALLINT,
    renovated_at    DATE,
    renovated_year  SMALLINT,
    capacity        INTEGER,
    capacity_source TEXT,
    owner           VARCHAR(200),
    owner_source    TEXT,
    created_at      TIMESTAMP DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_stadiums_slug ON stadiums (slug);
CREATE INDEX IF NOT EXISTS idx_stadiums_country ON stadiums (id_country);
CREATE INDEX IF NOT EXISTS idx_stadiums_city ON stadiums (id_city);

-- 4) Federações: cidade agora também por FK (city_name de texto livre continua existindo)
ALTER TABLE federations
    ADD COLUMN IF NOT EXISTS id_city INTEGER REFERENCES cities(id_city);

-- 5) Competições (tabela leagues): esfera e categoria do organizador.
-- Nomes traduzidos NÃO viram coluna aqui: já existe league_translations
-- (id_league, locale, name), é o que uploadLeagueXlsx já usa.
-- organizer já guarda o nome da entidade (ex: "CAF", "LaLiga") — mantido como está,
-- é o equivalente a "Nome da entidade" da planilha. organizer_type é a categoria nova
-- ("Liga" / "Federação" / "Confederação"...), fica nula nas ligas existentes.
ALTER TABLE leagues
    ADD COLUMN IF NOT EXISTS sphere VARCHAR(40),
    ADD COLUMN IF NOT EXISTS organizer_type VARCHAR(60);

-- 6) Clubes: vínculo com cidade/estádio, dados societários e sucessão.
-- Nomes traduzidos NÃO viram coluna aqui: já existe club_translations
-- (id_club, locale, name), é o que uploadClubXlsx já usa.
-- Vínculo com estádio é pelo SLUG (não pelo id_stadium), a pedido:
-- a planilha liga Tier 1 <-> Estádios pelo par de slugs, não por id.
ALTER TABLE clubs
    ADD COLUMN IF NOT EXISTS id_city INTEGER REFERENCES cities(id_city),
    ADD COLUMN IF NOT EXISTS stadium_slug VARCHAR(180) REFERENCES stadiums(slug),
    ADD COLUMN IF NOT EXISTS founded_year SMALLINT,
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS document_source TEXT,
    ADD COLUMN IF NOT EXISTS company_code VARCHAR(80),
    ADD COLUMN IF NOT EXISTS lifecycle_phase VARCHAR(20),
    ADD COLUMN IF NOT EXISTS has_succession_chain BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS successor_slug VARCHAR(180),
    ADD COLUMN IF NOT EXISTS predecessor_slug VARCHAR(180);

CREATE INDEX IF NOT EXISTS idx_clubs_city ON clubs (id_city);
CREATE INDEX IF NOT EXISTS idx_clubs_stadium_slug ON clubs (stadium_slug);

COMMENT ON COLUMN clubs.ownership_model IS 'Estrutura societária (sigla, ex: LLC, S/A) — reaproveitado, estava sem uso.';
COMMENT ON COLUMN clubs.successor_slug IS 'Slug de outro clube (chain real) ou nome livre entre aspas quando o sucessor não tem cadastro próprio.';
COMMENT ON COLUMN clubs.predecessor_slug IS 'Slug de outro clube (chain real) ou nome livre entre aspas quando o antecessor não tem cadastro próprio.';
COMMENT ON COLUMN leagues.organizer IS 'Nome da entidade organizadora (ex: CAF, LaLiga, DFL) — equivalente a "Nome da entidade" da planilha.';
COMMENT ON COLUMN leagues.organizer_type IS 'Categoria do organizador (Liga/Federação/Confederação...) — novo, nulo nas ligas já cadastradas até preenchimento.';
