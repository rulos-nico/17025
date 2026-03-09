CREATE TABLE usuarios (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255),
    avatar TEXT,
    rol VARCHAR(50) NOT NULL DEFAULT 'tecnico',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_usuarios_email ON usuarios(LOWER(email));
CREATE INDEX idx_usuarios_activo ON usuarios(activo) WHERE activo = TRUE;
