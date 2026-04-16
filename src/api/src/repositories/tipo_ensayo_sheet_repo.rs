use sqlx::FromRow;
use chrono::{DateTime, Utc};

use crate::db::DbPool;
use crate::models::{TipoEnsayoSheet, CreateTipoEnsayoSheet, UpdateTipoEnsayoSheet};

const COLUMNS: &str = "id, tipo_ensayo_id, url, drive_id, activo, created_at, updated_at";

#[derive(Debug, Clone, FromRow)]
pub struct TipoEnsayoSheetRow {
    pub id: String,
    pub tipo_ensayo_id: String,
    pub url: String,
    pub drive_id: Option<String>,
    pub activo: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<TipoEnsayoSheetRow> for TipoEnsayoSheet {
    fn from(row: TipoEnsayoSheetRow) -> Self {
        TipoEnsayoSheet {
            id: row.id,
            tipo_ensayo_id: row.tipo_ensayo_id,
            url: row.url,
            drive_id: row.drive_id,
            activo: row.activo,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Clone)]
pub struct TipoEnsayoSheetRepository {
    pool: DbPool,
}

impl TipoEnsayoSheetRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todas las plantillas de un tipo de ensayo
    pub async fn find_by_tipo_ensayo_id(
        &self,
        tipo_ensayo_id: &str,
    ) -> Result<Vec<TipoEnsayoSheet>, sqlx::Error> {
        let rows = sqlx::query_as::<_, TipoEnsayoSheetRow>(&format!(
            "SELECT {} FROM tipos_ensayo_sheets WHERE tipo_ensayo_id = $1 ORDER BY created_at DESC",
            COLUMNS
        ))
        .bind(tipo_ensayo_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(TipoEnsayoSheet::from).collect())
    }

    /// Obtiene la plantilla activa de un tipo de ensayo
    pub async fn find_active_by_tipo_ensayo_id(
        &self,
        tipo_ensayo_id: &str,
    ) -> Result<Option<TipoEnsayoSheet>, sqlx::Error> {
        let row = sqlx::query_as::<_, TipoEnsayoSheetRow>(&format!(
            "SELECT {} FROM tipos_ensayo_sheets WHERE tipo_ensayo_id = $1 AND activo = true LIMIT 1",
            COLUMNS
        ))
        .bind(tipo_ensayo_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(TipoEnsayoSheet::from))
    }

    /// Busca una plantilla por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<TipoEnsayoSheet>, sqlx::Error> {
        let row = sqlx::query_as::<_, TipoEnsayoSheetRow>(&format!(
            "SELECT {} FROM tipos_ensayo_sheets WHERE id = $1",
            COLUMNS
        ))
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(TipoEnsayoSheet::from))
    }

    /// Crea una nueva plantilla para un tipo de ensayo
    pub async fn create(
        &self,
        tipo_ensayo_id: &str,
        dto: CreateTipoEnsayoSheet,
    ) -> Result<TipoEnsayoSheet, sqlx::Error> {
        let row = sqlx::query_as::<_, TipoEnsayoSheetRow>(&format!(
            r#"
            INSERT INTO tipos_ensayo_sheets (id, tipo_ensayo_id, url, drive_id)
            VALUES (gen_random_uuid()::text, $1, $2, $3)
            RETURNING {}
            "#,
            COLUMNS
        ))
        .bind(tipo_ensayo_id)
        .bind(&dto.url)
        .bind(&dto.drive_id)
        .fetch_one(&self.pool)
        .await?;

        Ok(TipoEnsayoSheet::from(row))
    }

    /// Actualiza una plantilla existente
    pub async fn update(
        &self,
        id: &str,
        dto: UpdateTipoEnsayoSheet,
    ) -> Result<Option<TipoEnsayoSheet>, sqlx::Error> {
        let row = sqlx::query_as::<_, TipoEnsayoSheetRow>(&format!(
            r#"
            UPDATE tipos_ensayo_sheets
            SET url = COALESCE($2, url),
                drive_id = COALESCE($3, drive_id),
                activo = COALESCE($4, activo)
            WHERE id = $1
            RETURNING {}
            "#,
            COLUMNS
        ))
        .bind(id)
        .bind(&dto.url)
        .bind(&dto.drive_id)
        .bind(&dto.activo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(TipoEnsayoSheet::from))
    }

    /// Elimina una plantilla
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM tipos_ensayo_sheets WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
