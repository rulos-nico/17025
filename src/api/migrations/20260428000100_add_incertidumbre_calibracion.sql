-- =============================================================================
-- Add incertidumbre column to calibracion + backfill seed data
-- =============================================================================
-- Permite registrar la incertidumbre expandida (U) reportada en cada certificado
-- de calibración. Texto libre con unidad (ej. "± 0.0001 g") para mantener
-- coherencia con error_maximo y precision que también son VARCHAR.
-- =============================================================================

ALTER TABLE calibracion ADD COLUMN IF NOT EXISTS incertidumbre VARCHAR(255);

-- Backfill de los datos demo seed (no afecta calibraciones reales)
UPDATE calibracion SET incertidumbre = '0.0001 g' WHERE sensor_id = 'SEN-BAL-001' AND incertidumbre IS NULL;
UPDATE calibracion SET incertidumbre = '0.2 °C'   WHERE sensor_id = 'SEN-HRN-001' AND incertidumbre IS NULL;
UPDATE calibracion SET incertidumbre = '0.02 kN'  WHERE sensor_id = 'SEN-PRN-001' AND incertidumbre IS NULL;
UPDATE calibracion SET incertidumbre = '0.1 °C'   WHERE sensor_id = 'SEN-TMP-001' AND incertidumbre IS NULL;
