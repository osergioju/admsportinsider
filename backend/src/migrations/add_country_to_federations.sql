-- Liga federações nacionais aos países (CBF → Brasil, DBU → Dinamarca).
-- Seleções continuam gravadas por id_country (matches, player_seasons, stats);
-- a federação é o vínculo navegável: clicar na seleção leva à página da federação.

ALTER TABLE federations
    ADD COLUMN IF NOT EXISTS id_country INT REFERENCES countries(id_country);

CREATE INDEX IF NOT EXISTS idx_federations_country ON federations(id_country);
