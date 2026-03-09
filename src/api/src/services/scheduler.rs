//! Servicio de asignación automática de ensayos.
//!
//! Flujo: E1 (solicitado) → validar → E2 (programado) con técnico y equipos asignados.

use chrono::{Duration, NaiveDate, Utc};
use crate::db::DbPool;
use crate::errors::AppError;
use crate::utils::id::generate_uuid;

/// Resultado de una asignación exitosa
#[derive(Debug)]
pub struct AsignacionResult {
    pub tecnico_id: String,
    pub tecnico_nombre: String,
    pub fecha_programacion: NaiveDate,
    pub equipos_ids: Vec<String>,
}

pub struct SchedulerService {
    pool: DbPool,
}

impl SchedulerService {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Asigna automáticamente técnico, fecha y equipos para un ensayo en E1.
    /// Retorna los datos de asignación o error si no hay disponibilidad.
    pub async fn asignar(&self, ensayo_id: &str, tipo_ensayo_id: &str) -> Result<AsignacionResult, AppError> {
        // 1. Obtener equipos requeridos para este tipo de ensayo
        let equipos_requeridos = self.get_equipos_requeridos(tipo_ensayo_id).await?;

        // 2. Buscar técnico con capacidad disponible (nivel Ejecutor para este tipo)
        let tecnico = self.get_tecnico_disponible(tipo_ensayo_id).await?
            .ok_or_else(|| AppError::BadRequest("No hay técnicos disponibles para este tipo de ensayo".into()))?;

        // 3. Buscar primera fecha donde todos los equipos requeridos estén libres
        let fecha = if equipos_requeridos.is_empty() {
            // Sin equipos requeridos: programar para mañana
            Utc::now().date_naive() + Duration::days(1)
        } else {
            self.get_primera_fecha_disponible(&equipos_requeridos).await?
        };

        // 4. Crear reservas de equipos para esa fecha
        for equipo_id in &equipos_requeridos {
            let reserva_id = generate_uuid();
            sqlx::query(
                "INSERT INTO reservas_equipos (id, equipo_id, ensayo_id, fecha) VALUES ($1, $2, $3, $4)"
            )
            .bind(&reserva_id)
            .bind(equipo_id)
            .bind(ensayo_id)
            .bind(fecha)
            .execute(&self.pool)
            .await
            .map_err(AppError::from)?;
        }

        Ok(AsignacionResult {
            tecnico_id: tecnico.0,
            tecnico_nombre: tecnico.1,
            fecha_programacion: fecha,
            equipos_ids: equipos_requeridos,
        })
    }

    /// Obtiene IDs de equipos requeridos para un tipo de ensayo
    async fn get_equipos_requeridos(&self, tipo_ensayo_id: &str) -> Result<Vec<String>, AppError> {
        let rows: Vec<(String,)> = sqlx::query_as(
            "SELECT equipo_id FROM equipos_tipos_ensayo WHERE tipo_ensayo_id = $1 AND requerido = TRUE AND activo = TRUE"
        )
        .bind(tipo_ensayo_id)
        .fetch_all(&self.pool)
        .await
        .map_err(AppError::from)?;
        Ok(rows.into_iter().map(|r| r.0).collect())
    }

    /// Obtiene el técnico con menos ensayos activos que tenga nivel Ejecutor para este tipo.
    /// Estados activos: E2, E4, E5, E6, E7, E8
    async fn get_tecnico_disponible(&self, tipo_ensayo_id: &str) -> Result<Option<(String, String)>, AppError> {
        // Técnicos habilitados (nivel Ejecutor) para este tipo
        // Ordenados por carga actual (ensayos activos), FIFO
        let row: Option<(String, String)> = sqlx::query_as(
            r#"
            SELECT p.id, CONCAT(p.nombre, ' ', COALESCE(p.apellido, '')) as nombre_completo
            FROM personal_interno p
            INNER JOIN personal_tipos_ensayo pte ON pte.personal_id = p.id
                AND pte.tipo_ensayo_id = $1
                AND pte.nivel = 'Ejecutor'
                AND pte.activo = TRUE
            WHERE p.activo = TRUE
            ORDER BY (
                SELECT COUNT(*) FROM ensayos e
                WHERE e.tecnico_id = p.id
                AND e.workflow_state IN ('E2', 'E4', 'E5', 'E6', 'E7', 'E8')
            ) ASC
            LIMIT 1
            "#
        )
        .bind(tipo_ensayo_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(AppError::from)?;
        Ok(row)
    }

    /// Busca la primera fecha (desde mañana) en que todos los equipos están disponibles.
    /// Busca hasta 365 días hacia adelante.
    async fn get_primera_fecha_disponible(&self, equipos_ids: &[String]) -> Result<NaiveDate, AppError> {
        // Obtener todas las reservas existentes para estos equipos en los próximos 365 días
        let desde = Utc::now().date_naive() + Duration::days(1);
        let hasta = desde + Duration::days(365);

        let fechas_ocupadas: Vec<(String, NaiveDate)> = sqlx::query_as(
            "SELECT equipo_id, fecha FROM reservas_equipos WHERE equipo_id = ANY($1) AND fecha BETWEEN $2 AND $3"
        )
        .bind(equipos_ids)
        .bind(desde)
        .bind(hasta)
        .fetch_all(&self.pool)
        .await
        .map_err(AppError::from)?;

        // Agrupar fechas ocupadas por equipo para búsqueda rápida
        use std::collections::HashSet;
        let ocupadas: HashSet<(String, NaiveDate)> = fechas_ocupadas.into_iter().collect();

        // Buscar la primera fecha donde TODOS los equipos están libres
        let mut fecha = desde;
        while fecha <= hasta {
            let todos_libres = equipos_ids.iter().all(|eid| !ocupadas.contains(&(eid.clone(), fecha)));
            if todos_libres {
                return Ok(fecha);
            }
            fecha += Duration::days(1);
        }

        Err(AppError::BadRequest(
            "No hay disponibilidad de equipos en los próximos 365 días".into()
        ))
    }
}
