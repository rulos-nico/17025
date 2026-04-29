-- =============================================================================
-- Seed: datos demo para equipos, sensores, calibraciones y comprobaciones
-- =============================================================================
-- Inserta datos suficientes para validar las páginas Inventario, Calibraciones,
-- Comprobaciones y Gráficos de Control. Idempotente vía ON CONFLICT DO NOTHING
-- e IDs fijos.
--
-- Volumen aproximado:
--   * 1 usuario demo (responsable de comprobaciones)
--   * 3 equipos (balanza, horno, prensa CBR)
--   * 4 sensores (uno por equipo + 1 termómetro ambiente)
--   * 12 calibraciones (3 por sensor: 2 históricas + 1 vigente)
--   * 100 comprobaciones (25 por sensor) con outliers determinísticos
--     en los índices 7 y 18 para validar detección Shewhart en GraficosControl.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Usuario responsable
-- ---------------------------------------------------------------------------
INSERT INTO usuarios (id, email, nombre, apellido, rol, activo)
VALUES ('demo-user-001', 'demo@ingetec.cl', 'Demo', 'Técnico', 'tecnico', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Equipos
-- ---------------------------------------------------------------------------
INSERT INTO equipos (id, codigo, nombre, serie, marca, modelo, ubicacion, estado, descripcion, responsable, activo)
VALUES
    ('EQ-BAL-001', 'EQ-BAL-001', 'Balanza analítica', 'SAR-MS204-2024', 'Sartorius', 'MS204', 'Laboratorio Físicos', 'disponible', 'Balanza analítica de precisión 0.0001 g', 'Demo Técnico', TRUE),
    ('EQ-HRN-001', 'EQ-HRN-001', 'Horno de secado', 'MEM-UF55-2023', 'Memmert',  'UF55',  'Laboratorio Suelos',  'disponible', 'Horno universal de secado hasta 250 °C',  'Demo Técnico', TRUE),
    ('EQ-PRN-001', 'EQ-PRN-001', 'Prensa CBR',        'ELE-2150-2022', 'ELE',       '26-2150','Laboratorio Suelos',  'disponible', 'Prensa de compresión 50 kN para CBR',     'Demo Técnico', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Sensores
-- ---------------------------------------------------------------------------
INSERT INTO sensores (id, codigo, tipo, estado, marca, modelo, numero_serie, ubicacion, responsable, observaciones, equipo_id, activo)
VALUES
    ('SEN-BAL-001', 'SEN-BAL-001', 'masa',                'activo', 'Sartorius', 'MS204',    'SEN-BAL-S001', 'Laboratorio Físicos', 'Demo Técnico', 'Rango 0-220 g, precisión 0.0001 g',     'EQ-BAL-001', TRUE),
    ('SEN-HRN-001', 'SEN-HRN-001', 'temperatura',         'activo', 'Memmert',   'UF55-PT',  'SEN-HRN-S001', 'Laboratorio Suelos',  'Demo Técnico', 'Rango 30-250 °C, precisión 0.1 °C',     'EQ-HRN-001', TRUE),
    ('SEN-PRN-001', 'SEN-PRN-001', 'carga',               'activo', 'ELE',       'LC-50KN',  'SEN-PRN-S001', 'Laboratorio Suelos',  'Demo Técnico', 'Rango 0-50 kN, precisión 0.01 kN',      'EQ-PRN-001', TRUE),
    ('SEN-TMP-001', 'SEN-TMP-001', 'temperatura ambiente','activo', 'Testo',     '174T',     'SEN-TMP-S001', 'Sala instrumentos',   'Demo Técnico', 'Rango -20 a 60 °C, precisión 0.1 °C',   NULL,         TRUE)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Calibraciones (3 por sensor: 2 vencidas + 1 vigente)
-- ---------------------------------------------------------------------------
INSERT INTO calibracion (id, sensor_id, fecha_calibracion, proxima_calibracion, rango_medicion, "precision", error_maximo, certificado_id, estado, factor)
VALUES
    -- Balanza
    ('CAL-SEN-BAL-001-001', 'SEN-BAL-001', CURRENT_DATE - INTERVAL '730 days', CURRENT_DATE - INTERVAL '365 days', '0-220 g', '0.0001 g', '0.0002 g', 'CERT-BAL-2023-A', 'vencida', 1.00010),
    ('CAL-SEN-BAL-001-002', 'SEN-BAL-001', CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE - INTERVAL '5 days',   '0-220 g', '0.0001 g', '0.0002 g', 'CERT-BAL-2024-A', 'vencida', 1.00005),
    ('CAL-SEN-BAL-001-003', 'SEN-BAL-001', CURRENT_DATE - INTERVAL '5 days',   CURRENT_DATE + INTERVAL '360 days', '0-220 g', '0.0001 g', '0.0002 g', 'CERT-BAL-2025-A', 'vigente', 1.00002),
    -- Horno
    ('CAL-SEN-HRN-001-001', 'SEN-HRN-001', CURRENT_DATE - INTERVAL '730 days', CURRENT_DATE - INTERVAL '365 days', '30-250 °C', '0.1 °C', '0.5 °C', 'CERT-HRN-2023-A', 'vencida', 0.99800),
    ('CAL-SEN-HRN-001-002', 'SEN-HRN-001', CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE - INTERVAL '10 days',  '30-250 °C', '0.1 °C', '0.5 °C', 'CERT-HRN-2024-A', 'vencida', 0.99900),
    ('CAL-SEN-HRN-001-003', 'SEN-HRN-001', CURRENT_DATE - INTERVAL '10 days',  CURRENT_DATE + INTERVAL '355 days', '30-250 °C', '0.1 °C', '0.5 °C', 'CERT-HRN-2025-A', 'vigente', 0.99950),
    -- Prensa
    ('CAL-SEN-PRN-001-001', 'SEN-PRN-001', CURRENT_DATE - INTERVAL '730 days', CURRENT_DATE - INTERVAL '365 days', '0-50 kN', '0.01 kN', '0.05 kN', 'CERT-PRN-2023-A', 'vencida', 1.00250),
    ('CAL-SEN-PRN-001-002', 'SEN-PRN-001', CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE - INTERVAL '15 days',  '0-50 kN', '0.01 kN', '0.05 kN', 'CERT-PRN-2024-A', 'vencida', 1.00100),
    ('CAL-SEN-PRN-001-003', 'SEN-PRN-001', CURRENT_DATE - INTERVAL '15 days',  CURRENT_DATE + INTERVAL '350 days', '0-50 kN', '0.01 kN', '0.05 kN', 'CERT-PRN-2025-A', 'vigente', 1.00050),
    -- Termómetro ambiente
    ('CAL-SEN-TMP-001-001', 'SEN-TMP-001', CURRENT_DATE - INTERVAL '730 days', CURRENT_DATE - INTERVAL '365 days', '-20 a 60 °C', '0.1 °C', '0.3 °C', 'CERT-TMP-2023-A', 'vencida', 1.00100),
    ('CAL-SEN-TMP-001-002', 'SEN-TMP-001', CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE - INTERVAL '20 days',  '-20 a 60 °C', '0.1 °C', '0.3 °C', 'CERT-TMP-2024-A', 'vencida', 1.00050),
    ('CAL-SEN-TMP-001-003', 'SEN-TMP-001', CURRENT_DATE - INTERVAL '20 days',  CURRENT_DATE + INTERVAL '345 days', '-20 a 60 °C', '0.1 °C', '0.3 °C', 'CERT-TMP-2025-A', 'vigente', 1.00020)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Comprobaciones (25 por sensor, outliers en n=7 y n=18)
-- ---------------------------------------------------------------------------
-- Fija la semilla para que random() sea reproducible dentro de esta migración.
SELECT setseed(0.42);

WITH series AS (
    SELECT s.sensor_id, n
    FROM (VALUES ('SEN-BAL-001'), ('SEN-HRN-001'), ('SEN-PRN-001'), ('SEN-TMP-001')) AS s(sensor_id)
    CROSS JOIN generate_series(1, 25) AS n
),
points AS (
    SELECT
        sensor_id,
        n,
        -- Espaciado temporal: 25 mediciones cada ~7 días, las más recientes con n=25.
        NOW() - ((25 - n) * INTERVAL '7 days') AS fecha,
        -- Indicador de outlier en posiciones fijas para validar detección Shewhart.
        (n IN (7, 18)) AS is_outlier,
        random() AS r1,
        random() AS r2
    FROM series
)
INSERT INTO comprobacion (id, sensor_id, fecha, data, resultado, responsable, observaciones)
SELECT
    'CMP-' || sensor_id || '-' || lpad(n::text, 3, '0') AS id,
    sensor_id,
    fecha,
    CASE sensor_id
        WHEN 'SEN-BAL-001' THEN jsonb_build_object(
            'masa_patron_g',  200.0,
            'lectura_g',      round((200.0 + (r1 - 0.5) * 0.04 + CASE WHEN is_outlier THEN 0.15 ELSE 0 END)::numeric, 4),
            'desviacion_g',   round(((r1 - 0.5) * 0.04 + CASE WHEN is_outlier THEN 0.15 ELSE 0 END)::numeric, 4),
            'temperatura_c',  round((22.0 + (r2 - 0.5) * 1.0)::numeric, 1)
        )
        WHEN 'SEN-HRN-001' THEN jsonb_build_object(
            'setpoint_c',     110.0,
            'lectura_c',      round((110.0 + (r1 - 0.5) * 0.6 + CASE WHEN is_outlier THEN 2.0 ELSE 0 END)::numeric, 2),
            'desviacion_c',   round(((r1 - 0.5) * 0.6 + CASE WHEN is_outlier THEN 2.0 ELSE 0 END)::numeric, 2),
            'humedad_pct',    round((45.0 + (r2 - 0.5) * 5.0)::numeric, 1)
        )
        WHEN 'SEN-PRN-001' THEN jsonb_build_object(
            'carga_patron_kn', 50.0,
            'lectura_kn',      round((50.0 + (r1 - 0.5) * 0.10 + CASE WHEN is_outlier THEN 0.40 ELSE 0 END)::numeric, 3),
            'desviacion_kn',   round(((r1 - 0.5) * 0.10 + CASE WHEN is_outlier THEN 0.40 ELSE 0 END)::numeric, 3),
            'temperatura_c',   round((21.0 + (r2 - 0.5) * 1.0)::numeric, 1)
        )
        WHEN 'SEN-TMP-001' THEN jsonb_build_object(
            'patron_c',       25.0,
            'lectura_c',      round((25.0 + (r1 - 0.5) * 0.4 + CASE WHEN is_outlier THEN 1.5 ELSE 0 END)::numeric, 2),
            'desviacion_c',   round(((r1 - 0.5) * 0.4 + CASE WHEN is_outlier THEN 1.5 ELSE 0 END)::numeric, 2),
            'humedad_pct',    round((55.0 + (r2 - 0.5) * 8.0)::numeric, 1)
        )
    END AS data,
    CASE WHEN is_outlier THEN 'No Conforme' ELSE 'Conforme' END AS resultado,
    'demo-user-001' AS responsable,
    CASE WHEN is_outlier THEN 'Lectura fuera de tolerancia, reverificar' ELSE NULL END AS observaciones
FROM points
ON CONFLICT (id) DO NOTHING;
