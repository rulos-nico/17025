-- Agregar columna duracion_estimada a la tabla ensayos
-- El modelo Rust (EnsayoRow) y ENSAYO_COLUMNS ya la referencian,
-- pero ninguna migración previa la creó.
ALTER TABLE ensayos ADD COLUMN IF NOT EXISTS duracion_estimada VARCHAR(50);
