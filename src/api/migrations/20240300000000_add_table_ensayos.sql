-- Enum para tipo de acreditación
CREATE TYPE acreditacion AS ENUM ('ISO 17025:2017', 'ISO 9001:2015', 'Otra');

-- Tabla principal de tipos de ensayo
CREATE TABLE tipos_ensayo (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(50),
  vigente_desde DATE,
  norma VARCHAR(100) NOT NULL,
  acre acreditacion NOT NULL,
  activo BOOLEAN DEFAULT true,
  orden INT DEFAULT 0,
  precio_base DECIMAL(10,2),
  tiempo_estimado_dias INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tipos_ensayo_categoria ON tipos_ensayo(categoria);
CREATE INDEX idx_tipos_ensayo_activo ON tipos_ensayo(activo) WHERE activo = true;

-- Seed data inicial
INSERT INTO tipos_ensayo (nombre, norma, vigente_desde, acre) VALUES
  ('Compresión inconfinada en muestras de suelos', 'INV E-152:2013', '2013-01-01', 'ISO 17025:2017'),
  ('Corte directo de suelos en condición consolidada drenada', 'INV E-154:2013', '2013-01-01', 'ISO 17025:2017'),
  ('Compresión simple con medición de módulo de elasticidad y relación de Poisson', 'ASTM D 7012-23 Método D', '2023-01-01', 'ISO 17025:2017'),
  ('Consolidación unidimensional de los suelos', 'INV E-151:2013', '2013-01-01', 'ISO 17025:2017'),
  ('Módulo resiliente de suelos y agregados', 'INV E-156:2013', '2013-01-01', 'ISO 17025:2017'),
  ('Compresión triaxial sobre suelos cohesivos en condición consolidado no drenado', 'INV E-153:2013', '2013-01-01', 'ISO 17025:2017'),
  ('Triaxial bajo condiciones consolidado y drenado en suelos', 'ASTM D 7181-20', '2020-01-01', 'ISO 17025:2017'),
  ('Determinación en el laboratorio del contenido de agua (humedad) de muestras de suelo, roca y mezclas de suelo - agregado', 'ASTM D2216-19', '2019-01-01', 'ISO 17025:2017'),
  ('Determinación del tamaño de partículas de suelo mediante el análisis por tamizado (gradación)', 'ASTM D6913/D6913M-17', '2017-01-01', 'ISO 17025:2017'),
  ('Determinación del límite líquido, límite plástico e índice de plasticidad de los suelos', 'ASTM D4318-17', '2017-01-01', 'ISO 17025:2017'),
  ('Determinación por lavado del material que pasa el tamiz 75 μm (No 200) en agregados minerales', 'ASTM C117-23', '2023-01-01', 'ISO 17025:2017'),
  ('Determinación de la gravedad específica de las partículas sólidas de los suelos, empleando un picnómetro con agua', 'ASTM D854-23', '2023-01-01', 'ISO 17025:2017'),
  ('Análisis granulométrico de agregados gruesos y finos por tamizado', 'ASTM C136/C136M-19', '2019-01-01', 'ISO 17025:2017'),
  ('Determinación de la densidad (peso unitario) de muestras de suelo (Parafinado)', 'ASTM D7263-21 (Método A)', '2021-01-01', 'ISO 17025:2017'),
  ('Determinación de la resistencia a la compresión de muestras de núcleos de roca intacta bajo diferentes estados de esfuerzo', 'ASTM D7012-23 (Método C)', '2023-01-01', 'ISO 17025:2017'),
  ('Determinación de la expansión libre o colapso de un suelo en consolidómetro', 'ASTM D4546-21 (Métodos A y B)', '2021-01-01', 'ISO 17025:2017'),
  ('Determinación de la expansión controlada o colapso de un suelo en consolidómetro', 'ASTM D4546-21 (Métodos A y B)', '2021-01-01', 'ISO 17025:2017');


-- Enum para nivel de responsabilidad del personal
CREATE TYPE nivel_responsabilidad AS ENUM ('Ejecutor', 'Supervisor', 'Firmante');

-- Tabla de relación personal-tipos de ensayo
CREATE TABLE personal_tipos_ensayo (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    personal_id VARCHAR(50) NOT NULL REFERENCES personal_interno(id),
    tipo_ensayo_id VARCHAR(50) NOT NULL REFERENCES tipos_ensayo(id),
    nivel nivel_responsabilidad NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(personal_id, tipo_ensayo_id, nivel)
);

CREATE INDEX idx_personal_tipos_ensayo_personal ON personal_tipos_ensayo(personal_id);
CREATE INDEX idx_personal_tipos_ensayo_tipo ON personal_tipos_ensayo(tipo_ensayo_id);
CREATE INDEX idx_personal_tipos_ensayo_activo ON personal_tipos_ensayo(tipo_ensayo_id, nivel) WHERE activo = true;

-- Tabla de historial de normas por tipo de ensayo
CREATE TABLE tipos_ensayo_normas_historial (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tipo_ensayo_id VARCHAR(50) NOT NULL REFERENCES tipos_ensayo(id),
    norma VARCHAR(100) NOT NULL,
    norma_version VARCHAR(50),
    vigente_desde DATE NOT NULL,
    vigente_hasta DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tipos_ensayo_normas_tipo ON tipos_ensayo_normas_historial(tipo_ensayo_id);
CREATE INDEX idx_tipos_ensayo_normas_vigente ON tipos_ensayo_normas_historial(tipo_ensayo_id) WHERE vigente_hasta IS NULL;
