-- Premiações por seleção/federação em cada edição da competição
-- (planilha premiacoes.xlsx: seções "Times" — total, performance, fixo — e
--  "Material de apoio" → posição final). Valores em MILHÕES de USD, como na planilha.

CREATE TABLE IF NOT EXISTS edition_team_prizes (
  id            SERIAL PRIMARY KEY,
  id_edition    INT NOT NULL REFERENCES competition_editions(id_edition) ON DELETE CASCADE,
  id_federation INT NOT NULL REFERENCES federations(id_federation),
  year          INT,
  total         NUMERIC,
  performance   NUMERIC,
  fixed         NUMERIC,
  standing      INT,
  UNIQUE (id_edition, id_federation)
);

CREATE INDEX IF NOT EXISTS idx_edition_team_prizes_edition ON edition_team_prizes(id_edition);
