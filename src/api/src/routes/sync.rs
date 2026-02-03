use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc, Duration};
use serde::{Deserialize, Serialize};

use crate::AppState;
use crate::errors::AppError;
use crate::services::sync::{
    SheetsToDatabaseSync, DatabaseToSheetsSync, FullSyncSummary
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/sheets-to-db", post(sync_sheets_to_db))
        .route("/db-to-sheets", post(sync_db_to_sheets))
        .route("/full", post(sync_full))
        .route("/status", get(sync_status))
}

/// Request para sincronización incremental
#[derive(Debug, Deserialize)]
pub struct IncrementalSyncRequest {
    /// Fecha desde la cual sincronizar (ISO 8601)
    /// Si no se proporciona, sincroniza los últimos 24 horas
    pub since: Option<String>,
}

/// Response de estado de sincronización
#[derive(Debug, Serialize)]
pub struct SyncStatusResponse {
    pub database_connected: bool,
    pub sheets_connected: bool,
    pub last_sync: Option<DateTime<Utc>>,
    pub entities: Vec<EntitySyncStatus>,
}

#[derive(Debug, Serialize)]
pub struct EntitySyncStatus {
    pub name: String,
    pub db_count: i64,
}

/// POST /api/sync/sheets-to-db
/// Sincroniza datos desde Google Sheets hacia la base de datos
async fn sync_sheets_to_db(
    State(state): State<AppState>,
) -> Result<Json<FullSyncSummary>, AppError> {
    let sheets = super::require_sheets(&state.sheets_client)?;
    let sync_service = SheetsToDatabaseSync::new(
        state.db_pool.clone(),
        sheets.clone(),
    );

    let summary = sync_service.sync_all().await;
    
    Ok(Json(summary))
}

/// POST /api/sync/db-to-sheets
/// Sincroniza cambios desde la base de datos hacia Google Sheets
async fn sync_db_to_sheets(
    State(state): State<AppState>,
    Json(request): Json<IncrementalSyncRequest>,
) -> Result<Json<FullSyncSummary>, AppError> {
    let sheets = super::require_sheets(&state.sheets_client)?;
    let sync_service = DatabaseToSheetsSync::new(
        state.db_pool.clone(),
        sheets.clone(),
    );

    // Parsear fecha o usar últimas 24 horas
    let since = request
        .since
        .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|| Utc::now() - Duration::hours(24));

    let summary = sync_service.sync_changes_since(since).await;
    
    Ok(Json(summary))
}

/// POST /api/sync/full
/// Ejecuta sincronización bidireccional completa
async fn sync_full(
    State(state): State<AppState>,
) -> Result<Json<FullSyncResponse>, AppError> {
    let sheets = super::require_sheets(&state.sheets_client)?;
    
    // Primero: Sheets -> DB (para obtener datos actuales de Sheets)
    let sheets_to_db = SheetsToDatabaseSync::new(
        state.db_pool.clone(),
        sheets.clone(),
    );
    let sheets_summary = sheets_to_db.sync_all().await;

    // Segundo: DB -> Sheets (para enviar cambios locales)
    // Nota: Esto solo envía cambios con sync_source = 'db'
    let db_to_sheets = DatabaseToSheetsSync::new(
        state.db_pool.clone(),
        sheets.clone(),
    );
    let since = Utc::now() - Duration::hours(24);
    let db_summary = db_to_sheets.sync_changes_since(since).await;

    Ok(Json(FullSyncResponse {
        sheets_to_db: sheets_summary,
        db_to_sheets: db_summary,
    }))
}

#[derive(Debug, Serialize)]
pub struct FullSyncResponse {
    pub sheets_to_db: FullSyncSummary,
    pub db_to_sheets: FullSyncSummary,
}

/// GET /api/sync/status
/// Obtiene el estado actual de sincronización
async fn sync_status(
    State(state): State<AppState>,
) -> Result<Json<SyncStatusResponse>, AppError> {
    use crate::repositories::*;

    // Verificar conexión a DB
    let database_connected = sqlx::query("SELECT 1")
        .execute(&state.db_pool)
        .await
        .is_ok();

    // Verificar conexión a Sheets (solo si está configurado)
    let sheets_connected = match super::require_sheets(&state.sheets_client) {
        Ok(sheets) => sheets.read_sheet("Clientes").await.is_ok(),
        Err(_) => false,
    };

    // Obtener conteos de cada entidad
    let mut entities = Vec::new();

    if database_connected {
        let cliente_repo = ClienteRepository::new(state.db_pool.clone());
        if let Ok(count) = cliente_repo.count().await {
            entities.push(EntitySyncStatus {
                name: "clientes".to_string(),
                db_count: count,
            });
        }

        let proyecto_repo = ProyectoRepository::new(state.db_pool.clone());
        if let Ok(count) = proyecto_repo.count().await {
            entities.push(EntitySyncStatus {
                name: "proyectos".to_string(),
                db_count: count,
            });
        }

        let ensayo_repo = EnsayoRepository::new(state.db_pool.clone());
        if let Ok(count) = ensayo_repo.count().await {
            entities.push(EntitySyncStatus {
                name: "ensayos".to_string(),
                db_count: count,
            });
        }

        let equipo_repo = EquipoRepository::new(state.db_pool.clone());
        if let Ok(count) = equipo_repo.count().await {
            entities.push(EntitySyncStatus {
                name: "equipos".to_string(),
                db_count: count,
            });
        }
    }

    Ok(Json(SyncStatusResponse {
        database_connected,
        sheets_connected,
        last_sync: None, // TODO: Implementar tracking de última sincronización
        entities,
    }))
}
