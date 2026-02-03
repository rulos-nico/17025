-- Migración: Agregar tabla de muestras
-- Las muestras representan puntos de extracción dentro de una perforación

-- Crear tabla de muestras
CREATE TABLE IF NOT EXISTS muestras (
    id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    perforacion_id VARCHAR(36) NOT NULL REFERENCES perforaciones(id) ON DELETE CASCADE,
    profundidad_inicio DECIMAL(10, 2) NOT NULL,
    profundidad_fin DECIMAL(10, 2) NOT NULL,
    tipo_muestra VARCHAR(50) NOT NULL,  -- 'alterado', 'inalterado', 'roca', 'spt', 'shelby'
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    sync_source VARCHAR(20) DEFAULT 'db',
    
    CONSTRAINT profundidad_valida CHECK (profundidad_fin >= profundidad_inicio),
    CONSTRAINT tipo_muestra_valido CHECK (tipo_muestra IN ('alterado', 'inalterado', 'roca', 'spt', 'shelby'))
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_muestras_perforacion ON muestras(perforacion_id);
CREATE INDEX IF NOT EXISTS idx_muestras_codigo ON muestras(codigo);
CREATE INDEX IF NOT EXISTS idx_muestras_tipo ON muestras(tipo_muestra);

-- Agregar columna muestra_id a ensayos (referencia opcional a muestra)
ALTER TABLE ensayos ADD COLUMN IF NOT EXISTS muestra_id VARCHAR(36) REFERENCES muestras(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ensayos_muestra ON ensayos(muestra_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_muestras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_muestras_updated_at ON muestras;
CREATE TRIGGER trigger_muestras_updated_at
    BEFORE UPDATE ON muestras
    FOR EACH ROW
    EXECUTE FUNCTION update_muestras_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE muestras IS 'Muestras extraídas de perforaciones para ensayos de laboratorio';
COMMENT ON COLUMN muestras.codigo IS 'Código único de la muestra, formato M-XXX';
COMMENT ON COLUMN muestras.tipo_muestra IS 'Tipo: alterado, inalterado, roca, spt, shelby';
COMMENT ON COLUMN muestras.profundidad_inicio IS 'Profundidad de inicio de extracción en metros';
COMMENT ON COLUMN muestras.profundidad_fin IS 'Profundidad de fin de extracción en metros';
