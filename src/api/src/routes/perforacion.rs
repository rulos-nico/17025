use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use chrono::Utc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreatePerforacion, Perforacion, UpdatePerforacion};
use crate::repositories::{PerforacionRepository, ProyectoRepository, EnsayoRepository};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_perforaciones).post(create_perforacion))
        .route("/{id}", get(get_perforacion).put(update_perforacion).delete(delete_perforacion))
        .route("/{id}/ensayos", get(get_ensayos_by_perforacion))
}

/// GET /api/perforaciones
async fn list_perforaciones(
    State(state): State<AppState>,
) -> Result<Json<Vec<Perforacion>>, AppError> {
    let repo = PerforacionRepository::new(state.db_pool.clone());
    let perforaciones = repo.find_all().await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    Ok(Json(perforaciones))
}

/// GET /api/perforaciones/:id
async fn get_perforacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Perforacion>, AppError> {
    let repo = PerforacionRepository::new(state.db_pool.clone());
    let perforacion = repo.find_by_id(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(perforacion))
}

/// POST /api/perforaciones
/// Creates a new perforacion in PostgreSQL
/// TODO: In the future, add Google Drive folder creation when drive_client is integrated
async fn create_perforacion(
    State(state): State<AppState>,
    Json(payload): Json<CreatePerforacion>,
) -> Result<(StatusCode, Json<Perforacion>), AppError> {
    // Generate ID and code
    let id = Uuid::new_v4().to_string();
    let codigo = format!(
        "PER-{}-{:04}",
        Utc::now().format("%Y%m%d"),
        rand_suffix()
    );

    // Verify project exists
    let proyecto_repo = ProyectoRepository::new(state.db_pool.clone());
    let _proyecto = proyecto_repo.find_by_id(&payload.proyecto_id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or_else(|| AppError::BadRequest("Proyecto no encontrado".to_string()))?;

    // Create perforacion in database
    let perforacion_repo = PerforacionRepository::new(state.db_pool.clone());
    let perforacion = perforacion_repo.create(&id, &codigo, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, Json(perforacion)))
}

/// PUT /api/perforaciones/:id
async fn update_perforacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdatePerforacion>,
) -> Result<Json<Perforacion>, AppError> {
    let repo = PerforacionRepository::new(state.db_pool.clone());
    let perforacion = repo.update(&id, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(perforacion))
}

/// DELETE /api/perforaciones/:id
async fn delete_perforacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = PerforacionRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}

/// GET /api/perforaciones/:id/ensayos
async fn get_ensayos_by_perforacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Vec<crate::models::Ensayo>>, AppError> {
    // First verify the perforacion exists
    let perforacion_repo = PerforacionRepository::new(state.db_pool.clone());
    let _ = perforacion_repo.find_by_id(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    
    // Get ensayos for this perforacion
    let ensayo_repo = EnsayoRepository::new(state.db_pool.clone());
    let ensayos = ensayo_repo.find_by_perforacion(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(Json(ensayos))
}

fn rand_suffix() -> u16 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 10000) as u16
}
