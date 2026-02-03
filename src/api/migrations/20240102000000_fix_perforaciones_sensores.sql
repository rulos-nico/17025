-- Migración 002 ya aplicada manualmente
-- Verificar que los ajustes de perforaciones y sensores existen

DO $$
BEGIN
    -- Verificar columnas de perforaciones
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perforaciones' AND column_name = 'drive_folder_id') THEN
        RAISE EXCEPTION 'Column perforaciones.drive_folder_id does not exist. Run migration 002 manually.';
    END IF;
    
    -- Verificar columnas de sensores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sensores' AND column_name = 'numero_serie') THEN
        RAISE EXCEPTION 'Column sensores.numero_serie does not exist. Run migration 002 manually.';
    END IF;
END $$;
