-- Re-seed comprobaciones con nuevo shape: 5 replicas por evento, derivados
-- calculados directamente en SQL. Reemplaza las 100 filas demo (CMP-SEN-*-NNN).
-- Mantiene IDs, fechas redistribuidas (~29 dias entre puntos), outliers en n=7,18.

DELETE FROM comprobacion WHERE id LIKE 'CMP-SEN-%';

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
        NOW() - ((25 - n) * INTERVAL '29 days') AS fecha,
        (n IN (7, 18)) AS is_outlier,
        -- Patron por tipo de sensor
        CASE sensor_id
            WHEN 'SEN-BAL-001' THEN 200.0
            WHEN 'SEN-HRN-001' THEN 110.0
            WHEN 'SEN-PRN-001' THEN 50.0
            WHEN 'SEN-TMP-001' THEN 25.0
        END AS patron,
        CASE sensor_id
            WHEN 'SEN-BAL-001' THEN 'g'
            WHEN 'SEN-HRN-001' THEN '°C'
            WHEN 'SEN-PRN-001' THEN 'kN'
            WHEN 'SEN-TMP-001' THEN '°C'
        END AS unidad,
        -- Amplitud de ruido tipica por instrumento
        CASE sensor_id
            WHEN 'SEN-BAL-001' THEN 0.04
            WHEN 'SEN-HRN-001' THEN 0.6
            WHEN 'SEN-PRN-001' THEN 0.10
            WHEN 'SEN-TMP-001' THEN 0.4
        END AS noise,
        CASE sensor_id
            WHEN 'SEN-BAL-001' THEN 0.15
            WHEN 'SEN-HRN-001' THEN 2.0
            WHEN 'SEN-PRN-001' THEN 0.40
            WHEN 'SEN-TMP-001' THEN 1.5
        END AS outlier_shift,
        -- Variables ambientales
        round((22.0 + (random() - 0.5) * 1.5)::numeric, 1) AS temp_amb,
        round((45.0 + (random() - 0.5) * 8.0)::numeric, 1) AS humedad
    FROM series
),
replicas AS (
    SELECT
        p.*,
        ARRAY[
            p.patron + (random() - 0.5) * p.noise + CASE WHEN p.is_outlier THEN p.outlier_shift ELSE 0 END,
            p.patron + (random() - 0.5) * p.noise + CASE WHEN p.is_outlier THEN p.outlier_shift ELSE 0 END,
            p.patron + (random() - 0.5) * p.noise + CASE WHEN p.is_outlier THEN p.outlier_shift ELSE 0 END,
            p.patron + (random() - 0.5) * p.noise + CASE WHEN p.is_outlier THEN p.outlier_shift ELSE 0 END,
            p.patron + (random() - 0.5) * p.noise + CASE WHEN p.is_outlier THEN p.outlier_shift ELSE 0 END
        ] AS reps
    FROM points p
),
calc AS (
    SELECT
        sensor_id, n, fecha, is_outlier, patron, unidad, temp_amb, humedad, reps,
        -- Redondear cada replica a 4 decimales
        ARRAY(
            SELECT round(r::numeric, 4)::double precision
            FROM unnest(reps) AS r
        ) AS reps_round
    FROM replicas
),
stats AS (
    SELECT
        sensor_id, n, fecha, is_outlier, patron, unidad, temp_amb, humedad, reps_round,
        (SELECT AVG(v) FROM unnest(reps_round) AS v) AS media,
        (SELECT STDDEV_SAMP(v) FROM unnest(reps_round) AS v) AS sd
    FROM calc
)
INSERT INTO comprobacion (
    id, sensor_id, fecha, data, resultado, responsable, observaciones,
    valor_patron, unidad, n_replicas, media, desviacion_std, error, incertidumbre
)
SELECT
    'CMP-' || sensor_id || '-' || lpad(n::text, 3, '0'),
    sensor_id,
    fecha,
    jsonb_build_object(
        'replicas', to_jsonb(reps_round),
        'ambiente', CASE sensor_id
            WHEN 'SEN-BAL-001' THEN jsonb_build_object('temperatura_c', temp_amb)
            WHEN 'SEN-HRN-001' THEN jsonb_build_object('humedad_pct', humedad)
            WHEN 'SEN-PRN-001' THEN jsonb_build_object('temperatura_c', temp_amb)
            WHEN 'SEN-TMP-001' THEN jsonb_build_object('humedad_pct', humedad)
        END
    ),
    CASE WHEN is_outlier THEN 'No Conforme' ELSE 'Conforme' END,
    'demo-user-001',
    CASE WHEN is_outlier THEN 'Lectura fuera de tolerancia, reverificar' ELSE NULL END,
    patron,
    unidad,
    5,
    round(media::numeric, 6)::double precision,
    round(sd::numeric, 6)::double precision,
    round((media - patron)::numeric, 6)::double precision,
    round((sd / sqrt(5.0))::numeric, 6)::double precision
FROM stats
ON CONFLICT (id) DO NOTHING;
