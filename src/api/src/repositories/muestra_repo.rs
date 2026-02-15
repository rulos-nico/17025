use sqlx::FromRow;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::db::DbPool;
use crate::models::{Muestra, CreateMuestra, UpdateMuestra};
use crate::utils::sql::{MUESTRA_COLUMNS, select_from_with, select_where, select_where_with};

/// Modelo de base de datos para Muestra
#[derive(Debug, Clone, FromRow)]
pub struct MuestraRow {
    pub id: String,
    pub codigo: String,
    pub perforacion_id: String,
    pub profundidad_inicio: Decimal,
    pub profundidad_fin: Decimal,
    pub tipo_muestra: String,
    pub descripcion: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub sync_source: Option<String>,
}

impl From<MuestraRow> for Muestra {
    fn from(row: MuestraRow) -> Self {
        Muestra {
            id: row.id,
            codigo: row.codigo,
            perforacion_id: row.perforacion_id,
            profundidad_inicio: row.profundidad_inicio.to_string().parse().unwrap_or(0.0),
            profundidad_fin: row.profundidad_fin.to_string().parse().unwrap_or(0.0),
            tipo_muestra: row.tipo_muestra,
            descripcion: row.descripcion,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Clone)]
pub struct MuestraRepository {
    pool: DbPool,
}

impl MuestraRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todas las muestras
    pub async fn find_all(&self) -> Result<Vec<Muestra>, sqlx::Error> {
        let rows = sqlx::query_as::<_, MuestraRow>(
            &select_from_with("muestras", MUESTRA_COLUMNS, "ORDER BY perforacion_id, profundidad_inicio"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Muestra::from).collect())
    }

    /// Busca una muestra por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Muestra>, sqlx::Error> {
        let row = sqlx::query_as::<_, MuestraRow>(
            &select_where("muestras", MUESTRA_COLUMNS, "id = $1"),
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Muestra::from))
    }

    /// Busca una muestra por código
    pub async fn find_by_codigo(&self, codigo: &str) -> Result<Option<Muestra>, sqlx::Error> {
        let row = sqlx::query_as::<_, MuestraRow>(
            &select_where("muestras", MUESTRA_COLUMNS, "codigo = $1"),
        )
        .bind(codigo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Muestra::from))
    }

    /// Obtiene muestras por perforación
    pub async fn find_by_perforacion(&self, perforacion_id: &str) -> Result<Vec<Muestra>, sqlx::Error> {
        let rows = sqlx::query_as::<_, MuestraRow>(
            &select_where_with("muestras", MUESTRA_COLUMNS, "perforacion_id = $1", "ORDER BY profundidad_inicio"),
        )
        .bind(perforacion_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Muestra::from).collect())
    }

    /// Cuenta muestras por perforación (para generar código)
    pub async fn count_by_perforacion(&self, perforacion_id: &str) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM muestras WHERE perforacion_id = $1"
        )
        .bind(perforacion_id)
        .fetch_one(&self.pool)
        .await?;
        Ok(row.0)
    }

    /// Genera el próximo código de muestra para una perforación
    async fn generate_codigo(&self, perforacion_id: &str) -> Result<String, sqlx::Error> {
        let count = self.count_by_perforacion(perforacion_id).await?;
        Ok(format!("M-{:03}", count + 1))
    }

    /// Crea una nueva muestra
    pub async fn create(&self, dto: CreateMuestra) -> Result<Muestra, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let codigo = self.generate_codigo(&dto.perforacion_id).await?;
        
        let profundidad_inicio = Decimal::try_from(dto.profundidad_inicio)
            .map_err(|_| sqlx::Error::Protocol("Invalid profundidad_inicio".into()))?;
        let profundidad_fin = Decimal::try_from(dto.profundidad_fin)
            .map_err(|_| sqlx::Error::Protocol("Invalid profundidad_fin".into()))?;

        let row = sqlx::query_as::<_, MuestraRow>(&format!(
            r#"
            INSERT INTO muestras (id, codigo, perforacion_id, profundidad_inicio, profundidad_fin,
                                  tipo_muestra, descripcion, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'db')
            RETURNING {}
            "#,
            MUESTRA_COLUMNS
        ))
        .bind(&id)
        .bind(&codigo)
        .bind(&dto.perforacion_id)
        .bind(profundidad_inicio)
        .bind(profundidad_fin)
        .bind(&dto.tipo_muestra)
        .bind(&dto.descripcion)
        .fetch_one(&self.pool)
        .await?;

        Ok(Muestra::from(row))
    }

    /// Actualiza una muestra existente
    pub async fn update(&self, id: &str, dto: UpdateMuestra) -> Result<Option<Muestra>, sqlx::Error> {
        let profundidad_inicio = dto.profundidad_inicio
            .and_then(|p| Decimal::try_from(p).ok());
        let profundidad_fin = dto.profundidad_fin
            .and_then(|p| Decimal::try_from(p).ok());

        let row = sqlx::query_as::<_, MuestraRow>(&format!(
            r#"
            UPDATE muestras
            SET profundidad_inicio = COALESCE($2, profundidad_inicio),
                profundidad_fin = COALESCE($3, profundidad_fin),
                tipo_muestra = COALESCE($4, tipo_muestra),
                descripcion = COALESCE($5, descripcion),
                sync_source = 'db'
            WHERE id = $1
            RETURNING {}
            "#,
            MUESTRA_COLUMNS
        ))
        .bind(id)
        .bind(profundidad_inicio)
        .bind(profundidad_fin)
        .bind(&dto.tipo_muestra)
        .bind(&dto.descripcion)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Muestra::from))
    }

    /// Elimina una muestra (verifica que no tenga ensayos asociados)
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        // Verificar que no haya ensayos asociados
        let ensayo_count: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM ensayos WHERE muestra_id = $1"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        if ensayo_count.0 > 0 {
            return Err(sqlx::Error::Protocol(
                format!("Cannot delete muestra with {} associated ensayos", ensayo_count.0)
            ));
        }

        let result = sqlx::query("DELETE FROM muestras WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Upsert para sincronización desde Sheets
    pub async fn upsert_from_sheets(&self, muestra: &Muestra) -> Result<(), sqlx::Error> {
        let profundidad_inicio = Decimal::try_from(muestra.profundidad_inicio)
            .map_err(|_| sqlx::Error::Protocol("Invalid profundidad_inicio".into()))?;
        let profundidad_fin = Decimal::try_from(muestra.profundidad_fin)
            .map_err(|_| sqlx::Error::Protocol("Invalid profundidad_fin".into()))?;

        sqlx::query(
            r#"
            INSERT INTO muestras (id, codigo, perforacion_id, profundidad_inicio, profundidad_fin,
                                  tipo_muestra, descripcion, synced_at, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'sheets')
            ON CONFLICT (id) DO UPDATE SET
                codigo = EXCLUDED.codigo,
                perforacion_id = EXCLUDED.perforacion_id,
                profundidad_inicio = EXCLUDED.profundidad_inicio,
                profundidad_fin = EXCLUDED.profundidad_fin,
                tipo_muestra = EXCLUDED.tipo_muestra,
                descripcion = EXCLUDED.descripcion,
                synced_at = NOW(),
                sync_source = 'sheets'
            "#,
        )
        .bind(&muestra.id)
        .bind(&muestra.codigo)
        .bind(&muestra.perforacion_id)
        .bind(profundidad_inicio)
        .bind(profundidad_fin)
        .bind(&muestra.tipo_muestra)
        .bind(&muestra.descripcion)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Obtiene muestras modificadas desde una fecha
    pub async fn find_modified_since(&self, since: DateTime<Utc>) -> Result<Vec<Muestra>, sqlx::Error> {
        let rows = sqlx::query_as::<_, MuestraRow>(
            &select_where_with("muestras", MUESTRA_COLUMNS, "updated_at > $1 AND sync_source = 'db'", "ORDER BY updated_at"),
        )
        .bind(since)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Muestra::from).collect())
    }

    /// Cuenta total de muestras
    pub async fn count(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM muestras")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }
}
