-- Comprobaciones de equipos (verificaciones periódicas)
CREATE TABLE IF NOT EXISTS comprobaciones (
    id TEXT PRIMARY KEY,
    equipo_id TEXT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ NOT NULL,
    tipo TEXT NOT NULL,
    resultado TEXT NOT NULL, -- 'Conforme' | 'No Conforme'
    responsable TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Google Sheets sync fields
    sheets_row_index INTEGER,
    sheets_synced_at TIMESTAMPTZ,
    local_modified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comprobaciones_equipo_id ON comprobaciones(equipo_id);
CREATE INDEX IF NOT EXISTS idx_comprobaciones_fecha ON comprobaciones(fecha);

-- Calibraciones de equipos (certificaciones externas)
CREATE TABLE IF NOT EXISTS calibraciones (
    id TEXT PRIMARY KEY,
    equipo_id TEXT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ NOT NULL,
    laboratorio TEXT NOT NULL,
    certificado TEXT, -- número o link del certificado
    factor DOUBLE PRECISION, -- factor de calibración
    incertidumbre TEXT, -- ej: "±0.01%"
    proxima_calibracion TIMESTAMPTZ,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Google Sheets sync fields
    sheets_row_index INTEGER,
    sheets_synced_at TIMESTAMPTZ,
    local_modified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calibraciones_equipo_id ON calibraciones(equipo_id);
CREATE INDEX IF NOT EXISTS idx_calibraciones_fecha ON calibraciones(fecha);
