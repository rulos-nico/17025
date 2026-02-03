use sqlx::FromRow;
use chrono::{DateTime, Utc, NaiveDate};

use crate::db::DbPool;
use crate::models::{Proyecto, CreateProyecto, UpdateProyecto};

/// Modelo de base de datos para Proyecto
#[derive(Debug, Clone, FromRow)]
pub struct ProyectoRow {
    pub id: String,
    pub codigo: String,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub fecha_inicio: NaiveDate,
    pub fecha_fin_estimada: Option<NaiveDate>,
    pub cliente_id: String,
    pub cliente_nombre: String,
    pub contacto: Option<String>,
    pub estado: String,
    pub fecha_fin_real: Option<NaiveDate>,
    pub drive_folder_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub synced_at: Option<DateTime<Utc>>,
    pub sync_source: Option<String>,
}

impl From<ProyectoRow> for Proyecto {
    fn from(row: ProyectoRow) -> Self {
        Proyecto {
            id: row.id,
            codigo: row.codigo,
            nombre: row.nombre,
            descripcion: row.descripcion.unwrap_or_default(),
            fecha_inicio: row.fecha_inicio.to_string(),
            fecha_fin_estimada: row.fecha_fin_estimada.map(|d| d.to_string()),
            cliente_id: row.cliente_id,
            cliente_nombre: row.cliente_nombre,
            contacto: row.contacto,
            estado: row.estado,
            fecha_fin_real: row.fecha_fin_real.map(|d| d.to_string()),
            drive_folder_id: row.drive_folder_id,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
            created_by: row.created_by,
        }
    }
}

#[derive(Clone)]
pub struct ProyectoRepository {
    pool: DbPool,
}

impl ProyectoRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todos los proyectos
    pub async fn find_all(&self) -> Result<Vec<Proyecto>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ProyectoRow>(
            r#"
            SELECT id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada,
                   cliente_id, cliente_nombre, contacto, estado, fecha_fin_real,
                   drive_folder_id, created_at, updated_at, created_by, synced_at, sync_source
            FROM proyectos
            ORDER BY fecha_inicio DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Proyecto::from).collect())
    }

    /// Obtiene proyectos por estado
    pub async fn find_by_estado(&self, estado: &str) -> Result<Vec<Proyecto>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ProyectoRow>(
            r#"
            SELECT id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada,
                   cliente_id, cliente_nombre, contacto, estado, fecha_fin_real,
                   drive_folder_id, created_at, updated_at, created_by, synced_at, sync_source
            FROM proyectos
            WHERE estado = $1
            ORDER BY fecha_inicio DESC
            "#,
        )
        .bind(estado)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Proyecto::from).collect())
    }

    /// Obtiene proyectos de un cliente
    pub async fn find_by_cliente(&self, cliente_id: &str) -> Result<Vec<Proyecto>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ProyectoRow>(
            r#"
            SELECT id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada,
                   cliente_id, cliente_nombre, contacto, estado, fecha_fin_real,
                   drive_folder_id, created_at, updated_at, created_by, synced_at, sync_source
            FROM proyectos
            WHERE cliente_id = $1
            ORDER BY fecha_inicio DESC
            "#,
        )
        .bind(cliente_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Proyecto::from).collect())
    }

    /// Busca un proyecto por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Proyecto>, sqlx::Error> {
        let row = sqlx::query_as::<_, ProyectoRow>(
            r#"
            SELECT id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada,
                   cliente_id, cliente_nombre, contacto, estado, fecha_fin_real,
                   drive_folder_id, created_at, updated_at, created_by, synced_at, sync_source
            FROM proyectos
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Proyecto::from))
    }

    /// Busca un proyecto por código
    pub async fn find_by_codigo(&self, codigo: &str) -> Result<Option<Proyecto>, sqlx::Error> {
        let row = sqlx::query_as::<_, ProyectoRow>(
            r#"
            SELECT id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada,
                   cliente_id, cliente_nombre, contacto, estado, fecha_fin_real,
                   drive_folder_id, created_at, updated_at, created_by, synced_at, sync_source
            FROM proyectos
            WHERE codigo = $1
            "#,
        )
        .bind(codigo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Proyecto::from))
    }

    /// Crea un nuevo proyecto
    pub async fn create(&self, id: &str, codigo: &str, dto: CreateProyecto) -> Result<Proyecto, sqlx::Error> {
        let fecha_inicio = NaiveDate::parse_from_str(&dto.fecha_inicio, "%Y-%m-%d")
            .unwrap_or_else(|_| Utc::now().date_naive());
        
        let fecha_fin_estimada = dto.fecha_fin_estimada
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        let row = sqlx::query_as::<_, ProyectoRow>(
            r#"
            INSERT INTO proyectos (id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada,
                                   cliente_id, cliente_nombre, contacto, estado, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'activo', 'db')
            RETURNING id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada,
                      cliente_id, cliente_nombre, contacto, estado, fecha_fin_real,
                      drive_folder_id, created_at, updated_at, created_by, synced_at, sync_source
            "#,
        )
        .bind(id)
        .bind(codigo)
        .bind(&dto.nombre)
        .bind(&dto.descripcion)
        .bind(fecha_inicio)
        .bind(fecha_fin_estimada)
        .bind(&dto.cliente_id)
        .bind(&dto.cliente_nombre)
        .bind(&dto.contacto)
        .fetch_one(&self.pool)
        .await?;

        Ok(Proyecto::from(row))
    }

    /// Actualiza un proyecto existente
    pub async fn update(&self, id: &str, dto: UpdateProyecto) -> Result<Option<Proyecto>, sqlx::Error> {
        let fecha_fin_estimada = dto.fecha_fin_estimada
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        
        let fecha_fin_real = dto.fecha_fin_real
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        let row = sqlx::query_as::<_, ProyectoRow>(
            r#"
            UPDATE proyectos
            SET nombre = COALESCE($2, nombre),
                descripcion = COALESCE($3, descripcion),
                fecha_fin_estimada = COALESCE($4, fecha_fin_estimada),
                contacto = COALESCE($5, contacto),
                estado = COALESCE($6, estado),
                fecha_fin_real = COALESCE($7, fecha_fin_real),
                sync_source = 'db'
            WHERE id = $1
            RETURNING id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada,
                      cliente_id, cliente_nombre, contacto, estado, fecha_fin_real,
                      drive_folder_id, created_at, updated_at, created_by, synced_at, sync_source
            "#,
        )
        .bind(id)
        .bind(&dto.nombre)
        .bind(&dto.descripcion)
        .bind(fecha_fin_estimada)
        .bind(&dto.contacto)
        .bind(&dto.estado)
        .bind(fecha_fin_real)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Proyecto::from))
    }

    /// Upsert para sincronización desde Sheets
    pub async fn upsert_from_sheets(&self, proyecto: &Proyecto) -> Result<(), sqlx::Error> {
        let fecha_inicio = NaiveDate::parse_from_str(&proyecto.fecha_inicio, "%Y-%m-%d")
            .unwrap_or_else(|_| Utc::now().date_naive());
        
        let fecha_fin_estimada = proyecto.fecha_fin_estimada
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        
        let fecha_fin_real = proyecto.fecha_fin_real
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        sqlx::query(
            r#"
            INSERT INTO proyectos (id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada,
                                   cliente_id, cliente_nombre, contacto, estado, fecha_fin_real,
                                   drive_folder_id, created_by, synced_at, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), 'sheets')
            ON CONFLICT (id) DO UPDATE SET
                codigo = EXCLUDED.codigo,
                nombre = EXCLUDED.nombre,
                descripcion = EXCLUDED.descripcion,
                fecha_inicio = EXCLUDED.fecha_inicio,
                fecha_fin_estimada = EXCLUDED.fecha_fin_estimada,
                cliente_id = EXCLUDED.cliente_id,
                cliente_nombre = EXCLUDED.cliente_nombre,
                contacto = EXCLUDED.contacto,
                estado = EXCLUDED.estado,
                fecha_fin_real = EXCLUDED.fecha_fin_real,
                drive_folder_id = EXCLUDED.drive_folder_id,
                synced_at = NOW(),
                sync_source = 'sheets'
            "#,
        )
        .bind(&proyecto.id)
        .bind(&proyecto.codigo)
        .bind(&proyecto.nombre)
        .bind(&proyecto.descripcion)
        .bind(fecha_inicio)
        .bind(fecha_fin_estimada)
        .bind(&proyecto.cliente_id)
        .bind(&proyecto.cliente_nombre)
        .bind(&proyecto.contacto)
        .bind(&proyecto.estado)
        .bind(fecha_fin_real)
        .bind(&proyecto.drive_folder_id)
        .bind(&proyecto.created_by)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Obtiene proyectos modificados desde la última sincronización
    pub async fn find_modified_since(&self, since: DateTime<Utc>) -> Result<Vec<Proyecto>, sqlx::Error> {
        let rows = sqlx::query_as::<_, ProyectoRow>(
            r#"
            SELECT id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada,
                   cliente_id, cliente_nombre, contacto, estado, fecha_fin_real,
                   drive_folder_id, created_at, updated_at, created_by, synced_at, sync_source
            FROM proyectos
            WHERE updated_at > $1 AND sync_source = 'db'
            ORDER BY updated_at
            "#,
        )
        .bind(since)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Proyecto::from).collect())
    }

    /// Estadísticas de proyectos por estado
    pub async fn count_by_estado(&self) -> Result<Vec<(String, i64)>, sqlx::Error> {
        let rows: Vec<(String, i64)> = sqlx::query_as(
            "SELECT estado, COUNT(*) as count FROM proyectos GROUP BY estado"
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    /// Cuenta total de proyectos
    pub async fn count(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM proyectos")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Cuenta proyectos activos
    pub async fn count_active(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM proyectos WHERE estado = 'activo'")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Elimina un proyecto (soft delete: estado = 'eliminado')
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE proyectos
            SET estado = 'eliminado', 
                updated_at = NOW(),
                sync_source = 'db'
            WHERE id = $1 AND estado != 'eliminado'
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
