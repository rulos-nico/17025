CREATE TABLE IF NOT EXISTS tipos_ensayo_sheets (
    id             VARCHAR(50)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tipo_ensayo_id VARCHAR(50)  NOT NULL REFERENCES tipos_ensayo(id) ON DELETE RESTRICT,
    url            TEXT         NOT NULL,
    drive_id       VARCHAR(100),
    activo         BOOLEAN      NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tipos_ensayo_sheets_tipo 
    ON tipos_ensayo_sheets(tipo_ensayo_id);

CREATE INDEX idx_tipos_ensayo_sheets_activo 
    ON tipos_ensayo_sheets(tipo_ensayo_id) WHERE activo = true;

CREATE OR REPLACE TRIGGER update_tipos_ensayo_sheets_updated_at
    BEFORE UPDATE ON tipos_ensayo_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


