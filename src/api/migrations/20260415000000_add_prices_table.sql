ALTER TABLE tipos_ensayo DROP COLUMN IF EXISTS precio_base;

CREATE TABLE IF NOT EXISTS precios (
    id SERIAL PRIMARY KEY,
    tipo_ensayo_id varchar(50) NOT NULL REFERENCES tipos_ensayo(id) ON DELETE CASCADE,
    precio DECIMAL(10, 2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE
);

CREATE INDEX idx_precios_tipo_ensayo_id ON precios(tipo_ensayo_id);

CREATE OR REPLACE TRIGGER update_precios_updated_at
    BEFORE UPDATE ON precios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

