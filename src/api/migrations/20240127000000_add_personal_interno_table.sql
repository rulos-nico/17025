-- Crear tabla personal_interno
CREATE TABLE IF NOT EXISTS personal_interno (
    id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    sync_source VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_personal_interno_codigo ON personal_interno(codigo);
CREATE INDEX IF NOT EXISTS idx_personal_interno_activo ON personal_interno(activo);
CREATE INDEX IF NOT EXISTS idx_personal_interno_cargo ON personal_interno(cargo);
