use sqlx::FromRow;
use chrono::{DateTime, Utc, NaiveDate};

use crate::db::DbPool;
use crate::models::{Ensayo, CreateEnsayo, UpdateEnsayo, WorkflowState};

/// Modelo de base de datos para Ensayo
#[derive(Debug, Clone, FromRow)]
pub struct EnsayoRow {
    pub id: String,
    pub codigo: String,
    pub tipo: String,
    pub perforacion_id: String,
    pub proyecto_id: String,
    pub muestra: String,
    pub norma: String,
    pub workflow_state: String,
    pub fecha_solicitud: NaiveDate,
    pub fecha_programacion: Option<NaiveDate>,
    pub fecha_ejecucion: Option<NaiveDate>,
    pub fecha_reporte: Option<NaiveDate>,
    pub fecha_entrega: Option<NaiveDate>,
    pub tecnico_id: Option<String>,
    pub tecnico_nombre: Option<String>,
    pub sheet_id: Option<String>,
    pub sheet_url: Option<String>,
    pub equipos_utilizados: Option<Vec<String>>,
    pub observaciones: Option<String>,
    pub urgente: bool,
    // PDF-related fields
    pub pdf_drive_id: Option<String>,
    pub pdf_url: Option<String>,
    pub pdf_generated_at: Option<DateTime<Utc>>,
    pub perforacion_folder_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub sync_source: Option<String>,
}

impl From<EnsayoRow> for Ensayo {
    fn from(row: EnsayoRow) -> Self {
        // Parsear workflow_state de String a enum
        let workflow_state = row.workflow_state
            .parse::<WorkflowState>()
            .unwrap_or_default();
        
        Ensayo {
            id: row.id,
            codigo: row.codigo,
            tipo: row.tipo,
            perforacion_id: row.perforacion_id,
            proyecto_id: row.proyecto_id,
            muestra: row.muestra,
            norma: row.norma,
            workflow_state,
            fecha_solicitud: row.fecha_solicitud.to_string(),
            fecha_programacion: row.fecha_programacion.map(|d| d.to_string()),
            fecha_ejecucion: row.fecha_ejecucion.map(|d| d.to_string()),
            fecha_reporte: row.fecha_reporte.map(|d| d.to_string()),
            fecha_entrega: row.fecha_entrega.map(|d| d.to_string()),
            tecnico_id: row.tecnico_id,
            tecnico_nombre: row.tecnico_nombre,
            sheet_id: row.sheet_id,
            sheet_url: row.sheet_url,
            equipos_utilizados: row.equipos_utilizados.unwrap_or_default(),
            observaciones: row.observaciones,
            urgente: row.urgente,
            // PDF-related fields
            pdf_drive_id: row.pdf_drive_id,
            pdf_url: row.pdf_url,
            pdf_generated_at: row.pdf_generated_at.map(|d| d.to_rfc3339()),
            perforacion_folder_id: row.perforacion_folder_id,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Clone)]
pub struct EnsayoRepository {
    pool: DbPool,
}

impl EnsayoRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// Obtiene todos los ensayos
    pub async fn find_all(&self) -> Result<Vec<Ensayo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EnsayoRow>(
            r#"
            SELECT id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                   workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                   fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                   sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                   pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id,
                   created_at, updated_at, synced_at, sync_source
            FROM ensayos
            ORDER BY fecha_solicitud DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Ensayo::from).collect())
    }

    /// Obtiene ensayos por proyecto
    pub async fn find_by_proyecto(&self, proyecto_id: &str) -> Result<Vec<Ensayo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EnsayoRow>(
            r#"
            SELECT id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                   workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                   fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                   sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                   pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id,
                   created_at, updated_at, synced_at, sync_source
            FROM ensayos
            WHERE proyecto_id = $1
            ORDER BY fecha_solicitud DESC
            "#,
        )
        .bind(proyecto_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Ensayo::from).collect())
    }

    /// Obtiene ensayos por estado de workflow
    pub async fn find_by_workflow_state(&self, state: &str) -> Result<Vec<Ensayo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EnsayoRow>(
            r#"
            SELECT id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                   workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                   fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                   sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                   pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id,
                   created_at, updated_at, synced_at, sync_source
            FROM ensayos
            WHERE workflow_state = $1
            ORDER BY urgente DESC, fecha_solicitud ASC
            "#,
        )
        .bind(state)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Ensayo::from).collect())
    }

    /// Obtiene ensayos urgentes pendientes
    pub async fn find_urgent_pending(&self) -> Result<Vec<Ensayo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EnsayoRow>(
            r#"
            SELECT id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                   workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                   fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                   sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                   pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id,
                   created_at, updated_at, synced_at, sync_source
            FROM ensayos
            WHERE urgente = true AND workflow_state NOT IN ('entregado', 'cancelado')
            ORDER BY fecha_solicitud ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Ensayo::from).collect())
    }

    /// Busca un ensayo por ID
    pub async fn find_by_id(&self, id: &str) -> Result<Option<Ensayo>, sqlx::Error> {
        let row = sqlx::query_as::<_, EnsayoRow>(
            r#"
            SELECT id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                   workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                   fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                   sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                   pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id,
                   created_at, updated_at, synced_at, sync_source
            FROM ensayos
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Ensayo::from))
    }

    /// Crea un nuevo ensayo
    pub async fn create(&self, id: &str, codigo: &str, dto: CreateEnsayo) -> Result<Ensayo, sqlx::Error> {
        let fecha_solicitud = NaiveDate::parse_from_str(&dto.fecha_solicitud, "%Y-%m-%d")
            .unwrap_or_else(|_| Utc::now().date_naive());

        let row = sqlx::query_as::<_, EnsayoRow>(
            r#"
            INSERT INTO ensayos (id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                                 workflow_state, fecha_solicitud, observaciones, urgente, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'solicitado', $8, $9, $10, 'db')
            RETURNING id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                      workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                      fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                      sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                      pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id,
                      created_at, updated_at, synced_at, sync_source
            "#,
        )
        .bind(id)
        .bind(codigo)
        .bind(&dto.tipo)
        .bind(&dto.perforacion_id)
        .bind(&dto.proyecto_id)
        .bind(&dto.muestra)
        .bind(&dto.norma)
        .bind(fecha_solicitud)
        .bind(&dto.observaciones)
        .bind(dto.urgente.unwrap_or(false))
        .fetch_one(&self.pool)
        .await?;

        Ok(Ensayo::from(row))
    }

    /// Actualiza un ensayo existente
    pub async fn update(&self, id: &str, dto: UpdateEnsayo) -> Result<Option<Ensayo>, sqlx::Error> {
        let fecha_programacion = dto.fecha_programacion
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        
        let fecha_ejecucion = dto.fecha_ejecucion
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        
        let fecha_reporte = dto.fecha_reporte
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        
        let fecha_entrega = dto.fecha_entrega
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        let row = sqlx::query_as::<_, EnsayoRow>(
            r#"
            UPDATE ensayos
            SET workflow_state = COALESCE($2, workflow_state),
                fecha_programacion = COALESCE($3, fecha_programacion),
                fecha_ejecucion = COALESCE($4, fecha_ejecucion),
                fecha_reporte = COALESCE($5, fecha_reporte),
                fecha_entrega = COALESCE($6, fecha_entrega),
                tecnico_id = COALESCE($7, tecnico_id),
                tecnico_nombre = COALESCE($8, tecnico_nombre),
                observaciones = COALESCE($9, observaciones),
                sync_source = 'db'
            WHERE id = $1
            RETURNING id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                      workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                      fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                      sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                      pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id,
                      created_at, updated_at, synced_at, sync_source
            "#,
        )
        .bind(id)
        .bind(dto.workflow_state.as_ref().map(|ws| ws.to_string()))
        .bind(fecha_programacion)
        .bind(fecha_ejecucion)
        .bind(fecha_reporte)
        .bind(fecha_entrega)
        .bind(&dto.tecnico_id)
        .bind(&dto.tecnico_nombre)
        .bind(&dto.observaciones)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Ensayo::from))
    }

    /// Actualiza solo el estado del workflow
    pub async fn update_workflow_state(&self, id: &str, state: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE ensayos 
            SET workflow_state = $2, sync_source = 'db'
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(state)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Upsert para sincronización desde Sheets
    pub async fn upsert_from_sheets(&self, ensayo: &Ensayo) -> Result<(), sqlx::Error> {
        let fecha_solicitud = NaiveDate::parse_from_str(&ensayo.fecha_solicitud, "%Y-%m-%d")
            .unwrap_or_else(|_| Utc::now().date_naive());
        
        let fecha_programacion = ensayo.fecha_programacion
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        
        let fecha_ejecucion = ensayo.fecha_ejecucion
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        
        let fecha_reporte = ensayo.fecha_reporte
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        
        let fecha_entrega = ensayo.fecha_entrega
            .as_ref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        sqlx::query(
            r#"
            INSERT INTO ensayos (id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                                 workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                                 fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                                 sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                                 synced_at, sync_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), 'sheets')
            ON CONFLICT (id) DO UPDATE SET
                codigo = EXCLUDED.codigo,
                tipo = EXCLUDED.tipo,
                perforacion_id = EXCLUDED.perforacion_id,
                proyecto_id = EXCLUDED.proyecto_id,
                muestra = EXCLUDED.muestra,
                norma = EXCLUDED.norma,
                workflow_state = EXCLUDED.workflow_state,
                fecha_solicitud = EXCLUDED.fecha_solicitud,
                fecha_programacion = EXCLUDED.fecha_programacion,
                fecha_ejecucion = EXCLUDED.fecha_ejecucion,
                fecha_reporte = EXCLUDED.fecha_reporte,
                fecha_entrega = EXCLUDED.fecha_entrega,
                tecnico_id = EXCLUDED.tecnico_id,
                tecnico_nombre = EXCLUDED.tecnico_nombre,
                sheet_id = EXCLUDED.sheet_id,
                sheet_url = EXCLUDED.sheet_url,
                equipos_utilizados = EXCLUDED.equipos_utilizados,
                observaciones = EXCLUDED.observaciones,
                urgente = EXCLUDED.urgente,
                synced_at = NOW(),
                sync_source = 'sheets'
            "#,
        )
        .bind(&ensayo.id)
        .bind(&ensayo.codigo)
        .bind(&ensayo.tipo)
        .bind(&ensayo.perforacion_id)
        .bind(&ensayo.proyecto_id)
        .bind(&ensayo.muestra)
        .bind(&ensayo.norma)
        .bind(ensayo.workflow_state.to_string())
        .bind(fecha_solicitud)
        .bind(fecha_programacion)
        .bind(fecha_ejecucion)
        .bind(fecha_reporte)
        .bind(fecha_entrega)
        .bind(&ensayo.tecnico_id)
        .bind(&ensayo.tecnico_nombre)
        .bind(&ensayo.sheet_id)
        .bind(&ensayo.sheet_url)
        .bind(&ensayo.equipos_utilizados)
        .bind(&ensayo.observaciones)
        .bind(&ensayo.urgente)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Obtiene ensayos modificados desde la última sincronización
    pub async fn find_modified_since(&self, since: DateTime<Utc>) -> Result<Vec<Ensayo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EnsayoRow>(
            r#"
            SELECT id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                   workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                   fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                   sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                   pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id,
                   created_at, updated_at, synced_at, sync_source
            FROM ensayos
            WHERE updated_at > $1 AND sync_source = 'db'
            ORDER BY updated_at
            "#,
        )
        .bind(since)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Ensayo::from).collect())
    }

    /// Estadísticas de ensayos por estado
    pub async fn count_by_workflow_state(&self) -> Result<Vec<(String, i64)>, sqlx::Error> {
        let rows: Vec<(String, i64)> = sqlx::query_as(
            "SELECT workflow_state, COUNT(*) as count FROM ensayos GROUP BY workflow_state"
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    /// Estadísticas de ensayos por tipo
    pub async fn count_by_tipo(&self) -> Result<Vec<(String, i64)>, sqlx::Error> {
        let rows: Vec<(String, i64)> = sqlx::query_as(
            "SELECT tipo, COUNT(*) as count FROM ensayos GROUP BY tipo ORDER BY count DESC"
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    /// Cuenta total de ensayos
    pub async fn count(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM ensayos")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    /// Cuenta ensayos pendientes (no entregados ni cancelados)
    pub async fn count_pending(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM ensayos WHERE workflow_state NOT IN ('E14', 'E15')"
        )
        .fetch_one(&self.pool)
        .await?;
        Ok(row.0)
    }

    /// Busca un ensayo por código
    pub async fn find_by_codigo(&self, codigo: &str) -> Result<Option<Ensayo>, sqlx::Error> {
        let row = sqlx::query_as::<_, EnsayoRow>(
            r#"
            SELECT id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                   workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                   fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                   sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                   pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id,
                   created_at, updated_at, synced_at, sync_source
            FROM ensayos
            WHERE codigo = $1
            "#,
        )
        .bind(codigo)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(Ensayo::from))
    }

    /// Busca ensayos por perforación
    pub async fn find_by_perforacion(&self, perforacion_id: &str) -> Result<Vec<Ensayo>, sqlx::Error> {
        let rows = sqlx::query_as::<_, EnsayoRow>(
            r#"
            SELECT id, codigo, tipo, perforacion_id, proyecto_id, muestra, norma,
                   workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion,
                   fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre,
                   sheet_id, sheet_url, equipos_utilizados, observaciones, urgente,
                   pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id,
                   created_at, updated_at, synced_at, sync_source
            FROM ensayos
            WHERE perforacion_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(perforacion_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Ensayo::from).collect())
    }

    /// Elimina un ensayo (soft delete: workflow_state = 'E15' cancelado)
    pub async fn delete(&self, id: &str) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE ensayos
            SET workflow_state = 'E15',
                updated_at = NOW(),
                sync_source = 'db'
            WHERE id = $1 AND workflow_state != 'E15'
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Actualiza la información del PDF generado
    pub async fn update_pdf_info(
        &self,
        id: &str,
        pdf_drive_id: &str,
        pdf_url: &str,
    ) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE ensayos
            SET pdf_drive_id = $2,
                pdf_url = $3,
                pdf_generated_at = NOW(),
                updated_at = NOW(),
                sync_source = 'db'
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(pdf_drive_id)
        .bind(pdf_url)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Actualiza la información del Sheet asociado al ensayo
    pub async fn update_sheet_info(
        &self,
        id: &str,
        sheet_id: &str,
        sheet_url: &str,
    ) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE ensayos
            SET sheet_id = $2,
                sheet_url = $3,
                updated_at = NOW(),
                sync_source = 'db'
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(sheet_id)
        .bind(sheet_url)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Actualiza el perforacion_folder_id (cache para evitar queries repetidas)
    pub async fn update_perforacion_folder_id(
        &self,
        id: &str,
        folder_id: &str,
    ) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE ensayos
            SET perforacion_folder_id = $2,
                updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(folder_id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
