-- Migración: Agregar drive_folder_id a muestras para jerarquía de carpetas en Drive
-- Estructura: Proyecto → Perforación → Muestra → Ensayo (Sheet)

ALTER TABLE muestras ADD COLUMN IF NOT EXISTS drive_folder_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_muestras_drive_folder ON muestras(drive_folder_id) WHERE drive_folder_id IS NOT NULL;
