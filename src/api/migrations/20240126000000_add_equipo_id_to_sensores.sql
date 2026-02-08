-- Migración: Agregar campo equipo_id a sensores para relacionar con equipos
-- Esta migración es idempotente (usa IF NOT EXISTS)

-- Campo para relacionar sensor con equipo padre (opcional)
ALTER TABLE sensores ADD COLUMN IF NOT EXISTS equipo_id VARCHAR(36);

-- Foreign Key a tabla equipos (solo si no existe)
-- ON DELETE SET NULL: Si se elimina el equipo, el sensor queda sin asociar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_sensores_equipo' 
        AND table_name = 'sensores'
    ) THEN
        ALTER TABLE sensores 
        ADD CONSTRAINT fk_sensores_equipo 
        FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Índice para búsquedas eficientes de sensores por equipo
CREATE INDEX IF NOT EXISTS idx_sensores_equipo ON sensores(equipo_id) WHERE equipo_id IS NOT NULL;
