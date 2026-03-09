-- Tabla: qué equipos se necesitan para cada tipo de ensayo
CREATE TABLE equipos_tipos_ensayo (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    equipo_id VARCHAR(50) NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    tipo_ensayo_id VARCHAR(50) NOT NULL REFERENCES tipos_ensayo(id) ON DELETE CASCADE,
    requerido BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(equipo_id, tipo_ensayo_id)
);
CREATE INDEX idx_ete_tipo ON equipos_tipos_ensayo(tipo_ensayo_id) WHERE activo = TRUE;

-- Tabla: cuántos ensayos activos simultáneos puede tener un técnico por tipo
CREATE TABLE personal_capacidad (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    personal_id VARCHAR(50) NOT NULL REFERENCES personal_interno(id) ON DELETE CASCADE,
    tipo_ensayo_id VARCHAR(50) NOT NULL REFERENCES tipos_ensayo(id) ON DELETE CASCADE,
    max_ensayos_activos INT NOT NULL DEFAULT 100,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(personal_id, tipo_ensayo_id)
);
CREATE INDEX idx_pc_personal ON personal_capacidad(personal_id) WHERE activo = TRUE;

-- Tabla: reservas de equipos por fecha
CREATE TABLE reservas_equipos (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    equipo_id VARCHAR(50) NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    ensayo_id VARCHAR(50) REFERENCES ensayos(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_re_equipo_fecha ON reservas_equipos(equipo_id, fecha);
CREATE INDEX idx_re_ensayo ON reservas_equipos(ensayo_id);
