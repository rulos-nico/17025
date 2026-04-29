-- Comprobacion: agregar columnas derivadas (media, desviacion_std, error,
-- incertidumbre tipo A) + columnas de contexto (valor_patron, unidad, n_replicas).
-- El JSONB `data` mantiene las réplicas crudas y condiciones ambientales.
--
-- Ademas, instala un trigger que recalcula derivados desde data->'replicas'
-- cuando esos campos vengan NULL en INSERT/UPDATE, asegurando una sola fuente
-- de verdad para clientes que no sean el frontend principal.

ALTER TABLE comprobacion
    ADD COLUMN IF NOT EXISTS valor_patron     DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS unidad           VARCHAR(20),
    ADD COLUMN IF NOT EXISTS n_replicas       INTEGER,
    ADD COLUMN IF NOT EXISTS media            DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS desviacion_std   DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS error            DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS incertidumbre    DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_comprobacion_sensor_fecha
    ON comprobacion(sensor_id, fecha);

-- Funcion: recalcula derivados desde data->'replicas' si estan NULL.
CREATE OR REPLACE FUNCTION comprobacion_derive_metrics()
RETURNS TRIGGER AS $$
DECLARE
    rep_arr   JSONB;
    n         INTEGER;
    s_mean    DOUBLE PRECISION;
    s_sd      DOUBLE PRECISION;
BEGIN
    rep_arr := NEW.data -> 'replicas';

    -- Solo recalcular si hay replicas validas y al menos uno de los derivados es NULL.
    IF rep_arr IS NOT NULL AND jsonb_typeof(rep_arr) = 'array' THEN
        SELECT COUNT(*),
               AVG((value)::text::double precision),
               STDDEV_SAMP((value)::text::double precision)
          INTO n, s_mean, s_sd
          FROM jsonb_array_elements(rep_arr) AS value
         WHERE jsonb_typeof(value) = 'number';

        IF n IS NOT NULL AND n >= 1 THEN
            IF NEW.n_replicas IS NULL THEN NEW.n_replicas := n; END IF;
            IF NEW.media IS NULL THEN NEW.media := s_mean; END IF;
            IF NEW.desviacion_std IS NULL AND n >= 2 THEN
                NEW.desviacion_std := s_sd;
            END IF;
            IF NEW.incertidumbre IS NULL AND s_sd IS NOT NULL AND n >= 2 THEN
                NEW.incertidumbre := s_sd / sqrt(n::double precision);
            END IF;
            IF NEW.error IS NULL AND NEW.valor_patron IS NOT NULL AND s_mean IS NOT NULL THEN
                NEW.error := s_mean - NEW.valor_patron;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comprobacion_derive ON comprobacion;
CREATE TRIGGER trg_comprobacion_derive
    BEFORE INSERT OR UPDATE ON comprobacion
    FOR EACH ROW
    EXECUTE FUNCTION comprobacion_derive_metrics();
