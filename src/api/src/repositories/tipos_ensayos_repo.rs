use sqlx::FromRow;
use chrono::{DateTime, Utc, NaiveDate};

use crate::db::DbPool;
use crate::models::{CreateTipoEnsayo, UpdateTipoEnsayo, TipoEnsayo};
use crate::utils::sql::{TIPO_ENSAYO_COLUMNS, select_from_with, select_where, select_where_with};

#[derive(Debug, Clone, FromRow)]
pub struct TipoEnsayoRow {
    pub id: String,
    pub nombre: String,
    pub categoria: Option<String>,
    pub vigente_desde: Option<NaiveDate>,
    pub norma: String,
    pub acre: String,
    pub activo: bool,
    pub orden: i32,
    pub tiempo_estimado_dias: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<TipoEnsayoRow> for TipoEnsayo {
    fn from(row: TipoEnsayoRow) -> Self {
        TipoEnsayo {
            id: row.id,
            nombre: row.nombre,
            categoria: row.categoria,
            vigente_desde: row.vigente_desde.map(|d| d.to_string()),
            norma: row.norma,
            acre: row.acre,
            activo: row.activo,
            orden: row.orden,
            tiempo_estimado_dias: row.tiempo_estimado_dias,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Clone)]
pub struct TipoEnsayoRepository {
    pool: DbPool,
}

impl TipoEnsayoRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todos los tipos de ensayo
    pub async fn find_all(&self) -> Result<Vec<TipoEnsayo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, TipoEnsayoRow>(
            &select_from_with("tipos_ensayo", TIPO_ENSAYO_COLUMNS, "ORDER BY orden, nombre"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(TipoEnsayo::from).collect())
    }

    /// Obtiene tipos de ensayo activos
    pub async fn find_active(&self) -> Result<Vec<TipoEnsayo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, TipoEnsayoRow>(
            &select_where_with("tipos_ensayo", TIPO_ENSAYO_COLUMNS, "activo = true", "ORDER BY orden, nombre"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(TipoEnsayo::from).collect())
    }

    /// Busca un tipo de ensayo por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<TipoEnsayo>, sqlx::Error> {
        let row = sqlx::query_as::<_, TipoEnsayoRow>(
            &select_where("tipos_ensayo", TIPO_ENSAYO_COLUMNS, "id = $1"),
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(TipoEnsayo::from))
    }

    /// Crea un nuevo tipo de ensayo
    pub async fn create(&self, id: &str, dto: CreateTipoEnsayo) -> Result<TipoEnsayo, sqlx::Error> {
        let vigente_desde = dto.vigente_desde
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        let row = sqlx::query_as::<_, TipoEnsayoRow>(&format!(
            r#"
            INSERT INTO tipos_ensayo (id, nombre, categoria, vigente_desde, norma, acre, orden, tiempo_estimado_dias)
            VALUES ($1, $2, $3, $4, $5, $6::acreditacion, $7, $8)
            RETURNING {}
            "#,
            TIPO_ENSAYO_COLUMNS
        ))
        .bind(id)
        .bind(&dto.nombre)
        .bind(&dto.categoria)
        .bind(vigente_desde)
        .bind(&dto.norma)
        .bind(&dto.acre)
        .bind(dto.orden.unwrap_or(0))
        .bind(dto.tiempo_estimado_dias)
        .fetch_one(&self.pool)
        .await?;

        Ok(TipoEnsayo::from(row))
    }

    /// Actualiza un tipo de ensayo existente
    pub async fn update(&self, id: &str, dto: UpdateTipoEnsayo) -> Result<Option<TipoEnsayo>, sqlx::Error> {
        let vigente_desde = dto.vigente_desde
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        let row = sqlx::query_as::<_, TipoEnsayoRow>(&format!(
            r#"
            UPDATE tipos_ensayo
            SET nombre = COALESCE($2, nombre),
                categoria = COALESCE($3, categoria),
                vigente_desde = COALESCE($4, vigente_desde),
                norma = COALESCE($5, norma),
                acre = COALESCE($6::acreditacion, acre),
                activo = COALESCE($7, activo),
                orden = COALESCE($8, orden),
                tiempo_estimado_dias = COALESCE($9, tiempo_estimado_dias),
                updated_at = NOW()
            WHERE id = $1
            RETURNING {}
            "#,
            TIPO_ENSAYO_COLUMNS
        ))
        .bind(id)
        .bind(&dto.nombre)
        .bind(&dto.categoria)
        .bind(vigente_desde)
        .bind(&dto.norma)
        .bind(&dto.acre)
        .bind(dto.activo)
        .bind(dto.orden)
        .bind(dto.tiempo_estimado_dias)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(TipoEnsayo::from))
    }

    /// Elimina un tipo de ensayo (soft delete: activo = false)
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE tipos_ensayo
            SET activo = false,
                updated_at = NOW()
            WHERE id = $1 AND activo = true
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Cuenta total de tipos de ensayo
    pub async fn count(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tipos_ensayo")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Cuenta tipos de ensayo activos
    pub async fn count_active(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tipos_ensayo WHERE activo = true")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }
}
