-- =============================================================================
-- Migración A.3: SEQUENCEs por entidad + helper fn_next_codigo
-- =============================================================================
-- Reemplaza la generación legacy `nanos % 10000` (con riesgo de colisión bajo
-- carga, ver MIGRATION_AUDIT.md §6.3) por SEQUENCE T-SQL atómicas.
--
-- Patrón de uso desde C# (ICodigoGenerator):
--     SELECT dbo.fn_next_codigo('EQP', 'seq_equipos');     -> 'EQP-000001'
--     SELECT dbo.fn_next_codigo_dated('PRY', 'seq_proyectos', SYSUTCDATETIME());
--                                                          -> 'PRY-20260506-000001'
--
-- Decisión Fase A.3:
--   * Formato fijo 6 dígitos cero-padded (suficiente para ~1M registros/entidad).
--   * Si una transacción hace ROLLBACK queda gap (aceptable para códigos
--     legibles, no para auditoría regulatoria).
--   * Las sequences son CACHE 1 para evitar saltos grandes al reiniciar SQL.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SEQUENCEs por entidad
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_clientes' AND schema_id = SCHEMA_ID('dbo'))
    CREATE SEQUENCE dbo.seq_clientes      AS BIGINT START WITH 1 INCREMENT BY 1 CACHE 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_equipos' AND schema_id = SCHEMA_ID('dbo'))
    CREATE SEQUENCE dbo.seq_equipos       AS BIGINT START WITH 1 INCREMENT BY 1 CACHE 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_sensores' AND schema_id = SCHEMA_ID('dbo'))
    CREATE SEQUENCE dbo.seq_sensores      AS BIGINT START WITH 1 INCREMENT BY 1 CACHE 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_proyectos' AND schema_id = SCHEMA_ID('dbo'))
    CREATE SEQUENCE dbo.seq_proyectos     AS BIGINT START WITH 1 INCREMENT BY 1 CACHE 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_perforaciones' AND schema_id = SCHEMA_ID('dbo'))
    CREATE SEQUENCE dbo.seq_perforaciones AS BIGINT START WITH 1 INCREMENT BY 1 CACHE 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_muestras' AND schema_id = SCHEMA_ID('dbo'))
    CREATE SEQUENCE dbo.seq_muestras      AS BIGINT START WITH 1 INCREMENT BY 1 CACHE 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_ensayos' AND schema_id = SCHEMA_ID('dbo'))
    CREATE SEQUENCE dbo.seq_ensayos       AS BIGINT START WITH 1 INCREMENT BY 1 CACHE 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_personal' AND schema_id = SCHEMA_ID('dbo'))
    CREATE SEQUENCE dbo.seq_personal      AS BIGINT START WITH 1 INCREMENT BY 1 CACHE 1;
GO
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_tipos_ensayo' AND schema_id = SCHEMA_ID('dbo'))
    CREATE SEQUENCE dbo.seq_tipos_ensayo  AS BIGINT START WITH 1 INCREMENT BY 1 CACHE 1;
GO

-- ---------------------------------------------------------------------------
-- 2. Helper: fn_next_codigo('PRE', 'seq_xxx') -> 'PRE-NNNNNN'
--    Implementado como stored procedure porque las funciones T-SQL
--    no pueden ejecutar `NEXT VALUE FOR` directamente sobre nombre dinámico.
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sp_next_codigo', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_next_codigo;
GO
CREATE PROCEDURE dbo.sp_next_codigo
    @prefix      NVARCHAR(10),
    @sequence    SYSNAME,
    @dated       BIT             = 0,
    @fecha       DATETIMEOFFSET  = NULL,
    @codigo      NVARCHAR(50)    OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @prefix IS NULL OR LEN(@prefix) = 0
        THROW 50001, 'sp_next_codigo: @prefix es obligatorio', 1;

    -- Validación contra sys.sequences (evita SQL injection vía @sequence).
    IF NOT EXISTS (SELECT 1 FROM sys.sequences
                   WHERE name = @sequence AND schema_id = SCHEMA_ID('dbo'))
        THROW 50002, 'sp_next_codigo: sequence no existe en dbo', 1;

    DECLARE @next BIGINT;
    DECLARE @sql  NVARCHAR(200) = N'SELECT @n = NEXT VALUE FOR dbo.' + QUOTENAME(@sequence) + N';';
    EXEC sp_executesql @sql, N'@n BIGINT OUTPUT', @n = @next OUTPUT;

    DECLARE @nnnn NVARCHAR(10) = RIGHT(REPLICATE('0', 6) + CONVERT(NVARCHAR(20), @next), 6);

    IF @dated = 1
    BEGIN
        DECLARE @ymd NVARCHAR(8) =
            CONVERT(NVARCHAR(8), ISNULL(@fecha, SYSUTCDATETIME()), 112);
        SET @codigo = @prefix + N'-' + @ymd + N'-' + @nnnn;
    END
    ELSE
    BEGIN
        SET @codigo = @prefix + N'-' + @nnnn;
    END
END;
GO
