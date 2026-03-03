# Sistema de Asignación Automática de Ensayos

## Resumen Ejecutivo

Este documento describe el diseño del sistema de asignación automática para ensayos de laboratorio, que asignará técnico, equipo y fecha de programación cuando un administrador valide un ensayo solicitado por un cliente.

### Decisiones de Diseño

| Aspecto               | Decisión                                                               |
| --------------------- | ---------------------------------------------------------------------- |
| Flujo                 | Cliente crea (E1) → Admin valida → Sistema asigna automáticamente (E2) |
| Capacidad de personal | Total de ensayos activos por técnico/tipo (ej: máx 100 simultáneos)    |
| Equipos               | Requeridos por tipo de ensayo                                          |
| Prioridad             | FIFO (orden de llegada, sin prioridad especial para urgentes)          |

### Estados "Activos" (ocupan capacidad del técnico)

La capacidad del técnico se mide por el **total de ensayos activos asignados**, no por día. Un ensayo se considera "activo" cuando está en proceso de ejecución/trabajo por el técnico.

| Estado | Nombre            | ¿Activo? | Razón                                |
| ------ | ----------------- | -------- | ------------------------------------ |
| E1     | Sin programación  | No       | Aún no asignado a técnico            |
| **E2** | Programado        | **Sí**   | Asignado, pendiente de ejecutar      |
| E3     | Anulado           | No       | Terminal, cancelado                  |
| **E4** | Repetición        | **Sí**   | Necesita re-ejecutarse               |
| **E5** | Novedad           | **Sí**   | Tiene problema, pero sigue activo    |
| **E6** | En ejecución      | **Sí**   | El técnico lo está trabajando        |
| **E7** | Espera ensayos    | **Sí**   | Esperando dependencias               |
| **E8** | Procesamiento     | **Sí**   | Procesando datos                     |
| E9     | Rev. Técnica      | No       | Ya pasó a revisión, técnico liberado |
| E10    | Rev. Coordinación | No       | En revisión administrativa           |
| E11    | Rev. Dirección    | No       | En revisión dirección                |
| E12    | Por enviar        | No       | Listo para cliente                   |
| E13    | Enviado           | No       | Ya enviado                           |
| E14    | Entregado         | No       | Ya entregado                         |
| E15    | Facturado         | No       | Terminal, completado                 |

**Resumen**: Estados activos = **E2, E4, E5, E6, E7, E8**

Cuando un ensayo pasa de E8 → E9 (Revisión Técnica), la capacidad del técnico se **libera automáticamente**.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ASIGNACIÓN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cliente crea ensayo                                            │
│       │                                                         │
│       ▼                                                         │
│  Ensayo en estado E1 (Solicitado)                              │
│       │                                                         │
│       ▼                                                         │
│  Admin hace clic en "Validar"                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SCHEDULER SERVICE                                       │   │
│  │                                                          │   │
│  │  1. Obtener tipo_ensayo del ensayo                       │   │
│  │  2. Buscar técnico con capacidad disponible:             │   │
│  │     - Contar ensayos activos (E2,E4,E5,E6,E7,E8)         │   │
│  │     - Verificar < max_ensayos_activos                    │   │
│  │  3. Buscar equipos requeridos para este tipo             │   │
│  │  4. Buscar primera fecha con equipos disponibles         │   │
│  │  5. Crear reservas de equipos                            │   │
│  │  6. Retornar: tecnico_id, equipo_ids, fecha_programacion │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  Ensayo actualizado con asignación                              │
│  Estado cambia a E2 (Validado)                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estado Actual del Sistema

### Tablas Existentes Relevantes

| Tabla                   | Propósito                                 | Estado                                                                |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `ensayos`               | Almacena ensayos con campos de scheduling | Existe, tiene `fecha_programacion`, `tecnico_id`, `duracion_estimada` |
| `tipos_ensayo`          | Catálogo de tipos de ensayo               | Existe, tiene `tiempo_estimado_dias`                                  |
| `personal_interno`      | Personal del laboratorio                  | Existe                                                                |
| `equipos`               | Equipos del laboratorio                   | Existe, tiene `estado`, `fecha_calibracion`, `proxima_calibracion`    |
| `personal_tipos_ensayo` | Relación personal ↔ tipos (con nivel)     | Existe en DB, **sin modelo Rust**                                     |

### Campos de Scheduling en `Ensayo`

```rust
// En src/api/src/models/ensayo.rs
pub struct Ensayo {
    // ... otros campos ...
    pub fecha_programacion: Option<String>,    // Fecha programada
    pub tecnico_id: Option<String>,            // Técnico asignado
    pub tecnico_nombre: Option<String>,        // Nombre del técnico (denormalizado)
    pub duracion_estimada: Option<String>,     // Duración estimada
    pub urgente: bool,                         // Flag de urgencia
    pub equipos_utilizados: Vec<String>,       // Equipos usados
}
```

### Lo que FALTA

1. **Modelo Rust para `personal_tipos_ensayo`** - La tabla existe pero no hay modelo
2. **Relación equipos ↔ tipos_ensayo** - No existe tabla ni modelo
3. **Sistema de capacidad por técnico** - No existe
4. **Sistema de reservas de equipos** - No existe

---

## Esquema de Base de Datos - Nuevas Tablas

### 1. `equipos_tipos_ensayo`

Relaciona qué equipos se necesitan para cada tipo de ensayo.

```sql
CREATE TABLE equipos_tipos_ensayo (
    id VARCHAR(50) PRIMARY KEY,
    equipo_id VARCHAR(50) NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    tipo_ensayo_id VARCHAR(50) NOT NULL REFERENCES tipos_ensayo(id) ON DELETE CASCADE,
    requerido BOOLEAN DEFAULT TRUE,  -- TRUE = obligatorio, FALSE = opcional
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(equipo_id, tipo_ensayo_id)
);

CREATE INDEX idx_equipos_tipos_ensayo_tipo ON equipos_tipos_ensayo(tipo_ensayo_id);
CREATE INDEX idx_equipos_tipos_ensayo_equipo ON equipos_tipos_ensayo(equipo_id);
```

### 2. `personal_capacidad`

Define el máximo de ensayos activos (simultáneos) que puede tener asignado cada técnico por tipo de ensayo.

```sql
CREATE TABLE personal_capacidad (
    id VARCHAR(50) PRIMARY KEY,
    personal_id VARCHAR(50) NOT NULL REFERENCES personal_interno(id) ON DELETE CASCADE,
    tipo_ensayo_id VARCHAR(50) NOT NULL REFERENCES tipos_ensayo(id) ON DELETE CASCADE,
    max_ensayos_activos INT NOT NULL DEFAULT 100,  -- Máximo de ensayos activos simultáneos
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(personal_id, tipo_ensayo_id)
);

CREATE INDEX idx_personal_capacidad_personal ON personal_capacidad(personal_id);
CREATE INDEX idx_personal_capacidad_tipo ON personal_capacidad(tipo_ensayo_id);
```

### 3. `reservas_equipos`

Registra cuándo un equipo está ocupado (por ensayo, calibración, mantenimiento).

```sql
CREATE TYPE motivo_reserva_equipo AS ENUM (
    'ensayo',
    'calibracion',
    'mantenimiento',
    'otro'
);

CREATE TABLE reservas_equipos (
    id VARCHAR(50) PRIMARY KEY,
    equipo_id VARCHAR(50) NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    ensayo_id VARCHAR(50) REFERENCES ensayos(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    motivo motivo_reserva_equipo NOT NULL DEFAULT 'ensayo',
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(equipo_id, fecha, ensayo_id)  -- Un equipo puede tener múltiples reservas por día si son de diferentes ensayos
);

CREATE INDEX idx_reservas_equipos_equipo_fecha ON reservas_equipos(equipo_id, fecha);
CREATE INDEX idx_reservas_equipos_fecha ON reservas_equipos(fecha);
```

> **Nota**: La tabla `reservas_personal` **no es necesaria** porque la capacidad del técnico se calcula dinámicamente contando sus ensayos activos (E2, E4, E5, E6, E7, E8), no mediante reservas por fecha.

---

## Migración SQL Completa

```sql
-- Migración: YYYYMMDDHHMMSS_add_scheduler_tables.sql

-- 1. Equipos requeridos por tipo de ensayo
CREATE TABLE equipos_tipos_ensayo (
    id VARCHAR(50) PRIMARY KEY,
    equipo_id VARCHAR(50) NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    tipo_ensayo_id VARCHAR(50) NOT NULL REFERENCES tipos_ensayo(id) ON DELETE CASCADE,
    requerido BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(equipo_id, tipo_ensayo_id)
);

CREATE INDEX idx_equipos_tipos_ensayo_tipo ON equipos_tipos_ensayo(tipo_ensayo_id);
CREATE INDEX idx_equipos_tipos_ensayo_equipo ON equipos_tipos_ensayo(equipo_id);

-- 2. Capacidad de ensayos activos por técnico/tipo
CREATE TABLE personal_capacidad (
    id VARCHAR(50) PRIMARY KEY,
    personal_id VARCHAR(50) NOT NULL REFERENCES personal_interno(id) ON DELETE CASCADE,
    tipo_ensayo_id VARCHAR(50) NOT NULL REFERENCES tipos_ensayo(id) ON DELETE CASCADE,
    max_ensayos_activos INT NOT NULL DEFAULT 100,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(personal_id, tipo_ensayo_id)
);

CREATE INDEX idx_personal_capacidad_personal ON personal_capacidad(personal_id);
CREATE INDEX idx_personal_capacidad_tipo ON personal_capacidad(tipo_ensayo_id);

-- 3. Reservas de equipos (calendario)
CREATE TYPE motivo_reserva_equipo AS ENUM ('ensayo', 'calibracion', 'mantenimiento', 'otro');

CREATE TABLE reservas_equipos (
    id VARCHAR(50) PRIMARY KEY,
    equipo_id VARCHAR(50) NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    ensayo_id VARCHAR(50) REFERENCES ensayos(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    motivo motivo_reserva_equipo NOT NULL DEFAULT 'ensayo',
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(equipo_id, fecha, ensayo_id)
);

CREATE INDEX idx_reservas_equipos_equipo_fecha ON reservas_equipos(equipo_id, fecha);
CREATE INDEX idx_reservas_equipos_fecha ON reservas_equipos(fecha);
```

---

## Modelos Rust a Crear

### Estructura de Archivos

```
src/api/src/
├── models/
│   ├── equipos_tipos_ensayo.rs    # NUEVO
│   ├── personal_capacidad.rs      # NUEVO
│   ├── personal_tipos_ensayo.rs   # NUEVO (modelo para tabla existente)
│   └── reservas_equipos.rs        # NUEVO
├── repositories/
│   ├── equipos_tipos_ensayo_repo.rs
│   ├── personal_capacidad_repo.rs
│   ├── personal_tipos_ensayo_repo.rs
│   └── reservas_equipos_repo.rs
├── services/
│   └── scheduler.rs               # NUEVO - Lógica de asignación
└── routes/
    └── ensayo.rs                  # Modificar - Agregar endpoint /validar
```

### Ejemplo: Modelo `EquiposTiposEnsayo`

```rust
// src/api/src/models/equipos_tipos_ensayo.rs

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EquipoTipoEnsayo {
    pub id: String,
    pub equipo_id: String,
    pub tipo_ensayo_id: String,
    pub requerido: bool,
    pub activo: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateEquipoTipoEnsayo {
    pub equipo_id: String,
    pub tipo_ensayo_id: String,
    pub requerido: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateEquipoTipoEnsayo {
    pub requerido: Option<bool>,
    pub activo: Option<bool>,
}
```

### Ejemplo: Modelo `PersonalCapacidad`

```rust
// src/api/src/models/personal_capacidad.rs

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PersonalCapacidad {
    pub id: String,
    pub personal_id: String,
    pub tipo_ensayo_id: String,
    pub max_ensayos_activos: i32,  // Máximo de ensayos activos simultáneos
    pub activo: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePersonalCapacidad {
    pub personal_id: String,
    pub tipo_ensayo_id: String,
    pub max_ensayos_activos: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePersonalCapacidad {
    pub max_ensayos_activos: Option<i32>,
    pub activo: Option<bool>,
}
```

---

## Servicio Scheduler

### Interfaz

```rust
// src/api/src/services/scheduler.rs

use chrono::NaiveDate;

/// Estados que cuentan como "activos" para la capacidad del técnico
const ESTADOS_ACTIVOS: &[&str] = &["E2", "E4", "E5", "E6", "E7", "E8"];

pub struct Asignacion {
    pub tecnico_id: String,
    pub tecnico_nombre: String,
    pub equipo_ids: Vec<String>,
    pub fecha_programacion: NaiveDate,
    pub duracion_dias: i32,
}

pub struct SchedulerService {
    pool: PgPool,
}

impl SchedulerService {
    /// Asigna técnico, equipos y fecha a un ensayo
    pub async fn asignar_ensayo(&self, ensayo_id: &str) -> Result<Asignacion, SchedulerError>;

    /// Cuenta ensayos activos de un técnico para un tipo de ensayo
    pub async fn contar_ensayos_activos(
        &self,
        personal_id: &str,
        tipo_ensayo_id: &str,
    ) -> Result<i32, SchedulerError>;

    /// Verifica si un técnico tiene capacidad disponible
    pub async fn tiene_capacidad(
        &self,
        personal_id: &str,
        tipo_ensayo_id: &str,
    ) -> Result<bool, SchedulerError>;

    /// Verifica si un equipo está disponible en un rango de fechas
    pub async fn verificar_disponibilidad_equipo(
        &self,
        equipo_id: &str,
        fecha_inicio: NaiveDate,
        duracion_dias: i32,
    ) -> Result<bool, SchedulerError>;

    /// Crea las reservas de equipos para un ensayo
    pub async fn crear_reservas_equipos(
        &self,
        ensayo_id: &str,
        asignacion: &Asignacion,
    ) -> Result<(), SchedulerError>;
}
```

### Algoritmo de Asignación (Pseudo-código)

```rust
pub async fn asignar_ensayo(&self, ensayo_id: &str) -> Result<Asignacion, SchedulerError> {
    // 1. Obtener ensayo y su tipo
    let ensayo = self.get_ensayo(ensayo_id).await?;
    let tipo = self.get_tipo_ensayo(&ensayo.tipo_ensayo_id).await?;
    let duracion = tipo.tiempo_estimado_dias.unwrap_or(1);

    // 2. Obtener técnicos habilitados (con nivel Ejecutor)
    let tecnicos = self.get_tecnicos_habilitados(&tipo.id).await?;
    if tecnicos.is_empty() {
        return Err(SchedulerError::NoTecnicosDisponibles);
    }

    // 3. Buscar primer técnico con capacidad disponible
    let tecnico = tecnicos.iter()
        .find(|t| self.tiene_capacidad(&t.id, &tipo.id).await.unwrap_or(false))
        .ok_or(SchedulerError::TodosTecnicosSaturados)?;

    // 4. Obtener equipos requeridos
    let equipos_requeridos = self.get_equipos_requeridos(&tipo.id).await?;

    // 5. Buscar primera fecha donde EQUIPOS estén disponibles
    let mut fecha = chrono::Local::now().date_naive();
    let max_fecha = fecha + chrono::Duration::days(365);

    while fecha <= max_fecha {
        let mut todos_disponibles = true;

        for equipo in &equipos_requeridos {
            if !self.verificar_disponibilidad_equipo(&equipo.id, fecha, duracion).await? {
                todos_disponibles = false;
                break;
            }
        }

        if todos_disponibles {
            // ¡Encontramos fecha!
            let asignacion = Asignacion {
                tecnico_id: tecnico.id.clone(),
                tecnico_nombre: tecnico.nombre.clone(),
                equipo_ids: equipos_requeridos.iter().map(|e| e.id.clone()).collect(),
                fecha_programacion: fecha,
                duracion_dias: duracion,
            };

            // 6. Crear reservas de equipos
            self.crear_reservas_equipos(ensayo_id, &asignacion).await?;

            return Ok(asignacion);
        }

        fecha += chrono::Duration::days(1);
    }

    Err(SchedulerError::NoDisponibilidadEnPeriodo)
}

/// Verifica si el técnico tiene capacidad para más ensayos activos
pub async fn tiene_capacidad(&self, personal_id: &str, tipo_ensayo_id: &str) -> Result<bool, SchedulerError> {
    // Obtener configuración de capacidad (default: 100)
    let capacidad = self.get_capacidad(personal_id, tipo_ensayo_id).await?;
    let max = capacidad.map(|c| c.max_ensayos_activos).unwrap_or(100);

    // Contar ensayos activos (E2, E4, E5, E6, E7, E8)
    let activos = self.contar_ensayos_activos(personal_id, tipo_ensayo_id).await?;

    Ok(activos < max)
}

/// Query para contar ensayos activos
pub async fn contar_ensayos_activos(&self, personal_id: &str, tipo_ensayo_id: &str) -> Result<i32, SchedulerError> {
    // SELECT COUNT(*) FROM ensayos
    // WHERE tecnico_id = $1
    //   AND tipo_ensayo_id = $2
    //   AND estado IN ('E2', 'E4', 'E5', 'E6', 'E7', 'E8')
}
```

---

## API Endpoints

### Endpoint de Validación

```
POST /api/ensayos/{id}/validar
```

**Request:** (vacío o con opciones)

```json
{
  "forzar_fecha": "2024-03-15", // Opcional: forzar fecha específica
  "forzar_tecnico_id": "abc123" // Opcional: forzar técnico específico
}
```

**Response (éxito):**

```json
{
  "success": true,
  "ensayo": {
    "id": "ensayo123",
    "estado": "E2",
    "tecnico_id": "tech456",
    "tecnico_nombre": "Juan Pérez",
    "fecha_programacion": "2024-03-10",
    "equipos_utilizados": ["equipo1", "equipo2"]
  },
  "asignacion": {
    "tecnico_id": "tech456",
    "tecnico_nombre": "Juan Pérez",
    "equipo_ids": ["equipo1", "equipo2"],
    "fecha_programacion": "2024-03-10",
    "duracion_dias": 2
  }
}
```

**Response (error - sin disponibilidad):**

```json
{
  "success": false,
  "error": "NO_DISPONIBILIDAD",
  "message": "No se encontró disponibilidad en los próximos 365 días",
  "detalles": {
    "tecnicos_revisados": 3,
    "equipos_requeridos": 2,
    "dias_revisados": 365
  }
}
```

### Endpoints de Configuración

```
# Equipos por tipo de ensayo
GET    /api/tipos-ensayo/{id}/equipos
POST   /api/tipos-ensayo/{id}/equipos
DELETE /api/tipos-ensayo/{id}/equipos/{equipo_id}

# Capacidad de personal (ensayos activos)
GET    /api/personal/{id}/capacidad
POST   /api/personal/{id}/capacidad
PUT    /api/personal/{id}/capacidad/{tipo_ensayo_id}
DELETE /api/personal/{id}/capacidad/{tipo_ensayo_id}

# Reservas de equipos (para visualización de calendario)
GET    /api/reservas/equipos?fecha_inicio=X&fecha_fin=Y
POST   /api/reservas/equipos      # Reserva manual (calibración, mantenimiento)
DELETE /api/reservas/equipos/{id}
```

---

## Plan de Implementación

### Fase 1: Base de Datos y Modelos (Prioridad Alta)

| #   | Tarea                                                          | Estimación |
| --- | -------------------------------------------------------------- | ---------- |
| 1.1 | Crear migración SQL con las 3 tablas nuevas                    | 1h         |
| 1.2 | Crear modelo `equipos_tipos_ensayo.rs`                         | 30min      |
| 1.3 | Crear modelo `personal_capacidad.rs`                           | 30min      |
| 1.4 | Crear modelo `personal_tipos_ensayo.rs` (para tabla existente) | 30min      |
| 1.5 | Crear modelo `reservas_equipos.rs`                             | 30min      |

### Fase 2: Repositorios (Prioridad Alta)

| #   | Tarea                                 | Estimación |
| --- | ------------------------------------- | ---------- |
| 2.1 | Crear `equipos_tipos_ensayo_repo.rs`  | 1h         |
| 2.2 | Crear `personal_capacidad_repo.rs`    | 1h         |
| 2.3 | Crear `personal_tipos_ensayo_repo.rs` | 1h         |
| 2.4 | Crear `reservas_equipos_repo.rs`      | 1h         |

### Fase 3: Servicio Scheduler (Prioridad Alta)

| #   | Tarea                                                  | Estimación |
| --- | ------------------------------------------------------ | ---------- |
| 3.1 | Implementar `scheduler.rs` con algoritmo de asignación | 3h         |
| 3.2 | Agregar tests unitarios para scheduler                 | 2h         |

### Fase 4: API Endpoints (Prioridad Alta)

| #   | Tarea                                          | Estimación |
| --- | ---------------------------------------------- | ---------- |
| 4.1 | Crear endpoint `POST /ensayos/{id}/validar`    | 2h         |
| 4.2 | Crear endpoints CRUD para equipos_tipos_ensayo | 1h         |
| 4.3 | Crear endpoints CRUD para personal_capacidad   | 1h         |
| 4.4 | Crear endpoints para reservas_equipos          | 1h         |

### Fase 5: UI de Configuración (Prioridad Media)

| #   | Tarea                                     | Estimación |
| --- | ----------------------------------------- | ---------- |
| 5.1 | UI para asignar equipos a tipos de ensayo | 3h         |
| 5.2 | UI para configurar capacidad de técnicos  | 3h         |

### Fase 6: Vista de Calendario (Prioridad Baja)

| #   | Tarea                                         | Estimación |
| --- | --------------------------------------------- | ---------- |
| 6.1 | Componente de calendario con vista de equipos | 4h         |
| 6.2 | Integración con el flujo de validación        | 2h         |

---

## Consideraciones Adicionales

### Manejo de Errores

El scheduler debe manejar estos casos:

1. **No hay técnicos habilitados** para el tipo de ensayo
2. **No hay equipos configurados** para el tipo de ensayo
3. **Técnico sin capacidad configurada** → usar default de 100 ensayos activos
4. **Todos los técnicos saturados** → retornar error con detalles
5. **Equipo fuera de calibración** → excluir automáticamente
6. **No hay disponibilidad de equipos** en el período de búsqueda (365 días)

### Calibración de Equipos

El scheduler debe verificar `proxima_calibracion` del equipo:

```rust
fn equipo_disponible(equipo: &Equipo, fecha: NaiveDate) -> bool {
    // Verificar que no esté fuera de calibración
    if let Some(proxima_cal) = &equipo.proxima_calibracion {
        if fecha > proxima_cal {
            return false; // Equipo necesita calibración
        }
    }

    // Verificar que no esté en mantenimiento
    if equipo.estado != "Operativo" {
        return false;
    }

    // Verificar reservas...
    true
}
```

### Duraciones Multi-día

Si un ensayo dura más de 1 día:

- Se crean reservas de equipo para cada día del rango
- Todos los días deben tener disponibilidad de equipo
- La capacidad del técnico se afecta una sola vez (cuenta como 1 ensayo activo)

### Liberación de Capacidad

Cuando un ensayo pasa de E8 → E9 (Revisión Técnica):

- El ensayo ya no cuenta para la capacidad del técnico
- Se libera automáticamente (no requiere acción manual)

### Cancelación de Ensayos

Cuando un ensayo se cancela:

- Eliminar todas las reservas asociadas (`ensayo_id`)
- Liberar automáticamente técnico y equipos

---

## Diagrama de Entidades

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  tipos_ensayo   │────<│ equipos_tipos_ensayo │>────│     equipos     │
│                 │     │                      │     │                 │
│ - id            │     │ - equipo_id          │     │ - id            │
│ - nombre        │     │ - tipo_ensayo_id     │     │ - nombre        │
│ - tiempo_est... │     │ - requerido          │     │ - estado        │
└────────┬────────┘     └──────────────────────┘     │ - prox_calibr.. │
         │                                           └────────┬────────┘
         │                                                    │
         │     ┌──────────────────────┐                       │
         │────<│ personal_tipos_ensayo│                       │
         │     │                      │              ┌────────┴────────┐
         │     │ - personal_id        │              │ reservas_equipos│
         │     │ - tipo_ensayo_id     │              │                 │
         │     │ - nivel              │              │ - equipo_id     │
         │     └──────────┬───────────┘              │ - ensayo_id     │
         │                │                          │ - fecha         │
         │                │                          │ - motivo        │
         │     ┌──────────┴───────────┐              └─────────────────┘
         │     │  personal_interno    │
         │     │                      │
         │     │ - id                 │
         │     │ - nombre             │
         │     └──────────┬───────────┘
         │                │
         │     ┌──────────┴───────────┐
         │────<│  personal_capacidad  │
         │     │                      │
         │     │ - personal_id        │
         │     │ - tipo_ensayo_id     │
         │     │ - max_ensayos_activos│  ◄─── Límite de ensayos simultáneos
         │     └──────────────────────┘
         │
┌────────┴────────┐
│     ensayos     │
│                 │
│ - id            │
│ - tipo          │
│ - estado        │  ◄─── E2,E4,E5,E6,E7,E8 = "activo" (cuenta para capacidad)
│ - tecnico_id    │  ◄─── Asignado por Scheduler
│ - fecha_prog... │  ◄─── Asignado por Scheduler
│ - equipos_util..│  ◄─── Asignado por Scheduler
└─────────────────┘
```

---

## Próximos Pasos

1. **Revisar y aprobar** este documento
2. **Comenzar Fase 1**: Crear migración SQL
3. **Iterar** según feedback

---

_Documento creado: 2026-02-28_
_Última actualización: 2026-03-01_
