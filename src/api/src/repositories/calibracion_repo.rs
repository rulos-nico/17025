use sqlx::FromRow;
use chrono::{DateTime, Utc};

use crate::db::DbPool;
use crate::models::{Calibracion, CreateCalibracion, UpdateCalibracion};

/// Modelo de base de datos para Calibracion
#[derive(Debug, Clone, FromRow)]
pub struct CalibracionRow {
    pub id: String,
    pub equipo_id: String,
    pub fecha: DateTime<Utc>,
    pub laboratorio: String,
    pub certificado: Option<String>,
    pub factor: Option<f64>,
    pub incertidumbre: Option<String>,
    pub proxima_calibracion: Option<DateTime<Utc>>,
    pub observaciones: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<CalibracionRow> for Calibracion {
    fn from(row: CalibracionRow) -> Self {
        Calibracion {
            id: row.id,
            equipo_id: row.equipo_id,
            fecha: row.fecha.to_rfc3339(),
            laboratorio: row.laboratorio,
            certificado: row.certificado,
            factor: row.factor,
            incertidumbre: row.incertidumbre,
            proxima_calibracion: row.proxima_calibracion.map(|d| d.to_rfc3339()),
            observaciones: row.observaciones,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Clone)]
pub struct CalibracionRepository {
    pool: DbPool,
}

impl CalibracionRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todas las calibraciones
    pub async fn find_all(&self) -> Result<Vec<Calibracion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, CalibracionRow>(
            r#"
            SELECT id, equipo_id, fecha, laboratorio, certificado, factor, incertidumbre,
                   proxima_calibracion, observaciones, created_at, updated_at
            FROM calibraciones
            ORDER BY fecha DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Calibracion::from).collect())
    }

    /// Obtiene calibraciones por equipo_id
    pub async fn find_by_equipo(&self, equipo_id: &str) -> Result<Vec<Calibracion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, CalibracionRow>(
            r#"
            SELECT id, equipo_id, fecha, laboratorio, certificado, factor, incertidumbre,
                   proxima_calibracion, observaciones, created_at, updated_at
            FROM calibraciones
            WHERE equipo_id = $1
            ORDER BY fecha DESC
            "#,
        )
        .bind(equipo_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Calibracion::from).collect())
    }

    /// Busca calibración por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Calibracion>, sqlx::Error> {
        let row = sqlx::query_as::<_, CalibracionRow>(
            r#"
            SELECT id, equipo_id, fecha, laboratorio, certificado, factor, incertidumbre,
                   proxima_calibracion, observaciones, created_at, updated_at
            FROM calibraciones
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Calibracion::from))
    }

    /// Crea una nueva calibración
    pub async fn create(&self, id: &str, dto: CreateCalibracion) -> Result<Calibracion, sqlx::Error> {
        let row = sqlx::query_as::<_, CalibracionRow>(
            r#"
            INSERT INTO calibraciones (id, equipo_id, fecha, laboratorio, certificado, factor,
                                       incertidumbre, proxima_calibracion, observaciones)
            VALUES ($1, $2, $3::timestamptz, $4, $5, $6, $7, $8::timestamptz, $9)
            RETURNING id, equipo_id, fecha, laboratorio, certificado, factor, incertidumbre,
                      proxima_calibracion, observaciones, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(&dto.equipo_id)
        .bind(&dto.fecha)
        .bind(&dto.laboratorio)
        .bind(&dto.certificado)
        .bind(&dto.factor)
        .bind(&dto.incertidumbre)
        .bind(&dto.proxima_calibracion)
        .bind(&dto.observaciones)
        .fetch_one(&self.pool)
        .await?;

        Ok(Calibracion::from(row))
    }

    /// Actualiza una calibración existente
    pub async fn update(&self, id: &str, dto: UpdateCalibracion) -> Result<Option<Calibracion>, sqlx::Error> {
        let row = sqlx::query_as::<_, CalibracionRow>(
            r#"
            UPDATE calibraciones
            SET fecha = COALESCE($2::timestamptz, fecha),
                laboratorio = COALESCE($3, laboratorio),
                certificado = COALESCE($4, certificado),
                factor = COALESCE($5, factor),
                incertidumbre = COALESCE($6, incertidumbre),
                proxima_calibracion = COALESCE($7::timestamptz, proxima_calibracion),
                observaciones = COALESCE($8, observaciones),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, equipo_id, fecha, laboratorio, certificado, factor, incertidumbre,
                      proxima_calibracion, observaciones, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(&dto.fecha)
        .bind(&dto.laboratorio)
        .bind(&dto.certificado)
        .bind(&dto.factor)
        .bind(&dto.incertidumbre)
        .bind(&dto.proxima_calibracion)
        .bind(&dto.observaciones)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Calibracion::from))
    }

    /// Elimina una calibración
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM calibraciones WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Cuenta calibraciones por equipo
    pub async fn count_by_equipo(&self, equipo_id: &str) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM calibraciones WHERE equipo_id = $1")
            .bind(equipo_id)
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Obtiene calibraciones que vencen pronto
    pub async fn find_expiring_soon(&self, days: i32) -> Result<Vec<Calibracion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, CalibracionRow>(
            r#"
            SELECT id, equipo_id, fecha, laboratorio, certificado, factor, incertidumbre,
                   proxima_calibracion, observaciones, created_at, updated_at
            FROM calibraciones
            WHERE proxima_calibracion IS NOT NULL
              AND proxima_calibracion <= NOW() + ($1 || ' days')::interval
              AND proxima_calibracion >= NOW()
            ORDER BY proxima_calibracion ASC
            "#,
        )
        .bind(days)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Calibracion::from).collect())
    }
}
