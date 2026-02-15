# Laboratorio ISO 17025 - Sistema de Gestión

Sistema de gestión integral para laboratorio de ensayos acreditado bajo la norma **ISO/IEC 17025:2017**. Permite la trazabilidad completa desde la recepción de muestras hasta la entrega de informes y facturación.

---

## Tecnologías Utilizadas

### Frontend

| Tecnología            | Versión   | Descripción                       |
| --------------------- | --------- | --------------------------------- |
| **React**             | 19.2      | Framework UI con hooks            |
| **Vite**              | 7.2.5     | Build tool (rolldown-vite)        |
| **Recharts**          | 3.7       | Gráficos y visualización de datos |
| **ESLint + Prettier** | 9.x / 3.8 | Linting y formateo de código      |

### Backend

| Tecnología            | Versión  | Descripción                      |
| --------------------- | -------- | -------------------------------- |
| **Rust**              | 2021 ed. | Lenguaje de programación         |
| **Axum**              | 0.8      | Framework web async              |
| **SQLx**              | 0.8      | ORM async para PostgreSQL        |
| **PostgreSQL**        | -        | Base de datos relacional         |
| **JWT**               | 9        | Autenticación con tokens         |
| **Google Sheets API** | 6        | Integración con hojas de cálculo |
| **Google Drive API**  | 6        | Almacenamiento de documentos     |

### Herramientas de Desarrollo

| Herramienta | Uso                                       |
| ----------- | ----------------------------------------- |
| **Docker**  | Contenedores para desarrollo y producción |
| **Postman** | Testing de API (colecciones incluidas)    |
| **Tokio**   | Runtime async para Rust                   |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    React 19 + Vite                               │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │   Home   │ │Proyectos │ │ Equipos  │ │ Ensayos  │ │Personal││
│  │(Dashboard│ │          │ │          │ │          │ │        ││
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘│
│       └────────────┴────────────┴────────────┴───────────┘     │
│                              │                                  │
│            ┌─────────────────┴─────────────────┐               │
│            │         Custom Hooks              │               │
│            │  useApiData · useMultipleApiData  │               │
│            │  useMutation · useAuth            │               │
│            └─────────────────┬─────────────────┘               │
│                              │                                  │
│            ┌─────────────────┴─────────────────┐               │
│            │         API Service               │               │
│            │     apiService.js (fetch)         │               │
│            └─────────────────┬─────────────────┘               │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTP/REST (JSON)
                               ▼
┌──────────────────────────────┴──────────────────────────────────┐
│                         BACKEND                                  │
│                    Rust + Axum 0.8                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Routes (API)                         │  │
│  │  /proyectos · /ensayos · /equipos · /clientes · /auth    │  │
│  │  /perforaciones · /muestras · /sensores · /calibraciones │  │
│  └────────────────────────────┬─────────────────────────────┘  │
│                               │                                  │
│  ┌────────────────────────────┴─────────────────────────────┐  │
│  │                    Repositories                           │  │
│  │  proyecto_repo · ensayo_repo · equipo_repo · etc.        │  │
│  └────────────────────────────┬─────────────────────────────┘  │
│                               │                                  │
│  ┌────────────────────────────┴─────────────────────────────┐  │
│  │                     Data Layer                            │  │
│  │         PostgreSQL (SQLx)    Google Sheets/Drive          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
17025/
├── 📁 src/                          # Código fuente
│   │
│   ├── 📁 api/                      # BACKEND (Rust)
│   │   ├── Cargo.toml               # Dependencias Rust
│   │   ├── 📁 migrations/           # Migraciones SQL
│   │   │   ├── 20240127_personal_interno.sql
│   │   │   └── 20240128_comprobaciones_calibraciones.sql
│   │   │
│   │   └── 📁 src/
│   │       ├── main.rs              # Punto de entrada
│   │       ├── config.rs            # Variables de entorno
│   │       ├── errors.rs            # Manejo de errores (AppError)
│   │       │
│   │       ├── 📁 db/               # Conexión a base de datos
│   │       │   ├── mod.rs
│   │       │   └── connection.rs
│   │       │
│   │       ├── 📁 models/           # Estructuras de datos
│   │       │   ├── mod.rs
│   │       │   ├── proyecto.rs
│   │       │   ├── ensayo.rs
│   │       │   ├── cliente.rs
│   │       │   ├── equipos.rs
│   │       │   ├── sensores.rs
│   │       │   ├── perforacion.rs
│   │       │   ├── muestra.rs
│   │       │   ├── calibracion.rs
│   │       │   ├── comprobacion.rs
│   │       │   ├── personal_interno.rs
│   │       │   └── workflow.rs
│   │       │
│   │       ├── 📁 repositories/     # Acceso a datos (CRUD)
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
│   │       │   └── personal_interno_repo.rs
│   │       │
│   │       ├── 📁 routes/           # Endpoints HTTP
│   │       │   ├── mod.rs           # Registro de rutas
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
│   │       │   ├── auth.rs
│   │       │   └── sync.rs
│   │       │
│   │       ├── 📁 services/         # Lógica de negocio
│   │       │   ├── mod.rs
│   │       │   ├── google_sheets.rs
│   │       │   ├── google_drive.rs
│   │       │   ├── ensayo_sheets.rs
│   │       │   └── 📁 sync/         # Sincronización bidireccional
│   │       │       ├── mod.rs
│   │       │       ├── sheets_to_db.rs
│   │       │       └── db_to_sheets.rs
│   │       │
│   │       └── 📁 utils/            # Utilidades compartidas
│   │           ├── mod.rs
│   │           ├── id.rs            # Generación de IDs (UUID)
│   │           ├── date.rs          # Manejo de fechas
│   │           └── sql.rs           # Helpers SQL (columnas)
│   │
│   ├── 📁 pages/                    # FRONTEND - Páginas
│   │   ├── Home.jsx                 # Dashboard principal
│   │   ├── Proyectos.jsx            # Gestión de proyectos
│   │   ├── MisProyectos.jsx         # Vista cliente
│   │   ├── Equipos.jsx              # Equipos y sensores
│   │   ├── Ensayo.jsx               # Detalle de ensayo
│   │   ├── Personal.jsx             # Gestión de personal
│   │   ├── Reportes.jsx             # Generación de informes
│   │   └── Relacion_muestras.jsx    # Relación de muestras
│   │
│   ├── 📁 components/               # FRONTEND - Componentes
│   │   ├── PageLayout.jsx           # Layout base de páginas
│   │   ├── Cronograma.jsx           # Componente de cronograma
│   │   │
│   │   ├── 📁 ui/                   # Componentes UI base
│   │   │   ├── index.js
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   └── Modal.jsx
│   │   │
│   │   └── 📁 modals/               # Modales reutilizables
│   │       ├── index.js
│   │       ├── SolicitarEnsayoModal.jsx
│   │       └── ConfirmDeleteModal.jsx
│   │
│   ├── 📁 hooks/                    # FRONTEND - Custom Hooks
│   │   ├── index.js                 # Barrel export
│   │   ├── useAuth.jsx              # Autenticación
│   │   ├── useApiData.js            # Fetch de datos (GET)
│   │   ├── useMultipleApiData.js    # Fetch paralelo múltiple
│   │   └── useMutation.js           # Operaciones CRUD
│   │
│   ├── 📁 utils/                    # FRONTEND - Utilidades
│   │   ├── index.js                 # Barrel export
│   │   ├── mappers.js               # Transformación de datos
│   │   ├── formatters.js            # Formateo (fechas, números)
│   │   └── helpers.js               # Funciones auxiliares
│   │
│   ├── 📁 services/                 # FRONTEND - Servicios API
│   │   └── apiService.js            # Cliente HTTP centralizado
│   │
│   ├── App.jsx                      # Componente raíz
│   ├── App.css                      # Estilos globales
│   ├── config.js                    # Configuración centralizada
│   └── main.jsx                     # Punto de entrada React
│
├── 📁 public/                       # Archivos estáticos
├── 📁 docker/                       # Configuración Docker
├── 📁 postman/                      # Colecciones Postman
│
├── package.json                     # Dependencias Node.js
├── vite.config.js                   # Configuración Vite
├── eslint.config.js                 # Configuración ESLint
└── README.md                        # Este archivo
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
- **PostgreSQL** 14+
- **Docker** (opcional)

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

# Lint y formato
npm run lint
npm run format
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

### Docker

```bash
# Desarrollo completo (frontend + backend + db)
docker-compose up -d

# Solo base de datos
docker-compose up -d postgres

# Rebuild
docker-compose up -d --build
```

### Variables de Entorno

```bash
# Backend (.env)
DATABASE_URL=postgres://user:pass@localhost:5432/lab17025
RUST_LOG=debug
JWT_SECRET=your-secret-key
GOOGLE_CREDENTIALS_PATH=./credentials.json

# Frontend (.env.local)
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Laboratorio Ingetec
```

---

## API Endpoints

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
| POST   | `/api/calibraciones`  | Registrar calibración  |
| POST   | `/api/comprobaciones` | Registrar comprobación |

### Otros

| Método | Endpoint             | Descripción          |
| ------ | -------------------- | -------------------- |
| GET    | `/api/clientes`      | Listar clientes      |
| GET    | `/api/perforaciones` | Listar perforaciones |
| GET    | `/api/muestras`      | Listar muestras      |
| GET    | `/api/personal`      | Listar personal      |
| POST   | `/api/auth/login`    | Autenticación        |

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
