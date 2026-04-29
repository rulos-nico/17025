use sqlx::FromRow;
use chrono::{DateTime, Utc};
use serde_json::Value as JsonValue;

use crate::db::DbPool;
use crate::models::{Comprobacion, CreateComprobacion, UpdateComprobacion};

/// Modelo de base de datos para Comprobacion
#[derive(Debug, Clone, FromRow)]
pub struct ComprobacionRow {
    pub id: String,
    pub sensor_id: String,
    pub fecha: DateTime<Utc>,
    pub data: JsonValue,
    pub resultado: String,
    pub responsable: String,
    pub observaciones: Option<String>,
    pub valor_patron: Option<f64>,
    pub unidad: Option<String>,
    pub n_replicas: Option<i32>,
    pub media: Option<f64>,
    pub desviacion_std: Option<f64>,
    pub error: Option<f64>,
    pub incertidumbre: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<ComprobacionRow> for Comprobacion {
    fn from(row: ComprobacionRow) -> Self {
        Comprobacion {
            id: row.id,
            sensor_id: row.sensor_id,
            fecha: row.fecha.to_rfc3339(),
            data: row.data,
            resultado: row.resultado,
            responsable: row.responsable,
            observaciones: row.observaciones,
            valor_patron: row.valor_patron,
            unidad: row.unidad,
            n_replicas: row.n_replicas,
            media: row.media,
            desviacion_std: row.desviacion_std,
            error: row.error,
            incertidumbre: row.incertidumbre,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

const COMPROBACION_COLUMNS: &str = "id, sensor_id, fecha, data, resultado, responsable, observaciones, \
    valor_patron, unidad, n_replicas, media, desviacion_std, error, incertidumbre, \
    created_at, updated_at";

#[derive(Clone)]
pub struct ComprobacionRepository {
    pool: DbPool,
}

impl ComprobacionRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todas las comprobaciones
    pub async fn find_all(&self) -> Result<Vec<Comprobacion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ComprobacionRow>(&format!(
            "SELECT {} FROM comprobacion ORDER BY fecha DESC",
            COMPROBACION_COLUMNS
        ))
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Comprobacion::from).collect())
    }

    /// Obtiene comprobaciones por sensor_id
    pub async fn find_by_sensor(&self, sensor_id: &str) -> Result<Vec<Comprobacion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ComprobacionRow>(&format!(
            "SELECT {} FROM comprobacion WHERE sensor_id = $1 ORDER BY fecha DESC",
            COMPROBACION_COLUMNS
        ))
        .bind(sensor_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Comprobacion::from).collect())
    }

    /// Busca comprobación por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Comprobacion>, sqlx::Error> {
        let row = sqlx::query_as::<_, ComprobacionRow>(&format!(
            "SELECT {} FROM comprobacion WHERE id = $1",
            COMPROBACION_COLUMNS
        ))
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Comprobacion::from))
    }

    /// Crea una nueva comprobación
    pub async fn create(&self, id: &str, dto: CreateComprobacion) -> Result<Comprobacion, sqlx::Error> {
        let row = sqlx::query_as::<_, ComprobacionRow>(&format!(
            r#"
            INSERT INTO comprobacion (
                id, sensor_id, fecha, data, resultado, responsable, observaciones,
                valor_patron, unidad, n_replicas, media, desviacion_std, error, incertidumbre
            )
            VALUES ($1, $2, $3::timestamptz, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING {}
            "#,
            COMPROBACION_COLUMNS
        ))
        .bind(id)
        .bind(&dto.sensor_id)
        .bind(&dto.fecha)
        .bind(&dto.data)
        .bind(&dto.resultado)
        .bind(&dto.responsable)
        .bind(&dto.observaciones)
        .bind(dto.valor_patron)
        .bind(&dto.unidad)
        .bind(dto.n_replicas)
        .bind(dto.media)
        .bind(dto.desviacion_std)
        .bind(dto.error)
        .bind(dto.incertidumbre)
        .fetch_one(&self.pool)
        .await?;

        Ok(Comprobacion::from(row))
    }

    /// Actualiza una comprobación existente
    pub async fn update(&self, id: &str, dto: UpdateComprobacion) -> Result<Option<Comprobacion>, sqlx::Error> {
        let row = sqlx::query_as::<_, ComprobacionRow>(&format!(
            r#"
            UPDATE comprobacion
            SET fecha = COALESCE($2::timestamptz, fecha),
                data = COALESCE($3, data),
                resultado = COALESCE($4, resultado),
                responsable = COALESCE($5, responsable),
                observaciones = COALESCE($6, observaciones),
                valor_patron = COALESCE($7, valor_patron),
                unidad = COALESCE($8, unidad),
                n_replicas = COALESCE($9, n_replicas),
                media = COALESCE($10, media),
                desviacion_std = COALESCE($11, desviacion_std),
                error = COALESCE($12, error),
                incertidumbre = COALESCE($13, incertidumbre),
                updated_at = NOW()
            WHERE id = $1
            RETURNING {}
            "#,
            COMPROBACION_COLUMNS
        ))
        .bind(id)
        .bind(&dto.fecha)
        .bind(&dto.data)
        .bind(&dto.resultado)
        .bind(&dto.responsable)
        .bind(&dto.observaciones)
        .bind(dto.valor_patron)
        .bind(&dto.unidad)
        .bind(dto.n_replicas)
        .bind(dto.media)
        .bind(dto.desviacion_std)
        .bind(dto.error)
        .bind(dto.incertidumbre)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Comprobacion::from))
    }

    /// Elimina una comprobación
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM comprobacion WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Cuenta comprobaciones por sensor
    pub async fn count_by_sensor(&self, sensor_id: &str) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM comprobacion WHERE sensor_id = $1")
            .bind(sensor_id)
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }
}
