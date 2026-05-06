-- =============================================================================
-- Migración 005: tabla refresh_tokens
-- Sub-fase A.1 — Auth híbrido Google + JWT propio.
-- =============================================================================
-- Almacena tokens de refresco emitidos al cliente (rotativos).
--   * token_hash: SHA-256 hex del token opaco entregado al cliente. Nunca se
--     guarda el valor plano. La verificación se hace con re-hash + comparación.
--   * user_id: FK a usuarios(id), CASCADE para eliminar tokens al borrar user.
--   * expires_at: TTL del token (sugerido: 30 días).
--   * revoked_at: si != NULL, el token fue rotado/revocado (logout o refresh).
--   * replaced_by: id del nuevo token al rotar (auditoría / detección de reuse).
-- =============================================================================

IF OBJECT_ID(N'dbo.refresh_tokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.refresh_tokens (
        id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_refresh_tokens PRIMARY KEY
                                       CONSTRAINT DF_refresh_tokens_id DEFAULT (NEWSEQUENTIALID()),
        user_id      UNIQUEIDENTIFIER NOT NULL,
        token_hash   CHAR(64)         NOT NULL,
        expires_at   DATETIMEOFFSET   NOT NULL,
        revoked_at   DATETIMEOFFSET   NULL,
        replaced_by  UNIQUEIDENTIFIER NULL,
        user_agent   NVARCHAR(512)    NULL,
        ip_address   NVARCHAR(64)     NULL,
        created_at   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_refresh_tokens_created_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT FK_refresh_tokens_user
            FOREIGN KEY (user_id) REFERENCES dbo.usuarios(id) ON DELETE CASCADE,
        CONSTRAINT UQ_refresh_tokens_token_hash UNIQUE (token_hash)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_refresh_tokens_user' AND object_id = OBJECT_ID('dbo.refresh_tokens'))
    CREATE INDEX idx_refresh_tokens_user ON dbo.refresh_tokens(user_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_refresh_tokens_active' AND object_id = OBJECT_ID('dbo.refresh_tokens'))
    CREATE INDEX idx_refresh_tokens_active
        ON dbo.refresh_tokens(user_id, expires_at)
        WHERE revoked_at IS NULL;
GO
