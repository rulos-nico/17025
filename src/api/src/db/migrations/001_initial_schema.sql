-- Migración inicial: Esquema de base de datos para Lab 17025
-- Ejecutar: sqlx migrate run

-- ==================================================
-- TABLA: clientes
-- ==================================================
CREATE TABLE IF NOT EXISTS clientes (
    id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    telefono VARCHAR(50),
    email VARCHAR(255),
    contacto_nombre VARCHAR(255),
    contacto_cargo VARCHAR(100),
    contacto_email VARCHAR(255),
    contacto_telefono VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    drive_folder_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    sync_source VARCHAR(20) DEFAULT 'sheets' -- 'sheets' o 'db'
);

CREATE INDEX idx_clientes_codigo ON clientes(codigo);
CREATE INDEX idx_clientes_activo ON clientes(activo);

-- ==================================================
-- TABLA: proyectos
-- ==================================================
CREATE TABLE IF NOT EXISTS proyectos (
    id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE,
    cliente_id VARCHAR(36) NOT NULL REFERENCES clientes(id),
    cliente_nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    estado VARCHAR(50) NOT NULL DEFAULT 'activo',
    fecha_fin_real DATE,
    drive_folder_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    synced_at TIMESTAMPTZ,
    sync_source VARCHAR(20) DEFAULT 'sheets'
);

CREATE INDEX idx_proyectos_codigo ON proyectos(codigo);
CREATE INDEX idx_proyectos_cliente ON proyectos(cliente_id);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_proyectos_fecha_inicio ON proyectos(fecha_inicio);

-- ==================================================
-- TABLA: equipos
-- ==================================================
CREATE TABLE IF NOT EXISTS equipos (
    id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    serie VARCHAR(100) NOT NULL,
    placa VARCHAR(50),
    descripcion TEXT,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    ubicacion VARCHAR(100),
    estado VARCHAR(50) NOT NULL DEFAULT 'disponible',
    fecha_calibracion DATE,
    proxima_calibracion DATE,
    incertidumbre DECIMAL(10, 6),
    error_maximo DECIMAL(10, 6),
    certificado_id VARCHAR(100),
    responsable VARCHAR(255),
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    sync_source VARCHAR(20) DEFAULT 'sheets'
);

CREATE INDEX idx_equipos_codigo ON equipos(codigo);
CREATE INDEX idx_equipos_estado ON equipos(estado);
CREATE INDEX idx_equipos_proxima_calibracion ON equipos(proxima_calibracion);

-- ==================================================
-- TABLA: perforaciones
-- ==================================================
CREATE TABLE IF NOT EXISTS perforaciones (
    id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    proyecto_id VARCHAR(36) NOT NULL REFERENCES proyectos(id),
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    profundidad_total DECIMAL(10, 2),
    coordenada_norte DECIMAL(15, 6),
    coordenada_este DECIMAL(15, 6),
    cota DECIMAL(10, 2),
    datum VARCHAR(50),
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(50) DEFAULT 'planificada',
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    sync_source VARCHAR(20) DEFAULT 'sheets'
);

CREATE INDEX idx_perforaciones_proyecto ON perforaciones(proyecto_id);
CREATE INDEX idx_perforaciones_codigo ON perforaciones(codigo);

-- ==================================================
-- TABLA: ensayos
-- ==================================================
CREATE TABLE IF NOT EXISTS ensayos (
    id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    perforacion_id VARCHAR(36) NOT NULL REFERENCES perforaciones(id),
    proyecto_id VARCHAR(36) NOT NULL REFERENCES proyectos(id),
    muestra VARCHAR(100) NOT NULL,
    norma VARCHAR(100) NOT NULL,
    workflow_state VARCHAR(50) NOT NULL DEFAULT 'solicitado',
    fecha_solicitud DATE NOT NULL,
    fecha_programacion DATE,
    fecha_ejecucion DATE,
    fecha_reporte DATE,
    fecha_entrega DATE,
    tecnico_id VARCHAR(36),
    tecnico_nombre VARCHAR(255),
    sheet_id VARCHAR(100),
    sheet_url TEXT,
    equipos_utilizados TEXT[], -- Array de IDs de equipos
    observaciones TEXT,
    urgente BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    sync_source VARCHAR(20) DEFAULT 'sheets'
);

CREATE INDEX idx_ensayos_proyecto ON ensayos(proyecto_id);
CREATE INDEX idx_ensayos_perforacion ON ensayos(perforacion_id);
CREATE INDEX idx_ensayos_workflow ON ensayos(workflow_state);
CREATE INDEX idx_ensayos_tipo ON ensayos(tipo);
CREATE INDEX idx_ensayos_fecha_solicitud ON ensayos(fecha_solicitud);
CREATE INDEX idx_ensayos_urgente ON ensayos(urgente);

-- ==================================================
-- TABLA: sensores
-- ==================================================
CREATE TABLE IF NOT EXISTS sensores (
    id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    equipo_id VARCHAR(36) REFERENCES equipos(id),
    unidad_medida VARCHAR(50),
    rango_minimo DECIMAL(15, 6),
    rango_maximo DECIMAL(15, 6),
    resolucion DECIMAL(15, 6),
    estado VARCHAR(50) DEFAULT 'activo',
    fecha_calibracion DATE,
    proxima_calibracion DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    sync_source VARCHAR(20) DEFAULT 'sheets'
);

CREATE INDEX idx_sensores_equipo ON sensores(equipo_id);
CREATE INDEX idx_sensores_estado ON sensores(estado);

-- ==================================================
-- TABLA: sync_log (para rastrear sincronizaciones)
-- ==================================================
CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'insert', 'update', 'delete'
    source VARCHAR(20) NOT NULL, -- 'sheets', 'db'
    target VARCHAR(20) NOT NULL, -- 'sheets', 'db'
    status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_entity ON sync_log(entity_type, entity_id);

-- ==================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ==================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyectos_updated_at BEFORE UPDATE ON proyectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipos_updated_at BEFORE UPDATE ON equipos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perforaciones_updated_at BEFORE UPDATE ON perforaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ensayos_updated_at BEFORE UPDATE ON ensayos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sensores_updated_at BEFORE UPDATE ON sensores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
