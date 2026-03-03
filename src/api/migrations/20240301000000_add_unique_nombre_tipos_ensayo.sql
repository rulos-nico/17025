-- Agregar restricción de unicidad en nombre de tipos de ensayo (solo activos)
-- Permite recrear nombres de tipos que fueron desactivados (soft-deleted)
-- Case-insensitive para evitar duplicados como "Corte Directo" vs "corte directo"
CREATE UNIQUE INDEX uq_tipos_ensayo_nombre_activo
ON tipos_ensayo(LOWER(nombre))
WHERE activo = true;
