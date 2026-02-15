use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use sqlx::FromRow;

use crate::db::DbPool;
use crate::models::{CreatePerforacion, Perforacion, UpdatePerforacion};
use crate::utils::sql::{PERFORACION_COLUMNS, select_where, select_where_with};

/// Modelo de base de datos para Perforacion
#[derive(Debug, Clone, FromRow)]
pub struct PerforacionRow {
    pub id: String,
    pub codigo: String,
    pub proyecto_id: String,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub ubicacion: Option<String>,
    pub profundidad: Option<Decimal>,
    pub fecha_inicio: Option<NaiveDate>,
    pub fecha_fin: Option<NaiveDate>,
    pub estado: String,
    pub drive_folder_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub sync_source: Option<String>,
}

impl From<PerforacionRow> for Perforacion {
    fn from(row: PerforacionRow) -> Self {
        Perforacion {
            id: row.id,
            codigo: row.codigo,
            proyecto_id: row.proyecto_id,
            nombre: row.nombre,
            descripcion: row.descripcion,
            ubicacion: row.ubicacion,
            profundidad: row.profundidad.map(|d| d.to_string().parse().unwrap_or(0.0)),
            fecha_inicio: row.fecha_inicio.map(|d| d.to_string()),
            fecha_fin: row.fecha_fin.map(|d| d.to_string()),
            estado: row.estado,
            drive_folder_id: row.drive_folder_id,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Clone)]
pub struct PerforacionRepository {
    pool: DbPool,
}

impl PerforacionRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todas las perforaciones
    pub async fn find_all(&self) -> Result<Vec<Perforacion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, PerforacionRow>(
            &select_where_with("perforaciones", PERFORACION_COLUMNS, "estado != 'eliminado'", "ORDER BY created_at DESC"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Perforacion::from).collect())
    }

    /// Busca una perforacion por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Perforacion>, sqlx::Error> {
        let row = sqlx::query_as::<_, PerforacionRow>(
            &select_where("perforaciones", PERFORACION_COLUMNS, "id = $1"),
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Perforacion::from))
    }

    /// Busca una perforacion por código
    pub async fn find_by_codigo(&self, codigo: &str) -> Result<Option<Perforacion>, sqlx::Error> {
        let row = sqlx::query_as::<_, PerforacionRow>(
            &select_where("perforaciones", PERFORACION_COLUMNS, "codigo = $1"),
        )
        .bind(codigo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Perforacion::from))
    }

    /// Obtiene perforaciones por proyecto
    pub async fn find_by_proyecto(&self, proyecto_id: &str) -> Result<Vec<Perforacion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, PerforacionRow>(
            &select_where_with("perforaciones", PERFORACION_COLUMNS, "proyecto_id = $1 AND estado != 'eliminado'", "ORDER BY codigo"),
        )
        .bind(proyecto_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Perforacion::from).collect())
    }

    /// Crea una nueva perforacion
    pub async fn create(&self, id: &str, codigo: &str, dto: CreatePerforacion) -> Result<Perforacion, sqlx::Error> {
        let fecha_inicio = dto.fecha_inicio
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());

        let profundidad = dto.profundidad
            .and_then(|p| Decimal::try_from(p).ok());

        let row = sqlx::query_as::<_, PerforacionRow>(&format!(
            r#"
            INSERT INTO perforaciones (id, codigo, proyecto_id, nombre, descripcion, ubicacion, 
                                       profundidad, fecha_inicio, estado, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sin_relacionar', 'db')
            RETURNING {}
            "#,
            PERFORACION_COLUMNS
        ))
        .bind(id)
        .bind(codigo)
        .bind(&dto.proyecto_id)
        .bind(&dto.nombre)
        .bind(&dto.descripcion)
        .bind(&dto.ubicacion)
        .bind(profundidad)
        .bind(fecha_inicio)
        .fetch_one(&self.pool)
        .await?;

        Ok(Perforacion::from(row))
    }

    /// Actualiza una perforacion existente
    pub async fn update(&self, id: &str, dto: UpdatePerforacion) -> Result<Option<Perforacion>, sqlx::Error> {
        let fecha_inicio = dto.fecha_inicio
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
        let fecha_fin = dto.fecha_fin
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
        let profundidad = dto.profundidad
            .and_then(|p| Decimal::try_from(p).ok());

        let row = sqlx::query_as::<_, PerforacionRow>(&format!(
            r#"
            UPDATE perforaciones
            SET nombre = COALESCE($2, nombre),
                descripcion = COALESCE($3, descripcion),
                ubicacion = COALESCE($4, ubicacion),
                profundidad = COALESCE($5, profundidad),
                fecha_inicio = COALESCE($6, fecha_inicio),
                fecha_fin = COALESCE($7, fecha_fin),
                estado = COALESCE($8, estado),
                sync_source = 'db'
            WHERE id = $1
            RETURNING {}
            "#,
            PERFORACION_COLUMNS
        ))
        .bind(id)
        .bind(&dto.nombre)
        .bind(&dto.descripcion)
        .bind(&dto.ubicacion)
        .bind(profundidad)
        .bind(fecha_inicio)
        .bind(fecha_fin)
        .bind(&dto.estado)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Perforacion::from))
    }

    /// Elimina una perforacion (soft delete)
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"UPDATE perforaciones SET estado = 'eliminado', sync_source = 'db' WHERE id = $1"#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Upsert para sincronización desde Sheets
    pub async fn upsert_from_sheets(&self, perforacion: &Perforacion) -> Result<(), sqlx::Error> {
        let fecha_inicio = perforacion.fecha_inicio
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
        let fecha_fin = perforacion.fecha_fin
            .as_ref()
            .and_then(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
        let profundidad = perforacion.profundidad
            .and_then(|p| Decimal::try_from(p).ok());

        sqlx::query(
            r#"
            INSERT INTO perforaciones (id, codigo, proyecto_id, nombre, descripcion, ubicacion,
                                       profundidad, fecha_inicio, fecha_fin, estado, drive_folder_id,
                                       synced_at, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), 'sheets')
            ON CONFLICT (id) DO UPDATE SET
                codigo = EXCLUDED.codigo,
                proyecto_id = EXCLUDED.proyecto_id,
                nombre = EXCLUDED.nombre,
                descripcion = EXCLUDED.descripcion,
                ubicacion = EXCLUDED.ubicacion,
                profundidad = EXCLUDED.profundidad,
                fecha_inicio = EXCLUDED.fecha_inicio,
                fecha_fin = EXCLUDED.fecha_fin,
                estado = EXCLUDED.estado,
                drive_folder_id = EXCLUDED.drive_folder_id,
                synced_at = NOW(),
                sync_source = 'sheets'
            "#,
        )
        .bind(&perforacion.id)
        .bind(&perforacion.codigo)
        .bind(&perforacion.proyecto_id)
        .bind(&perforacion.nombre)
        .bind(&perforacion.descripcion)
        .bind(&perforacion.ubicacion)
        .bind(profundidad)
        .bind(fecha_inicio)
        .bind(fecha_fin)
        .bind(&perforacion.estado)
        .bind(&perforacion.drive_folder_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Obtiene perforaciones modificadas desde una fecha
    pub async fn find_modified_since(&self, since: DateTime<Utc>) -> Result<Vec<Perforacion>, sqlx::Error> {
        let rows = sqlx::query_as::<_, PerforacionRow>(
            &select_where_with("perforaciones", PERFORACION_COLUMNS, "updated_at > $1 AND sync_source = 'db'", "ORDER BY updated_at"),
        )
        .bind(since)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Perforacion::from).collect())
    }

    /// Cuenta total de perforaciones (excluyendo eliminadas)
    pub async fn count(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM perforaciones WHERE estado != 'eliminado'")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Cuenta perforaciones por proyecto
    pub async fn count_by_proyecto(&self, proyecto_id: &str) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM perforaciones WHERE proyecto_id = $1 AND estado != 'eliminado'"
        )
        .bind(proyecto_id)
        .fetch_one(&self.pool)
        .await?;
        Ok(row.0)
    }

    /// Actualiza el drive_folder_id de una perforación
    pub async fn update_drive_folder_id(&self, id: &str, drive_folder_id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE perforaciones
            SET drive_folder_id = $2,
                updated_at = NOW(),
                sync_source = 'db'
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(drive_folder_id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
