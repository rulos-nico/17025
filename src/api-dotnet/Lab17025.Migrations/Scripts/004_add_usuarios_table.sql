-- =============================================================================
-- Migración: tabla de usuarios + seed demo
-- Portado desde 20260309000000_add_usuarios_table.sql
-- =============================================================================
-- Adiciones para PoC:
--   * password_hash (NVARCHAR(255)) para auth local sin Google.
-- =============================================================================

IF OBJECT_ID(N'dbo.usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuarios (
        id              NVARCHAR(50)    NOT NULL CONSTRAINT PK_usuarios PRIMARY KEY
                                        CONSTRAINT DF_usuarios_id DEFAULT (CONVERT(NVARCHAR(36), NEWID())),
        email           NVARCHAR(255)   NOT NULL CONSTRAINT UQ_usuarios_email UNIQUE,
        nombre          NVARCHAR(255)   NOT NULL,
        apellido        NVARCHAR(255)   NULL,
        avatar          NVARCHAR(MAX)   NULL,
        rol             NVARCHAR(50)    NOT NULL CONSTRAINT DF_usuarios_rol DEFAULT ('tecnico'),
        activo          BIT             NOT NULL CONSTRAINT DF_usuarios_activo DEFAULT (1),
        password_hash   NVARCHAR(255)   NULL,
        created_at      DATETIMEOFFSET  NOT NULL CONSTRAINT DF_usuarios_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at      DATETIMEOFFSET  NOT NULL CONSTRAINT DF_usuarios_updated_at DEFAULT (SYSUTCDATETIME())
    );
END;
GO

-- En SQL Server NVARCHAR es case-insensitive por defecto en collations *_CI_*,
-- por lo que no hace falta LOWER() en el índice.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_usuarios_email' AND object_id = OBJECT_ID('dbo.usuarios'))
    CREATE INDEX idx_usuarios_email ON dbo.usuarios(email);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_usuarios_activo' AND object_id = OBJECT_ID('dbo.usuarios'))
    CREATE INDEX idx_usuarios_activo ON dbo.usuarios(activo) WHERE activo = 1;
GO

-- Seed usuario demo para PoC.
-- password_hash corresponde a SHA256("demo1234") en hex (placeholder PoC).
-- En producción reemplazar por BCrypt/Argon2.
MERGE dbo.usuarios AS target
USING (VALUES
    ('demo-user-001', 'demo@ingetec.cl', N'Demo', N'Técnico', 'tecnico', CAST(1 AS BIT),
     '7b2cbeed9cc1eed3b4afb50d7aa3aa57c1ee15db75c2e30706f66f88c84bcd54')
) AS source (id, email, nombre, apellido, rol, activo, password_hash)
ON target.id = source.id
WHEN NOT MATCHED BY TARGET THEN
    INSERT (id, email, nombre, apellido, rol, activo, password_hash)
    VALUES (source.id, source.email, source.nombre, source.apellido,
            source.rol, source.activo, source.password_hash);
GO
