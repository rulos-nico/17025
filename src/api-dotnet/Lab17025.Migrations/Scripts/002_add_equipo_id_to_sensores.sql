-- =============================================================================
-- Migración: Agregar columna equipo_id a sensores + FK
-- Portado desde 20240126000000_add_equipo_id_to_sensores.sql
-- =============================================================================
-- Fase A.0: equipo_id es UNIQUEIDENTIFIER (igual que dbo.equipos.id).
-- =============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.sensores') AND name = 'equipo_id'
)
BEGIN
    ALTER TABLE dbo.sensores ADD equipo_id UNIQUEIDENTIFIER NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_sensores_equipo'
)
BEGIN
    ALTER TABLE dbo.sensores
        ADD CONSTRAINT fk_sensores_equipo
        FOREIGN KEY (equipo_id) REFERENCES dbo.equipos(id) ON DELETE SET NULL;
END;
GO

-- Índice filtrado equivalente a "WHERE equipo_id IS NOT NULL"
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'idx_sensores_equipo' AND object_id = OBJECT_ID('dbo.sensores')
)
BEGIN
    CREATE INDEX idx_sensores_equipo ON dbo.sensores(equipo_id) WHERE equipo_id IS NOT NULL;
END;
GO
