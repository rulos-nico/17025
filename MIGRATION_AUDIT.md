# MIGRATION_AUDIT.md — Auditoría Lab 17025 (legacy Rust + React + Postgres)

> Fecha: 2026-05-06 · Rama auditada: `main` · Workdir: `/home/rulos/Proyects/17025`
> Objetivo: inventario exhaustivo para portar a ASP.NET Core 9 + Vue 3 + SQL Server 2022.

## 0. TL;DR

- **Backend:** Axum 0.8 (Rust 2021), sqlx 0.8 sobre PostgreSQL 18, autenticación delegada 100% a Google OAuth (sin JWT propio, sin refresh tokens). Integración pesada con Google Drive + Sheets vía service account. ~7.5k LOC.
- **Frontend:** React 19 + TS + Vite (rolldown-vite). Sin React Router (navegación por estado en `App.tsx`), sin Zustand/React Query (hooks custom + `useApiData/useMutation`). ~23.7k LOC.
- **Datos:** 25 migraciones sqlx, ~20 tablas activas, 1 tipo ENUM (`acreditacion`), 2 funciones plpgsql (`update_updated_at_column`, `comprobacion_derive_metrics`), JSONB para réplicas de comprobación y ensayos cotizados, arrays `TEXT[]` para `equipos_utilizados`.
- **Workflow ensayos:** máquina de estados E1→E15 con disparador automático en E12 (genera PDF en Drive) y endpoint `/validar` que asigna técnico+fecha+equipos.
- **Riesgo de migración alto:** integración Drive/Sheets, función plpgsql con STDDEV_SAMP en trigger, cálculo metrológico con DECIMAL(30,20), generación de códigos por nanosegundos.

---

## 1. Backend Rust — Módulos y endpoints

### 1.1 Estructura del crate `src/api`

```
src/api/
├── Cargo.toml
├── migrations/                  # 25 archivos .sql (sqlx-migrate)
└── src/
    ├── main.rs                  # bootstrap Axum + middlewares
    ├── config.rs                # AppConfig desde env
    ├── errors.rs                # AppError (impl IntoResponse)
    ├── routes/                  # 13 routers (mod.rs los nidifica)
    ├── models/                  # 15 archivos
    ├── repositories/            # 14 archivos (1 por agregado)
    ├── services/                # google_drive, ensayo_sheets, scheduler
    └── utils/                   # date.rs, id.rs, sql.rs
```

### 1.2 Dependencias clave (`Cargo.toml`)

| Crate | Versión | Uso |
|---|---|---|
| axum | 0.8 | HTTP framework |
| tokio | 1 (full) | runtime async |
| tower-http | 0.6 | CORS, trace, compression |
| sqlx | 0.8 | Postgres + macros + migrate |
| uuid | 1 | IDs |
| chrono | 0.4 | timestamps |
| serde / serde_json | 1 | (de)serialización |
| jsonwebtoken | 9 | (importado pero **no se usa** para emitir tokens — auth real es OAuth) |
| reqwest | 0.12 | llama a `googleapis.com/oauth2/v2/userinfo` |
| google-drive3 | 6 | API Drive |
| yup-oauth2 | 12 | service account |
| axum-prometheus | 0.7 | métricas `/metrics` |
| tracing / tracing-subscriber | 0.1 / 0.3 | logs estructurados |
| tokio-cron-scheduler | (presente pero **no usado**: scheduler real es síncrono al endpoint `/validar`) |

### 1.3 Montaje de rutas (`src/api/src/routes/mod.rs`)

- Públicas: `/auth/*`
- Protegidas (middleware `require_auth`): `/calibraciones`, `/clientes`, `/comprobaciones`, `/ensayos`, `/equipos`, `/muestras`, `/perforaciones`, `/personal-interno`, `/proyectos`, `/sensores`, `/tipos-ensayo`, `/tipos-ensayo-sheets`.
- Bypass: variable `REQUIRE_AUTH=false` deshabilita el middleware (modo dev).

### 1.4 Inventario de endpoints

> Prefijo común: `/api`. CRUD estándar = `GET /` (list), `POST /` (create), `GET /{id}`, `PUT /{id}`, `DELETE /{id}`.

#### auth (`routes/auth.rs`)
| Método | Path | Descripción |
|---|---|---|
| GET  | `/auth/health`  | Healthcheck del módulo |
| POST | `/auth/login`   | Body: `{ access_token }`. Valida contra `https://www.googleapis.com/oauth2/v2/userinfo`. Devuelve `User { id,email,nombre,rol,picture? }`. **No emite JWT propio**. |
| GET  | `/auth/profile` | Lee header `Authorization: Bearer <google_access_token>`. |
| POST | `/auth/logout`  | No-op (cliente borra token). |

Middleware: `require_auth` (extrae bearer, llama a Google userinfo, inyecta `User` en request extensions). `require_role(role)` declarado pero **no aplicado en ningún router**.

#### proyectos
- CRUD; `GET /proyectos/{id}/perforaciones`. Crea folder Drive al crear.
- Campo `ensayos_cotizados JSONB` para presupuesto.

#### clientes
- CRUD; `drive_folder_id` cacheado.

#### perforaciones
- CRUD; `GET /perforaciones/{id}/ensayos`, `GET /perforaciones/{id}/muestras`. Crea folder Drive.

#### muestras
- CRUD; `GET /muestras/{id}/ensayos`. Trigger `trigger_muestras_updated_at`.

#### ensayos (`routes/ensayo.rs`)
| Método | Path | Descripción |
|---|---|---|
| GET    | `/ensayos`                       | listar |
| POST   | `/ensayos`                       | crea ensayo + copia plantilla Sheets por `tipo_ensayo` |
| POST   | `/ensayos/drive-cleanup`         | barrido huérfanos en Drive |
| GET    | `/ensayos/{id}`                  | detalle |
| PUT    | `/ensayos/{id}`                  | update |
| DELETE | `/ensayos/{id}`                  | borra registro + sheet |
| PUT    | `/ensayos/{id}/status`           | transición libre de workflow |
| POST   | `/ensayos/{id}/validar`          | **E1→E2**: dispara `scheduler` (técnico+fecha+equipos). Body: `ValidarEnsayoRequest { tecnico_id?, fecha_programacion? }` |
| GET    | `/ensayos/{id}/pdf`              | download PDF generado |
| POST   | `/ensayos/{id}/pdf/generate`     | fuerza generación PDF (también automática al entrar a E12) |

#### equipos / sensores / calibraciones / comprobaciones
- equipos: CRUD.
- sensores: CRUD + `GET /sensores/equipo/{equipo_id}`.
- calibraciones (nuevas, por sensor): CRUD + `GET /calibraciones/sensor/{sensor_id}`.
- comprobaciones (nuevas, por sensor): CRUD + `GET /comprobaciones/sensor/{sensor_id}`.

#### personal-interno
- CRUD plano. La capacidad se modela en tablas separadas (`personal_capacidad`, `personal_tipos_ensayo`).

#### tipos-ensayo
- CRUD + `GET /tipos-ensayo/activos`.

#### tipos-ensayo-sheets
- `GET /tipos-ensayo-sheets/tipo-ensayo/{tipo_ensayo_id}` (list + POST), `GET/PUT/DELETE /{id}`.

### 1.5 DTOs principales (`src/api/src/models/`)

15 archivos, uno por agregado: `cliente.rs`, `proyecto.rs`, `perforacion.rs`, `muestra.rs`, `ensayo.rs`, `equipo.rs`, `sensor.rs`, `calibracion.rs`, `comprobacion.rs`, `personal_interno.rs`, `tipo_ensayo.rs`, `tipo_ensayo_sheet.rs`, `usuario.rs`, `workflow.rs`, `mod.rs`.

Patrón: cada agregado define `Entity`, `CreateEntity`, `UpdateEntity` (+ a veces `EntityRow` o helpers `from_row`/`to_row` para mapeos legacy desde Sheets).

**Ejemplo `Ensayo` (28 campos):** `id, codigo, tipo, perforacion_id, proyecto_id, muestra, muestra_id?, norma, workflow_state, fecha_solicitud, fecha_programacion?, fecha_ejecucion?, fecha_reporte?, fecha_entrega?, tecnico_id?, tecnico_nombre?, sheet_id?, sheet_url?, equipos_utilizados: Vec<String>, observaciones?, urgente: bool, duracion_estimada?, pdf_drive_id?, pdf_url?, pdf_generated_at?, perforacion_folder_id?, created_at, updated_at`.

### 1.6 Workflow de ensayos (`models/workflow.rs`)

Enum `WorkflowState` con 15 variantes E1…E15 + transiciones permitidas codificadas. **Importante**: existe drift de nombres entre backend y frontend:

| Estado | Backend (`workflow.rs`) | Frontend (`src/config.ts`) |
|---|---|---|
| E1 | Solicitado | Solicitado |
| E2 | Programado | Programado |
| E12 | Por enviar (auto-PDF) | Por enviar |
| E13 | Enviado | Enviado |
| E14 | Entregado | Entregado |
| E15 | Facturado / Terminal | Facturado |
| E3 | Cancelado / Terminal | — |

E12 dispara `services/ensayo_sheets::generate_pdf()` que exporta el sheet a PDF y lo sube a la carpeta de la perforación.

### 1.7 Funciones especiales

- **`utils/id.rs`**: `generate_uuid()` (uuid v4), `generate_dated_code(prefix)` → `PRY-YYYYMMDD-XXXX`, `generate_simple_code(prefix)` → `CLI-XXXX`. El sufijo XXXX es `nanos % 10000` (alta probabilidad de colisión bajo carga; portar a CLOCK_SEQ o secuencia SQL).
- **`services/scheduler.rs`** (145 LOC): se ejecuta sincrónicamente desde `POST /ensayos/{id}/validar`. Algoritmo:
  1. Lee `equipos_tipos_ensayo` y `personal_tipos_ensayo` (nivel `Ejecutor`) para el tipo de ensayo.
  2. Itera fechas hábiles desde hoy hasta +365 días buscando primer hueco con (a) técnico libre (capacidad < `max_ensayos_activos`) y (b) todos los equipos requeridos sin reserva en esa fecha.
  3. Crea filas en `reservas_equipos`, asigna `tecnico_id`/`fecha_programacion` al ensayo y promueve a E2.
- **`services/google_drive.rs`** (250 LOC): autenticación con service account JSON (`sustained-truck-493518-b7-d4b4e336bdd1.json` en root). Crea jerarquía Cliente→Proyecto→Perforación→Muestra. Copia plantillas de Sheets (`tipos_ensayo_sheets.template_id`). Exporta a PDF con `files.export(application/pdf)`.
- **`services/ensayo_sheets.rs`** (205 LOC): orquesta la creación del Sheet por tipo de ensayo y mantiene metadata sincronizada (sheet_id, sheet_url, pdf_*).

---

## 2. Modelo de datos

### 2.1 Migraciones (25 archivos)

| # | Versión | Archivo | Resumen | Estado SQL Server |
|---|---|---|---|---|
| 1 | 20240101000000 | initial_schema | 6 tablas core + sync_log + trigger updated_at | **Portada** |
| 2 | 20240102000000 | fix_perforaciones_sensores | No-op (placeholder) | — |
| 3 | 20240103000000 | add_pdf_fields_to_ensayos | pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id; índices parciales | Pendiente |
| 4 | 20240125000000 | add_muestras_table | tabla `muestras` + checks + trigger propio | Pendiente |
| 5 | 20240126000000 | add_equipo_id_to_sensores | FK sensores→equipos | **Portada** |
| 6 | 20240127000000 | add_personal_interno_table | tabla personal_interno | Pendiente |
| 7 | 20240128000000 | add_comprobaciones_calibraciones_tables | tablas viejas (luego dropeadas) | Obsoleta |
| 8 | 20240300000000 | add_table_ensayos | tabla `ensayos` (versión final) | Pendiente |
| 9 | 20240301000000 | add_unique_nombre_tipos_ensayo | índice único parcial | Pendiente |
| 10 | 20260309000000 | add_usuarios_table | tabla `usuarios` (rol VARCHAR default 'tecnico') | **Portada** |
| 11 | 20260309001000 | add_scheduler_tables | `equipos_tipos_ensayo`, `personal_capacidad`, `reservas_equipos` | Pendiente |
| 12 | 20260310000000 | add_duracion_estimada_to_ensayos | columna duracion_estimada | Pendiente |
| 13 | 20260318114500 | enhance_scheduler_tables | **Archivo vacío (0 bytes)** — placeholder de migración | n/a |
| 14 | 20260413000000 | add_url_sheets_ensayos | sheet_url | Pendiente |
| 15 | 20260415000000 | add_prices_table | drop precio_base de tipos_ensayo + crea `precios` con histórico | Pendiente |
| 16 | 20260417000000 | add_drive_folder_id_to_muestras | drive_folder_id | Pendiente |
| 17 | 20260417010000 | seed_tipos_ensayo_sheets | seed plantillas (template_id Drive) | Pendiente |
| 18 | 20260420143500 | update_tipos_ensayo_sheets_drive_ids | actualiza IDs Drive reales | Pendiente |
| 19 | 20260420205700 | calibration_sensor | DROP `calibraciones` viejo + crea `calibracion` nueva por sensor con `factor DECIMAL(30,20)` | Pendiente |
| 20 | 20260421000000 | comprobacion_sensor | DROP `comprobaciones` viejo + crea `comprobacion_resultados` (catálogo) y `comprobacion` nueva con JSONB data | Pendiente |
| 21 | 20260428000000 | seed_equipos_demo_data | seed | **Portada** |
| 22 | 20260428000100 | add_incertidumbre_calibracion | columna incertidumbre | Pendiente |
| 23 | 20260428000200 | redistribute_comprobaciones_demo | re-seed | Pendiente |
| 24 | 20260429000000 | comprobacion_derivados | columnas valor_patron, unidad, n_replicas, media, desviacion_std, error, incertidumbre + función `comprobacion_derive_metrics()` + trigger | Pendiente (clave) |
| 25 | 20260429000100 | seed_comprobaciones_v2 | seed final | Pendiente |

### 2.2 Schema consolidado

> El dump `docs/esquema_local.sql` (1181 líneas) está **desactualizado** — no contiene `usuarios`, `precios`, `equipos_tipos_ensayo`, `personal_capacidad`, `reservas_equipos`, `tipos_ensayo_sheets`, `calibracion` (singular) ni `comprobacion` (singular). Refleja un estado anterior a las migraciones de 2026-03/04.

#### Tablas activas (post-migraciones)

| Tabla | PK | FKs salientes | Triggers | Notas |
|---|---|---|---|---|
| `clientes` | id varchar(36) | — | update_clientes_updated_at | unique(codigo) |
| `proyectos` | id varchar(36) | cliente_id→clientes | update_proyectos_updated_at | `ensayos_cotizados JSONB`, `drive_folder_id` |
| `perforaciones` | id varchar(36) | proyecto_id→proyectos | update_perforaciones_updated_at | drive_folder_id |
| `muestras` | id varchar(36) | perforacion_id→perforaciones (CASCADE) | trigger_muestras_updated_at | check profundidad_fin>=inicio, check tipo IN (alterado/inalterado/roca/spt/shelby) |
| `ensayos` | id varchar(36) | proyecto_id, perforacion_id, muestra_id (SET NULL) | update_ensayos_updated_at | `equipos_utilizados text[]`, índice parcial sobre workflow_state='E12' AND pdf_drive_id IS NULL |
| `equipos` | id varchar(36) | — | update_equipos_updated_at | unique(codigo) |
| `sensores` | id varchar(36) | equipo_id→equipos (SET NULL) | update_sensores_updated_at | unique(codigo); columnas legacy de calibración fueron DROPed por migración 19 |
| `calibracion` (singular) | id varchar(36) | sensor_id→sensores (CASCADE) | update_calibracion_updated_at | `factor DECIMAL(30,20)`; check estado IN (vigente/vencida/pendiente); incertidumbre añadida en mig 22 |
| `comprobacion` (singular) | id varchar(36) | sensor_id (CASCADE), resultado→comprobacion_resultados (RESTRICT), responsable→usuarios(id) (RESTRICT) | update_comprobacion_updated_at, trg_comprobacion_derive | `data JSONB` (réplicas + condiciones), columnas derivadas calculadas por trigger |
| `comprobacion_resultados` | resultado varchar(50) | — | — | catálogo: 'Conforme', 'No Conforme' |
| `personal_interno` | id varchar(36) | — | — | unique(codigo) |
| `personal_tipos_ensayo` | id varchar(50) | personal_id, tipo_ensayo_id | — | enum `nivel_responsabilidad` (Ejecutor/Supervisor/Firmante); unique(personal_id,tipo_ensayo_id,nivel) |
| `personal_capacidad` | id varchar(50) | personal_id, tipo_ensayo_id | — | unique(personal_id,tipo_ensayo_id), max_ensayos_activos default 100 |
| `equipos_tipos_ensayo` | id varchar(50) | equipo_id, tipo_ensayo_id | — | unique(equipo_id,tipo_ensayo_id), `requerido` |
| `reservas_equipos` | id varchar(50) | equipo_id (CASCADE), ensayo_id (SET NULL) | — | índice (equipo_id, fecha) |
| `tipos_ensayo` | id varchar(50) | — | update | enum `acreditacion`; unique parcial `lower(nombre) WHERE activo` |
| `tipos_ensayo_normas_historial` | id varchar(50) | tipo_ensayo_id | — | versionado de normas |
| `tipos_ensayo_sheets` | (ver mig 17) | tipo_ensayo_id | — | template_id Drive por tipo |
| `precios` | id serial | tipo_ensayo_id (CASCADE) | update_precios_updated_at | histórico (fecha_inicio/fecha_fin) |
| `usuarios` | id varchar | — | — | rol VARCHAR default 'tecnico'; usado como FK por `comprobacion.responsable` |
| `sync_log` | id serial | — | — | tabla histórica de sincronización con Sheets (legacy, posiblemente removible) |

#### Tipos / Enums
- `acreditacion`: `'ISO 17025:2017' | 'ISO 9001:2015' | 'Otra'`
- `nivel_responsabilidad`: `'Ejecutor' | 'Supervisor' | 'Firmante'`

#### Funciones plpgsql
- `update_updated_at_column()` — trigger genérico, usado por 7+ tablas.
- `update_muestras_updated_at()` — duplicado específico de muestras.
- **`comprobacion_derive_metrics()`** (clave para portar): trigger BEFORE INSERT/UPDATE que recalcula `n_replicas`, `media`, `desviacion_std`, `error`, `incertidumbre` desde `data->'replicas'` (JSONB array) usando `STDDEV_SAMP` y `s/sqrt(n)`. Solo recalcula campos que vengan NULL → permite override desde el cliente.

---

## 3. Auth y roles

- **Mecanismo:** Google OAuth2 (frontend obtiene `access_token` con `@react-oauth/google`, lo envía al backend, backend valida llamando a `googleapis.com/oauth2/v2/userinfo`).
- **No hay JWT propio**, no hay refresh tokens, no hay sesiones server-side. Cada request protegido revalida contra Google (overhead + dependencia online).
- **Middleware:** `require_auth` (`routes/auth.rs:223+`) inyecta `User` en extensions. `require_role(Role)` definido pero **nunca montado en routers**.
- **Tabla `usuarios`:** `id, email, nombre, rol VARCHAR DEFAULT 'tecnico', picture, created_at, updated_at`.
- **Roles en frontend (`src/config.ts`):** `ADMIN | COORDINADOR | TECNICO | CLIENTE | DISENO`. La autorización por rol se hace **client-side** (filtros de menú en `App.tsx`); el backend no la enforce.
- **Bypass dev:** env `REQUIRE_AUTH=false` desactiva el middleware completo.

> **Migración a ASP.NET:** reescribir como `JwtBearer` con validación en línea contra Google + emisión de cookie/JWT propio para evitar latencia. Implementar `[Authorize(Roles=...)]` en controladores.

---

## 4. Integraciones externas

### 4.1 Google Drive + Sheets
- **Service account:** archivo `sustained-truck-493518-b7-d4b4e336bdd1.json` en root del repo (⚠️ secreto commiteado).
- **Carpeta raíz:** env `GOOGLE_DRIVE_ROOT_FOLDER_ID`.
- **Jerarquía creada:** Root → Cliente → Proyecto → Perforación → Muestra. Cada nivel cachea `drive_folder_id` en su tabla.
- **Sheets:** al crear un ensayo, copia el template definido en `tipos_ensayo_sheets.template_id` para ese tipo.
- **PDF:** export `application/pdf` del sheet, sube a la carpeta de la perforación.

### 4.2 Scheduler
- **No usa cron**: aunque `tokio-cron-scheduler` está en deps, la asignación es síncrona al `POST /validar`.
- Algoritmo greedy hasta +365 días (ver §1.7).

### 4.3 Email
- No se detectó integración SMTP/SendGrid en backend ni frontend.

### 4.4 Observabilidad
- Prometheus exporter (`axum-prometheus`) en `/metrics`.
- Stack `docker/`: prometheus, grafana, promtail (logs Loki).
- Tracing estructurado con `tracing` + `tracing-subscriber` (env_filter).

---

## 5. Frontend React

### 5.1 Stack
- React 19, TypeScript, Vite (rolldown-vite), Vitest, ECharts + recharts, `@react-oauth/google`. **Sin** React Router, **sin** Zustand/Redux/React Query.

### 5.2 Páginas (`src/pages/`)

| Página | LOC aprox | Endpoints consumidos | Componentes / hooks principales |
|---|---|---|---|
| `Home.tsx` | bajo | DashboardAPI (no existe en backend, frontend incompleto) | — |
| `MisProyectos.tsx` | medio | `/proyectos`, `/clientes` | `useApiData` |
| `Proyectos.tsx` (presentation) | medio | `/proyectos`, `/clientes` | hooks de presentation/ |
| `ReporteProyecto.tsx` | 1136 | `/proyectos/{id}`, `/perforaciones/{id}/ensayos`, `/perforaciones/{id}/muestras` | `gantt/*`, recharts |
| `Reportes.tsx` | **1717** | múltiples | 6 sub-vistas: TiemposCiclos, CronogramaGantt, AnaliticaClientes, CargaTrabajo, EstadoEquipos, CurvaS |
| `Ensayo.tsx` | medio | `/ensayos`, `/ensayos/{id}/validar`, `/{id}/status`, `/{id}/pdf` | `useEnsayosData`, `useEnsayoModals` |
| `Equipos.tsx` | medio | `/equipos`, `/sensores/equipo/{id}` | `useEquiposData`, `useEquiposModals` |
| `Personal.tsx` | medio | `/personal-interno` | `usePersonalData`, `usePersonalModals` |
| `Calibraciones.tsx` | medio | `/calibraciones`, `/calibraciones/sensor/{id}` | `useCalibracionesData` |
| `Comprobaciones.tsx` | medio | `/comprobaciones/*` | `useComprobacionesData`, `utils/metrology.ts` |
| `GraficosControl.tsx` | 855 | `/comprobaciones/sensor/{id}` | ECharts Shewhart (LCL/UCL = media ± 3·σ) |
| `Relacion_muestras.tsx` | bajo | huérfana (sin entrada en `App.tsx`) | — |

### 5.3 Hooks (`src/hooks/`)

- `useApiData.ts` — fetch genérico con loading/error.
- `useMutation.ts` — POST/PUT/DELETE con optimistic UI opcional.
- `useMultipleApiData.ts` — paraleliza N llamadas.
- `useAuth.tsx` — Provider + `useAuth()`. Maneja `access_token` en `localStorage`.
- `useEnsayosData / useEnsayoModals`
- `useEquiposData / useEquiposModals`
- `useCalibracionesData`
- `useComprobacionesData` — incluye lógica de `computeDerived()` para previsualizar antes de guardar.
- `useGanttData` — agrega ensayos por proyecto.
- `usePersonalData / usePersonalModals`
- `useTiposEnsayoData`

### 5.4 Componentes reutilizables

```
components/
├── PageLayout.tsx, Sidebar.tsx, Cronograma.tsx
├── ui/        # botones, inputs, tabla, modal base
├── modals/    # modales compartidos
├── ensayo/, equipo/, calibracion/, comprobacion/, personal/, reportes/, gantt/
```

### 5.5 Routing y navegación
- `App.tsx` mantiene `activeModule: string` y renderiza la página por `switch`.
- Menú filtrado por rol en `config.ts` (`MENU_ITEMS` con `allowedRoles`).
- **No hay deep-linking ni back-button funcional.**

### 5.6 `apiService.ts`
Factory `createCrudAPI(resource)` que retorna `{ list, get, create, update, delete }`. Exporta:
`AuthAPI, ProyectosAPI, ClientesAPI, EnsayosAPI, PerforacionesAPI, MuestrasAPI, EquiposAPI, SensoresAPI, PersonalInternoAPI, ComprobacionesAPI, CalibracionesAPI, UsuariosAPI, ReportesAPI, DashboardAPI, TiposEnsayoAPI, TiposEnsayoSheetsAPI`.

> ⚠️ **Drift contractual:** `UsuariosAPI`, `ReportesAPI`, `DashboardAPI` apuntan a paths que **no existen en el backend** (`/api/usuarios`, `/api/reportes`, `/api/dashboard`). El frontend está incompleto o usa mocks.

### 5.7 Libs `package.json` relevantes
- `react@19`, `react-dom@19`
- `@react-oauth/google`
- `echarts`, `recharts`
- `vite` (rolldown), `vitest`, `@testing-library/*`
- `eslint`, `prettier`
- (sin react-router, sin axios — usa fetch nativo)

---

## 6. Lógica de negocio crítica ("hot spots")

### 6.1 Cálculos metrológicos (origen de verdad: `utils/metrology.ts` + trigger SQL)

```
n           = #réplicas válidas (Number.isFinite)
media       = Σx_i / n
desviaciónStd = sqrt( Σ(x_i - media)² / (n-1) )      # muestral, n>=2 → null si n<2
incertidumbre = desviaciónStd / sqrt(n)              # tipo A, sin factor de cobertura
error       = media - valorPatron                    # signed bias
```

- **Frontend (`src/utils/metrology.ts`):** funciones puras `mean`, `stdDevSample`, `uncertaintyTypeA`, `computeDerived`. Vista previa antes de POST.
- **Backend (trigger `comprobacion_derive_metrics`):** mismo cálculo en plpgsql con `STDDEV_SAMP` y `sqrt(n::double precision)`. Solo escribe si la columna viene NULL → la app puede sobreescribir.
- **Almacenamiento:** `comprobacion.data` JSONB conserva las réplicas crudas + condiciones (temperatura, humedad…), las columnas derivadas están desnormalizadas para queries rápidas en GraficosControl.

### 6.2 Gráficos de control (Shewhart) — `pages/GraficosControl.tsx`
- LCL = media_global − 3·σ, UCL = media_global + 3·σ (sobre la serie de `media` por comprobación, no sobre réplicas individuales).
- Detección de fuera-de-control = punto fuera de bandas + reglas de Western Electric (revisar implementación).

### 6.3 Generación de códigos secuenciales (`utils/id.rs`)
- Formato: `<PREFIX>-<YYYYMMDD>-<NNNN>` o `<PREFIX>-<NNNN>`.
- Prefijos: `PRY` proyecto, `PER`/`PERF` perforación, `ENS` ensayo, `INF` informe, `CLI` cliente, `EQP` equipo, `M-` muestra (formato distinto).
- ⚠️ El sufijo es `nanos % 10000`: colisiones probables bajo carga. **En SQL Server reemplazar por `SEQUENCE` o `NEWSEQUENTIALID()`.**

### 6.4 Workflow scheduler (E1→E2)
Detalle en §1.7. Greedy O(días × equipos × técnicos). Sin reintentos ni transaccionalidad fuerte (riesgo race-condition al reservar equipos).

### 6.5 Generación automática de PDF
- Se dispara al transicionar a E12 dentro de `update_status`.
- Idempotente: índice parcial `WHERE workflow_state='E12' AND pdf_drive_id IS NULL` permite reprocessing.

### 6.6 Cotización en JSONB
- `proyectos.ensayos_cotizados JSONB` guarda `{ tipo_ensayo_id: { cantidad, precio_unit, ... } }`. Se cruza con `precios` (con vigencia) para calcular totales en frontend.

---

## 7. Configuración y deploy

### 7.1 Variables de entorno
- `.env.example` (frontend): `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`.
- `src/api/.env.example` (backend): `DATABASE_URL`, `BIND_ADDR`, `REQUIRE_AUTH`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON_PATH`, `RUST_LOG`.
- `.env.portless`: variante para entorno sin puertos expuestos (Tailscale).

### 7.2 Docker (`docker/`)
- `Dockerfile.api` — multi-stage Rust release.
- `Dockerfile.frontend` y `.dev`.
- `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.prod.yml`, `docker-compose.tsnet.yml` (Tailscale).
- `nginx.conf` — reverse proxy.
- `grafana/`, `prometheus/`, `promtail/` — observabilidad completa.

### 7.3 Makefile
Targets: `dev`, `dev-build`, `dev-full` (con monitoring), `dev-monitoring`, `dev-db`, `down`, `logs`, `db-shell`, `portless-up`, `portless-down`.

### 7.4 CI (`.github/workflows/ci.yml`)
- **frontend job**: matriz Node 20.x/22.x, `npm ci`, `lint` (continue-on-error), `format:check` (continue-on-error), `test:run`, `build`, sube artefacto `dist/`.
- **backend job**: `cargo check`, `cargo test --no-fail-fast` (continue-on-error).
- **docker job** (solo push a main): build & push a `ghcr.io/<repo>/{frontend,api}:latest|<sha>` con cache GHA.

### 7.5 Riesgos de deploy
- Service account JSON commiteado en repo.
- Tests backend pueden fallar silenciosamente (`continue-on-error`).
- No hay job de migraciones automático (sqlx no corre en CI).

---

## 8. Postman collection

Archivo: `postman/collections/Lab 17025 API.postman_collection.json` (1320 líneas).

**Cubierto:** Auth, Proyectos, Clientes, Perforaciones, Muestras, Ensayos (incluye `/validar`, `/status`, `/pdf`, `/pdf/generate`, `/drive-cleanup`), Equipos, Sensores.

**Faltante (importante para el contrato de migración):**
- ❌ Calibraciones (`/calibraciones/*`)
- ❌ Comprobaciones (`/comprobaciones/*`)
- ❌ Personal-interno
- ❌ Tipos-ensayo y `/tipos-ensayo/activos`
- ❌ Tipos-ensayo-sheets

> **Acción recomendada antes de migrar:** completar Postman a partir de los routers en §1.4 — esta colección será el contrato compartido entre el código viejo (Rust) y el nuevo (ASP.NET).

### 8.1 Payloads de referencia (los más críticos)

```json
// POST /api/auth/login
{ "access_token": "ya29.a0Af..." }

// POST /api/proyectos
{
  "codigo": "PRY-20260101-1234",
  "nombre": "Proyecto Demo",
  "cliente_id": "uuid",
  "fecha_inicio": "2026-01-01",
  "fecha_fin_estimada": "2026-06-30",
  "duracion_estimada": "6 meses",
  "ensayos_cotizados": { "tipo_ensayo_id_x": { "cantidad": 10, "precio_unit": 50000 } }
}

// POST /api/ensayos
{
  "tipo": "CBR",
  "perforacion_id": "uuid",
  "proyecto_id": "uuid",
  "muestra": "M-001",
  "muestra_id": "uuid",
  "norma": "ASTM D1883",
  "fecha_solicitud": "2026-05-01",
  "urgente": false
}

// POST /api/ensayos/{id}/validar
{ "tecnico_id": null, "fecha_programacion": null }   // null → asignación automática

// POST /api/comprobaciones
{
  "sensor_id": "uuid",
  "fecha": "2026-04-30T10:00:00Z",
  "data": { "replicas": [10.01, 10.03, 9.99, 10.02], "temperatura": 23.5, "humedad": 45 },
  "valor_patron": 10.0,
  "unidad": "kg",
  "resultado": "Conforme",
  "responsable": "usuario_id"
  // media, desviacion_std, error, incertidumbre, n_replicas → calculados por trigger si vienen null
}

// POST /api/calibraciones
{
  "sensor_id": "uuid",
  "fecha_calibracion": "2026-04-15",
  "proxima_calibracion": "2027-04-15",
  "factor": "1.00000000000000000023",
  "estado": "vigente",
  "incertidumbre": "0.001"
}
```

---

## 9. DAG de dependencias para portado

Orden topológico recomendado (cada bloque depende solo de los anteriores):

```
[NIVEL 0 — Infraestructura]
  └─ DB schema base, función update_updated_at_column, ENUMs (acreditacion, nivel_responsabilidad)

[NIVEL 1 — Catálogos y maestros]
  ├─ usuarios            (ya portado)
  ├─ clientes            (ya portado: 001 initial)
  ├─ equipos             (ya portado: 001 + seed_demo)
  ├─ tipos_ensayo + tipos_ensayo_normas_historial
  ├─ personal_interno
  └─ comprobacion_resultados (catálogo)

[NIVEL 2 — Subordinados a maestros]
  ├─ sensores            (ya portado: 001 + equipo_id)
  ├─ proyectos           (FK clientes)
  ├─ tipos_ensayo_sheets (FK tipos_ensayo) + seeds
  ├─ precios             (FK tipos_ensayo)
  ├─ equipos_tipos_ensayo (FK equipos, tipos_ensayo)
  ├─ personal_tipos_ensayo (FK personal_interno, tipos_ensayo)
  └─ personal_capacidad  (FK personal_interno, tipos_ensayo)

[NIVEL 3 — Operación]
  ├─ perforaciones       (FK proyectos)
  ├─ calibracion         (FK sensores)
  └─ comprobacion        (FK sensores, comprobacion_resultados, usuarios) + trigger derive_metrics

[NIVEL 4 — Muestras y ensayos]
  ├─ muestras            (FK perforaciones) + trigger updated_at
  └─ ensayos             (FK proyectos, perforaciones, muestras)

[NIVEL 5 — Reservas y workflow]
  └─ reservas_equipos    (FK equipos, ensayos)

[NIVEL 6 — Servicios externos]
  ├─ Google Drive integration   (porta como IDriveService en .NET)
  ├─ Sheets templates           (depende de tipos_ensayo_sheets)
  ├─ PDF export                 (depende de Drive + ensayos.E12)
  └─ Scheduler /validar         (depende de NIVEL 2 + 4 + 5)

[NIVEL 7 — Auth]
  └─ Google OAuth validator + middleware → reescribir como JwtBearer/cookie

[NIVEL 8 — Frontend Vue]
  ├─ apiService (axios + interceptor OAuth)
  ├─ Páginas en orden: Home → Clientes → Equipos/Sensores → Personal → TiposEnsayo
  ├─                   Proyectos → Perforaciones → Muestras → Ensayos
  ├─                   Calibraciones → Comprobaciones → GraficosControl
  └─ Reportes (último: depende de toda la data) y Gantt
```

---

## 10. Métricas

| Métrica | Valor |
|---|---:|
| LOC backend Rust | ~7.514 |
| LOC frontend TS/TSX | ~23.771 |
| Páginas React | 12 (incluye 1 huérfana `Relacion_muestras`) |
| Hooks custom | 14 |
| Componentes reutilizables (subdirs) | 9 directorios |
| Módulos de rutas backend | 13 (12 montados + auth) |
| Endpoints HTTP | ~58 (CRUD × 12 + auth(4) + ensayos extras(6) + sub-rutas(8)) |
| Tablas activas | ~20 |
| Migraciones | 25 (1 vacía, 4 ya portadas a SQL Server) |
| Triggers plpgsql | 9 |
| Funciones plpgsql | 3 |
| Tipos ENUM | 2 |
| Endpoints en Postman | ~40 (faltan ~18) |
| Tamaño Postman collection | 1320 líneas |

---

## 11. Decisiones tomadas para el porting

1. **PK type:** `UNIQUEIDENTIFIER` nativo en TODAS las migraciones nuevas. Las 4 ya portadas (001-004) usan `NVARCHAR(50)` y deben refactorizarse en sub-fase A.0.
2. **Códigos legibles** (`EQ-BAL-001`, `PRY-...`, etc.): columna `codigo NVARCHAR(50) UNIQUE` separada de la PK.
3. **Auth:** decisión pendiente — el legacy usa Google OAuth puro (sin JWT propio); la PoC usa JWT local con SHA-256/BCrypt. Debe definirse en pre-Ola A:
   - Opción A: replicar Google OAuth 1:1 (paridad total).
   - Opción B: JWT local (más portable, simplifica desarrollo offline).
   - Opción C: híbrido (Google OAuth para login + emite JWT propio con refresh).
4. **Roles:** replicar 1:1 los del prototipo: `ADMIN | COORDINADOR | TECNICO | CLIENTE | DISENO`.
5. **JSONB → SQL Server:** `NVARCHAR(MAX) CHECK ISJSON(col) = 1`, columnas calculadas indexadas para queries frecuentes.
6. **TEXT[] (`equipos_utilizados`):** decisión pendiente — opción 1 mantener como `NVARCHAR(MAX)` JSON; opción 2 normalizar a tabla puente `ensayo_equipos` (mejor para reportes).
7. **Triggers `updated_at`:** SQL Server no permite default UPDATE, requiere trigger `AFTER UPDATE` o lógica en repos. Centralizar en helper de Dapper.
8. **Trigger `comprobacion_derive_metrics`:** portar como columnas computadas persistidas + trigger T-SQL `INSTEAD OF`, o mover cálculo a la capa de aplicación (más testeable). Decisión pendiente.
9. **Códigos secuenciales (`nanos % 10000`):** reemplazar por `SEQUENCE` SQL Server por prefijo (e.g. `seq_proyectos`, `seq_ensayos`).
10. **Service account JSON:** mover a User Secrets / Azure Key Vault. Eliminar del repo en `main` (rewrite history opcional).

---

*Fin del informe.*
