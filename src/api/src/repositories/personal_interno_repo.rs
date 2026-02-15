use sqlx::FromRow;
use chrono::{DateTime, Utc};

use crate::db::DbPool;
use crate::models::{PersonalInterno, CreatePersonalInterno, UpdatePersonalInterno};
use crate::utils::sql::{PERSONAL_INTERNO_COLUMNS, select_from_with, select_where, select_where_with};

/// Modelo de base de datos para PersonalInterno
#[derive(Debug, Clone, FromRow)]
pub struct PersonalInternoRow {
    pub id: String,
    pub codigo: String,
    pub nombre: String,
    pub apellido: String,
    pub cargo: String,
    pub email: String,
    pub telefono: Option<String>,
    pub activo: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub sync_source: Option<String>,
}

impl From<PersonalInternoRow> for PersonalInterno {
    fn from(row: PersonalInternoRow) -> Self {
        PersonalInterno {
            id: row.id,
            codigo: row.codigo,
            nombre: row.nombre,
            apellido: row.apellido,
            cargo: row.cargo,
            email: row.email,
            telefono: row.telefono,
            activo: row.activo,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Clone)]
pub struct PersonalInternoRepository {
    pool: DbPool,
}

impl PersonalInternoRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todo el personal interno
    pub async fn find_all(&self) -> Result<Vec<PersonalInterno>, sqlx::Error> {
        let rows = sqlx::query_as::<_, PersonalInternoRow>(
            &select_from_with("personal_interno", PERSONAL_INTERNO_COLUMNS, "ORDER BY apellido, nombre"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(PersonalInterno::from).collect())
    }

    /// Obtiene personal interno activo
    pub async fn find_active(&self) -> Result<Vec<PersonalInterno>, sqlx::Error> {
        let rows = sqlx::query_as::<_, PersonalInternoRow>(
            &select_where_with("personal_interno", PERSONAL_INTERNO_COLUMNS, "activo = true", "ORDER BY apellido, nombre"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(PersonalInterno::from).collect())
    }

    /// Busca personal interno por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<PersonalInterno>, sqlx::Error> {
        let row = sqlx::query_as::<_, PersonalInternoRow>(
            &select_where("personal_interno", PERSONAL_INTERNO_COLUMNS, "id = $1"),
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(PersonalInterno::from))
    }

    /// Busca personal interno por código
    pub async fn find_by_codigo(&self, codigo: &str) -> Result<Option<PersonalInterno>, sqlx::Error> {
        let row = sqlx::query_as::<_, PersonalInternoRow>(
            &select_where("personal_interno", PERSONAL_INTERNO_COLUMNS, "codigo = $1"),
        )
        .bind(codigo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(PersonalInterno::from))
    }

    /// Busca personal interno por cargo
    pub async fn find_by_cargo(&self, cargo: &str) -> Result<Vec<PersonalInterno>, sqlx::Error> {
        let rows = sqlx::query_as::<_, PersonalInternoRow>(
            &select_where_with("personal_interno", PERSONAL_INTERNO_COLUMNS, "cargo = $1 AND activo = true", "ORDER BY apellido, nombre"),
        )
        .bind(cargo)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(PersonalInterno::from).collect())
    }

    /// Crea un nuevo personal interno
    pub async fn create(&self, id: &str, codigo: &str, dto: CreatePersonalInterno) -> Result<PersonalInterno, sqlx::Error> {
        let row = sqlx::query_as::<_, PersonalInternoRow>(&format!(
            r#"
            INSERT INTO personal_interno (id, codigo, nombre, apellido, cargo, email, telefono, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'db')
            RETURNING {}
            "#,
            PERSONAL_INTERNO_COLUMNS
        ))
        .bind(id)
        .bind(codigo)
        .bind(&dto.nombre)
        .bind(&dto.apellido)
        .bind(&dto.cargo)
        .bind(&dto.email)
        .bind(&dto.telefono)
        .fetch_one(&self.pool)
        .await?;

        Ok(PersonalInterno::from(row))
    }

    /// Actualiza un personal interno existente
    pub async fn update(&self, id: &str, dto: UpdatePersonalInterno) -> Result<Option<PersonalInterno>, sqlx::Error> {
        let row = sqlx::query_as::<_, PersonalInternoRow>(&format!(
            r#"
            UPDATE personal_interno
            SET nombre = COALESCE($2, nombre),
                apellido = COALESCE($3, apellido),
                cargo = COALESCE($4, cargo),
                email = COALESCE($5, email),
                telefono = COALESCE($6, telefono),
                activo = COALESCE($7, activo),
                updated_at = NOW(),
                sync_source = 'db'
            WHERE id = $1
            RETURNING {}
            "#,
            PERSONAL_INTERNO_COLUMNS
        ))
        .bind(id)
        .bind(&dto.nombre)
        .bind(&dto.apellido)
        .bind(&dto.cargo)
        .bind(&dto.email)
        .bind(&dto.telefono)
        .bind(&dto.activo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(PersonalInterno::from))
    }

    /// Elimina un personal interno (soft delete)
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE personal_interno SET activo = false, updated_at = NOW() WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Upsert para sincronización desde Sheets
    pub async fn upsert_from_sheets(&self, personal: &PersonalInterno) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO personal_interno (id, codigo, nombre, apellido, cargo, email, telefono,
                                          activo, created_at, updated_at, synced_at, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 
                    COALESCE($9::timestamptz, NOW()), 
                    COALESCE($10::timestamptz, NOW()), 
                    NOW(), 'sheets')
            ON CONFLICT (id) DO UPDATE SET
                codigo = EXCLUDED.codigo,
                nombre = EXCLUDED.nombre,
                apellido = EXCLUDED.apellido,
                cargo = EXCLUDED.cargo,
                email = EXCLUDED.email,
                telefono = EXCLUDED.telefono,
                activo = EXCLUDED.activo,
                synced_at = NOW(),
                sync_source = 'sheets'
            "#,
        )
        .bind(&personal.id)
        .bind(&personal.codigo)
        .bind(&personal.nombre)
        .bind(&personal.apellido)
        .bind(&personal.cargo)
        .bind(&personal.email)
        .bind(&personal.telefono)
        .bind(&personal.activo)
        .bind(&personal.created_at)
        .bind(&personal.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Obtiene personal modificado desde la última sincronización
    pub async fn find_modified_since(&self, since: DateTime<Utc>) -> Result<Vec<PersonalInterno>, sqlx::Error> {
        let rows = sqlx::query_as::<_, PersonalInternoRow>(
            &select_where_with("personal_interno", PERSONAL_INTERNO_COLUMNS, "updated_at > $1 AND sync_source = 'db'", "ORDER BY updated_at"),
        )
        .bind(since)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(PersonalInterno::from).collect())
    }

    /// Cuenta total de personal interno
    pub async fn count(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM personal_interno")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Cuenta personal interno activo
    pub async fn count_active(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM personal_interno WHERE activo = true")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }
}
