use sqlx::FromRow;
use chrono::{DateTime, Utc, NaiveDate};
use rust_decimal::Decimal;

use crate::db::DbPool;
use crate::models::{Sensor, CreateSensor, UpdateSensor};
use crate::utils::sql::{SENSOR_COLUMNS, select_from_with, select_where, select_where_with};

/// Modelo de base de datos para Sensor
#[derive(Debug, Clone, FromRow)]
pub struct SensorRow {
    pub id: String,
    pub codigo: String,
    pub tipo: String,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: String,
    pub rango_medicion: Option<String>,
    pub precision: Option<String>,
    pub ubicacion: Option<String>,
    pub estado: String,
    pub fecha_calibracion: Option<NaiveDate>,
    pub proxima_calibracion: Option<NaiveDate>,
    pub error_maximo: Option<Decimal>,
    pub certificado_id: Option<String>,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub activo: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub sync_source: Option<String>,
    /// ID del equipo al que pertenece este sensor (opcional)
    pub equipo_id: Option<String>,
}

impl From<SensorRow> for Sensor {
    fn from(row: SensorRow) -> Self {
        Sensor {
            id: row.id,
            codigo: row.codigo,
            tipo: row.tipo,
            marca: row.marca,
            modelo: row.modelo,
            numero_serie: row.numero_serie,
            rango_medicion: row.rango_medicion,
            precision: row.precision,
            ubicacion: row.ubicacion,
            estado: row.estado,
            fecha_calibracion: row.fecha_calibracion.map(|d| d.to_string()),
            proxima_calibracion: row.proxima_calibracion.map(|d| d.to_string()),
            error_maximo: row.error_maximo.map(|d| d.to_string().parse().unwrap_or(0.0)),
            certificado_id: row.certificado_id,
            responsable: row.responsable,
            observaciones: row.observaciones,
            activo: row.activo,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
            equipo_id: row.equipo_id,
        }
    }
}

#[derive(Clone)]
pub struct SensorRepository {
    pool: DbPool,
}

impl SensorRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todos los sensores
    pub async fn find_all(&self) -> Result<Vec<Sensor>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SensorRow>(
            &select_from_with("sensores", SENSOR_COLUMNS, "ORDER BY codigo"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Sensor::from).collect())
    }

    /// Obtiene sensores activos
    pub async fn find_active(&self) -> Result<Vec<Sensor>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SensorRow>(
            &select_where_with("sensores", SENSOR_COLUMNS, "activo = true", "ORDER BY codigo"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Sensor::from).collect())
    }

    /// Busca un sensor por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Sensor>, sqlx::Error> {
        let row = sqlx::query_as::<_, SensorRow>(
            &select_where("sensores", SENSOR_COLUMNS, "id = $1"),
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Sensor::from))
    }

    /// Busca un sensor por código
    pub async fn find_by_codigo(&self, codigo: &str) -> Result<Option<Sensor>, sqlx::Error> {
        let row = sqlx::query_as::<_, SensorRow>(
            &select_where("sensores", SENSOR_COLUMNS, "codigo = $1"),
        )
        .bind(codigo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Sensor::from))
    }

    /// Busca un sensor por número de serie
    pub async fn find_by_numero_serie(&self, numero_serie: &str) -> Result<Option<Sensor>, sqlx::Error> {
        let row = sqlx::query_as::<_, SensorRow>(
            &select_where("sensores", SENSOR_COLUMNS, "numero_serie = $1"),
        )
        .bind(numero_serie)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Sensor::from))
    }

    /// Crea un nuevo sensor
    pub async fn create(&self, id: &str, codigo: &str, dto: CreateSensor) -> Result<Sensor, sqlx::Error> {
        let row = sqlx::query_as::<_, SensorRow>(&format!(
            r#"
            INSERT INTO sensores (id, codigo, tipo, marca, modelo, numero_serie, rango_medicion,
                                  precision, ubicacion, estado, activo, sync_source, equipo_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'operativo', true, 'db', $10)
            RETURNING {}
            "#,
            SENSOR_COLUMNS
        ))
        .bind(id)
        .bind(codigo)
        .bind(&dto.tipo)
        .bind(&dto.marca)
        .bind(&dto.modelo)
        .bind(&dto.numero_serie)
        .bind(&dto.rango_medicion)
        .bind(&dto.precision)
        .bind(&dto.ubicacion)
        .bind(&dto.equipo_id)
        .fetch_one(&self.pool)
        .await?;

        Ok(Sensor::from(row))
    }

    /// Actualiza un sensor existente
    pub async fn update(&self, id: &str, dto: UpdateSensor) -> Result<Option<Sensor>, sqlx::Error> {
        let fecha_calibracion = dto.fecha_calibracion
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
        let proxima_calibracion = dto.proxima_calibracion
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
        let error_maximo = dto.error_maximo
            .and_then(|e| Decimal::try_from(e).ok());

        let row = sqlx::query_as::<_, SensorRow>(&format!(
            r#"
            UPDATE sensores
            SET tipo = COALESCE($2, tipo),
                marca = COALESCE($3, marca),
                modelo = COALESCE($4, modelo),
                rango_medicion = COALESCE($5, rango_medicion),
                precision = COALESCE($6, precision),
                ubicacion = COALESCE($7, ubicacion),
                estado = COALESCE($8, estado),
                fecha_calibracion = COALESCE($9, fecha_calibracion),
                proxima_calibracion = COALESCE($10, proxima_calibracion),
                error_maximo = COALESCE($11, error_maximo),
                certificado_id = COALESCE($12, certificado_id),
                responsable = COALESCE($13, responsable),
                observaciones = COALESCE($14, observaciones),
                activo = COALESCE($15, activo),
                equipo_id = COALESCE($16, equipo_id),
                sync_source = 'db'
            WHERE id = $1
            RETURNING {}
            "#,
            SENSOR_COLUMNS
        ))
        .bind(id)
        .bind(&dto.tipo)
        .bind(&dto.marca)
        .bind(&dto.modelo)
        .bind(&dto.rango_medicion)
        .bind(&dto.precision)
        .bind(&dto.ubicacion)
        .bind(&dto.estado)
        .bind(fecha_calibracion)
        .bind(proxima_calibracion)
        .bind(error_maximo)
        .bind(&dto.certificado_id)
        .bind(&dto.responsable)
        .bind(&dto.observaciones)
        .bind(&dto.activo)
        .bind(&dto.equipo_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Sensor::from))
    }

    /// Elimina un sensor (soft delete)
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"UPDATE sensores SET activo = false, sync_source = 'db' WHERE id = $1"#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Upsert para sincronización desde Sheets
    pub async fn upsert_from_sheets(&self, sensor: &Sensor) -> Result<(), sqlx::Error> {
        let fecha_calibracion = sensor.fecha_calibracion
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
        let proxima_calibracion = sensor.proxima_calibracion
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
        let error_maximo = sensor.error_maximo
            .and_then(|e| Decimal::try_from(e).ok());

        sqlx::query(
            r#"
            INSERT INTO sensores (id, codigo, tipo, marca, modelo, numero_serie, rango_medicion,
                                  precision, ubicacion, estado, fecha_calibracion, proxima_calibracion,
                                  error_maximo, certificado_id, responsable, observaciones, activo,
                                  synced_at, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), 'sheets')
            ON CONFLICT (id) DO UPDATE SET
                codigo = EXCLUDED.codigo,
                tipo = EXCLUDED.tipo,
                marca = EXCLUDED.marca,
                modelo = EXCLUDED.modelo,
                numero_serie = EXCLUDED.numero_serie,
                rango_medicion = EXCLUDED.rango_medicion,
                precision = EXCLUDED.precision,
                ubicacion = EXCLUDED.ubicacion,
                estado = EXCLUDED.estado,
                fecha_calibracion = EXCLUDED.fecha_calibracion,
                proxima_calibracion = EXCLUDED.proxima_calibracion,
                error_maximo = EXCLUDED.error_maximo,
                certificado_id = EXCLUDED.certificado_id,
                responsable = EXCLUDED.responsable,
                observaciones = EXCLUDED.observaciones,
                activo = EXCLUDED.activo,
                synced_at = NOW(),
                sync_source = 'sheets'
            "#,
        )
        .bind(&sensor.id)
        .bind(&sensor.codigo)
        .bind(&sensor.tipo)
        .bind(&sensor.marca)
        .bind(&sensor.modelo)
        .bind(&sensor.numero_serie)
        .bind(&sensor.rango_medicion)
        .bind(&sensor.precision)
        .bind(&sensor.ubicacion)
        .bind(&sensor.estado)
        .bind(fecha_calibracion)
        .bind(proxima_calibracion)
        .bind(error_maximo)
        .bind(&sensor.certificado_id)
        .bind(&sensor.responsable)
        .bind(&sensor.observaciones)
        .bind(&sensor.activo)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Obtiene sensores modificados desde una fecha
    pub async fn find_modified_since(&self, since: DateTime<Utc>) -> Result<Vec<Sensor>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SensorRow>(
            &select_where_with("sensores", SENSOR_COLUMNS, "updated_at > $1 AND sync_source = 'db'", "ORDER BY updated_at"),
        )
        .bind(since)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Sensor::from).collect())
    }

    /// Cuenta total de sensores
    pub async fn count(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM sensores")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Cuenta sensores activos
    pub async fn count_active(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM sensores WHERE activo = true")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Obtiene sensores que necesitan calibración pronto (en los próximos N días)
    pub async fn find_needs_calibration(&self, days: i32) -> Result<Vec<Sensor>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SensorRow>(
            &select_where_with("sensores", SENSOR_COLUMNS, 
                "activo = true AND proxima_calibracion IS NOT NULL AND proxima_calibracion <= CURRENT_DATE + $1",
                "ORDER BY proxima_calibracion"),
        )
        .bind(days)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Sensor::from).collect())
    }

    /// Busca sensores por ID de equipo
    pub async fn find_by_equipo_id(&self, equipo_id: &str) -> Result<Vec<Sensor>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SensorRow>(
            &select_where_with("sensores", SENSOR_COLUMNS, "equipo_id = $1 AND activo = true", "ORDER BY codigo"),
        )
        .bind(equipo_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Sensor::from).collect())
    }
}
