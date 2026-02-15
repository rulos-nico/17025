use sqlx::FromRow;
use chrono::{DateTime, Utc};

use crate::db::DbPool;
use crate::models::{Comprobacion, CreateComprobacion, UpdateComprobacion};

/// Modelo de base de datos para Comprobacion
#[derive(Debug, Clone, FromRow)]
pub struct ComprobacionRow {
    pub id: String,
    pub equipo_id: String,
    pub fecha: DateTime<Utc>,
    pub tipo: String,
    pub resultado: String,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<ComprobacionRow> for Comprobacion {
    fn from(row: ComprobacionRow) -> Self {
        Comprobacion {
            id: row.id,
            equipo_id: row.equipo_id,
            fecha: row.fecha.to_rfc3339(),
            tipo: row.tipo,
            resultado: row.resultado,
            responsable: row.responsable,
            observaciones: row.observaciones,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

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
        let rows = sqlx::query_as::<_, ComprobacionRow>(
            r#"
            SELECT id, equipo_id, fecha, tipo, resultado, responsable, observaciones,
                   created_at, updated_at
            FROM comprobaciones
            ORDER BY fecha DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Comprobacion::from).collect())
    }

    /// Obtiene comprobaciones por equipo_id
    pub async fn find_by_equipo(&self, equipo_id: &str) -> Result<Vec<Comprobacion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ComprobacionRow>(
            r#"
            SELECT id, equipo_id, fecha, tipo, resultado, responsable, observaciones,
                   created_at, updated_at
            FROM comprobaciones
            WHERE equipo_id = $1
            ORDER BY fecha DESC
            "#,
        )
        .bind(equipo_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Comprobacion::from).collect())
    }

    /// Busca comprobación por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Comprobacion>, sqlx::Error> {
        let row = sqlx::query_as::<_, ComprobacionRow>(
            r#"
            SELECT id, equipo_id, fecha, tipo, resultado, responsable, observaciones,
                   created_at, updated_at
            FROM comprobaciones
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Comprobacion::from))
    }

    /// Crea una nueva comprobación
    pub async fn create(&self, id: &str, dto: CreateComprobacion) -> Result<Comprobacion, sqlx::Error> {
        let row = sqlx::query_as::<_, ComprobacionRow>(
            r#"
            INSERT INTO comprobaciones (id, equipo_id, fecha, tipo, resultado, responsable, observaciones)
            VALUES ($1, $2, $3::timestamptz, $4, $5, $6, $7)
            RETURNING id, equipo_id, fecha, tipo, resultado, responsable, observaciones,
                      created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(&dto.equipo_id)
        .bind(&dto.fecha)
        .bind(&dto.tipo)
        .bind(&dto.resultado)
        .bind(&dto.responsable)
        .bind(&dto.observaciones)
        .fetch_one(&self.pool)
        .await?;

        Ok(Comprobacion::from(row))
    }

    /// Actualiza una comprobación existente
    pub async fn update(&self, id: &str, dto: UpdateComprobacion) -> Result<Option<Comprobacion>, sqlx::Error> {
        let row = sqlx::query_as::<_, ComprobacionRow>(
            r#"
            UPDATE comprobaciones
            SET fecha = COALESCE($2::timestamptz, fecha),
                tipo = COALESCE($3, tipo),
                resultado = COALESCE($4, resultado),
                responsable = COALESCE($5, responsable),
                observaciones = COALESCE($6, observaciones),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, equipo_id, fecha, tipo, resultado, responsable, observaciones,
                      created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(&dto.fecha)
        .bind(&dto.tipo)
        .bind(&dto.resultado)
        .bind(&dto.responsable)
        .bind(&dto.observaciones)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Comprobacion::from))
    }

    /// Elimina una comprobación
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM comprobaciones WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Cuenta comprobaciones por equipo
    pub async fn count_by_equipo(&self, equipo_id: &str) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM comprobaciones WHERE equipo_id = $1")
            .bind(equipo_id)
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }
}
