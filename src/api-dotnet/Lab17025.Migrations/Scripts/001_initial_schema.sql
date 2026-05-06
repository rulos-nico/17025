-- =============================================================================
-- Migración inicial: Esquema base ISO/IEC 17025 (SQL Server / T-SQL)
-- Portado desde 20240101000000_initial_schema.sql (PostgreSQL)
-- =============================================================================
-- Diferencias clave vs Postgres:
--   TIMESTAMPTZ        -> DATETIMEOFFSET
--   BOOLEAN            -> BIT
--   TEXT               -> NVARCHAR(MAX)
--   NUMERIC(p,s)       -> DECIMAL(p,s)
--   NOW()              -> SYSUTCDATETIME()
--   gen_random_uuid()  -> NEWID() / NEWSEQUENTIALID()
--   UUID               -> UNIQUEIDENTIFIER
--   SERIAL             -> INT IDENTITY(1,1)
--   JSONB              -> NVARCHAR(MAX) + CHECK (ISJSON(...) = 1)
--   TEXT[]             -> tabla puente o JSON
--   ON CONFLICT...     -> MERGE
--   RETURNING *        -> OUTPUT INSERTED.*
--   trigger updated_at -> trigger T-SQL AFTER UPDATE
-- =============================================================================
-- Decisión de diseño (Fase A.0):
--   Todas las PK son UNIQUEIDENTIFIER (no NVARCHAR(36)). Los códigos
--   legibles (EQ-BAL-001, etc.) viven en columnas separadas `codigo`.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CLIENTES
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.clientes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.clientes (
        id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_clientes PRIMARY KEY
                                              CONSTRAINT DF_clientes_id DEFAULT (NEWSEQUENTIALID()),
        codigo              NVARCHAR(20)    NOT NULL CONSTRAINT UQ_clientes_codigo UNIQUE,
        nombre              NVARCHAR(255)   NOT NULL,
        rut                 NVARCHAR(20)    NULL,
        direccion           NVARCHAR(MAX)   NULL,
        ciudad              NVARCHAR(100)   NULL,
        telefono            NVARCHAR(50)    NULL,
        email               NVARCHAR(255)   NULL,
        contacto_nombre     NVARCHAR(255)   NULL,
        contacto_cargo      NVARCHAR(100)   NULL,
        contacto_email      NVARCHAR(255)   NULL,
        contacto_telefono   NVARCHAR(50)    NULL,
        activo              BIT             NOT NULL CONSTRAINT DF_clientes_activo DEFAULT (1),
        drive_folder_id     NVARCHAR(100)   NULL,
        created_at          DATETIMEOFFSET  NOT NULL CONSTRAINT DF_clientes_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at          DATETIMEOFFSET  NOT NULL CONSTRAINT DF_clientes_updated_at DEFAULT (SYSUTCDATETIME()),
        synced_at           DATETIMEOFFSET  NULL,
        sync_source         NVARCHAR(20)    NULL CONSTRAINT DF_clientes_sync_source DEFAULT ('sheets')
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_clientes_codigo' AND object_id = OBJECT_ID('dbo.clientes'))
    CREATE INDEX idx_clientes_codigo ON dbo.clientes(codigo);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_clientes_activo' AND object_id = OBJECT_ID('dbo.clientes'))
    CREATE INDEX idx_clientes_activo ON dbo.clientes(activo);
GO

-- Trigger updated_at para clientes
IF OBJECT_ID(N'dbo.trg_clientes_updated_at', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_clientes_updated_at;
GO
CREATE TRIGGER dbo.trg_clientes_updated_at
ON dbo.clientes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(updated_at)
        UPDATE c SET updated_at = SYSUTCDATETIME()
        FROM dbo.clientes c INNER JOIN inserted i ON c.id = i.id;
END;
GO

-- ---------------------------------------------------------------------------
-- 2. PROYECTOS
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.proyectos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.proyectos (
        id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_proyectos PRIMARY KEY
                                              CONSTRAINT DF_proyectos_id DEFAULT (NEWSEQUENTIALID()),
        codigo              NVARCHAR(20)    NOT NULL CONSTRAINT UQ_proyectos_codigo UNIQUE,
        nombre              NVARCHAR(255)   NOT NULL,
        descripcion         NVARCHAR(MAX)   NULL,
        fecha_inicio        DATE            NOT NULL,
        fecha_fin_estimada  DATE            NULL,
        cliente_id          UNIQUEIDENTIFIER NOT NULL,
        cliente_nombre      NVARCHAR(255)   NOT NULL,
        contacto            NVARCHAR(255)   NULL,
        estado              NVARCHAR(50)    NOT NULL CONSTRAINT DF_proyectos_estado DEFAULT ('activo'),
        fecha_fin_real      DATE            NULL,
        drive_folder_id     NVARCHAR(100)   NULL,
        created_at          DATETIMEOFFSET  NOT NULL CONSTRAINT DF_proyectos_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at          DATETIMEOFFSET  NOT NULL CONSTRAINT DF_proyectos_updated_at DEFAULT (SYSUTCDATETIME()),
        created_by          NVARCHAR(255)   NULL,
        synced_at           DATETIMEOFFSET  NULL,
        sync_source         NVARCHAR(20)    NULL CONSTRAINT DF_proyectos_sync_source DEFAULT ('sheets'),
        duracion_estimada   NVARCHAR(50)    NULL,
        ensayos_cotizados   NVARCHAR(MAX)   NULL CONSTRAINT DF_proyectos_ensayos_cotizados DEFAULT ('{}'),
        CONSTRAINT CK_proyectos_ensayos_cotizados_json CHECK (ensayos_cotizados IS NULL OR ISJSON(ensayos_cotizados) = 1),
        CONSTRAINT FK_proyectos_clientes FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_proyectos_codigo' AND object_id = OBJECT_ID('dbo.proyectos'))
    CREATE INDEX idx_proyectos_codigo ON dbo.proyectos(codigo);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_proyectos_cliente' AND object_id = OBJECT_ID('dbo.proyectos'))
    CREATE INDEX idx_proyectos_cliente ON dbo.proyectos(cliente_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_proyectos_estado' AND object_id = OBJECT_ID('dbo.proyectos'))
    CREATE INDEX idx_proyectos_estado ON dbo.proyectos(estado);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_proyectos_fecha_inicio' AND object_id = OBJECT_ID('dbo.proyectos'))
    CREATE INDEX idx_proyectos_fecha_inicio ON dbo.proyectos(fecha_inicio);
GO

IF OBJECT_ID(N'dbo.trg_proyectos_updated_at', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_proyectos_updated_at;
GO
CREATE TRIGGER dbo.trg_proyectos_updated_at
ON dbo.proyectos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(updated_at)
        UPDATE p SET updated_at = SYSUTCDATETIME()
        FROM dbo.proyectos p INNER JOIN inserted i ON p.id = i.id;
END;
GO

-- ---------------------------------------------------------------------------
-- 3. PERFORACIONES
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.perforaciones', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.perforaciones (
        id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_perforaciones PRIMARY KEY
                                          CONSTRAINT DF_perforaciones_id DEFAULT (NEWSEQUENTIALID()),
        codigo          NVARCHAR(50)    NOT NULL CONSTRAINT UQ_perforaciones_codigo UNIQUE,
        proyecto_id     UNIQUEIDENTIFIER NOT NULL,
        nombre          NVARCHAR(255)   NOT NULL,
        fecha_inicio    DATE            NULL,
        fecha_fin       DATE            NULL,
        estado          NVARCHAR(50)    NULL CONSTRAINT DF_perforaciones_estado DEFAULT ('planificada'),
        created_at      DATETIMEOFFSET  NOT NULL CONSTRAINT DF_perforaciones_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at      DATETIMEOFFSET  NOT NULL CONSTRAINT DF_perforaciones_updated_at DEFAULT (SYSUTCDATETIME()),
        synced_at       DATETIMEOFFSET  NULL,
        sync_source     NVARCHAR(20)    NULL CONSTRAINT DF_perforaciones_sync_source DEFAULT ('sheets'),
        descripcion     NVARCHAR(MAX)   NULL,
        ubicacion       NVARCHAR(255)   NULL,
        profundidad     DECIMAL(10,2)   NULL,
        drive_folder_id NVARCHAR(100)   NULL,
        CONSTRAINT FK_perforaciones_proyectos FOREIGN KEY (proyecto_id) REFERENCES dbo.proyectos(id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_perforaciones_codigo' AND object_id = OBJECT_ID('dbo.perforaciones'))
    CREATE INDEX idx_perforaciones_codigo ON dbo.perforaciones(codigo);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_perforaciones_proyecto' AND object_id = OBJECT_ID('dbo.perforaciones'))
    CREATE INDEX idx_perforaciones_proyecto ON dbo.perforaciones(proyecto_id);
GO

IF OBJECT_ID(N'dbo.trg_perforaciones_updated_at', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_perforaciones_updated_at;
GO
CREATE TRIGGER dbo.trg_perforaciones_updated_at
ON dbo.perforaciones
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(updated_at)
        UPDATE p SET updated_at = SYSUTCDATETIME()
        FROM dbo.perforaciones p INNER JOIN inserted i ON p.id = i.id;
END;
GO

-- ---------------------------------------------------------------------------
-- 4. ENSAYOS
-- ---------------------------------------------------------------------------
-- Nota: equipos_utilizados (TEXT[] en Postgres) se normalizará a tabla
-- puente `ensayo_equipos` en una migración posterior (decisión Fase A).
-- Por ahora se mantiene como NVARCHAR(MAX) JSON para no bloquear el
-- portado del módulo de ensayos.
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.ensayos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ensayos (
        id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ensayos PRIMARY KEY
                                              CONSTRAINT DF_ensayos_id DEFAULT (NEWSEQUENTIALID()),
        codigo              NVARCHAR(50)    NOT NULL CONSTRAINT UQ_ensayos_codigo UNIQUE,
        tipo                NVARCHAR(100)   NOT NULL,
        perforacion_id      UNIQUEIDENTIFIER NOT NULL,
        proyecto_id         UNIQUEIDENTIFIER NOT NULL,
        muestra             NVARCHAR(100)   NOT NULL,
        norma               NVARCHAR(100)   NOT NULL,
        workflow_state      NVARCHAR(50)    NOT NULL CONSTRAINT DF_ensayos_workflow_state DEFAULT ('solicitado'),
        fecha_solicitud     DATE            NOT NULL,
        fecha_programacion  DATE            NULL,
        fecha_ejecucion     DATE            NULL,
        fecha_reporte       DATE            NULL,
        fecha_entrega       DATE            NULL,
        tecnico_id          UNIQUEIDENTIFIER NULL,
        tecnico_nombre      NVARCHAR(255)   NULL,
        sheet_id            NVARCHAR(100)   NULL,
        sheet_url           NVARCHAR(MAX)   NULL,
        equipos_utilizados  NVARCHAR(MAX)   NULL, -- JSON (legacy: TEXT[])
        observaciones       NVARCHAR(MAX)   NULL,
        urgente             BIT             NOT NULL CONSTRAINT DF_ensayos_urgente DEFAULT (0),
        created_at          DATETIMEOFFSET  NOT NULL CONSTRAINT DF_ensayos_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at          DATETIMEOFFSET  NOT NULL CONSTRAINT DF_ensayos_updated_at DEFAULT (SYSUTCDATETIME()),
        synced_at           DATETIMEOFFSET  NULL,
        sync_source         NVARCHAR(20)    NULL CONSTRAINT DF_ensayos_sync_source DEFAULT ('sheets'),
        CONSTRAINT CK_ensayos_equipos_utilizados_json CHECK (equipos_utilizados IS NULL OR ISJSON(equipos_utilizados) = 1),
        CONSTRAINT FK_ensayos_perforaciones FOREIGN KEY (perforacion_id) REFERENCES dbo.perforaciones(id),
        CONSTRAINT FK_ensayos_proyectos     FOREIGN KEY (proyecto_id)    REFERENCES dbo.proyectos(id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_ensayos_perforacion' AND object_id = OBJECT_ID('dbo.ensayos'))
    CREATE INDEX idx_ensayos_perforacion ON dbo.ensayos(perforacion_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_ensayos_proyecto' AND object_id = OBJECT_ID('dbo.ensayos'))
    CREATE INDEX idx_ensayos_proyecto ON dbo.ensayos(proyecto_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_ensayos_tipo' AND object_id = OBJECT_ID('dbo.ensayos'))
    CREATE INDEX idx_ensayos_tipo ON dbo.ensayos(tipo);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_ensayos_workflow' AND object_id = OBJECT_ID('dbo.ensayos'))
    CREATE INDEX idx_ensayos_workflow ON dbo.ensayos(workflow_state);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_ensayos_fecha_solicitud' AND object_id = OBJECT_ID('dbo.ensayos'))
    CREATE INDEX idx_ensayos_fecha_solicitud ON dbo.ensayos(fecha_solicitud);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_ensayos_urgente' AND object_id = OBJECT_ID('dbo.ensayos'))
    CREATE INDEX idx_ensayos_urgente ON dbo.ensayos(urgente);
GO

IF OBJECT_ID(N'dbo.trg_ensayos_updated_at', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_ensayos_updated_at;
GO
CREATE TRIGGER dbo.trg_ensayos_updated_at
ON dbo.ensayos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(updated_at)
        UPDATE e SET updated_at = SYSUTCDATETIME()
        FROM dbo.ensayos e INNER JOIN inserted i ON e.id = i.id;
END;
GO

-- ---------------------------------------------------------------------------
-- 5. EQUIPOS
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.equipos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipos (
        id                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_equipos PRIMARY KEY
                                                  CONSTRAINT DF_equipos_id DEFAULT (NEWSEQUENTIALID()),
        codigo                  NVARCHAR(20)    NOT NULL CONSTRAINT UQ_equipos_codigo UNIQUE,
        nombre                  NVARCHAR(255)   NOT NULL,
        serie                   NVARCHAR(100)   NOT NULL,
        placa                   NVARCHAR(50)    NULL,
        descripcion             NVARCHAR(MAX)   NULL,
        marca                   NVARCHAR(100)   NULL,
        modelo                  NVARCHAR(100)   NULL,
        ubicacion               NVARCHAR(100)   NULL,
        estado                  NVARCHAR(50)    NOT NULL CONSTRAINT DF_equipos_estado DEFAULT ('disponible'),
        fecha_calibracion       DATE            NULL,
        proxima_calibracion     DATE            NULL,
        incertidumbre           DECIMAL(18,6)   NULL,
        error_maximo            DECIMAL(18,6)   NULL,
        certificado_id          NVARCHAR(100)   NULL,
        responsable             NVARCHAR(255)   NULL,
        observaciones           NVARCHAR(MAX)   NULL,
        activo                  BIT             NOT NULL CONSTRAINT DF_equipos_activo DEFAULT (1),
        created_at              DATETIMEOFFSET  NOT NULL CONSTRAINT DF_equipos_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at              DATETIMEOFFSET  NOT NULL CONSTRAINT DF_equipos_updated_at DEFAULT (SYSUTCDATETIME()),
        synced_at               DATETIMEOFFSET  NULL,
        sync_source             NVARCHAR(20)    NULL CONSTRAINT DF_equipos_sync_source DEFAULT ('sheets')
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_equipos_codigo' AND object_id = OBJECT_ID('dbo.equipos'))
    CREATE INDEX idx_equipos_codigo ON dbo.equipos(codigo);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_equipos_estado' AND object_id = OBJECT_ID('dbo.equipos'))
    CREATE INDEX idx_equipos_estado ON dbo.equipos(estado);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_equipos_proxima_calibracion' AND object_id = OBJECT_ID('dbo.equipos'))
    CREATE INDEX idx_equipos_proxima_calibracion ON dbo.equipos(proxima_calibracion);
GO

IF OBJECT_ID(N'dbo.trg_equipos_updated_at', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_equipos_updated_at;
GO
CREATE TRIGGER dbo.trg_equipos_updated_at
ON dbo.equipos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(updated_at)
        UPDATE e SET updated_at = SYSUTCDATETIME()
        FROM dbo.equipos e INNER JOIN inserted i ON e.id = i.id;
END;
GO

-- ---------------------------------------------------------------------------
-- 6. SENSORES
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sensores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sensores (
        id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_sensores PRIMARY KEY
                                              CONSTRAINT DF_sensores_id DEFAULT (NEWSEQUENTIALID()),
        codigo              NVARCHAR(20)    NOT NULL CONSTRAINT UQ_sensores_codigo UNIQUE,
        tipo                NVARCHAR(100)   NOT NULL CONSTRAINT DF_sensores_tipo DEFAULT ('general'),
        estado              NVARCHAR(50)    NULL CONSTRAINT DF_sensores_estado DEFAULT ('activo'),
        fecha_calibracion   DATE            NULL,
        proxima_calibracion DATE            NULL,
        created_at          DATETIMEOFFSET  NOT NULL CONSTRAINT DF_sensores_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at          DATETIMEOFFSET  NOT NULL CONSTRAINT DF_sensores_updated_at DEFAULT (SYSUTCDATETIME()),
        synced_at           DATETIMEOFFSET  NULL,
        sync_source         NVARCHAR(20)    NULL CONSTRAINT DF_sensores_sync_source DEFAULT ('sheets'),
        marca               NVARCHAR(100)   NULL,
        modelo              NVARCHAR(100)   NULL,
        numero_serie        NVARCHAR(100)   NOT NULL CONSTRAINT DF_sensores_numero_serie DEFAULT (''),
        rango_medicion      NVARCHAR(100)   NULL,
        [precision]         NVARCHAR(100)   NULL,
        ubicacion           NVARCHAR(255)   NULL,
        error_maximo        DECIMAL(18,6)   NULL,
        certificado_id      NVARCHAR(100)   NULL,
        responsable         NVARCHAR(255)   NULL,
        observaciones       NVARCHAR(MAX)   NULL,
        activo              BIT             NOT NULL CONSTRAINT DF_sensores_activo DEFAULT (1)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_sensores_estado' AND object_id = OBJECT_ID('dbo.sensores'))
    CREATE INDEX idx_sensores_estado ON dbo.sensores(estado);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_sensores_numero_serie' AND object_id = OBJECT_ID('dbo.sensores'))
    CREATE INDEX idx_sensores_numero_serie ON dbo.sensores(numero_serie);
GO

IF OBJECT_ID(N'dbo.trg_sensores_updated_at', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_sensores_updated_at;
GO
CREATE TRIGGER dbo.trg_sensores_updated_at
ON dbo.sensores
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(updated_at)
        UPDATE s SET updated_at = SYSUTCDATETIME()
        FROM dbo.sensores s INNER JOIN inserted i ON s.id = i.id;
END;
GO

-- ---------------------------------------------------------------------------
-- 7. SYNC_LOG
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sync_log', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_log (
        id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_sync_log PRIMARY KEY,
        entity_type     NVARCHAR(50)    NOT NULL,
        entity_id       UNIQUEIDENTIFIER NOT NULL,
        action          NVARCHAR(20)    NOT NULL,
        source          NVARCHAR(20)    NOT NULL,
        target          NVARCHAR(20)    NOT NULL,
        status          NVARCHAR(20)    NOT NULL,
        error_message   NVARCHAR(MAX)   NULL,
        created_at      DATETIMEOFFSET  NOT NULL CONSTRAINT DF_sync_log_created_at DEFAULT (SYSUTCDATETIME()),
        completed_at    DATETIMEOFFSET  NULL
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_sync_log_entity' AND object_id = OBJECT_ID('dbo.sync_log'))
    CREATE INDEX idx_sync_log_entity ON dbo.sync_log(entity_type, entity_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_sync_log_status' AND object_id = OBJECT_ID('dbo.sync_log'))
    CREATE INDEX idx_sync_log_status ON dbo.sync_log(status);
GO
