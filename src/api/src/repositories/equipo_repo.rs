use sqlx::FromRow;
use chrono::{DateTime, Utc, NaiveDate};

use crate::db::DbPool;
use crate::models::{Equipo, CreateEquipo, UpdateEquipo, EquipoConSensores, SensorResumen};
use crate::utils::sql::{EQUIPO_COLUMNS, select_from_with, select_where, select_where_with};

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

/// Modelo de base de datos para Equipo con sensores asociados (para queries con JOIN)
#[derive(Debug, Clone, FromRow)]
pub struct EquipoConSensoresRow {
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
    pub sensores_asociados: sqlx::types::Json<Vec<SensorResumen>>,
}

impl From<EquipoConSensoresRow> for EquipoConSensores {
    fn from(row: EquipoConSensoresRow) -> Self {
        EquipoConSensores {
            equipo: Equipo {
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
            },
            sensores_asociados: row.sensores_asociados.0,
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
            &select_from_with("equipos", EQUIPO_COLUMNS, "ORDER BY nombre"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Equipo::from).collect())
    }

    /// Obtiene equipos activos
    pub async fn find_active(&self) -> Result<Vec<Equipo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EquipoRow>(
            &select_where_with("equipos", EQUIPO_COLUMNS, "activo = true", "ORDER BY nombre"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Equipo::from).collect())
    }

    /// Obtiene equipos disponibles para uso
    pub async fn find_available(&self) -> Result<Vec<Equipo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EquipoRow>(
            &select_where_with("equipos", EQUIPO_COLUMNS, "activo = true AND estado = 'disponible'", "ORDER BY nombre"),
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Equipo::from).collect())
    }

    /// Obtiene equipos con calibración próxima a vencer (en los próximos N días)
    pub async fn find_calibration_due(&self, days: i32) -> Result<Vec<Equipo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EquipoRow>(
            &select_where_with("equipos", EQUIPO_COLUMNS, 
                "activo = true AND proxima_calibracion IS NOT NULL AND proxima_calibracion <= CURRENT_DATE + $1::integer", 
                "ORDER BY proxima_calibracion ASC"),
        )
        .bind(days)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Equipo::from).collect())
    }

    /// Busca un equipo por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Equipo>, sqlx::Error> {
        let row = sqlx::query_as::<_, EquipoRow>(
            &select_where("equipos", EQUIPO_COLUMNS, "id = $1"),
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Equipo::from))
    }

    /// Busca un equipo por código
    pub async fn find_by_codigo(&self, codigo: &str) -> Result<Option<Equipo>, sqlx::Error> {
        let row = sqlx::query_as::<_, EquipoRow>(
            &select_where("equipos", EQUIPO_COLUMNS, "codigo = $1"),
        )
        .bind(codigo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Equipo::from))
    }

    /// Crea un nuevo equipo
    pub async fn create(&self, id: &str, codigo: &str, dto: CreateEquipo) -> Result<Equipo, sqlx::Error> {
        let row = sqlx::query_as::<_, EquipoRow>(&format!(
            r#"
            INSERT INTO equipos (id, codigo, nombre, serie, placa, descripcion, marca, modelo, ubicacion, estado, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'disponible', 'db')
            RETURNING {}
            "#,
            EQUIPO_COLUMNS
        ))
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

        let row = sqlx::query_as::<_, EquipoRow>(&format!(
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
            RETURNING {}
            "#,
            EQUIPO_COLUMNS
        ))
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
            &select_where_with("equipos", EQUIPO_COLUMNS, "updated_at > $1 AND sync_source = 'db'", "ORDER BY updated_at"),
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

    /// Elimina un equipo (soft delete: activo = false)
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE equipos
            SET activo = false, 
                updated_at = NOW(),
                sync_source = 'db'
            WHERE id = $1 AND activo = true
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Buscar equipos por nombre con sensor sensores_asociados
    /// Obtiene todos los equipos con sus sensores asociados
    pub async fn find_all_with_sensores(&self) -> Result<Vec<EquipoConSensores>, sqlx::Error> {
    let query = r#"
        SELECT 
            e.id, e.codigo, e.nombre, e.serie, e.placa, e.descripcion,
            e.marca, e.modelo, e.ubicacion, e.estado,
            e.fecha_calibracion, e.proxima_calibracion,
            e.incertidumbre, e.error_maximo, e.certificado_id,
            e.responsable, e.observaciones, e.activo,
            e.created_at, e.updated_at, e.synced_at, e.sync_source,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'codigo', s.codigo,
                        'tipo', s.tipo,
                        'marca', s.marca,
                        'modelo', s.modelo,
                        'numero_serie', s.numero_serie,
                        'rango_medicion', s.rango_medicion,
                        'estado', s.estado,
                        'proxima_calibracion', s.proxima_calibracion
                    )
                ) FILTER (WHERE s.id IS NOT NULL),
                '[]'::json
            ) as sensores_asociados
        FROM equipos e
        LEFT JOIN sensores s ON s.equipo_id = e.id AND s.activo = true
        WHERE e.activo = true
        GROUP BY e.id
        ORDER BY e.nombre
    "#;
    
    let rows = sqlx::query_as::<_, EquipoConSensoresRow>(query)
        .fetch_all(&self.pool)
        .await?;
    
    Ok(rows.into_iter().map(EquipoConSensores::from).collect())
    }
    /// Obtiene un equipo por ID con sus sensores asociados
    pub async fn find_by_id_with_sensores(&self, id: &str) -> Result<Option<EquipoConSensores>, sqlx::Error> {
    let query = r#"
        SELECT 
            e.id, e.codigo, e.nombre, e.serie, e.placa, e.descripcion,
            e.marca, e.modelo, e.ubicacion, e.estado,
            e.fecha_calibracion, e.proxima_calibracion,
            e.incertidumbre, e.error_maximo, e.certificado_id,
            e.responsable, e.observaciones, e.activo,
            e.created_at, e.updated_at, e.synced_at, e.sync_source,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'codigo', s.codigo,
                        'tipo', s.tipo,
                        'marca', s.marca,
                        'modelo', s.modelo,
                        'numero_serie', s.numero_serie,
                        'rango_medicion', s.rango_medicion,
                        'estado', s.estado,
                        'proxima_calibracion', s.proxima_calibracion
                    )
                ) FILTER (WHERE s.id IS NOT NULL),
                '[]'::json
            ) as sensores_asociados
        FROM equipos e
        LEFT JOIN sensores s ON s.equipo_id = e.id AND s.activo = true
        WHERE e.id = $1 AND e.activo = true
        GROUP BY e.id
    "#;
    
    let row = sqlx::query_as::<_, EquipoConSensoresRow>(query)
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
    
    Ok(row.map(EquipoConSensores::from))
    }


}
