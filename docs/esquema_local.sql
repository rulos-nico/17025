--
-- PostgreSQL database dump
--

\restrict 34kxybKKOrqkjvdFAMLWgNz0v7jcgP3IlUQSbiu8vk6DECbpyHAj9zeAEVdPu5n

-- Dumped from database version 18.3 (Ubuntu 18.3-1.pgdg25.10+1)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1.pgdg25.10+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: acreditacion; Type: TYPE; Schema: public; Owner: rulos
--

CREATE TYPE public.acreditacion AS ENUM (
    'ISO 17025:2017',
    'ISO 9001:2015',
    'Otra'
);


ALTER TYPE public.acreditacion OWNER TO rulos;

--
-- Name: nivel_responsabilidad; Type: TYPE; Schema: public; Owner: rulos
--

CREATE TYPE public.nivel_responsabilidad AS ENUM (
    'Ejecutor',
    'Supervisor',
    'Firmante'
);


ALTER TYPE public.nivel_responsabilidad OWNER TO rulos;

--
-- Name: update_muestras_updated_at(); Type: FUNCTION; Schema: public; Owner: rulos
--

CREATE FUNCTION public.update_muestras_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_muestras_updated_at() OWNER TO rulos;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: rulos
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO rulos;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _sqlx_migrations; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public._sqlx_migrations (
    version bigint NOT NULL,
    description text NOT NULL,
    installed_on timestamp with time zone DEFAULT now() NOT NULL,
    success boolean NOT NULL,
    checksum bytea NOT NULL,
    execution_time bigint NOT NULL
);


ALTER TABLE public._sqlx_migrations OWNER TO rulos;

--
-- Name: calibraciones; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.calibraciones (
    id text NOT NULL,
    equipo_id text NOT NULL,
    fecha timestamp with time zone NOT NULL,
    laboratorio text NOT NULL,
    certificado text,
    factor double precision,
    incertidumbre text,
    proxima_calibracion timestamp with time zone,
    observaciones text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    sheets_row_index integer,
    sheets_synced_at timestamp with time zone,
    local_modified_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.calibraciones OWNER TO rulos;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.clientes (
    id character varying(36) NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(255) NOT NULL,
    rut character varying(20),
    direccion text,
    ciudad character varying(100),
    telefono character varying(50),
    email character varying(255),
    contacto_nombre character varying(255),
    contacto_cargo character varying(100),
    contacto_email character varying(255),
    contacto_telefono character varying(50),
    activo boolean DEFAULT true,
    drive_folder_id character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    synced_at timestamp with time zone,
    sync_source character varying(20) DEFAULT 'sheets'::character varying
);


ALTER TABLE public.clientes OWNER TO rulos;

--
-- Name: comprobaciones; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.comprobaciones (
    id text NOT NULL,
    equipo_id text NOT NULL,
    fecha timestamp with time zone NOT NULL,
    tipo text NOT NULL,
    resultado text NOT NULL,
    responsable text,
    observaciones text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    sheets_row_index integer,
    sheets_synced_at timestamp with time zone,
    local_modified_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.comprobaciones OWNER TO rulos;

--
-- Name: ensayos; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.ensayos (
    id character varying(36) NOT NULL,
    codigo character varying(50) NOT NULL,
    tipo character varying(100) NOT NULL,
    perforacion_id character varying(36) NOT NULL,
    proyecto_id character varying(36) NOT NULL,
    muestra character varying(100) NOT NULL,
    norma character varying(100) NOT NULL,
    workflow_state character varying(50) DEFAULT 'solicitado'::character varying NOT NULL,
    fecha_solicitud date NOT NULL,
    fecha_programacion date,
    fecha_ejecucion date,
    fecha_reporte date,
    fecha_entrega date,
    tecnico_id character varying(36),
    tecnico_nombre character varying(255),
    sheet_id character varying(100),
    sheet_url text,
    equipos_utilizados text[],
    observaciones text,
    urgente boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    synced_at timestamp with time zone,
    sync_source character varying(20) DEFAULT 'sheets'::character varying,
    pdf_drive_id character varying(100),
    pdf_url text,
    pdf_generated_at timestamp with time zone,
    perforacion_folder_id character varying(100),
    muestra_id character varying(36),
    duracion_estimada character varying(50)
);


ALTER TABLE public.ensayos OWNER TO rulos;

--
-- Name: COLUMN ensayos.pdf_drive_id; Type: COMMENT; Schema: public; Owner: rulos
--

COMMENT ON COLUMN public.ensayos.pdf_drive_id IS 'Google Drive file ID del PDF generado';


--
-- Name: COLUMN ensayos.pdf_url; Type: COMMENT; Schema: public; Owner: rulos
--

COMMENT ON COLUMN public.ensayos.pdf_url IS 'URL directa al PDF en Google Drive';


--
-- Name: COLUMN ensayos.pdf_generated_at; Type: COMMENT; Schema: public; Owner: rulos
--

COMMENT ON COLUMN public.ensayos.pdf_generated_at IS 'Timestamp de la última generación del PDF';


--
-- Name: COLUMN ensayos.perforacion_folder_id; Type: COMMENT; Schema: public; Owner: rulos
--

COMMENT ON COLUMN public.ensayos.perforacion_folder_id IS 'ID de la carpeta de Drive de la perforación (cache)';


--
-- Name: equipos; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.equipos (
    id character varying(36) NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(255) NOT NULL,
    serie character varying(100) NOT NULL,
    placa character varying(50),
    descripcion text,
    marca character varying(100),
    modelo character varying(100),
    ubicacion character varying(100),
    estado character varying(50) DEFAULT 'disponible'::character varying NOT NULL,
    fecha_calibracion date,
    proxima_calibracion date,
    incertidumbre numeric(10,6),
    error_maximo numeric(10,6),
    certificado_id character varying(100),
    responsable character varying(255),
    observaciones text,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    synced_at timestamp with time zone,
    sync_source character varying(20) DEFAULT 'sheets'::character varying
);


ALTER TABLE public.equipos OWNER TO rulos;

--
-- Name: muestras; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.muestras (
    id character varying(36) NOT NULL,
    codigo character varying(50) NOT NULL,
    perforacion_id character varying(36) NOT NULL,
    profundidad_inicio numeric(10,2) NOT NULL,
    profundidad_fin numeric(10,2) NOT NULL,
    tipo_muestra character varying(50) NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    synced_at timestamp with time zone,
    sync_source character varying(20) DEFAULT 'db'::character varying,
    CONSTRAINT profundidad_valida CHECK ((profundidad_fin >= profundidad_inicio)),
    CONSTRAINT tipo_muestra_valido CHECK (((tipo_muestra)::text = ANY (ARRAY[('alterado'::character varying)::text, ('inalterado'::character varying)::text, ('roca'::character varying)::text, ('spt'::character varying)::text, ('shelby'::character varying)::text])))
);


ALTER TABLE public.muestras OWNER TO rulos;

--
-- Name: TABLE muestras; Type: COMMENT; Schema: public; Owner: rulos
--

COMMENT ON TABLE public.muestras IS 'Muestras extraídas de perforaciones para ensayos de laboratorio';


--
-- Name: COLUMN muestras.codigo; Type: COMMENT; Schema: public; Owner: rulos
--

COMMENT ON COLUMN public.muestras.codigo IS 'Código único de la muestra, formato M-XXX';


--
-- Name: COLUMN muestras.profundidad_inicio; Type: COMMENT; Schema: public; Owner: rulos
--

COMMENT ON COLUMN public.muestras.profundidad_inicio IS 'Profundidad de inicio de extracción en metros';


--
-- Name: COLUMN muestras.profundidad_fin; Type: COMMENT; Schema: public; Owner: rulos
--

COMMENT ON COLUMN public.muestras.profundidad_fin IS 'Profundidad de fin de extracción en metros';


--
-- Name: COLUMN muestras.tipo_muestra; Type: COMMENT; Schema: public; Owner: rulos
--

COMMENT ON COLUMN public.muestras.tipo_muestra IS 'Tipo: alterado, inalterado, roca, spt, shelby';


--
-- Name: perforaciones; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.perforaciones (
    id character varying(36) NOT NULL,
    codigo character varying(50) NOT NULL,
    proyecto_id character varying(36) NOT NULL,
    nombre character varying(255) NOT NULL,
    fecha_inicio date,
    fecha_fin date,
    estado character varying(50) DEFAULT 'planificada'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    synced_at timestamp with time zone,
    sync_source character varying(20) DEFAULT 'sheets'::character varying,
    descripcion text,
    ubicacion character varying(255),
    profundidad numeric(10,2),
    drive_folder_id character varying(100)
);


ALTER TABLE public.perforaciones OWNER TO rulos;

--
-- Name: personal_interno; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.personal_interno (
    id character varying(36) NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    cargo character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    telefono character varying(50),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    synced_at timestamp with time zone,
    sync_source character varying(20)
);


ALTER TABLE public.personal_interno OWNER TO rulos;

--
-- Name: personal_tipos_ensayo; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.personal_tipos_ensayo (
    id character varying(50) DEFAULT (gen_random_uuid())::text NOT NULL,
    personal_id character varying(50) NOT NULL,
    tipo_ensayo_id character varying(50) NOT NULL,
    nivel public.nivel_responsabilidad NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.personal_tipos_ensayo OWNER TO rulos;

--
-- Name: proyectos; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.proyectos (
    id character varying(36) NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    fecha_inicio date NOT NULL,
    fecha_fin_estimada date,
    cliente_id character varying(36) NOT NULL,
    cliente_nombre character varying(255) NOT NULL,
    contacto character varying(255),
    estado character varying(50) DEFAULT 'activo'::character varying NOT NULL,
    fecha_fin_real date,
    drive_folder_id character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by character varying(255),
    synced_at timestamp with time zone,
    sync_source character varying(20) DEFAULT 'sheets'::character varying,
    duracion_estimada character varying(50),
    ensayos_cotizados jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.proyectos OWNER TO rulos;

--
-- Name: sensores; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.sensores (
    id character varying(36) NOT NULL,
    codigo character varying(20) NOT NULL,
    tipo character varying(100) DEFAULT 'general'::character varying NOT NULL,
    estado character varying(50) DEFAULT 'activo'::character varying,
    fecha_calibracion date,
    proxima_calibracion date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    synced_at timestamp with time zone,
    sync_source character varying(20) DEFAULT 'sheets'::character varying,
    marca character varying(100),
    modelo character varying(100),
    numero_serie character varying(100) DEFAULT ''::character varying NOT NULL,
    rango_medicion character varying(100),
    "precision" character varying(100),
    ubicacion character varying(255),
    error_maximo numeric(10,6),
    certificado_id character varying(100),
    responsable character varying(255),
    observaciones text,
    activo boolean DEFAULT true,
    equipo_id character varying(36)
);


ALTER TABLE public.sensores OWNER TO rulos;

--
-- Name: sync_log; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.sync_log (
    id integer NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(36) NOT NULL,
    action character varying(20) NOT NULL,
    source character varying(20) NOT NULL,
    target character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);


ALTER TABLE public.sync_log OWNER TO rulos;

--
-- Name: sync_log_id_seq; Type: SEQUENCE; Schema: public; Owner: rulos
--

CREATE SEQUENCE public.sync_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_log_id_seq OWNER TO rulos;

--
-- Name: sync_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rulos
--

ALTER SEQUENCE public.sync_log_id_seq OWNED BY public.sync_log.id;


--
-- Name: tipos_ensayo; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.tipos_ensayo (
    id character varying(50) DEFAULT (gen_random_uuid())::text NOT NULL,
    nombre character varying(255) NOT NULL,
    categoria character varying(50),
    vigente_desde date,
    norma character varying(100) NOT NULL,
    acre public.acreditacion NOT NULL,
    activo boolean DEFAULT true,
    orden integer DEFAULT 0,
    precio_base numeric(10,2),
    tiempo_estimado_dias integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tipos_ensayo OWNER TO rulos;

--
-- Name: tipos_ensayo_normas_historial; Type: TABLE; Schema: public; Owner: rulos
--

CREATE TABLE public.tipos_ensayo_normas_historial (
    id character varying(50) DEFAULT (gen_random_uuid())::text NOT NULL,
    tipo_ensayo_id character varying(50) NOT NULL,
    norma character varying(100) NOT NULL,
    norma_version character varying(50),
    vigente_desde date NOT NULL,
    vigente_hasta date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tipos_ensayo_normas_historial OWNER TO rulos;

--
-- Name: sync_log id; Type: DEFAULT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.sync_log ALTER COLUMN id SET DEFAULT nextval('public.sync_log_id_seq'::regclass);


--
-- Name: _sqlx_migrations _sqlx_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public._sqlx_migrations
    ADD CONSTRAINT _sqlx_migrations_pkey PRIMARY KEY (version);


--
-- Name: calibraciones calibraciones_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.calibraciones
    ADD CONSTRAINT calibraciones_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_codigo_key; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_codigo_key UNIQUE (codigo);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: comprobaciones comprobaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.comprobaciones
    ADD CONSTRAINT comprobaciones_pkey PRIMARY KEY (id);


--
-- Name: ensayos ensayos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT ensayos_codigo_key UNIQUE (codigo);


--
-- Name: ensayos ensayos_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT ensayos_pkey PRIMARY KEY (id);


--
-- Name: equipos equipos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_codigo_key UNIQUE (codigo);


--
-- Name: equipos equipos_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_pkey PRIMARY KEY (id);


--
-- Name: muestras muestras_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.muestras
    ADD CONSTRAINT muestras_pkey PRIMARY KEY (id);


--
-- Name: perforaciones perforaciones_codigo_key; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.perforaciones
    ADD CONSTRAINT perforaciones_codigo_key UNIQUE (codigo);


--
-- Name: perforaciones perforaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.perforaciones
    ADD CONSTRAINT perforaciones_pkey PRIMARY KEY (id);


--
-- Name: personal_interno personal_interno_codigo_key; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.personal_interno
    ADD CONSTRAINT personal_interno_codigo_key UNIQUE (codigo);


--
-- Name: personal_interno personal_interno_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.personal_interno
    ADD CONSTRAINT personal_interno_pkey PRIMARY KEY (id);


--
-- Name: personal_tipos_ensayo personal_tipos_ensayo_personal_id_tipo_ensayo_id_nivel_key; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.personal_tipos_ensayo
    ADD CONSTRAINT personal_tipos_ensayo_personal_id_tipo_ensayo_id_nivel_key UNIQUE (personal_id, tipo_ensayo_id, nivel);


--
-- Name: personal_tipos_ensayo personal_tipos_ensayo_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.personal_tipos_ensayo
    ADD CONSTRAINT personal_tipos_ensayo_pkey PRIMARY KEY (id);


--
-- Name: proyectos proyectos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_codigo_key UNIQUE (codigo);


--
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- Name: sensores sensores_codigo_key; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.sensores
    ADD CONSTRAINT sensores_codigo_key UNIQUE (codigo);


--
-- Name: sensores sensores_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.sensores
    ADD CONSTRAINT sensores_pkey PRIMARY KEY (id);


--
-- Name: sync_log sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.sync_log
    ADD CONSTRAINT sync_log_pkey PRIMARY KEY (id);


--
-- Name: tipos_ensayo_normas_historial tipos_ensayo_normas_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.tipos_ensayo_normas_historial
    ADD CONSTRAINT tipos_ensayo_normas_historial_pkey PRIMARY KEY (id);


--
-- Name: tipos_ensayo tipos_ensayo_pkey; Type: CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.tipos_ensayo
    ADD CONSTRAINT tipos_ensayo_pkey PRIMARY KEY (id);


--
-- Name: idx_calibraciones_equipo_id; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_calibraciones_equipo_id ON public.calibraciones USING btree (equipo_id);


--
-- Name: idx_calibraciones_fecha; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_calibraciones_fecha ON public.calibraciones USING btree (fecha);


--
-- Name: idx_clientes_activo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_clientes_activo ON public.clientes USING btree (activo);


--
-- Name: idx_clientes_codigo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_clientes_codigo ON public.clientes USING btree (codigo);


--
-- Name: idx_comprobaciones_equipo_id; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_comprobaciones_equipo_id ON public.comprobaciones USING btree (equipo_id);


--
-- Name: idx_comprobaciones_fecha; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_comprobaciones_fecha ON public.comprobaciones USING btree (fecha);


--
-- Name: idx_ensayos_fecha_solicitud; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_ensayos_fecha_solicitud ON public.ensayos USING btree (fecha_solicitud);


--
-- Name: idx_ensayos_muestra; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_ensayos_muestra ON public.ensayos USING btree (muestra_id);


--
-- Name: idx_ensayos_pdf; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_ensayos_pdf ON public.ensayos USING btree (pdf_drive_id) WHERE (pdf_drive_id IS NOT NULL);


--
-- Name: idx_ensayos_pending_pdf; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_ensayos_pending_pdf ON public.ensayos USING btree (workflow_state) WHERE (((workflow_state)::text = 'E12'::text) AND (pdf_drive_id IS NULL));


--
-- Name: idx_ensayos_perforacion; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_ensayos_perforacion ON public.ensayos USING btree (perforacion_id);


--
-- Name: idx_ensayos_proyecto; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_ensayos_proyecto ON public.ensayos USING btree (proyecto_id);


--
-- Name: idx_ensayos_tipo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_ensayos_tipo ON public.ensayos USING btree (tipo);


--
-- Name: idx_ensayos_urgente; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_ensayos_urgente ON public.ensayos USING btree (urgente);


--
-- Name: idx_ensayos_workflow; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_ensayos_workflow ON public.ensayos USING btree (workflow_state);


--
-- Name: idx_equipos_codigo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_equipos_codigo ON public.equipos USING btree (codigo);


--
-- Name: idx_equipos_estado; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_equipos_estado ON public.equipos USING btree (estado);


--
-- Name: idx_equipos_proxima_calibracion; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_equipos_proxima_calibracion ON public.equipos USING btree (proxima_calibracion);


--
-- Name: idx_muestras_codigo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_muestras_codigo ON public.muestras USING btree (codigo);


--
-- Name: idx_muestras_perforacion; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_muestras_perforacion ON public.muestras USING btree (perforacion_id);


--
-- Name: idx_muestras_tipo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_muestras_tipo ON public.muestras USING btree (tipo_muestra);


--
-- Name: idx_perforaciones_codigo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_perforaciones_codigo ON public.perforaciones USING btree (codigo);


--
-- Name: idx_perforaciones_proyecto; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_perforaciones_proyecto ON public.perforaciones USING btree (proyecto_id);


--
-- Name: idx_personal_interno_activo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_personal_interno_activo ON public.personal_interno USING btree (activo);


--
-- Name: idx_personal_interno_cargo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_personal_interno_cargo ON public.personal_interno USING btree (cargo);


--
-- Name: idx_personal_interno_codigo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_personal_interno_codigo ON public.personal_interno USING btree (codigo);


--
-- Name: idx_personal_tipos_ensayo_activo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_personal_tipos_ensayo_activo ON public.personal_tipos_ensayo USING btree (tipo_ensayo_id, nivel) WHERE (activo = true);


--
-- Name: idx_personal_tipos_ensayo_personal; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_personal_tipos_ensayo_personal ON public.personal_tipos_ensayo USING btree (personal_id);


--
-- Name: idx_personal_tipos_ensayo_tipo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_personal_tipos_ensayo_tipo ON public.personal_tipos_ensayo USING btree (tipo_ensayo_id);


--
-- Name: idx_proyectos_cliente; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_proyectos_cliente ON public.proyectos USING btree (cliente_id);


--
-- Name: idx_proyectos_codigo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_proyectos_codigo ON public.proyectos USING btree (codigo);


--
-- Name: idx_proyectos_estado; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_proyectos_estado ON public.proyectos USING btree (estado);


--
-- Name: idx_proyectos_fecha_inicio; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_proyectos_fecha_inicio ON public.proyectos USING btree (fecha_inicio);


--
-- Name: idx_sensores_equipo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_sensores_equipo ON public.sensores USING btree (equipo_id) WHERE (equipo_id IS NOT NULL);


--
-- Name: idx_sensores_estado; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_sensores_estado ON public.sensores USING btree (estado);


--
-- Name: idx_sensores_numero_serie; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_sensores_numero_serie ON public.sensores USING btree (numero_serie);


--
-- Name: idx_sync_log_entity; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_sync_log_entity ON public.sync_log USING btree (entity_type, entity_id);


--
-- Name: idx_sync_log_status; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_sync_log_status ON public.sync_log USING btree (status);


--
-- Name: idx_tipos_ensayo_activo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_tipos_ensayo_activo ON public.tipos_ensayo USING btree (activo) WHERE (activo = true);


--
-- Name: idx_tipos_ensayo_categoria; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_tipos_ensayo_categoria ON public.tipos_ensayo USING btree (categoria);


--
-- Name: idx_tipos_ensayo_normas_tipo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_tipos_ensayo_normas_tipo ON public.tipos_ensayo_normas_historial USING btree (tipo_ensayo_id);


--
-- Name: idx_tipos_ensayo_normas_vigente; Type: INDEX; Schema: public; Owner: rulos
--

CREATE INDEX idx_tipos_ensayo_normas_vigente ON public.tipos_ensayo_normas_historial USING btree (tipo_ensayo_id) WHERE (vigente_hasta IS NULL);


--
-- Name: uq_tipos_ensayo_nombre_activo; Type: INDEX; Schema: public; Owner: rulos
--

CREATE UNIQUE INDEX uq_tipos_ensayo_nombre_activo ON public.tipos_ensayo USING btree (lower((nombre)::text)) WHERE (activo = true);


--
-- Name: muestras trigger_muestras_updated_at; Type: TRIGGER; Schema: public; Owner: rulos
--

CREATE TRIGGER trigger_muestras_updated_at BEFORE UPDATE ON public.muestras FOR EACH ROW EXECUTE FUNCTION public.update_muestras_updated_at();


--
-- Name: clientes update_clientes_updated_at; Type: TRIGGER; Schema: public; Owner: rulos
--

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ensayos update_ensayos_updated_at; Type: TRIGGER; Schema: public; Owner: rulos
--

CREATE TRIGGER update_ensayos_updated_at BEFORE UPDATE ON public.ensayos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: equipos update_equipos_updated_at; Type: TRIGGER; Schema: public; Owner: rulos
--

CREATE TRIGGER update_equipos_updated_at BEFORE UPDATE ON public.equipos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: perforaciones update_perforaciones_updated_at; Type: TRIGGER; Schema: public; Owner: rulos
--

CREATE TRIGGER update_perforaciones_updated_at BEFORE UPDATE ON public.perforaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: proyectos update_proyectos_updated_at; Type: TRIGGER; Schema: public; Owner: rulos
--

CREATE TRIGGER update_proyectos_updated_at BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sensores update_sensores_updated_at; Type: TRIGGER; Schema: public; Owner: rulos
--

CREATE TRIGGER update_sensores_updated_at BEFORE UPDATE ON public.sensores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: calibraciones calibraciones_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.calibraciones
    ADD CONSTRAINT calibraciones_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON DELETE CASCADE;


--
-- Name: comprobaciones comprobaciones_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.comprobaciones
    ADD CONSTRAINT comprobaciones_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON DELETE CASCADE;


--
-- Name: ensayos ensayos_muestra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT ensayos_muestra_id_fkey FOREIGN KEY (muestra_id) REFERENCES public.muestras(id) ON DELETE SET NULL;


--
-- Name: ensayos ensayos_perforacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT ensayos_perforacion_id_fkey FOREIGN KEY (perforacion_id) REFERENCES public.perforaciones(id);


--
-- Name: ensayos ensayos_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT ensayos_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id);


--
-- Name: sensores fk_sensores_equipo; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.sensores
    ADD CONSTRAINT fk_sensores_equipo FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON DELETE SET NULL;


--
-- Name: muestras muestras_perforacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.muestras
    ADD CONSTRAINT muestras_perforacion_id_fkey FOREIGN KEY (perforacion_id) REFERENCES public.perforaciones(id) ON DELETE CASCADE;


--
-- Name: perforaciones perforaciones_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.perforaciones
    ADD CONSTRAINT perforaciones_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id);


--
-- Name: personal_tipos_ensayo personal_tipos_ensayo_personal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.personal_tipos_ensayo
    ADD CONSTRAINT personal_tipos_ensayo_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES public.personal_interno(id);


--
-- Name: personal_tipos_ensayo personal_tipos_ensayo_tipo_ensayo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.personal_tipos_ensayo
    ADD CONSTRAINT personal_tipos_ensayo_tipo_ensayo_id_fkey FOREIGN KEY (tipo_ensayo_id) REFERENCES public.tipos_ensayo(id);


--
-- Name: proyectos proyectos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: tipos_ensayo_normas_historial tipos_ensayo_normas_historial_tipo_ensayo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rulos
--

ALTER TABLE ONLY public.tipos_ensayo_normas_historial
    ADD CONSTRAINT tipos_ensayo_normas_historial_tipo_ensayo_id_fkey FOREIGN KEY (tipo_ensayo_id) REFERENCES public.tipos_ensayo(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 34kxybKKOrqkjvdFAMLWgNz0v7jcgP3IlUQSbiu8vk6DECbpyHAj9zeAEVdPu5n

