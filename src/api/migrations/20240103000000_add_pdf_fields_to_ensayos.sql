-- Migración 003: Agregar campos PDF a ensayos
-- Esta migración es idempotente (usa IF NOT EXISTS)

-- Campo para almacenar el ID del archivo PDF en Google Drive
ALTER TABLE ensayos ADD COLUMN IF NOT EXISTS pdf_drive_id VARCHAR(100);

-- Campo para almacenar la URL del PDF
ALTER TABLE ensayos ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Timestamp de cuando se generó el PDF por última vez
ALTER TABLE ensayos ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Campo para cache del ID de la carpeta de la perforación
ALTER TABLE ensayos ADD COLUMN IF NOT EXISTS perforacion_folder_id VARCHAR(100);

-- Índices (idempotentes)
CREATE INDEX IF NOT EXISTS idx_ensayos_pdf ON ensayos(pdf_drive_id) WHERE pdf_drive_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ensayos_pending_pdf ON ensayos(workflow_state) 
    WHERE workflow_state = 'E12' AND pdf_drive_id IS NULL;
