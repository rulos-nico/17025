# Plan de Implementacion - Scheduler Fases 1 y 2

## Resumen

Este documento detalla la implementacion de las Fases 1 y 2 del sistema de asignacion automatica de ensayos. El objetivo es completar la infraestructura backend (modelos, repositorios, migracion) y refactorizar el scheduler existente para usar repositorios y agregar validaciones faltantes.

**Alcance**: Solo el flujo critico (backend + conectar con endpoint `/validar` existente).
**Estilo**: Refactorizar con repos (no SQL crudo en scheduler).
**Schema**: Agregar `motivo` y `descripcion` a `reservas_equipos` via nueva migracion.

---

## Estado Actual (Analisis)

### Lo que YA existe

| Componente                    | Ubicacion                                            | Estado                                                                                                                  |
| ----------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 3 tablas scheduler en DB      | `migrations/20260309001000_add_scheduler_tables.sql` | `equipos_tipos_ensayo`, `personal_capacidad`, `reservas_equipos` — creadas pero SIN `motivo`/`descripcion`/`updated_at` |
| Columna `duracion_estimada`   | `migrations/20260310000000_...`                      | Agregada a tabla `ensayos`                                                                                              |
| Tabla `personal_tipos_ensayo` | `migrations/20240300000000_...`                      | Existe en DB, tiene enum `nivel_responsabilidad` ('Ejecutor','Supervisor','Firmante'), pero NO tiene modelo Rust        |
| `SchedulerService`            | `src/api/src/services/scheduler.rs`                  | 145 lineas, usa SQL crudo, sin chequeo de capacidad ni calibracion                                                      |
| Endpoint `/validar`           | `src/api/src/routes/ensayo.rs:229-307`               | Funciona pero usa `sqlx::query` crudo para el UPDATE                                                                    |
| Request/Response types        | `src/api/src/models/ensayo.rs:68-84`                 | `ValidarEnsayoRequest`, `ValidarEnsayoResponse`                                                                         |

### Lo que NO existe (a crear)

| Componente                                                                      | Fase |
| ------------------------------------------------------------------------------- | ---- |
| Migracion ALTER TABLE para `reservas_equipos` (motivo, descripcion, updated_at) | 1    |
| Modelo `personal_tipos_ensayo.rs` (tabla existente sin modelo Rust)             | 1    |
| Modelo `equipos_tipos_ensayo.rs`                                                | 1    |
| Modelo `personal_capacidad.rs`                                                  | 1    |
| Modelo `reservas_equipos.rs`                                                    | 1    |
| Repositorio `personal_tipos_ensayo_repo.rs`                                     | 1    |
| Repositorio `equipos_tipos_ensayo_repo.rs`                                      | 1    |
| Repositorio `personal_capacidad_repo.rs`                                        | 1    |
| Repositorio `reservas_equipos_repo.rs`                                          | 1    |
| Constantes de columnas en `utils/sql.rs`                                        | 1    |
| Registros en `models/mod.rs` y `repositories/mod.rs`                            | 1    |
| Refactor de `scheduler.rs` para usar repos                                      | 2    |
| Metodo `count_active_by_tecnico()` en `ensayo_repo.rs`                          | 2    |
| Campos `equipos_utilizados` y `duracion_estimada` en `UpdateEnsayo`             | 2    |
| Refactor de `validar_ensayo` handler para usar `repo.update()`                  | 2    |

### Deficiencias del Scheduler Actual (a corregir en Fase 2)

1. **No chequea `personal_capacidad.max_ensayos_activos`** — siempre asigna al tecnico con menos carga sin limite
2. **No chequea `equipo.estado`** — podria asignar equipos fuera de servicio
3. **No chequea `equipo.proxima_calibracion`** — podria reservar fechas donde el equipo estara en calibracion
4. **No soporta multi-dia** — solo reserva 1 dia, ignora `tiempo_estimado_dias`
5. **`validar_ensayo` handler** usa `sqlx::query` crudo en vez de `repo.update()`
6. **Bug**: `equipo_repo.find_available()` filtra `estado = 'disponible'` que no es un valor valido (deberia ser `'operativo'`)

---

## Fase 1: Migracion + Modelos + Repositorios

### 1.1 Migracion SQL

**Archivo**: `src/api/migrations/20260314000000_enhance_scheduler_tables.sql`

Necesitamos una migracion ALTER para agregar campos a la tabla `reservas_equipos` existente, ya que las tablas fueron creadas en `20260309001000` pero sin `motivo`, `descripcion`, ni `updated_at`.

```sql
-- Agregar enum motivo_reserva_equipo
CREATE TYPE motivo_reserva_equipo AS ENUM ('ensayo', 'calibracion', 'mantenimiento', 'otro');

-- Agregar columnas faltantes a reservas_equipos
ALTER TABLE reservas_equipos
    ADD COLUMN IF NOT EXISTS motivo motivo_reserva_equipo NOT NULL DEFAULT 'ensayo',
    ADD COLUMN IF NOT EXISTS descripcion TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Agregar updated_at a las otras tablas scheduler que no lo tienen
ALTER TABLE equipos_tipos_ensayo
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- personal_capacidad ya no tiene updated_at en la migracion original
ALTER TABLE personal_capacidad
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
```

**Nota**: La migracion original `20260309001000` creo `equipos_tipos_ensayo` sin `updated_at` y `reservas_equipos` sin `motivo`/`descripcion`/`updated_at`. Esta migracion complementa esas tablas.

### 1.2 Modelos

Cada modelo sigue el patron existente: `Row` struct (con `FromRow`, tipos nativos) + struct API (con Strings) + `From<Row>` impl + DTOs.

**Importante sobre enums PostgreSQL**: Usar `::text` en SELECT y `::enum_name` en INSERT/WHERE para evitar necesitar `DATABASE_URL` en compilacion.

#### 1.2.1 `src/api/src/models/personal_tipos_ensayo.rs`

Tabla existente en DB, nunca tuvo modelo Rust.

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

/// Row struct para personal_tipos_ensayo (FromRow, tipos nativos)
#[derive(Debug, Clone, FromRow)]
pub struct PersonalTipoEnsayoRow {
    pub id: String,
    pub personal_id: String,
    pub tipo_ensayo_id: String,
    pub nivel: String,           // nivel_responsabilidad enum: 'Ejecutor','Supervisor','Firmante'
    pub activo: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// API struct (serializable)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalTipoEnsayo {
    pub id: String,
    pub personal_id: String,
    pub tipo_ensayo_id: String,
    pub nivel: String,
    pub activo: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<PersonalTipoEnsayoRow> for PersonalTipoEnsayo {
    fn from(row: PersonalTipoEnsayoRow) -> Self {
        Self {
            id: row.id,
            personal_id: row.personal_id,
            tipo_ensayo_id: row.tipo_ensayo_id,
            nivel: row.nivel,
            activo: row.activo.unwrap_or(true),
            created_at: row.created_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
            updated_at: row.updated_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreatePersonalTipoEnsayo {
    pub personal_id: String,
    pub tipo_ensayo_id: String,
    pub nivel: String,  // 'Ejecutor', 'Supervisor', 'Firmante'
}
```

**Nota sobre `nivel`**: En SELECT se usa `nivel::text` para obtener string. En INSERT/WHERE se hace `.bind(&nivel)` con cast `$N::nivel_responsabilidad`.

#### 1.2.2 `src/api/src/models/equipos_tipos_ensayo.rs`

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, FromRow)]
pub struct EquipoTipoEnsayoRow {
    pub id: String,
    pub equipo_id: String,
    pub tipo_ensayo_id: String,
    pub requerido: bool,
    pub activo: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,  // Agregado por migracion 20260314
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EquipoTipoEnsayo {
    pub id: String,
    pub equipo_id: String,
    pub tipo_ensayo_id: String,
    pub requerido: bool,
    pub activo: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<EquipoTipoEnsayoRow> for EquipoTipoEnsayo {
    fn from(row: EquipoTipoEnsayoRow) -> Self {
        Self {
            id: row.id,
            equipo_id: row.equipo_id,
            tipo_ensayo_id: row.tipo_ensayo_id,
            requerido: row.requerido,
            activo: row.activo,
            created_at: row.created_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
            updated_at: row.updated_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateEquipoTipoEnsayo {
    pub equipo_id: String,
    pub tipo_ensayo_id: String,
    pub requerido: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEquipoTipoEnsayo {
    pub requerido: Option<bool>,
    pub activo: Option<bool>,
}
```

#### 1.2.3 `src/api/src/models/personal_capacidad.rs`

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, FromRow)]
pub struct PersonalCapacidadRow {
    pub id: String,
    pub personal_id: String,
    pub tipo_ensayo_id: String,
    pub max_ensayos_activos: i32,
    pub activo: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,  // Agregado por migracion 20260314
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalCapacidad {
    pub id: String,
    pub personal_id: String,
    pub tipo_ensayo_id: String,
    pub max_ensayos_activos: i32,
    pub activo: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<PersonalCapacidadRow> for PersonalCapacidad {
    fn from(row: PersonalCapacidadRow) -> Self {
        Self {
            id: row.id,
            personal_id: row.personal_id,
            tipo_ensayo_id: row.tipo_ensayo_id,
            max_ensayos_activos: row.max_ensayos_activos,
            activo: row.activo,
            created_at: row.created_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
            updated_at: row.updated_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreatePersonalCapacidad {
    pub personal_id: String,
    pub tipo_ensayo_id: String,
    pub max_ensayos_activos: Option<i32>,  // Default: 100
}

#[derive(Debug, Deserialize)]
pub struct UpdatePersonalCapacidad {
    pub max_ensayos_activos: Option<i32>,
    pub activo: Option<bool>,
}
```

#### 1.2.4 `src/api/src/models/reservas_equipos.rs`

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, NaiveDate, Utc};

#[derive(Debug, Clone, FromRow)]
pub struct ReservaEquipoRow {
    pub id: String,
    pub equipo_id: String,
    pub ensayo_id: Option<String>,
    pub fecha: NaiveDate,
    pub motivo: String,           // motivo_reserva_equipo enum, SELECT con ::text
    pub descripcion: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReservaEquipo {
    pub id: String,
    pub equipo_id: String,
    pub ensayo_id: Option<String>,
    pub fecha: String,             // NaiveDate -> String "YYYY-MM-DD"
    pub motivo: String,
    pub descripcion: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<ReservaEquipoRow> for ReservaEquipo {
    fn from(row: ReservaEquipoRow) -> Self {
        Self {
            id: row.id,
            equipo_id: row.equipo_id,
            ensayo_id: row.ensayo_id,
            fecha: row.fecha.to_string(),
            motivo: row.motivo,
            descripcion: row.descripcion,
            created_at: row.created_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
            updated_at: row.updated_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateReservaEquipo {
    pub equipo_id: String,
    pub ensayo_id: Option<String>,
    pub fecha: String,         // "YYYY-MM-DD"
    pub motivo: Option<String>,     // Default: 'ensayo'
    pub descripcion: Option<String>,
}

/// Para crear multiples reservas de una vez (multi-dia)
#[derive(Debug)]
pub struct CreateReservaEquipoBatch {
    pub equipo_id: String,
    pub ensayo_id: String,
    pub fechas: Vec<NaiveDate>,
    pub motivo: String,
}
```

### 1.3 Registros en mod.rs

#### `src/api/src/models/mod.rs`

Agregar 4 lineas de `pub mod` y 4 de `pub use`:

```rust
// Agregar despues de los existentes:
pub mod equipos_tipos_ensayo;
pub mod personal_capacidad;
pub mod personal_tipos_ensayo;
pub mod reservas_equipos;

pub use equipos_tipos_ensayo::*;
pub use personal_capacidad::*;
pub use personal_tipos_ensayo::*;
pub use reservas_equipos::*;
```

#### `src/api/src/repositories/mod.rs`

Agregar 4 lineas de `pub mod` y 4 de `pub use`:

```rust
// Agregar despues de los existentes:
pub mod equipos_tipos_ensayo_repo;
pub mod personal_capacidad_repo;
pub mod personal_tipos_ensayo_repo;
pub mod reservas_equipos_repo;

pub use equipos_tipos_ensayo_repo::EquiposTiposEnsayoRepository;
pub use personal_capacidad_repo::PersonalCapacidadRepository;
pub use personal_tipos_ensayo_repo::PersonalTiposEnsayoRepository;
pub use reservas_equipos_repo::ReservasEquiposRepository;
```

### 1.4 Constantes de columnas en `utils/sql.rs`

```rust
/// Columns for the `personal_tipos_ensayo` table
pub const PERSONAL_TIPO_ENSAYO_COLUMNS: &str =
    "id, personal_id, tipo_ensayo_id, nivel::text, activo, created_at, updated_at";
// Nota: nivel::text para evitar problemas con enum de PostgreSQL

/// Columns for the `equipos_tipos_ensayo` table
pub const EQUIPO_TIPO_ENSAYO_COLUMNS: &str =
    "id, equipo_id, tipo_ensayo_id, requerido, activo, created_at, updated_at";

/// Columns for the `personal_capacidad` table
pub const PERSONAL_CAPACIDAD_COLUMNS: &str =
    "id, personal_id, tipo_ensayo_id, max_ensayos_activos, activo, created_at, updated_at";

/// Columns for the `reservas_equipos` table
pub const RESERVA_EQUIPO_COLUMNS: &str =
    "id, equipo_id, ensayo_id, fecha, motivo::text, descripcion, created_at, updated_at";
// Nota: motivo::text para evitar problemas con enum de PostgreSQL
```

### 1.5 Repositorios

Cada repositorio sigue el patron existente (ver `equipo_repo.rs`, `ensayo_repo.rs`).

#### 1.5.1 `personal_tipos_ensayo_repo.rs`

Metodos principales:

- `find_all()` -> `Vec<PersonalTipoEnsayo>`
- `find_by_id(id)` -> `Option<PersonalTipoEnsayo>`
- `find_by_personal(personal_id)` -> `Vec<PersonalTipoEnsayo>`
- `find_ejecutores_by_tipo(tipo_ensayo_id)` -> `Vec<PersonalTipoEnsayo>`
  - WHERE `tipo_ensayo_id = $1 AND nivel = 'Ejecutor' AND activo = TRUE`
  - Este es el metodo CRITICO para el scheduler
- `create(dto)` -> `PersonalTipoEnsayo`
  - INSERT con `nivel` casteado a `$3::nivel_responsabilidad`
- `delete(id)` -> `bool`

#### 1.5.2 `equipos_tipos_ensayo_repo.rs`

Metodos principales:

- `find_all()` -> `Vec<EquipoTipoEnsayo>`
- `find_by_id(id)` -> `Option<EquipoTipoEnsayo>`
- `find_requeridos_by_tipo(tipo_ensayo_id)` -> `Vec<EquipoTipoEnsayo>`
  - WHERE `tipo_ensayo_id = $1 AND requerido = TRUE AND activo = TRUE`
  - Retorna la lista de equipos necesarios para un tipo de ensayo
- `create(dto)` -> `EquipoTipoEnsayo`
- `update(id, dto)` -> `Option<EquipoTipoEnsayo>`
- `delete(id)` -> `bool`

#### 1.5.3 `personal_capacidad_repo.rs`

Metodos principales:

- `find_all()` -> `Vec<PersonalCapacidad>`
- `find_by_id(id)` -> `Option<PersonalCapacidad>`
- `find_by_personal(personal_id)` -> `Vec<PersonalCapacidad>`
- `find_by_personal_and_tipo(personal_id, tipo_ensayo_id)` -> `Option<PersonalCapacidad>`
  - WHERE `personal_id = $1 AND tipo_ensayo_id = $2 AND activo = TRUE`
  - Retorna la config de capacidad; si None, default = 100
- `create(dto)` -> `PersonalCapacidad`
- `update(id, dto)` -> `Option<PersonalCapacidad>`
- `delete(id)` -> `bool`

#### 1.5.4 `reservas_equipos_repo.rs`

Metodos principales:

- `find_all()` -> `Vec<ReservaEquipo>`
- `find_by_id(id)` -> `Option<ReservaEquipo>`
- `find_by_equipo(equipo_id)` -> `Vec<ReservaEquipo>`
- `find_by_ensayo(ensayo_id)` -> `Vec<ReservaEquipo>`
- `find_by_equipos_and_rango(equipo_ids: &[String], desde: NaiveDate, hasta: NaiveDate)` -> `Vec<ReservaEquipo>`
  - WHERE `equipo_id = ANY($1) AND fecha BETWEEN $2 AND $3`
  - Usado por scheduler para buscar fechas libres
- `create(dto)` -> `ReservaEquipo`
  - INSERT con `motivo` casteado a `$5::motivo_reserva_equipo`
- `create_batch(batch)` -> `Vec<ReservaEquipo>`
  - Inserta multiples reservas en una transaccion (para multi-dia)
  - Usa `sqlx::query` en un loop dentro de `pool.begin()` / `tx.commit()`
- `delete_by_ensayo(ensayo_id)` -> `u64` (rows affected)
  - DELETE WHERE `ensayo_id = $1`
  - Necesario para limpiar reservas si se cancela/re-asigna un ensayo
- `delete(id)` -> `bool`

---

## Fase 2: Refactorizar Scheduler + Handler

### 2.1 Modificar `UpdateEnsayo` en `models/ensayo.rs`

Agregar campos faltantes al DTO:

```rust
#[derive(Debug, Deserialize)]
pub struct UpdateEnsayo {
    pub workflow_state: Option<WorkflowState>,
    pub fecha_programacion: Option<String>,
    pub fecha_ejecucion: Option<String>,
    pub fecha_reporte: Option<String>,
    pub fecha_entrega: Option<String>,
    pub tecnico_id: Option<String>,
    pub tecnico_nombre: Option<String>,
    pub observaciones: Option<String>,
    // NUEVOS:
    pub equipos_utilizados: Option<Vec<String>>,
    pub duracion_estimada: Option<String>,
}
```

### 2.2 Actualizar `update()` en `ensayo_repo.rs`

Extender la query UPDATE para incluir `equipos_utilizados` y `duracion_estimada`:

```sql
UPDATE ensayos SET
    workflow_state = COALESCE($2, workflow_state),
    fecha_programacion = COALESCE($3, fecha_programacion),
    -- ... campos existentes ...
    observaciones = COALESCE($9, observaciones),
    equipos_utilizados = COALESCE($10, equipos_utilizados),    -- NUEVO
    duracion_estimada = COALESCE($11, duracion_estimada),      -- NUEVO
    updated_at = NOW(),
    sync_source = 'db'
WHERE id = $1
RETURNING {ENSAYO_COLUMNS}
```

### 2.3 Agregar `count_active_by_tecnico()` en `ensayo_repo.rs`

```rust
/// Cuenta ensayos activos (E2,E4,E5,E6,E7,E8) asignados a un tecnico
pub async fn count_active_by_tecnico(&self, tecnico_id: &str) -> Result<i64, AppError> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM ensayos
         WHERE tecnico_id = $1
         AND workflow_state IN ('E2', 'E4', 'E5', 'E6', 'E7', 'E8')"
    )
    .bind(tecnico_id)
    .fetch_one(&self.pool)
    .await
    .map_err(AppError::from)?;
    Ok(row.0)
}
```

### 2.4 Refactorizar `scheduler.rs`

El scheduler actual (145 lineas) se reescribe completamente para:

1. **Inyectar repositorios** en vez de usar `&self.pool` directamente
2. **Chequear capacidad** via `personal_capacidad_repo` + `ensayo_repo.count_active_by_tecnico()`
3. **Chequear estado del equipo** — solo usar equipos con `estado = 'operativo'`
4. **Chequear calibracion** — no reservar fechas donde `proxima_calibracion` cae en el rango
5. **Soporte multi-dia** — usar `tipos_ensayo.tiempo_estimado_dias` para reservar N dias consecutivos
6. **Usar `reservas_equipos_repo.create_batch()`** para las reservas

#### Estructura refactorizada (~250 lineas estimadas):

```rust
pub struct SchedulerService {
    pool: DbPool,
}

pub struct AsignacionResult {
    pub tecnico_id: String,
    pub tecnico_nombre: String,
    pub fecha_programacion: NaiveDate,
    pub equipos_ids: Vec<String>,
    pub duracion_dias: i32,
}

const ESTADOS_ACTIVOS: &[&str] = &["E2", "E4", "E5", "E6", "E7", "E8"];

impl SchedulerService {
    pub fn new(pool: DbPool) -> Self { ... }

    pub async fn asignar(
        &self,
        ensayo_id: &str,
        tipo_ensayo_id: &str,
    ) -> Result<AsignacionResult, AppError> {
        // 1. Obtener duracion del tipo de ensayo
        let tipo_repo = TipoEnsayoRepository::new(self.pool.clone());
        let tipo = tipo_repo.find_by_id(tipo_ensayo_id).await?
            .ok_or(AppError::BadRequest("Tipo de ensayo no encontrado".into()))?;
        let duracion = tipo.tiempo_estimado_dias
            .and_then(|d| d.parse::<i32>().ok())
            .unwrap_or(1);

        // 2. Obtener ejecutores habilitados
        let pte_repo = PersonalTiposEnsayoRepository::new(self.pool.clone());
        let ejecutores = pte_repo.find_ejecutores_by_tipo(tipo_ensayo_id).await?;
        if ejecutores.is_empty() {
            return Err(AppError::BadRequest(
                "No hay tecnicos con nivel Ejecutor para este tipo de ensayo".into()
            ));
        }

        // 3. Buscar tecnico con capacidad disponible (menor carga primero)
        let ensayo_repo = EnsayoRepository::new(self.pool.clone());
        let cap_repo = PersonalCapacidadRepository::new(self.pool.clone());

        let tecnico = self.find_tecnico_disponible(
            &ejecutores, &ensayo_repo, &cap_repo, tipo_ensayo_id
        ).await?;

        // 4. Obtener equipos requeridos (solo operativos)
        let ete_repo = EquiposTiposEnsayoRepository::new(self.pool.clone());
        let equipo_repo = EquipoRepository::new(self.pool.clone());
        let equipos_ids = self.get_equipos_operativos(
            &ete_repo, &equipo_repo, tipo_ensayo_id
        ).await?;

        // 5. Buscar primera fecha con disponibilidad multi-dia
        let reservas_repo = ReservasEquiposRepository::new(self.pool.clone());
        let fecha = self.find_fecha_disponible(
            &equipos_ids, &equipo_repo, &reservas_repo, duracion
        ).await?;

        // 6. Crear reservas multi-dia
        if !equipos_ids.is_empty() {
            let fechas: Vec<NaiveDate> = (0..duracion)
                .map(|d| fecha + Duration::days(d as i64))
                .collect();
            for equipo_id in &equipos_ids {
                reservas_repo.create_batch(&CreateReservaEquipoBatch {
                    equipo_id: equipo_id.clone(),
                    ensayo_id: ensayo_id.to_string(),
                    fechas: fechas.clone(),
                    motivo: "ensayo".to_string(),
                }).await?;
            }
        }

        Ok(AsignacionResult {
            tecnico_id: tecnico.0,
            tecnico_nombre: tecnico.1,
            fecha_programacion: fecha,
            equipos_ids,
            duracion_dias: duracion,
        })
    }

    /// Busca tecnico con menor carga que tenga capacidad disponible
    async fn find_tecnico_disponible(...) -> Result<(String, String), AppError> {
        // Para cada ejecutor:
        //   1. Contar ensayos activos con ensayo_repo.count_active_by_tecnico()
        //   2. Obtener max con cap_repo.find_by_personal_and_tipo() (default 100)
        //   3. Si activos < max, candidato valido
        // Ordenar candidatos por carga ascendente, retornar primero
        // Si ninguno tiene capacidad -> AppError::BadRequest("Todos los tecnicos saturados")
    }

    /// Filtra equipos requeridos que esten en estado 'operativo'
    async fn get_equipos_operativos(...) -> Result<Vec<String>, AppError> {
        // 1. equipos_tipos_ensayo_repo.find_requeridos_by_tipo(tipo_id)
        // 2. Para cada equipo, verificar equipo_repo.find_by_id() -> estado == 'operativo'
        // 3. Si algun equipo requerido NO esta operativo -> error
    }

    /// Busca primera fecha donde todos los equipos estan libres por N dias consecutivos
    async fn find_fecha_disponible(...) -> Result<NaiveDate, AppError> {
        // 1. Rango: manana hasta manana+365
        // 2. Obtener todas las reservas existentes con reservas_repo.find_by_equipos_and_rango()
        // 3. Tambien excluir fechas donde proxima_calibracion cae en el rango
        // 4. Para cada fecha candidata, verificar N dias consecutivos libres
        // 5. Retornar primera fecha valida o error si no hay en 365 dias
    }
}
```

### 2.5 Refactorizar `validar_ensayo` handler en `routes/ensayo.rs`

Reemplazar el `sqlx::query` crudo (lineas 280-295) por uso de `repo.update()`:

```rust
// ANTES (SQL crudo):
sqlx::query(r#"UPDATE ensayos SET workflow_state = 'E2', ..."#)
    .bind(&id).bind(&tecnico_id)...
    .execute(&state.db_pool).await?;

// DESPUES (usando repo):
let update_dto = UpdateEnsayo {
    workflow_state: Some(WorkflowState::E2),
    fecha_programacion: Some(fecha_str.clone()),
    tecnico_id: Some(tecnico_id.clone()),
    tecnico_nombre: Some(tecnico_nombre.clone()),
    equipos_utilizados: Some(equipos_ids.clone()),
    duracion_estimada: None,  // o Some(...) si disponible
    // resto None
    ..Default::default()
};
let ensayo_actualizado = repo.update(&id, update_dto).await?
    .ok_or(AppError::NotFound)?;
```

Esto requiere implementar `Default` para `UpdateEnsayo` o construir manualmente con todos los campos.

---

## Orden de Implementacion

### Fase 1 (en orden estricto)

| Paso | Archivo                                                  | Accion                                                                         |
| ---- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1    | `migrations/20260314000000_enhance_scheduler_tables.sql` | Crear migracion ALTER TABLE                                                    |
| 2    | `models/personal_tipos_ensayo.rs`                        | Crear modelo (tabla existente)                                                 |
| 3    | `models/equipos_tipos_ensayo.rs`                         | Crear modelo                                                                   |
| 4    | `models/personal_capacidad.rs`                           | Crear modelo                                                                   |
| 5    | `models/reservas_equipos.rs`                             | Crear modelo                                                                   |
| 6    | `models/mod.rs`                                          | Registrar 4 modulos                                                            |
| 7    | `utils/sql.rs`                                           | Agregar 4 constantes COLUMNS                                                   |
| 8    | `repositories/personal_tipos_ensayo_repo.rs`             | Crear repo con `find_ejecutores_by_tipo`                                       |
| 9    | `repositories/equipos_tipos_ensayo_repo.rs`              | Crear repo con `find_requeridos_by_tipo`                                       |
| 10   | `repositories/personal_capacidad_repo.rs`                | Crear repo con `find_by_personal_and_tipo`                                     |
| 11   | `repositories/reservas_equipos_repo.rs`                  | Crear repo con `create_batch`, `find_by_equipos_and_rango`, `delete_by_ensayo` |
| 12   | `repositories/mod.rs`                                    | Registrar 4 modulos                                                            |
| 13   | Verificar                                                | `cargo check` debe compilar sin errores nuevos                                 |

### Fase 2 (en orden estricto)

| Paso | Archivo                       | Accion                                                                       |
| ---- | ----------------------------- | ---------------------------------------------------------------------------- |
| 1    | `models/ensayo.rs`            | Agregar `equipos_utilizados` y `duracion_estimada` a `UpdateEnsayo`          |
| 2    | `repositories/ensayo_repo.rs` | Extender `update()` para nuevos campos + agregar `count_active_by_tecnico()` |
| 3    | `services/scheduler.rs`       | Reescritura completa: repos, capacidad, calibracion, multi-dia               |
| 4    | `routes/ensayo.rs`            | Refactorizar `validar_ensayo` para usar `repo.update()`                      |
| 5    | Verificar                     | `cargo check` debe compilar sin errores nuevos                               |

---

## Notas Tecnicas

### Patron de enum PostgreSQL

```sql
-- En SELECT (obtener como texto):
SELECT nivel::text FROM personal_tipos_ensayo

-- En INSERT (castear al enum):
INSERT INTO personal_tipos_ensayo (nivel) VALUES ($1::nivel_responsabilidad)

-- En WHERE (castear al enum):
WHERE nivel = $1::nivel_responsabilidad
```

Esto evita necesitar `DATABASE_URL` en tiempo de compilacion para que sqlx resuelva tipos.

### Estados de equipo validos

Segun `src/config/equipos.ts`:

- `'operativo'` -- unico estado valido para asignacion
- `'en_calibracion'`
- `'fuera_servicio'`
- `'en_mantenimiento'`

**Bug existente**: `equipo_repo.find_available()` filtra por `estado = 'disponible'` que NO es un valor valido. Se debe corregir a `'operativo'`.

### Generacion de IDs

Usar `crate::utils::id::generate_uuid()` para todos los IDs nuevos, consistente con el resto del codebase.

### Transacciones

`create_batch` en `reservas_equipos_repo` debe usar transaccion:

```rust
let mut tx = self.pool.begin().await?;
for fecha in &batch.fechas {
    sqlx::query("INSERT INTO reservas_equipos ...")
        .bind(...)
        .execute(&mut *tx).await?;
}
tx.commit().await?;
```

---

## Fase 3 (Fuera de Alcance - Solo Referencia)

La Fase 3 conecta el frontend con el endpoint `/validar`:

- Agregar `validar(ensayoId)` a `apiService.ts`
- Crear componente `ValidarEnsayoModal`
- Agregar boton "Validar" al `EnsayoCard` (visible solo en estado E1)

No se detalla aqui porque requiere analisis separado del frontend.
