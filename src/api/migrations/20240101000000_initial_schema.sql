-- =============================================================================
-- Migración inicial: Esquema base del sistema de laboratorio ISO/IEC 17025
-- =============================================================================
-- Crea las 6 tablas base + sync_log, índices, triggers y foreign keys.
-- Todas las tablas usan CREATE TABLE IF NOT EXISTS para ser idempotentes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Función trigger para actualizar updated_at automáticamente
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =============================================================================
-- 1. CLIENTES
-- =============================================================================
CREATE TABLE IF NOT EXISTS clientes (
    id              VARCHAR(36)     NOT NULL PRIMARY KEY,
    codigo          VARCHAR(20)     NOT NULL UNIQUE,
    nombre          VARCHAR(255)    NOT NULL,
    rut             VARCHAR(20),
    direccion       TEXT,
    ciudad          VARCHAR(100),
    telefono        VARCHAR(50),
    email           VARCHAR(255),
    contacto_nombre VARCHAR(255),
    contacto_cargo  VARCHAR(100),
    contacto_email  VARCHAR(255),
    contacto_telefono VARCHAR(50),
    activo          BOOLEAN         DEFAULT true,
    drive_folder_id VARCHAR(100),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    synced_at       TIMESTAMPTZ,
    sync_source     VARCHAR(20)     DEFAULT 'sheets'
);

CREATE INDEX IF NOT EXISTS idx_clientes_codigo  ON clientes(codigo);
CREATE INDEX IF NOT EXISTS idx_clientes_activo  ON clientes(activo);

CREATE OR REPLACE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. PROYECTOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS proyectos (
    id                  VARCHAR(36)     NOT NULL PRIMARY KEY,
    codigo              VARCHAR(20)     NOT NULL UNIQUE,
    nombre              VARCHAR(255)    NOT NULL,
    descripcion         TEXT,
    fecha_inicio        DATE            NOT NULL,
    fecha_fin_estimada  DATE,
    cliente_id          VARCHAR(36)     NOT NULL,
    cliente_nombre      VARCHAR(255)    NOT NULL,
    contacto            VARCHAR(255),
    estado              VARCHAR(50)     NOT NULL DEFAULT 'activo',
    fecha_fin_real      DATE,
    drive_folder_id     VARCHAR(100),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(255),
    synced_at           TIMESTAMPTZ,
    sync_source         VARCHAR(20)     DEFAULT 'sheets',
    duracion_estimada   VARCHAR(50),
    ensayos_cotizados   JSONB           DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_proyectos_codigo       ON proyectos(codigo);
CREATE INDEX IF NOT EXISTS idx_proyectos_cliente       ON proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado        ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_fecha_inicio  ON proyectos(fecha_inicio);

CREATE OR REPLACE TRIGGER update_proyectos_updated_at
    BEFORE UPDATE ON proyectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 3. PERFORACIONES (incluye columnas drive_folder_id, descripcion, ubicacion, profundidad)
-- =============================================================================
CREATE TABLE IF NOT EXISTS perforaciones (
    id              VARCHAR(36)     NOT NULL PRIMARY KEY,
    codigo          VARCHAR(50)     NOT NULL UNIQUE,
    proyecto_id     VARCHAR(36)     NOT NULL,
    nombre          VARCHAR(255)    NOT NULL,
    fecha_inicio    DATE,
    fecha_fin       DATE,
    estado          VARCHAR(50)     DEFAULT 'planificada',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    synced_at       TIMESTAMPTZ,
    sync_source     VARCHAR(20)     DEFAULT 'sheets',
    descripcion     TEXT,
    ubicacion       VARCHAR(255),
    profundidad     NUMERIC(10,2),
    drive_folder_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_perforaciones_codigo    ON perforaciones(codigo);
CREATE INDEX IF NOT EXISTS idx_perforaciones_proyecto   ON perforaciones(proyecto_id);

CREATE OR REPLACE TRIGGER update_perforaciones_updated_at
    BEFORE UPDATE ON perforaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. ENSAYOS (esquema base, sin columnas pdf_* ni muestra_id ni duracion_estimada
--    que se agregan en migraciones posteriores 003, 004)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ensayos (
    id                  VARCHAR(36)     NOT NULL PRIMARY KEY,
    codigo              VARCHAR(50)     NOT NULL UNIQUE,
    tipo                VARCHAR(100)    NOT NULL,
    perforacion_id      VARCHAR(36)     NOT NULL,
    proyecto_id         VARCHAR(36)     NOT NULL,
    muestra             VARCHAR(100)    NOT NULL,
    norma               VARCHAR(100)    NOT NULL,
    workflow_state      VARCHAR(50)     NOT NULL DEFAULT 'solicitado',
    fecha_solicitud     DATE            NOT NULL,
    fecha_programacion  DATE,
    fecha_ejecucion     DATE,
    fecha_reporte       DATE,
    fecha_entrega       DATE,
    tecnico_id          VARCHAR(36),
    tecnico_nombre      VARCHAR(255),
    sheet_id            VARCHAR(100),
    sheet_url           TEXT,
    equipos_utilizados  TEXT[],
    observaciones       TEXT,
    urgente             BOOLEAN         DEFAULT false,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    synced_at           TIMESTAMPTZ,
    sync_source         VARCHAR(20)     DEFAULT 'sheets'
);

CREATE INDEX IF NOT EXISTS idx_ensayos_perforacion      ON ensayos(perforacion_id);
CREATE INDEX IF NOT EXISTS idx_ensayos_proyecto          ON ensayos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ensayos_tipo              ON ensayos(tipo);
CREATE INDEX IF NOT EXISTS idx_ensayos_workflow          ON ensayos(workflow_state);
CREATE INDEX IF NOT EXISTS idx_ensayos_fecha_solicitud   ON ensayos(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_ensayos_urgente           ON ensayos(urgente);

CREATE OR REPLACE TRIGGER update_ensayos_updated_at
    BEFORE UPDATE ON ensayos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. EQUIPOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS equipos (
    id                      VARCHAR(36)     NOT NULL PRIMARY KEY,
    codigo                  VARCHAR(20)     NOT NULL UNIQUE,
    nombre                  VARCHAR(255)    NOT NULL,
    serie                   VARCHAR(100)    NOT NULL,
    placa                   VARCHAR(50),
    descripcion             TEXT,
    marca                   VARCHAR(100),
    modelo                  VARCHAR(100),
    ubicacion               VARCHAR(100),
    estado                  VARCHAR(50)     NOT NULL DEFAULT 'disponible',
    fecha_calibracion       DATE,
    proxima_calibracion     DATE,
    incertidumbre           NUMERIC(10,6),
    error_maximo            NUMERIC(10,6),
    certificado_id          VARCHAR(100),
    responsable             VARCHAR(255),
    observaciones           TEXT,
    activo                  BOOLEAN         DEFAULT true,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    synced_at               TIMESTAMPTZ,
    sync_source             VARCHAR(20)     DEFAULT 'sheets'
);

CREATE INDEX IF NOT EXISTS idx_equipos_codigo               ON equipos(codigo);
CREATE INDEX IF NOT EXISTS idx_equipos_estado                ON equipos(estado);
CREATE INDEX IF NOT EXISTS idx_equipos_proxima_calibracion   ON equipos(proxima_calibracion);

CREATE OR REPLACE TRIGGER update_equipos_updated_at
    BEFORE UPDATE ON equipos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. SENSORES (incluye numero_serie, marca, modelo y todas las columnas extras)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sensores (
    id                  VARCHAR(36)     NOT NULL PRIMARY KEY,
    codigo              VARCHAR(20)     NOT NULL UNIQUE,
    tipo                VARCHAR(100)    NOT NULL DEFAULT 'general',
    estado              VARCHAR(50)     DEFAULT 'activo',
    fecha_calibracion   DATE,
    proxima_calibracion DATE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    synced_at           TIMESTAMPTZ,
    sync_source         VARCHAR(20)     DEFAULT 'sheets',
    marca               VARCHAR(100),
    modelo              VARCHAR(100),
    numero_serie        VARCHAR(100)    NOT NULL DEFAULT '',
    rango_medicion      VARCHAR(100),
    "precision"         VARCHAR(100),
    ubicacion           VARCHAR(255),
    error_maximo        NUMERIC(10,6),
    certificado_id      VARCHAR(100),
    responsable         VARCHAR(255),
    observaciones       TEXT,
    activo              BOOLEAN         DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_sensores_estado          ON sensores(estado);
CREATE INDEX IF NOT EXISTS idx_sensores_numero_serie    ON sensores(numero_serie);

CREATE OR REPLACE TRIGGER update_sensores_updated_at
    BEFORE UPDATE ON sensores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. SYNC_LOG (registro de sincronización con Google Sheets)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sync_log (
    id              SERIAL          PRIMARY KEY,
    entity_type     VARCHAR(50)     NOT NULL,
    entity_id       VARCHAR(36)     NOT NULL,
    action          VARCHAR(20)     NOT NULL,
    source          VARCHAR(20)     NOT NULL,
    target          VARCHAR(20)     NOT NULL,
    status          VARCHAR(20)     NOT NULL,
    error_message   TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON sync_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);

-- =============================================================================
-- FOREIGN KEYS
-- =============================================================================
-- proyectos.cliente_id -> clientes.id
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proyectos_cliente_id_fkey') THEN
        ALTER TABLE proyectos ADD CONSTRAINT proyectos_cliente_id_fkey
            FOREIGN KEY (cliente_id) REFERENCES clientes(id);
    END IF;
END $$;

-- perforaciones.proyecto_id -> proyectos.id
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perforaciones_proyecto_id_fkey') THEN
        ALTER TABLE perforaciones ADD CONSTRAINT perforaciones_proyecto_id_fkey
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(id);
    END IF;
END $$;

-- ensayos.perforacion_id -> perforaciones.id
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ensayos_perforacion_id_fkey') THEN
        ALTER TABLE ensayos ADD CONSTRAINT ensayos_perforacion_id_fkey
            FOREIGN KEY (perforacion_id) REFERENCES perforaciones(id);
    END IF;
END $$;

-- ensayos.proyecto_id -> proyectos.id
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ensayos_proyecto_id_fkey') THEN
        ALTER TABLE ensayos ADD CONSTRAINT ensayos_proyecto_id_fkey
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(id);
    END IF;
END $$;
