DROP TABLE IF EXISTS comprobaciones CASCADE;

CREATE TABLE IF NOT EXISTS comprobacion_resultados (
    resultado VARCHAR(50) PRIMARY KEY
);

INSERT INTO comprobacion_resultados (resultado) VALUES
    ('Conforme'),
    ('No Conforme')
ON CONFLICT (resultado) DO NOTHING;

CREATE TABLE IF NOT EXISTS comprobacion (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    sensor_id VARCHAR(36) NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    data JSONB NOT NULL,
    resultado VARCHAR(50) NOT NULL,
    responsable VARCHAR(50) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_comprobacion_sensor
        FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE CASCADE,
    CONSTRAINT fk_comprobacion_resultado
        FOREIGN KEY (resultado) REFERENCES comprobacion_resultados(resultado) ON DELETE RESTRICT,
    CONSTRAINT fk_comprobacion_responsable
        FOREIGN KEY (responsable) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_comprobacion_sensor_id ON comprobacion(sensor_id);
CREATE INDEX IF NOT EXISTS idx_comprobacion_fecha ON comprobacion(fecha);
CREATE INDEX IF NOT EXISTS idx_comprobacion_resultado ON comprobacion(resultado);
CREATE INDEX IF NOT EXISTS idx_comprobacion_responsable ON comprobacion(responsable);

CREATE OR REPLACE TRIGGER update_comprobacion_updated_at
    BEFORE UPDATE ON comprobacion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
