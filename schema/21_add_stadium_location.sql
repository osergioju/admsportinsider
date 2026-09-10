-- Coordenada real do estádio, preenchida uma vez (geocoding via Mapbox no
-- front) e reaproveitada por todo mundo depois — evita repetir a busca por
-- nome a cada visita à página do estádio.
ALTER TABLE clubs
    ADD COLUMN IF NOT EXISTS stadium_latitude NUMERIC(9,6),
    ADD COLUMN IF NOT EXISTS stadium_longitude NUMERIC(9,6),
    ADD COLUMN IF NOT EXISTS stadium_country_code VARCHAR(2),
    ADD COLUMN IF NOT EXISTS stadium_geocoded_at TIMESTAMP;
