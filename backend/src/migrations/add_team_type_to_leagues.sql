-- Tipo de participantes da competição: clubes comuns ou seleções nacionais.
-- 'clubs'    → mapeamento por clubes (padrão, comportamento atual)
-- 'national' → mapeamento por países (ex: Copa do Mundo, Eliminatórias)

ALTER TABLE leagues
    ADD COLUMN IF NOT EXISTS team_type VARCHAR(10) NOT NULL DEFAULT 'clubs';

ALTER TABLE leagues
    DROP CONSTRAINT IF EXISTS leagues_team_type_check;

ALTER TABLE leagues
    ADD CONSTRAINT leagues_team_type_check
    CHECK (team_type IN ('clubs', 'national'));
