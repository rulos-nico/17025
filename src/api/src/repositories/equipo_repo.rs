use sqlx::FromRow;
use chrono::{DateTime, Utc, NaiveDate};

use crate::db::DbPool;
use crate::models::{Equipo, CreateEquipo, UpdateEquipo};

/// Modelo de base de datos para Equipo
#[derive(Debug, Clone, FromRow)]
pub struct EquipoRow {
    pub id: String,
    pub codigo: String,
    pub nombre: String,
    pub serie: String,
    pub placa: Option<String>,
    pub descripcion: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub ubicacion: Option<String>,
    pub estado: String,
    pub fecha_calibracion: Option<NaiveDate>,
    pub proxima_calibracion: Option<NaiveDate>,
    pub incertidumbre: Option<rust_decimal::Decimal>,
    pub error_maximo: Option<rust_decimal::Decimal>,
    pub certificado_id: Option<String>,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub activo: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub sync_source: Option<String>,
}

impl From<EquipoRow> for Equipo {
    fn from(row: EquipoRow) -> Self {
        Equipo {
            id: row.id,
            codigo: row.codigo,
            nombre: row.nombre,
            serie: row.serie,
            placa: row.placa,
            descripcion: row.descripcion,
            marca: row.marca,
            modelo: row.modelo,
            ubicacion: row.ubicacion,
            estado: row.estado,
            fecha_calibracion: row.fecha_calibracion.map(|d| d.to_string()),
            proxima_calibracion: row.proxima_calibracion.map(|d| d.to_string()),
            incertidumbre: row.incertidumbre.map(|d| d.to_string().parse().unwrap_or(0.0)),
            error_maximo: row.error_maximo.map(|d| d.to_string().parse().unwrap_or(0.0)),
            certificado_id: row.certificado_id,
            responsable: row.responsable,
            observaciones: row.observaciones,
            activo: row.activo,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Clone)]
pub struct EquipoRepository {
    pool: DbPool,
}

impl EquipoRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todos los equipos
    pub async fn find_all(&self) -> Result<Vec<Equipo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EquipoRow>(
            r#"
            SELECT id, codigo, nombre, serie, placa, descripcion, marca, modelo,
                   ubicacion, estado, fecha_calibracion, proxima_calibracion,
                   incertidumbre, error_maximo, certificado_id, responsable,
                   observaciones, activo, created_at, updated_at, synced_at, sync_source
            FROM equipos
            ORDER BY nombre
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Equipo::from).collect())
    }

    /// Obtiene equipos activos
    pub async fn find_active(&self) -> Result<Vec<Equipo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EquipoRow>(
            r#"
            SELECT id, codigo, nombre, serie, placa, descripcion, marca, modelo,
                   ubicacion, estado, fecha_calibracion, proxima_calibracion,
                   incertidumbre, error_maximo, certificado_id, responsable,
                   observaciones, activo, created_at, updated_at, synced_at, sync_source
            FROM equipos
            WHERE activo = true
            ORDER BY nombre
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Equipo::from).collect())
    }

    /// Obtiene equipos disponibles para uso
    pub async fn find_available(&self) -> Result<Vec<Equipo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EquipoRow>(
            r#"
            SELECT id, codigo, nombre, serie, placa, descripcion, marca, modelo,
                   ubicacion, estado, fecha_calibracion, proxima_calibracion,
                   incertidumbre, error_maximo, certificado_id, responsable,
                   observaciones, activo, created_at, updated_at, synced_at, sync_source
            FROM equipos
            WHERE activo = true AND estado = 'disponible'
            ORDER BY nombre
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Equipo::from).collect())
    }

    /// Obtiene equipos con calibración próxima a vencer (en los próximos N días)
    pub async fn find_calibration_due(&self, days: i32) -> Result<Vec<Equipo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EquipoRow>(
            r#"
            SELECT id, codigo, nombre, serie, placa, descripcion, marca, modelo,
                   ubicacion, estado, fecha_calibracion, proxima_calibracion,
                   incertidumbre, error_maximo, certificado_id, responsable,
                   observaciones, activo, created_at, updated_at, synced_at, sync_source
            FROM equipos
            WHERE activo = true 
              AND proxima_calibracion IS NOT NULL
              AND proxima_calibracion <= CURRENT_DATE + $1::integer
            ORDER BY proxima_calibracion ASC
            "#,
        )
        .bind(days)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Equipo::from).collect())
    }

    /// Busca un equipo por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Equipo>, sqlx::Error> {
        let row = sqlx::query_as::<_, EquipoRow>(
            r#"
            SELECT id, codigo, nombre, serie, placa, descripcion, marca, modelo,
                   ubicacion, estado, fecha_calibracion, proxima_calibracion,
                   incertidumbre, error_maximo, certificado_id, responsable,
                   observaciones, activo, created_at, updated_at, synced_at, sync_source
            FROM equipos
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Equipo::from))
    }

    /// Busca un equipo por código
    pub async fn find_by_codigo(&self, codigo: &str) -> Result<Option<Equipo>, sqlx::Error> {
        let row = sqlx::query_as::<_, EquipoRow>(
            r#"
            SELECT id, codigo, nombre, serie, placa, descripcion, marca, modelo,
                   ubicacion, estado, fecha_calibracion, proxima_calibracion,
                   incertidumbre, error_maximo, certificado_id, responsable,
                   observaciones, activo, created_at, updated_at, synced_at, sync_source
            FROM equipos
            WHERE codigo = $1
            "#,
        )
        .bind(codigo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Equipo::from))
    }

    /// Crea un nuevo equipo
    pub async fn create(&self, id: &str, codigo: &str, dto: CreateEquipo) -> Result<Equipo, sqlx::Error> {
        let row = sqlx::query_as::<_, EquipoRow>(
            r#"
            INSERT INTO equipos (id, codigo, nombre, serie, placa, descripcion, marca, modelo, ubicacion, estado, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'disponible', 'db')
            RETURNING id, codigo, nombre, serie, placa, descripcion, marca, modelo,
                      ubicacion, estado, fecha_calibracion, proxima_calibracion,
                      incertidumbre, error_maximo, certificado_id, responsable,
                      observaciones, activo, created_at, updated_at, synced_at, sync_source
            "#,
        )
        .bind(id)
        .bind(codigo)
        .bind(&dto.nombre)
        .bind(&dto.serie)
        .bind(&dto.placa)
        .bind(&dto.descripcion)
        .bind(&dto.marca)
        .bind(&dto.modelo)
        .bind(&dto.ubicacion)
        .fetch_one(&self.pool)
        .await?;

        Ok(Equipo::from(row))
    }

    /// Actualiza un equipo existente
    pub async fn update(&self, id: &str, dto: UpdateEquipo) -> Result<Option<Equipo>, sqlx::Error> {
        let fecha_calibracion = dto.fecha_calibracion
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        
        let proxima_calibracion = dto.proxima_calibracion
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        let row = sqlx::query_as::<_, EquipoRow>(
            r#"
            UPDATE equipos
            SET nombre = COALESCE($2, nombre),
                descripcion = COALESCE($3, descripcion),
                ubicacion = COALESCE($4, ubicacion),
                estado = COALESCE($5, estado),
                fecha_calibracion = COALESCE($6, fecha_calibracion),
                proxima_calibracion = COALESCE($7, proxima_calibracion),
                incertidumbre = COALESCE($8, incertidumbre),
                error_maximo = COALESCE($9, error_maximo),
                certificado_id = COALESCE($10, certificado_id),
                responsable = COALESCE($11, responsable),
                observaciones = COALESCE($12, observaciones),
                activo = COALESCE($13, activo),
                sync_source = 'db'
            WHERE id = $1
            RETURNING id, codigo, nombre, serie, placa, descripcion, marca, modelo,
                      ubicacion, estado, fecha_calibracion, proxima_calibracion,
                      incertidumbre, error_maximo, certificado_id, responsable,
                      observaciones, activo, created_at, updated_at, synced_at, sync_source
            "#,
        )
        .bind(id)
        .bind(&dto.nombre)
        .bind(&dto.descripcion)
        .bind(&dto.ubicacion)
        .bind(&dto.estado)
        .bind(fecha_calibracion)
        .bind(proxima_calibracion)
        .bind(dto.incertidumbre.map(rust_decimal::Decimal::from_f64_retain).flatten())
        .bind(dto.error_maximo.map(rust_decimal::Decimal::from_f64_retain).flatten())
        .bind(&dto.certificado_id)
        .bind(&dto.responsable)
        .bind(&dto.observaciones)
        .bind(&dto.activo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Equipo::from))
    }

    /// Upsert para sincronización desde Sheets
    pub async fn upsert_from_sheets(&self, equipo: &Equipo) -> Result<(), sqlx::Error> {
        let fecha_calibracion = equipo.fecha_calibracion
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        
        let proxima_calibracion = equipo.proxima_calibracion
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        sqlx::query(
            r#"
            INSERT INTO equipos (id, codigo, nombre, serie, placa, descripcion, marca, modelo,
                                 ubicacion, estado, fecha_calibracion, proxima_calibracion,
                                 incertidumbre, error_maximo, certificado_id, responsable,
                                 observaciones, activo, synced_at, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), 'sheets')
            ON CONFLICT (id) DO UPDATE SET
                codigo = EXCLUDED.codigo,
                nombre = EXCLUDED.nombre,
                serie = EXCLUDED.serie,
                placa = EXCLUDED.placa,
                descripcion = EXCLUDED.descripcion,
                marca = EXCLUDED.marca,
                modelo = EXCLUDED.modelo,
                ubicacion = EXCLUDED.ubicacion,
                estado = EXCLUDED.estado,
                fecha_calibracion = EXCLUDED.fecha_calibracion,
                proxima_calibracion = EXCLUDED.proxima_calibracion,
                incertidumbre = EXCLUDED.incertidumbre,
                error_maximo = EXCLUDED.error_maximo,
                certificado_id = EXCLUDED.certificado_id,
                responsable = EXCLUDED.responsable,
                observaciones = EXCLUDED.observaciones,
                activo = EXCLUDED.activo,
                synced_at = NOW(),
                sync_source = 'sheets'
            "#,
        )
        .bind(&equipo.id)
        .bind(&equipo.codigo)
        .bind(&equipo.nombre)
        .bind(&equipo.serie)
        .bind(&equipo.placa)
        .bind(&equipo.descripcion)
        .bind(&equipo.marca)
        .bind(&equipo.modelo)
        .bind(&equipo.ubicacion)
        .bind(&equipo.estado)
        .bind(fecha_calibracion)
        .bind(proxima_calibracion)
        .bind(equipo.incertidumbre.map(rust_decimal::Decimal::from_f64_retain).flatten())
        .bind(equipo.error_maximo.map(rust_decimal::Decimal::from_f64_retain).flatten())
        .bind(&equipo.certificado_id)
        .bind(&equipo.responsable)
        .bind(&equipo.observaciones)
        .bind(&equipo.activo)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Obtiene equipos modificados desde la última sincronización
    pub async fn find_modified_since(&self, since: DateTime<Utc>) -> Result<Vec<Equipo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EquipoRow>(
            r#"
            SELECT id, codigo, nombre, serie, placa, descripcion, marca, modelo,
                   ubicacion, estado, fecha_calibracion, proxima_calibracion,
                   incertidumbre, error_maximo, certificado_id, responsable,
                   observaciones, activo, created_at, updated_at, synced_at, sync_source
            FROM equipos
            WHERE updated_at > $1 AND sync_source = 'db'
            ORDER BY updated_at
            "#,
        )
        .bind(since)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Equipo::from).collect())
    }

    /// Estadísticas de equipos por estado
    pub async fn count_by_estado(&self) -> Result<Vec<(String, i64)>, sqlx::Error> {
        let rows: Vec<(String, i64)> = sqlx::query_as(
            "SELECT estado, COUNT(*) as count FROM equipos WHERE activo = true GROUP BY estado"
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    /// Cuenta total de equipos
    pub async fn count(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM equipos")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Cuenta equipos activos
    pub async fn count_active(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM equipos WHERE activo = true")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }
}
