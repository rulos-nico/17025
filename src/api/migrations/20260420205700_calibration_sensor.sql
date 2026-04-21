DROP TABLE IF EXISTS calibraciones CASCADE;

ALTER TABLE sensores DROP COLUMN IF EXISTS fecha_calibracion;
ALTER TABLE sensores DROP COLUMN IF EXISTS proxima_calibracion;
ALTER TABLE sensores DROP COLUMN IF EXISTS rango_medicion;
ALTER TABLE sensores DROP COLUMN IF EXISTS "precision";
ALTER TABLE sensores DROP COLUMN IF EXISTS error_maximo;
ALTER TABLE sensores DROP COLUMN IF EXISTS certificado_id;

CREATE TABLE IF NOT EXISTS calibracion (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    sensor_id VARCHAR(36) NOT NULL,
    fecha_calibracion DATE NOT NULL,
    proxima_calibracion DATE NOT NULL,
    rango_medicion VARCHAR(255),
    "precision" VARCHAR(255),
    error_maximo VARCHAR(255),
    certificado_id VARCHAR(255),
    estado VARCHAR(50) NOT NULL,
    factor DECIMAL(30, 20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_calibracion_sensor FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE CASCADE,
    CONSTRAINT chk_calibracion_estado CHECK (estado IN ('vigente', 'vencida', 'pendiente'))
);

CREATE INDEX IF NOT EXISTS idx_calibracion_sensor_id ON calibracion(sensor_id);
CREATE INDEX IF NOT EXISTS idx_calibracion_estado ON calibracion(estado);
CREATE INDEX IF NOT EXISTS idx_calibracion_fecha_calibracion ON calibracion(fecha_calibracion);
CREATE INDEX IF NOT EXISTS idx_calibracion_proxima_calibracion ON calibracion(proxima_calibracion);

CREATE OR REPLACE TRIGGER update_calibracion_updated_at
    BEFORE UPDATE ON calibracion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
