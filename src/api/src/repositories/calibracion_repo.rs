use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use sqlx::FromRow;

use crate::db::DbPool;
use crate::models::{Calibracion, CreateCalibracion, UpdateCalibracion};

const CALIBRACION_COLUMNS: &str = r#"id, sensor_id, fecha_calibracion, proxima_calibracion,
    rango_medicion, "precision", error_maximo, incertidumbre, certificado_id, estado, factor,
    created_at, updated_at"#;

#[derive(Debug, Clone, FromRow)]
pub struct CalibracionRow {
    pub id: String,
    pub sensor_id: String,
    pub fecha_calibracion: NaiveDate,
    pub proxima_calibracion: NaiveDate,
    pub rango_medicion: Option<String>,
    pub precision: Option<String>,
    pub error_maximo: Option<String>,
    pub incertidumbre: Option<String>,
    pub certificado_id: Option<String>,
    pub estado: String,
    pub factor: Decimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<CalibracionRow> for Calibracion {
    fn from(row: CalibracionRow) -> Self {
        Calibracion {
            id: row.id,
            sensor_id: row.sensor_id,
            fecha_calibracion: row.fecha_calibracion.to_string(),
            proxima_calibracion: row.proxima_calibracion.to_string(),
            rango_medicion: row.rango_medicion,
            precision: row.precision,
            error_maximo: row.error_maximo,
            incertidumbre: row.incertidumbre,
            certificado_id: row.certificado_id,
            estado: row.estado,
            factor: row.factor,
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

    pub async fn find_all(&self) -> Result<Vec<Calibracion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, CalibracionRow>(&format!(
            "SELECT {} FROM calibracion ORDER BY fecha_calibracion DESC",
            CALIBRACION_COLUMNS
        ))
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Calibracion::from).collect())
    }

    pub async fn find_by_sensor(&self, sensor_id: &str) -> Result<Vec<Calibracion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, CalibracionRow>(&format!(
            "SELECT {} FROM calibracion WHERE sensor_id = $1 ORDER BY fecha_calibracion DESC",
            CALIBRACION_COLUMNS
        ))
        .bind(sensor_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Calibracion::from).collect())
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<Calibracion>, sqlx::Error> {
        let row = sqlx::query_as::<_, CalibracionRow>(&format!(
            "SELECT {} FROM calibracion WHERE id = $1",
            CALIBRACION_COLUMNS
        ))
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(Calibracion::from))
    }

    pub async fn create(
        &self,
        id: &str,
        dto: CreateCalibracion,
    ) -> Result<Calibracion, sqlx::Error> {
        let fecha = NaiveDate::parse_from_str(&dto.fecha_calibracion, "%Y-%m-%d")
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
        let proxima = NaiveDate::parse_from_str(&dto.proxima_calibracion, "%Y-%m-%d")
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;

        let row = sqlx::query_as::<_, CalibracionRow>(&format!(
            r#"
            INSERT INTO calibracion (id, sensor_id, fecha_calibracion, proxima_calibracion,
                                     rango_medicion, "precision", error_maximo, incertidumbre,
                                     certificado_id, estado, factor)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING {}
            "#,
            CALIBRACION_COLUMNS
        ))
        .bind(id)
        .bind(&dto.sensor_id)
        .bind(fecha)
        .bind(proxima)
        .bind(&dto.rango_medicion)
        .bind(&dto.precision)
        .bind(&dto.error_maximo)
        .bind(&dto.incertidumbre)
        .bind(&dto.certificado_id)
        .bind(&dto.estado)
        .bind(dto.factor)
        .fetch_one(&self.pool)
        .await?;

        Ok(Calibracion::from(row))
    }

    pub async fn update(
        &self,
        id: &str,
        dto: UpdateCalibracion,
    ) -> Result<Option<Calibracion>, sqlx::Error> {
        let fecha = dto
            .fecha_calibracion
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
        let proxima = dto
            .proxima_calibracion
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());

        let row = sqlx::query_as::<_, CalibracionRow>(&format!(
            r#"
            UPDATE calibracion
            SET fecha_calibracion = COALESCE($2, fecha_calibracion),
                proxima_calibracion = COALESCE($3, proxima_calibracion),
                rango_medicion = COALESCE($4, rango_medicion),
                "precision" = COALESCE($5, "precision"),
                error_maximo = COALESCE($6, error_maximo),
                incertidumbre = COALESCE($7, incertidumbre),
                certificado_id = COALESCE($8, certificado_id),
                estado = COALESCE($9, estado),
                factor = COALESCE($10, factor),
                updated_at = NOW()
            WHERE id = $1
            RETURNING {}
            "#,
            CALIBRACION_COLUMNS
        ))
        .bind(id)
        .bind(fecha)
        .bind(proxima)
        .bind(&dto.rango_medicion)
        .bind(&dto.precision)
        .bind(&dto.error_maximo)
        .bind(&dto.incertidumbre)
        .bind(&dto.certificado_id)
        .bind(&dto.estado)
        .bind(dto.factor)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Calibracion::from))
    }

    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM calibracion WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn count_by_sensor(&self, sensor_id: &str) -> Result<i64, sqlx::Error> {
        let row: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM calibracion WHERE sensor_id = $1")
                .bind(sensor_id)
                .fetch_one(&self.pool)
                .await?;
        Ok(row.0)
    }

    pub async fn find_expiring_soon(&self, days: i32) -> Result<Vec<Calibracion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, CalibracionRow>(&format!(
            r#"
            SELECT {}
            FROM calibracion
            WHERE proxima_calibracion <= CURRENT_DATE + ($1 || ' days')::interval
              AND proxima_calibracion >= CURRENT_DATE
            ORDER BY proxima_calibracion ASC
            "#,
            CALIBRACION_COLUMNS
        ))
        .bind(days)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Calibracion::from).collect())
    }
}
