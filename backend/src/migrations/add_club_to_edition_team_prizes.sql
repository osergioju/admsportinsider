-- Premiação por time para competições de CLUBES (Copa de Clubes, Intercontinental).
-- Cada linha aponta para uma federação (seleções) OU um clube — nunca os dois.

ALTER TABLE edition_team_prizes
  ADD COLUMN IF NOT EXISTS id_club INTEGER REFERENCES clubs(id_club);

ALTER TABLE edition_team_prizes
  ALTER COLUMN id_federation DROP NOT NULL;

ALTER TABLE edition_team_prizes
  ADD CONSTRAINT chk_etp_fed_ou_clube CHECK ((id_federation IS NULL) <> (id_club IS NULL));

-- Upsert por clube (espelho do UNIQUE id_edition+id_federation das seleções)
CREATE UNIQUE INDEX IF NOT EXISTS uq_etp_edition_club
  ON edition_team_prizes (id_edition, id_club) WHERE id_club IS NOT NULL;
