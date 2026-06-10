-- Vencedor de empate em partidas de seleções (mata-mata decidido nos pênaltis).
-- Equivalente ao winner_club_id, mas apontando para countries.

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS winner_country_id INT REFERENCES countries(id_country);
