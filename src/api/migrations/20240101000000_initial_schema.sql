-- Migración inicial ya aplicada manualmente
-- Solo verificar que las tablas existen

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientes') THEN
        RAISE EXCEPTION 'Table clientes does not exist. Run initial migration manually.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proyectos') THEN
        RAISE EXCEPTION 'Table proyectos does not exist. Run initial migration manually.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'perforaciones') THEN
        RAISE EXCEPTION 'Table perforaciones does not exist. Run initial migration manually.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ensayos') THEN
        RAISE EXCEPTION 'Table ensayos does not exist. Run initial migration manually.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipos') THEN
        RAISE EXCEPTION 'Table equipos does not exist. Run initial migration manually.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sensores') THEN
        RAISE EXCEPTION 'Table sensores does not exist. Run initial migration manually.';
    END IF;
END $$;
