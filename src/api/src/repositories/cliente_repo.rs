use sqlx::{FromRow, Row};
use chrono::{DateTime, Utc};

use crate::db::DbPool;
use crate::models::{Cliente, CreateCliente, UpdateCliente};

/// Modelo de base de datos para Cliente
#[derive(Debug, Clone, FromRow)]
pub struct ClienteRow {
    pub id: String,
    pub codigo: String,
    pub nombre: String,
    pub rut: Option<String>,
    pub direccion: Option<String>,
    pub ciudad: Option<String>,
    pub telefono: Option<String>,
    pub email: Option<String>,
    pub contacto_nombre: Option<String>,
    pub contacto_cargo: Option<String>,
    pub contacto_email: Option<String>,
    pub contacto_telefono: Option<String>,
    pub activo: bool,
    pub drive_folder_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub sync_source: Option<String>,
}

impl From<ClienteRow> for Cliente {
    fn from(row: ClienteRow) -> Self {
        Cliente {
            id: row.id,
            codigo: row.codigo,
            nombre: row.nombre,
            rut: row.rut,
            direccion: row.direccion,
            ciudad: row.ciudad,
            telefono: row.telefono,
            email: row.email,
            contacto_nombre: row.contacto_nombre,
            contacto_cargo: row.contacto_cargo,
            contacto_email: row.contacto_email,
            contacto_telefono: row.contacto_telefono,
            activo: row.activo,
            drive_folder_id: row.drive_folder_id,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Clone)]
pub struct ClienteRepository {
    pool: DbPool,
}

impl ClienteRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todos los clientes
    pub async fn find_all(&self) -> Result<Vec<Cliente>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ClienteRow>(
            r#"
            SELECT id, codigo, nombre, rut, direccion, ciudad, telefono, email,
                   contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
                   activo, drive_folder_id, created_at, updated_at, synced_at, sync_source
            FROM clientes
            ORDER BY nombre
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Cliente::from).collect())
    }

    /// Obtiene clientes activos
    pub async fn find_active(&self) -> Result<Vec<Cliente>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ClienteRow>(
            r#"
            SELECT id, codigo, nombre, rut, direccion, ciudad, telefono, email,
                   contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
                   activo, drive_folder_id, created_at, updated_at, synced_at, sync_source
            FROM clientes
            WHERE activo = true
            ORDER BY nombre
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Cliente::from).collect())
    }

    /// Busca un cliente por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Cliente>, sqlx::Error> {
        let row = sqlx::query_as::<_, ClienteRow>(
            r#"
            SELECT id, codigo, nombre, rut, direccion, ciudad, telefono, email,
                   contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
                   activo, drive_folder_id, created_at, updated_at, synced_at, sync_source
            FROM clientes
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Cliente::from))
    }

    /// Busca un cliente por código
    pub async fn find_by_codigo(&self, codigo: &str) -> Result<Option<Cliente>, sqlx::Error> {
        let row = sqlx::query_as::<_, ClienteRow>(
            r#"
            SELECT id, codigo, nombre, rut, direccion, ciudad, telefono, email,
                   contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
                   activo, drive_folder_id, created_at, updated_at, synced_at, sync_source
            FROM clientes
            WHERE codigo = $1
            "#,
        )
        .bind(codigo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Cliente::from))
    }

    /// Crea un nuevo cliente
    pub async fn create(&self, id: &str, codigo: &str, dto: CreateCliente) -> Result<Cliente, sqlx::Error> {
        let row = sqlx::query_as::<_, ClienteRow>(
            r#"
            INSERT INTO clientes (id, codigo, nombre, rut, direccion, ciudad, telefono, email, contacto_nombre, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'db')
            RETURNING id, codigo, nombre, rut, direccion, ciudad, telefono, email,
                      contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
                      activo, drive_folder_id, created_at, updated_at, synced_at, sync_source
            "#,
        )
        .bind(id)
        .bind(codigo)
        .bind(&dto.nombre)
        .bind(&dto.rut)
        .bind(&dto.direccion)
        .bind(&dto.ciudad)
        .bind(&dto.telefono)
        .bind(&dto.email)
        .bind(&dto.contacto_nombre)
        .fetch_one(&self.pool)
        .await?;

        Ok(Cliente::from(row))
    }

    /// Actualiza un cliente existente
    pub async fn update(&self, id: &str, dto: UpdateCliente) -> Result<Option<Cliente>, sqlx::Error> {
        let row = sqlx::query_as::<_, ClienteRow>(
            r#"
            UPDATE clientes
            SET nombre = COALESCE($2, nombre),
                rut = COALESCE($3, rut),
                direccion = COALESCE($4, direccion),
                ciudad = COALESCE($5, ciudad),
                telefono = COALESCE($6, telefono),
                email = COALESCE($7, email),
                contacto_nombre = COALESCE($8, contacto_nombre),
                contacto_cargo = COALESCE($9, contacto_cargo),
                contacto_email = COALESCE($10, contacto_email),
                contacto_telefono = COALESCE($11, contacto_telefono),
                activo = COALESCE($12, activo),
                sync_source = 'db'
            WHERE id = $1
            RETURNING id, codigo, nombre, rut, direccion, ciudad, telefono, email,
                      contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
                      activo, drive_folder_id, created_at, updated_at, synced_at, sync_source
            "#,
        )
        .bind(id)
        .bind(&dto.nombre)
        .bind(&dto.rut)
        .bind(&dto.direccion)
        .bind(&dto.ciudad)
        .bind(&dto.telefono)
        .bind(&dto.email)
        .bind(&dto.contacto_nombre)
        .bind(&dto.contacto_cargo)
        .bind(&dto.contacto_email)
        .bind(&dto.contacto_telefono)
        .bind(&dto.activo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Cliente::from))
    }

    /// Elimina un cliente (soft delete)
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE clientes SET activo = false WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Upsert para sincronización desde Sheets
    pub async fn upsert_from_sheets(&self, cliente: &Cliente) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO clientes (id, codigo, nombre, rut, direccion, ciudad, telefono, email,
                                  contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
                                  activo, drive_folder_id, created_at, updated_at, synced_at, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                    COALESCE($15::timestamptz, NOW()), 
                    COALESCE($16::timestamptz, NOW()), 
                    NOW(), 'sheets')
            ON CONFLICT (id) DO UPDATE SET
                codigo = EXCLUDED.codigo,
                nombre = EXCLUDED.nombre,
                rut = EXCLUDED.rut,
                direccion = EXCLUDED.direccion,
                ciudad = EXCLUDED.ciudad,
                telefono = EXCLUDED.telefono,
                email = EXCLUDED.email,
                contacto_nombre = EXCLUDED.contacto_nombre,
                contacto_cargo = EXCLUDED.contacto_cargo,
                contacto_email = EXCLUDED.contacto_email,
                contacto_telefono = EXCLUDED.contacto_telefono,
                activo = EXCLUDED.activo,
                drive_folder_id = EXCLUDED.drive_folder_id,
                synced_at = NOW(),
                sync_source = 'sheets'
            "#,
        )
        .bind(&cliente.id)
        .bind(&cliente.codigo)
        .bind(&cliente.nombre)
        .bind(&cliente.rut)
        .bind(&cliente.direccion)
        .bind(&cliente.ciudad)
        .bind(&cliente.telefono)
        .bind(&cliente.email)
        .bind(&cliente.contacto_nombre)
        .bind(&cliente.contacto_cargo)
        .bind(&cliente.contacto_email)
        .bind(&cliente.contacto_telefono)
        .bind(&cliente.activo)
        .bind(&cliente.drive_folder_id)
        .bind(&cliente.created_at)
        .bind(&cliente.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Obtiene clientes modificados desde la última sincronización
    pub async fn find_modified_since(&self, since: DateTime<Utc>) -> Result<Vec<Cliente>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ClienteRow>(
            r#"
            SELECT id, codigo, nombre, rut, direccion, ciudad, telefono, email,
                   contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
                   activo, drive_folder_id, created_at, updated_at, synced_at, sync_source
            FROM clientes
            WHERE updated_at > $1 AND sync_source = 'db'
            ORDER BY updated_at
            "#,
        )
        .bind(since)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Cliente::from).collect())
    }

    /// Cuenta total de clientes
    pub async fn count(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM clientes")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Cuenta clientes activos
    pub async fn count_active(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM clientes WHERE activo = true")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }
}
