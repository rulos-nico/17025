-- =============================================================================
-- Migración 002: No-op
-- =============================================================================
-- Las columnas perforaciones.drive_folder_id y sensores.numero_serie
-- ahora se crean directamente en la migración inicial (001).
-- Esta migración se mantiene como no-op para preservar el orden de ejecución.
-- =============================================================================
SELECT 1;
