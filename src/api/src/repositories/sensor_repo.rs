use chrono::{DateTime, NaiveDate, Utc};
use sqlx::FromRow;

use crate::db::DbPool;
use crate::models::{CreateSensor, Sensor, UpdateSensor};
use crate::utils::sql::{SENSOR_COLUMNS, SENSOR_COLUMNS_WITH_CAL, SENSOR_LATEST_CAL_JOIN};

/// Modelo de base de datos para Sensor ampliado con los campos derivados de la
/// última calibración asociada (via LATERAL JOIN).
#[derive(Debug, Clone, FromRow)]
pub struct SensorRow {
    pub id: String,
    pub codigo: String,
    pub tipo: String,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: String,
    pub ubicacion: Option<String>,
    pub estado: String,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub activo: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub sync_source: Option<String>,
    pub equipo_id: Option<String>,
    // Campos derivados de la última calibración
    pub rango_medicion: Option<String>,
    pub precision: Option<String>,
    pub fecha_calibracion: Option<NaiveDate>,
    pub proxima_calibracion: Option<NaiveDate>,
    pub error_maximo: Option<String>,
    pub certificado_id: Option<String>,
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
            error_maximo: row.error_maximo,
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

    fn select_with_cal(where_clause: Option<&str>, suffix: &str) -> String {
        let where_part = where_clause
            .map(|w| format!("WHERE {}", w))
            .unwrap_or_default();
        format!(
            "SELECT {cols} FROM sensores s {join} {where_clause} {suffix}",
            cols = SENSOR_COLUMNS_WITH_CAL,
            join = SENSOR_LATEST_CAL_JOIN,
            where_clause = where_part,
            suffix = suffix,
        )
    }

    /// Obtiene todos los sensores
    pub async fn find_all(&self) -> Result<Vec<Sensor>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SensorRow>(&Self::select_with_cal(None, "ORDER BY s.codigo"))
            .fetch_all(&self.pool)
            .await?;
        Ok(rows.into_iter().map(Sensor::from).collect())
    }

    /// Obtiene sensores activos
    pub async fn find_active(&self) -> Result<Vec<Sensor>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SensorRow>(&Self::select_with_cal(
            Some("s.activo = true"),
            "ORDER BY s.codigo",
        ))
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Sensor::from).collect())
    }

    /// Busca un sensor por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Sensor>, sqlx::Error> {
        let row = sqlx::query_as::<_, SensorRow>(&Self::select_with_cal(Some("s.id = $1"), ""))
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.map(Sensor::from))
    }

    /// Busca un sensor por código
    pub async fn find_by_codigo(&self, codigo: &str) -> Result<Option<Sensor>, sqlx::Error> {
        let row = sqlx::query_as::<_, SensorRow>(&Self::select_with_cal(
            Some("s.codigo = $1"),
            "",
        ))
        .bind(codigo)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(Sensor::from))
    }

    /// Busca un sensor por número de serie
    pub async fn find_by_numero_serie(
        &self,
        numero_serie: &str,
    ) -> Result<Option<Sensor>, sqlx::Error> {
        let row = sqlx::query_as::<_, SensorRow>(&Self::select_with_cal(
            Some("s.numero_serie = $1"),
            "",
        ))
        .bind(numero_serie)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(Sensor::from))
    }

    /// Crea un nuevo sensor
    pub async fn create(
        &self,
        id: &str,
        codigo: &str,
        dto: CreateSensor,
    ) -> Result<Sensor, sqlx::Error> {
        // Inserta la fila; luego recarga con el query enriquecido de calibración.
        sqlx::query(
            r#"
            INSERT INTO sensores (id, codigo, tipo, marca, modelo, numero_serie, ubicacion,
                                  estado, activo, sync_source, equipo_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'operativo', true, 'db', $8)
            "#,
        )
        .bind(id)
        .bind(codigo)
        .bind(&dto.tipo)
        .bind(&dto.marca)
        .bind(&dto.modelo)
        .bind(&dto.numero_serie)
        .bind(&dto.ubicacion)
        .bind(&dto.equipo_id)
        .execute(&self.pool)
        .await?;

        self.find_by_id(id)
            .await?
            .ok_or_else(|| sqlx::Error::RowNotFound)
    }

    /// Actualiza un sensor existente
    pub async fn update(
        &self,
        id: &str,
        dto: UpdateSensor,
    ) -> Result<Option<Sensor>, sqlx::Error> {
        let updated = sqlx::query(
            r#"
            UPDATE sensores
            SET tipo = COALESCE($2, tipo),
                marca = COALESCE($3, marca),
                modelo = COALESCE($4, modelo),
                ubicacion = COALESCE($5, ubicacion),
                estado = COALESCE($6, estado),
                responsable = COALESCE($7, responsable),
                observaciones = COALESCE($8, observaciones),
                activo = COALESCE($9, activo),
                equipo_id = COALESCE($10, equipo_id),
                sync_source = 'db'
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(&dto.tipo)
        .bind(&dto.marca)
        .bind(&dto.modelo)
        .bind(&dto.ubicacion)
        .bind(&dto.estado)
        .bind(&dto.responsable)
        .bind(&dto.observaciones)
        .bind(&dto.activo)
        .bind(&dto.equipo_id)
        .execute(&self.pool)
        .await?;

        if updated.rows_affected() == 0 {
            return Ok(None);
        }
        self.find_by_id(id).await
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
        sqlx::query(
            r#"
            INSERT INTO sensores (id, codigo, tipo, marca, modelo, numero_serie, ubicacion,
                                  estado, responsable, observaciones, activo,
                                  synced_at, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), 'sheets')
            ON CONFLICT (id) DO UPDATE SET
                codigo = EXCLUDED.codigo,
                tipo = EXCLUDED.tipo,
                marca = EXCLUDED.marca,
                modelo = EXCLUDED.modelo,
                numero_serie = EXCLUDED.numero_serie,
                ubicacion = EXCLUDED.ubicacion,
                estado = EXCLUDED.estado,
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
        .bind(&sensor.ubicacion)
        .bind(&sensor.estado)
        .bind(&sensor.responsable)
        .bind(&sensor.observaciones)
        .bind(&sensor.activo)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    /// Obtiene sensores modificados desde una fecha
    pub async fn find_modified_since(
        &self,
        since: DateTime<Utc>,
    ) -> Result<Vec<Sensor>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SensorRow>(&Self::select_with_cal(
            Some("s.updated_at > $1 AND s.sync_source = 'db'"),
            "ORDER BY s.updated_at",
        ))
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
    /// basándose en la última calibración registrada.
    pub async fn find_needs_calibration(
        &self,
        days: i32,
    ) -> Result<Vec<Sensor>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SensorRow>(&Self::select_with_cal(
            Some(
                "s.activo = true AND c.proxima_calibracion IS NOT NULL \
                 AND c.proxima_calibracion <= CURRENT_DATE + $1",
            ),
            "ORDER BY c.proxima_calibracion",
        ))
        .bind(days)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Sensor::from).collect())
    }

    /// Busca sensores por ID de equipo
    pub async fn find_by_equipo_id(
        &self,
        equipo_id: &str,
    ) -> Result<Vec<Sensor>, sqlx::Error> {
        let rows = sqlx::query_as::<_, SensorRow>(&Self::select_with_cal(
            Some("s.equipo_id = $1 AND s.activo = true"),
            "ORDER BY s.codigo",
        ))
        .bind(equipo_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Sensor::from).collect())
    }
}

// Mantenemos el uso explícito de SENSOR_COLUMNS para otros consumidores (por ejemplo,
// los tests). No se usa directamente en este módulo tras la migración al JOIN lateral.
#[allow(dead_code)]
const _SENSOR_COLUMNS_REF: &str = SENSOR_COLUMNS;
