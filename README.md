# Laboratorio ISO 17025 - Sistema de Gestión

Sistema de gestión integral para laboratorio de ensayos acreditado bajo la norma **ISO/IEC 17025:2017**. Permite la trazabilidad completa desde la recepción de muestras hasta la entrega de informes y facturación.

---

## Tecnologías Utilizadas

### Frontend

| Tecnología            | Versión   | Descripción                         |
| --------------------- | --------- | ----------------------------------- |
| **React**             | 19.2      | Framework UI con hooks              |
| **TypeScript**        | 5.9       | Tipado estático para JavaScript     |
| **Vite**              | 7.2.5     | Build tool (rolldown-vite)          |
| **Vitest**            | 4.0       | Framework de testing con jsdom      |
| **Recharts**          | 3.7       | Gráficos y visualización de datos   |
| **DHTMLX Gantt**      | 9.1       | Diagramas de Gantt para cronogramas |
| **ESLint + Prettier** | 9.x / 3.8 | Linting y formateo de código        |

### Backend

| Tecnología           | Versión  | Descripción                  |
| -------------------- | -------- | ---------------------------- |
| **Rust**             | 2021 ed. | Lenguaje de programación     |
| **Axum**             | 0.8      | Framework web async          |
| **SQLx**             | 0.8      | ORM async para PostgreSQL    |
| **PostgreSQL**       | 16       | Base de datos relacional     |
| **JWT**              | 9        | Autenticación con tokens     |
| **Google Drive API** | 6        | Almacenamiento de documentos |
| **axum-prometheus**  | 0.10     | Métricas de rendimiento      |
| **tower-cookies**    | 0.11     | Gestión de cookies HTTP      |
| **reqwest**          | 0.12     | Cliente HTTP async           |

### Herramientas de Desarrollo

| Herramienta                     | Uso                                             |
| ------------------------------- | ----------------------------------------------- |
| **Docker**                      | Contenedores para desarrollo y producción       |
| **Makefile**                    | Targets de conveniencia para Docker y dev local |
| **GitHub Actions**              | CI/CD (lint, test, build, push a GHCR)          |
| **Prometheus + Grafana + Loki** | Monitoreo, métricas y logs                      |
| **Postman**                     | Testing de API (colecciones incluidas)          |
| **Portless**                    | Proxy HTTPS local (`lab17025.localhost:1355`)   |
| **Adminer**                     | Panel de administración de base de datos        |
| **Tokio**                       | Runtime async para Rust                         |

---

## Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                    │
│                  React 19 + TypeScript + Vite                        │
│                                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │   Home   │ │Proyectos │ │ Equipos  │ │ Ensayos  │ │ Personal  │ │
│  │(Dashboard│ │  (DDD)   │ │          │ │          │ │           │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘ │
│       │             │            │             │             │       │
│  ┌────┴─────┐ ┌─────┴────┐      │             │             │       │
│  │ Reportes │ │ Reporte  │      │             │             │       │
│  │          │ │ Proyecto │      │             │             │       │
│  └────┬─────┘ └────┬─────┘      │             │             │       │
│       └────────────┴────────────┴─────────────┴─────────────┘       │
│                              │                                       │
│       ┌──────────────────────┴───────────────────────┐              │
│       │               Custom Hooks                    │              │
│       │  useApiData · useMultipleApiData · useMutation│              │
│       │  useAuth · useEnsayosData · useEquiposData    │              │
│       │  usePersonalData · useGanttData               │              │
│       │  useEnsayoModals · useEquiposModals           │              │
│       │  usePersonalModals · useTiposEnsayoData       │              │
│       └──────────────────────┬───────────────────────┘              │
│                              │                                       │
│       ┌──────────────────────┴───────────────────────┐              │
│       │              API Service                      │              │
│       │          apiService.ts (fetch)                │              │
│       └──────────────────────┬───────────────────────┘              │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ HTTP/REST (JSON)
                               ▼
┌──────────────────────────────┴───────────────────────────────────────┐
│                           BACKEND                                     │
│                      Rust + Axum 0.8                                 │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                         Routes (API)                            │  │
│  │  /proyectos · /ensayos · /equipos · /clientes · /auth          │  │
│  │  /perforaciones · /muestras · /sensores · /calibraciones       │  │
│  │  /comprobaciones · /personal-interno · /tipos-ensayo            │  │
│  │  /metrics (Prometheus)                                          │  │
│  └───────────────────────────┬────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────┴────────────────────────────────────┐  │
│  │                       Repositories                              │  │
│  │  proyecto_repo · ensayo_repo · equipo_repo · sensor_repo       │  │
│  │  cliente_repo · muestra_repo · perforacion_repo                 │  │
│  │  calibracion_repo · comprobacion_repo · personal_interno_repo   │  │
│  │  tipos_ensayos_repo · usuario_repo                              │  │
│  └───────────────────────────┬────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────┴────────────────────────────────────┐  │
│  │                        Services                                 │  │
│  │  ensayo_sheets · google_drive · scheduler                       │  │
│  └───────────────────────────┬────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────┴────────────────────────────────────┐  │
│  │                       Data Layer                                │  │
│  │           PostgreSQL 16 (SQLx)    Google Drive                   │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

> **Nota:** El módulo de Proyectos está siendo migrado a una arquitectura Domain-Driven Design (DDD)
> con capas `domain/` y `presentation/`. El resto de módulos usa la estructura plana tradicional.

---

## Estructura de Carpetas

```
17025/
├── src/                                # Código fuente
│   │
│   ├── api/                            # BACKEND (Rust)
│   │   ├── Cargo.toml                  # Dependencias Rust
│   │   ├── migrations/                 # Migraciones SQL (13 archivos)
│   │   │   ├── 20240101_initial_schema.sql
│   │   │   ├── 20240102_fix_perforaciones_sensores.sql
│   │   │   ├── 20240103_add_pdf_fields_to_ensayos.sql
│   │   │   ├── 20240125_add_muestras_table.sql
│   │   │   ├── 20240126_add_equipo_id_to_sensores.sql
│   │   │   ├── 20240127_add_personal_interno_table.sql
│   │   │   ├── 20240128_add_comprobaciones_calibraciones_tables.sql
│   │   │   ├── 20240300_add_table_ensayos.sql
│   │   │   ├── 20240301_add_unique_nombre_tipos_ensayo.sql
│   │   │   ├── 20260309_add_usuarios_table.sql
│   │   │   ├── 20260309_add_scheduler_tables.sql
│   │   │   ├── 20260310_add_duracion_estimada_to_ensayos.sql
│   │   │   └── 20260318_enhance_scheduler_tables.sql
│   │   │
│   │   └── src/
│   │       ├── main.rs                 # Punto de entrada
│   │       ├── config.rs               # Variables de entorno
│   │       ├── errors.rs               # Manejo de errores (AppError)
│   │       │
│   │       ├── db/                     # Conexión a base de datos
│   │       │   ├── mod.rs
│   │       │   └── connection.rs
│   │       │
│   │       ├── models/                 # Estructuras de datos (14 modelos)
│   │       │   ├── mod.rs
│   │       │   ├── proyecto.rs
│   │       │   ├── ensayo.rs
│   │       │   ├── cliente.rs
│   │       │   ├── equipos.rs
│   │       │   ├── equipos_dtosensor.rs  # DTO para equipo+sensor
│   │       │   ├── sensores.rs
│   │       │   ├── perforacion.rs
│   │       │   ├── muestra.rs
│   │       │   ├── calibracion.rs
│   │       │   ├── comprobacion.rs
│   │       │   ├── personal_interno.rs
│   │       │   ├── tipos_ensayo.rs
│   │       │   └── workflow.rs
│   │       │
│   │       ├── repositories/           # Acceso a datos (13 repos)
│   │       │   ├── mod.rs
│   │       │   ├── proyecto_repo.rs
│   │       │   ├── ensayo_repo.rs
│   │       │   ├── cliente_repo.rs
│   │       │   ├── equipo_repo.rs
│   │       │   ├── sensor_repo.rs
│   │       │   ├── perforacion_repo.rs
│   │       │   ├── muestra_repo.rs
│   │       │   ├── calibracion_repo.rs
│   │       │   ├── comprobacion_repo.rs
│   │       │   ├── personal_interno_repo.rs
│   │       │   ├── tipos_ensayos_repo.rs
│   │       │   └── usuario_repo.rs
│   │       │
│   │       ├── routes/                 # Endpoints HTTP (12 módulos)
│   │       │   ├── mod.rs              # Registro de rutas (públicas + protegidas)
│   │       │   ├── auth.rs             # Autenticación + middleware require_auth
│   │       │   ├── proyecto.rs
│   │       │   ├── ensayo.rs
│   │       │   ├── cliente.rs
│   │       │   ├── equipos.rs
│   │       │   ├── sensores.rs
│   │       │   ├── perforacion.rs
│   │       │   ├── muestra.rs
│   │       │   ├── calibraciones.rs
│   │       │   ├── comprobaciones.rs
│   │       │   ├── personal_interno.rs
│   │       │   └── tipos_ensayo.rs
│   │       │
│   │       ├── services/               # Lógica de negocio
│   │       │   ├── mod.rs
│   │       │   ├── ensayo_sheets.rs    # Integración con Google Sheets
│   │       │   ├── google_drive.rs     # Almacenamiento en Drive
│   │       │   └── scheduler.rs        # Programación automática de ensayos
│   │       │
│   │       └── utils/                  # Utilidades compartidas
│   │           ├── mod.rs
│   │           ├── id.rs               # Generación de IDs (UUID)
│   │           ├── date.rs             # Manejo de fechas
│   │           └── sql.rs              # Helpers SQL (columnas)
│   │
│   ├── domain/                         # FRONTEND - Capa de dominio (DDD)
│   │   ├── index.ts
│   │   ├── entities/                   # Entidades del dominio
│   │   │   ├── index.ts
│   │   │   ├── Proyecto.ts
│   │   │   ├── Perforacion.ts
│   │   │   └── Cliente.ts
│   │   ├── value-objects/              # Objetos de valor
│   │   │   ├── index.ts
│   │   │   └── EstadoProyecto.ts
│   │   └── repositories/              # Interfaces de repositorios
│   │       ├── index.ts
│   │       └── ProyectoRepository.ts
│   │
│   ├── presentation/                   # FRONTEND - Capa de presentación (DDD)
│   │   ├── index.ts
│   │   ├── hooks/
│   │   │   └── index.ts
│   │   └── pages/
│   │       └── proyectos/
│   │           ├── Proyectos.tsx       # Página principal de proyectos
│   │           ├── types.ts
│   │           └── components/
│   │               ├── index.ts
│   │               ├── NuevoProyectoModal.tsx
│   │               ├── EditarProyectoModal.tsx
│   │               ├── ConfirmDeleteModal.tsx
│   │               ├── EditarPerforacionModal.tsx
│   │               ├── AgregarMuestraModal.tsx
│   │               └── RelacionarMuestraModal.tsx
│   │
│   ├── pages/                          # FRONTEND - Páginas (estructura plana)
│   │   ├── Home.tsx                    # Dashboard principal
│   │   ├── MisProyectos.tsx            # Vista cliente
│   │   ├── Equipos.tsx                 # Equipos y sensores
│   │   ├── Ensayo.tsx                  # Gestión de ensayos (Kanban + jerarquía)
│   │   ├── Personal.tsx                # Gestión de personal
│   │   ├── Reportes.tsx                # Generación de informes
│   │   ├── ReporteProyecto.tsx         # Reporte detallado por proyecto
│   │   └── Relacion_muestras.tsx       # Relación de muestras
│   │
│   ├── components/                     # FRONTEND - Componentes
│   │   ├── PageLayout.tsx              # Layout base de páginas
│   │   ├── Cronograma.tsx              # Componente de cronograma
│   │   │
│   │   ├── ensayo/                     # Componentes de ensayos
│   │   │   ├── index.ts
│   │   │   ├── EnsayoCard.tsx          # Tarjeta de ensayo
│   │   │   ├── EnsayoRow.tsx           # Fila de tabla de ensayos
│   │   │   ├── HierarchyView.tsx       # Vista jerárquica
│   │   │   ├── KanbanColumn.tsx        # Columna Kanban por estado
│   │   │   ├── ViewTabs.tsx            # Tabs de vista (Kanban/jerarquía)
│   │   │   ├── hierarchy/              # Nodos de la jerarquía
│   │   │   │   ├── index.ts
│   │   │   │   ├── ProyectoNode.tsx
│   │   │   │   ├── PerforacionNode.tsx
│   │   │   │   └── MuestraNode.tsx
│   │   │   └── modals/                 # Modales de ensayos
│   │   │       ├── index.ts
│   │   │       ├── DetalleEnsayoModal.tsx
│   │   │       ├── ReasignarModal.tsx
│   │   │       ├── NovedadModal.tsx
│   │   │       └── CambiarEstadoModal.tsx
│   │   │
│   │   ├── equipo/                     # Componentes de equipos
│   │   │   ├── index.ts
│   │   │   ├── EquipoRow.tsx           # Fila de tabla de equipos
│   │   │   ├── NuevoDropdown.tsx       # Dropdown para crear equipo/sensor
│   │   │   ├── SensoresAsociados.tsx   # Lista de sensores de un equipo
│   │   │   └── modals/
│   │   │       ├── index.ts
│   │   │       ├── EquipoFormModal.tsx
│   │   │       └── SensorFormModal.tsx
│   │   │
│   │   ├── personal/                   # Componentes de personal
│   │   │   ├── index.ts
│   │   │   ├── PersonalRow.tsx         # Fila de tabla de personal
│   │   │   └── modals/
│   │   │       ├── index.ts
│   │   │       ├── AgregarPersonaModal.tsx
│   │   │       └── DetallePersonaModal.tsx
│   │   │
│   │   ├── gantt/                      # Diagramas de Gantt
│   │   │   ├── gantt_proyects.tsx
│   │   │   └── gantt_config.ts
│   │   │
│   │   ├── ui/                         # Componentes UI base
│   │   │   ├── index.ts
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Combobox.tsx
│   │   │   └── Modal.tsx
│   │   │
│   │   └── modals/                     # Modales reutilizables
│   │       ├── index.ts
│   │       ├── SolicitarEnsayoModal.tsx
│   │       └── ConfirmDeleteModal.tsx
│   │
│   ├── hooks/                          # FRONTEND - Custom Hooks (13 hooks)
│   │   ├── index.ts                    # Barrel export
│   │   ├── useAuth.tsx                 # Autenticación (contexto + provider)
│   │   ├── useApiData.ts              # Fetch de datos (GET)
│   │   ├── useMultipleApiData.ts      # Fetch paralelo múltiple
│   │   ├── useMutation.ts            # Operaciones CRUD
│   │   ├── useEnsayosData.ts          # Datos de ensayos
│   │   ├── useEnsayoModals.ts         # Estado de modales de ensayos
│   │   ├── useEquiposData.ts          # Datos de equipos
│   │   ├── useEquiposModals.ts        # Estado de modales de equipos
│   │   ├── usePersonalData.ts         # Datos de personal
│   │   ├── usePersonalModals.ts       # Estado de modales de personal
│   │   ├── useGanttData.ts            # Datos para diagrama Gantt
│   │   └── useTiposEnsayoData.ts      # Tipos de ensayo (contexto + provider)
│   │
│   ├── config/                         # FRONTEND - Configuración por módulo
│   │   ├── personal.ts                 # Config del módulo de personal
│   │   └── equipos.ts                  # Config del módulo de equipos
│   │
│   ├── utils/                          # FRONTEND - Utilidades
│   │   ├── index.ts                    # Barrel export
│   │   ├── mappers.ts                  # Transformación de datos (snake_case/camelCase)
│   │   ├── formatters.ts              # Formateo (fechas, números, moneda)
│   │   ├── formatters.test.ts         # Tests de formatters
│   │   ├── helpers.ts                 # Funciones auxiliares (estados, vencimientos)
│   │   ├── helpers.test.ts            # Tests de helpers
│   │   └── permissions.ts             # Verificación de permisos por rol
│   │
│   ├── services/                       # FRONTEND - Servicios API
│   │   └── apiService.ts              # Cliente HTTP centralizado
│   │
│   ├── styles/                         # FRONTEND - Estilos globales
│   │   ├── variables.css               # Variables CSS (colores, tamaños)
│   │   └── Form.module.css             # Estilos de formularios compartidos
│   │
│   ├── test/                           # FRONTEND - Configuración de tests
│   │   └── setup.ts                    # Setup de Vitest
│   │
│   ├── App.tsx                         # Componente raíz (navegación por módulos)
│   ├── App.css                         # Estilos globales
│   ├── config.ts                       # Configuración centralizada
│   ├── index.css                       # Estilos base
│   └── main.tsx                        # Punto de entrada React
│
├── docker/                             # Configuración Docker
│   ├── docker-compose.yml              # Compose base (PostgreSQL + API + Nginx)
│   ├── docker-compose.dev.yml          # Compose de desarrollo (hot-reload + monitoreo)
│   ├── docker-compose.prod.yml         # Compose de producción
│   ├── Dockerfile.api                  # Build producción API (multi-stage, cargo-chef)
│   ├── Dockerfile.api.dev              # Build desarrollo API (cargo-watch)
│   ├── Dockerfile.frontend             # Build producción frontend (Node + Nginx)
│   ├── Dockerfile.frontend.dev         # Build desarrollo frontend (Vite + HMR)
│   ├── Dockerfile.dev                  # Build de verificación CI
│   ├── nginx.conf                      # Nginx: reverse proxy + SPA fallback
│   ├── grafana/                        # Provisioning de datasources Grafana
│   ├── prometheus/                     # Configuración de scraping Prometheus
│   └── promtail/                       # Recolección de logs Docker
│
├── .github/
│   └── workflows/
│       └── ci.yml                      # Pipeline CI/CD (lint, test, build, Docker push)
│
├── docs/                               # Documentación adicional
│   ├── esquema_local.sql               # Esquema SQL local
│   ├── scheduler-plan.md               # Plan del scheduler
│   └── scheduler-implementacion.md     # Implementación del scheduler
│
├── postman/                            # Colecciones Postman
├── public/                             # Archivos estáticos
│
├── package.json                        # Dependencias Node.js
├── vite.config.ts                      # Configuración Vite + Vitest
├── tsconfig.json                       # Configuración TypeScript
├── tsconfig.node.json                  # TypeScript para config de Vite
├── eslint.config.js                    # Configuración ESLint (flat config)
├── Makefile                            # Targets de conveniencia
└── README.md                           # Este archivo
```

---

## Roles de Usuario e Interacciones

### Administrador (`admin`)

**Permisos:** Acceso total al sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO ADMINISTRADOR                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Dashboard│────▶│ Personal │────▶│ Asignar  │────▶│ Auditar  │
│  Global  │     │ Gestión  │     │  Roles   │     │ Acciones │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  • Crear/editar/eliminar usuarios                            │
│  • Asignar roles y permisos                                  │
│  • Ver métricas globales del laboratorio                     │
│  • Gestionar configuración del sistema                       │
│  • Acceso a todos los módulos sin restricción                │
│  • Exportar reportes de auditoría                            │
└──────────────────────────────────────────────────────────────┘
```

**Acciones principales:**
| Módulo | Acciones |
|--------|----------|
| Personal | Crear usuarios, asignar roles, desactivar cuentas |
| Proyectos | CRUD completo, reasignar coordinadores |
| Equipos | CRUD completo, aprobar calibraciones |
| Reportes | Generar reportes de auditoría ISO 17025 |

---

### Coordinador (`coordinador`)

**Permisos:** Gestión de proyectos y revisión técnica

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO COORDINADOR                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Nuevo   │────▶│ Asignar  │────▶│ Seguir   │────▶│ Revisar  │
│ Proyecto │     │ Técnicos │     │ Avance   │     │ Informes │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
      │                                                   │
      ▼                                                   ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Definir  │     │ Programar│     │ Aprobar  │     │ Enviar a │
│Perforac. │────▶│ Ensayos  │────▶│Resultados│────▶│ Cliente  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

**Flujo detallado:**

1. **Crear Proyecto**

   ```
   Proyectos → + Nuevo Proyecto
   ├── Datos básicos (nombre, cliente, fecha)
   ├── Definir perforaciones (códigos, ubicación)
   └── Cotizar ensayos por tipo
   ```

2. **Gestionar Perforaciones**

   ```
   Proyecto → Perforación
   ├── Relacionar muestra física (código recepción)
   ├── Registrar muestras (profundidad, tipo)
   └── Asignar ensayos a muestras
   ```

3. **Revisión Técnica (E9 → E10)**

   ```
   Ensayo en E9 (Rev. Técnica)
   ├── Revisar datos y cálculos
   ├── Aprobar → E10 (Rev. Coordinación)
   └── Rechazar → E8 (Reprocesar)
   ```

4. **Gestión de Equipos**
   ```
   Equipos → Equipo/Sensor
   ├── Ver próximas calibraciones
   ├── Registrar comprobaciones
   └── Programar mantenimientos
   ```

---

### Técnico (`tecnico`)

**Permisos:** Ejecución de ensayos y manejo de equipos

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO TÉCNICO                               │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Ver      │────▶│Comprob.  │────▶│ Ejecutar │────▶│ Cargar   │
│ Asignados│     │ Equipo   │     │ Ensayo   │     │ Datos    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
      │                                                   │
      │                                                   ▼
      │                                            ┌──────────┐
      └───────────────────────────────────────────▶│ Enviar a │
                                                    │ Revisión │
                                                    └──────────┘
```

**Flujo diario típico:**

1. **Inicio de Jornada**

   ```
   Dashboard
   ├── Ver ensayos asignados (E2: Programados)
   ├── Ver alertas de calibración
   └── Ver comprobaciones pendientes
   ```

2. **Comprobación de Equipos**

   ```
   Equipos → Equipo a usar
   ├── Verificar estado (Operativo)
   ├── Registrar comprobación diaria
   │   ├── Tipo: verificación inicial
   │   ├── Resultado: Conforme/No conforme
   │   └── Observaciones
   └── Confirmar disponibilidad
   ```

3. **Ejecutar Ensayo**

   ```
   Ensayo E2 (Programado) → Iniciar
   ├── Estado cambia a E6 (En Ejecución)
   ├── Registrar parámetros de ensayo
   ├── Cargar resultados/mediciones
   └── Adjuntar evidencias (fotos, archivos)
   ```

4. **Procesar y Enviar**
   ```
   Ensayo E6 → Finalizar
   ├── Estado cambia a E8 (Procesamiento)
   ├── Calcular resultados
   ├── Validar contra norma
   └── Enviar a E9 (Revisión Técnica)
   ```

**Gestión de Equipos (vista técnico):**
| Acción | Descripción |
|--------|-------------|
| Ver equipos | Lista de equipos asignados al laboratorio |
| Comprobación | Registrar verificación diaria antes de uso |
| Ver historial | Consultar comprobaciones y calibraciones previas |
| Reportar falla | Marcar equipo como fuera de servicio |

---

### Cliente (`cliente`)

**Permisos:** Ver sus proyectos, solicitar ensayos, descargar informes

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO CLIENTE                               │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   Mis    │────▶│   Ver    │────▶│Solicitar │────▶│ Descargar│
│Proyectos │     │ Muestras │     │ Ensayos  │     │ Informes │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │  Seguimiento │
                                 │   en tiempo  │
                                 │     real     │
                                 └──────────────┘
```

**Flujo detallado:**

1. **Acceso a Mis Proyectos**

   ```
   Mis Proyectos (solo ve los suyos)
   ├── Lista de proyectos activos
   ├── Estado general (% completado)
   └── Perforaciones y muestras
   ```

2. **Solicitar Ensayo**

   ```
   Proyecto → Perforación → Muestra
   ├── Seleccionar tipo de ensayo
   ├── Indicar norma (si aplica)
   ├── Marcar urgente (opcional)
   └── Agregar observaciones

   → Genera ensayo en E1 (Sin programación)
   ```

3. **Seguimiento de Ensayos**

   ```
   Muestra → Ver ensayos solicitados
   ├── E1-E2: Pendiente/Programado
   ├── E6-E8: En proceso
   ├── E9-E11: En revisión
   ├── E12-E14: Listo/Enviado
   └── E15: Facturado
   ```

4. **Descargar Informes**
   ```
   Ensayo E13+ (Enviado)
   ├── Ver informe preliminar
   ├── Descargar PDF oficial
   └── Ver historial de versiones
   ```

**Restricciones:**

- No puede ver proyectos de otros clientes
- No puede modificar datos de muestras
- No puede ver información de equipos/personal
- Solo solicita ensayos, no los ejecuta

---

## Workflow de Ensayos (E1-E15)

El sistema implementa un workflow de 15 estados para la trazabilidad completa de ensayos:

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW DE ENSAYOS                           │
└─────────────────────────────────────────────────────────────────┘

    INICIAL                 EJECUCIÓN                 REVISIÓN
  ┌─────────┐             ┌─────────┐             ┌─────────┐
  │   E1    │────────────▶│   E6    │────────────▶│   E9    │
  │Sin prog.│             │En ejec. │             │Rev. Téc.│
  └────┬────┘             └────┬────┘             └────┬────┘
       │                       │                       │
       ▼                       ▼                       ▼
  ┌─────────┐             ┌─────────┐             ┌─────────┐
  │   E2    │             │   E7    │             │   E10   │
  │Program. │             │ Espera  │             │Rev.Coord│
  └────┬────┘             └─────────┘             └────┬────┘
       │                       │                       │
       │                       ▼                       ▼
       │                  ┌─────────┐             ┌─────────┐
       │                  │   E8    │             │   E11   │
       │                  │Procesam.│             │Rev. Dir.│
       │                  └─────────┘             └────┬────┘
       │                                               │
       │         EXCEPCIONES                           │
       │        ┌─────────┐                            │
       ├───────▶│   E3    │ (Terminal)                 │
       │        │ Anulado │                            │
       │        └─────────┘                            │
       │        ┌─────────┐                            │
       ├───────▶│   E4    │◀─────────────┐             │
       │        │Repetir  │              │             │
       │        └─────────┘              │             │
       │        ┌─────────┐              │             │
       └───────▶│   E5    │              │             │
                │Novedad  │              │             │
                └─────────┘              │             │
                                         │             │
    ENTREGA                              │             │
  ┌─────────┐◀───────────────────────────┴─────────────┘
  │   E12   │
  │Por enviar│
  └────┬────┘
       │
       ▼
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │   E13   │────▶│   E14   │────▶│   E15   │
  │ Enviado │     │Entregado│     │Facturado│ (Terminal)
  └─────────┘     └─────────┘     └─────────┘
```

### Estados y Responsables

| Estado | Nombre            | Fase      | Responsable      |
| ------ | ----------------- | --------- | ---------------- |
| E1     | Sin programación  | Inicial   | Coordinador      |
| E2     | Programado        | Inicial   | Coordinador      |
| E3     | Anulado           | Terminal  | Coordinador      |
| E4     | Repetición        | Inicial   | Técnico/Coord.   |
| E5     | Novedad           | Inicial   | Técnico          |
| E6     | En ejecución      | Ejecución | Técnico          |
| E7     | Espera ensayos    | Ejecución | Sistema          |
| E8     | Procesamiento     | Ejecución | Técnico          |
| E9     | Rev. Técnica      | Revisión  | Técnico Sr.      |
| E10    | Rev. Coordinación | Revisión  | Coordinador      |
| E11    | Rev. Dirección    | Revisión  | Director         |
| E12    | Por enviar        | Entrega   | Coordinador      |
| E13    | Enviado           | Entrega   | Sistema          |
| E14    | Entregado         | Entrega   | Cliente confirma |
| E15    | Facturado         | Terminal  | Administración   |

---

## Instalación y Ejecución

### Requisitos

- **Node.js** v20+
- **Rust** 1.70+
- **PostgreSQL** 16+
- **Docker** (opcional, recomendado)

### Inicio Rápido con Makefile

```bash
# Iniciar stack completo (DB + API + Frontend)
make dev

# Stack completo + monitoreo (Prometheus, Grafana, Loki) + Adminer
make dev-full

# Solo monitoreo
make dev-monitoring

# Solo Adminer (panel de DB)
make dev-db

# Detener servicios
make down

# Detener y limpiar volúmenes (destructivo)
make down-clean

# Ver estado de contenedores
make status

# Ver logs
make logs           # Todos los servicios
make logs-api       # Solo API
make logs-frontend  # Solo frontend
make logs-db        # Solo base de datos

# Reconstruir servicios individuales
make rebuild-api
make rebuild-frontend

# Conectar a PostgreSQL
make db-shell

# Exportar dump de la base de datos
make db-dump

# Producción
make build          # Construir imágenes
make prod           # Iniciar stack de producción

# HTTPS local con Portless
make dev-portless   # Docker + HTTPS (lab17025.localhost:1355)
```

### Frontend

```bash
# Instalar dependencias
npm install

# Desarrollo (hot reload)
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Tests
npm run test          # Modo watch
npm run test:run      # Ejecución única
npm run test:coverage # Con cobertura

# Lint y formato
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### Backend

```bash
cd src/api

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de PostgreSQL y Google APIs

# Ejecutar migraciones
sqlx migrate run

# Desarrollo
cargo run

# Build de producción
cargo build --release
```

### Docker (manual)

Los archivos Docker están en el directorio `docker/`:

```bash
# Desarrollo completo (frontend + backend + db)
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

# Con monitoreo (Prometheus + Grafana + Loki)
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml --profile monitoring up -d

# Producción
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d

# Rebuild
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d --build
```

**Servicios Docker (desarrollo):**

| Servicio     | Puerto | Descripción                              |
| ------------ | ------ | ---------------------------------------- |
| `frontend`   | 5173   | Vite dev server con HMR                  |
| `api`        | 3000   | Rust/Axum con cargo-watch                |
| `db`         | 5434   | PostgreSQL 16-alpine                     |
| `adminer`    | 8080   | Panel de admin DB (perfil `dbadmin`)     |
| `prometheus` | 9090   | Métricas (perfil `monitoring`)           |
| `grafana`    | 3001   | Dashboards (perfil `monitoring`)         |
| `loki`       | 3100   | Agregación de logs (perfil `monitoring`) |

### Variables de Entorno

```bash
# === App Frontend (.env.local) ===
VITE_APP_NAME=Laboratorio Ingetec
VITE_APP_ENV=development
VITE_AUTH_BYPASS=true          # Bypass Google OAuth en desarrollo

# === API ===
VITE_API_URL=/api
VITE_API_TIMEOUT=10000

# === Backend (.env en src/api/) ===
API_PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/lab17025
RUN_MIGRATIONS=true
REQUIRE_AUTH=false
ALLOWED_ORIGINS=http://localhost:5173
RUST_LOG=debug

# === Google OAuth ===
VITE_GOOGLE_API_KEY=your-api-key
VITE_GOOGLE_CLIENT_ID=your-client-id

# === Google Drive ===
GOOGLE_DRIVE_FOLDER_ROOT=folder-id
GOOGLE_DRIVE_DB_MASTER=spreadsheet-id
GOOGLE_DRIVE_FOLDER_PLANTILLAS=folder-id
GOOGLE_DRIVE_FOLDER_PROYECTOS=folder-id
# ... (ver .env.example para la lista completa)

# === Google Sheets Templates ===
GOOGLE_SHEETS_TEMPLATE_TRACCION=spreadsheet-id
GOOGLE_SHEETS_TEMPLATE_DUREZA=spreadsheet-id
# ... (ver .env.example para todos los templates)
```

---

## CI/CD

El proyecto usa **GitHub Actions** con el pipeline definido en `.github/workflows/ci.yml`:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │     │   Backend   │     │   Docker    │
│             │     │             │     │  (solo main) │
│ Node 20/22  │     │ Rust stable │     │             │
│ npm ci      │     │ cargo check │     │ Buildx      │
│ lint        │     │ cargo test  │     │ Push GHCR   │
│ format:check│     │             │     │ SHA + latest│
│ test:run    │     │             │     │             │
│ build       │     │             │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    Push/PR a main/develop
```

- **Frontend:** Matrix con Node 20.x y 22.x. Lint, formato, tests y build.
- **Backend:** Rust stable. `cargo check` y `cargo test` (con cache via `Swatinem/rust-cache`).
- **Docker:** Solo en push a `main`, después de que frontend y backend pasen. Construye y sube imágenes a `ghcr.io` con tags SHA y `latest`.

---

## API Endpoints

### Autenticación

| Método | Endpoint          | Descripción   | Auth |
| ------ | ----------------- | ------------- | ---- |
| POST   | `/api/auth/login` | Autenticación | No   |

### Proyectos

| Método | Endpoint             | Descripción         |
| ------ | -------------------- | ------------------- |
| GET    | `/api/proyectos`     | Listar proyectos    |
| POST   | `/api/proyectos`     | Crear proyecto      |
| GET    | `/api/proyectos/:id` | Detalle de proyecto |
| PUT    | `/api/proyectos/:id` | Actualizar proyecto |
| DELETE | `/api/proyectos/:id` | Eliminar proyecto   |

### Ensayos

| Método | Endpoint                  | Descripción             |
| ------ | ------------------------- | ----------------------- |
| GET    | `/api/ensayos`            | Listar ensayos          |
| POST   | `/api/ensayos`            | Crear ensayo            |
| GET    | `/api/ensayos/:id`        | Detalle de ensayo       |
| PUT    | `/api/ensayos/:id`        | Actualizar ensayo       |
| PUT    | `/api/ensayos/:id/status` | Cambiar estado workflow |

### Equipos y Sensores

| Método | Endpoint              | Descripción            |
| ------ | --------------------- | ---------------------- |
| GET    | `/api/equipos`        | Listar equipos         |
| POST   | `/api/equipos`        | Crear equipo           |
| GET    | `/api/sensores`       | Listar sensores        |
| POST   | `/api/sensores`       | Crear sensor           |
| POST   | `/api/calibraciones`  | Registrar calibración  |
| POST   | `/api/comprobaciones` | Registrar comprobación |

### Tipos de Ensayo

| Método | Endpoint            | Descripción            |
| ------ | ------------------- | ---------------------- |
| GET    | `/api/tipos-ensayo` | Listar tipos de ensayo |
| POST   | `/api/tipos-ensayo` | Crear tipo de ensayo   |

### Otros

| Método | Endpoint                | Descripción             |
| ------ | ----------------------- | ----------------------- |
| GET    | `/api/clientes`         | Listar clientes         |
| GET    | `/api/perforaciones`    | Listar perforaciones    |
| GET    | `/api/muestras`         | Listar muestras         |
| GET    | `/api/personal-interno` | Listar personal interno |
| GET    | `/api/metrics`          | Métricas Prometheus     |

---

## Norma ISO/IEC 17025:2017

El sistema está diseñado para cumplir con los requisitos de:

| Requisito                    | Implementación                                     |
| ---------------------------- | -------------------------------------------------- |
| **4.1 Imparcialidad**        | Control de acceso por roles, auditoría de acciones |
| **4.2 Confidencialidad**     | Clientes solo ven sus proyectos                    |
| **6.2 Personal**             | Gestión de competencias y capacitaciones           |
| **6.4 Equipamiento**         | Trazabilidad de calibraciones y comprobaciones     |
| **6.5 Trazabilidad**         | Workflow completo E1-E15, historial de cambios     |
| **7.2 Selección de métodos** | Catálogo de tipos de ensayo con normas             |
| **7.4 Manejo de muestras**   | Registro desde recepción hasta disposición         |
| **7.5 Registros técnicos**   | Almacenamiento de resultados y evidencias          |
| **7.8 Informes**             | Generación y control de versiones                  |

---

## Licencia

Este software es propiedad privada. Todos los derechos reservados.

---

## Contacto

**Repositorio:** [github.com/rulos-nico/17025](https://github.com/rulos-nico/17025)
