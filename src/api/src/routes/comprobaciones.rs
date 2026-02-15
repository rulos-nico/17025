use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{Comprobacion, CreateComprobacion, UpdateComprobacion};
use crate::repositories::ComprobacionRepository;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_comprobaciones).post(create_comprobacion))
        .route("/{id}", get(get_comprobacion).put(update_comprobacion).delete(delete_comprobacion))
        .route("/equipo/{equipo_id}", get(list_by_equipo))
}

/// GET /api/comprobaciones
async fn list_comprobaciones(
    State(state): State<AppState>,
) -> Result<Json<Vec<Comprobacion>>, AppError> {
    let repo = ComprobacionRepository::new(state.db_pool.clone());
    let comprobaciones = repo.find_all().await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    Ok(Json(comprobaciones))
}

/// GET /api/comprobaciones/equipo/:equipo_id
async fn list_by_equipo(
    Path(equipo_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Comprobacion>>, AppError> {
    let repo = ComprobacionRepository::new(state.db_pool.clone());
    let comprobaciones = repo.find_by_equipo(&equipo_id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    Ok(Json(comprobaciones))
}

/// GET /api/comprobaciones/:id
async fn get_comprobacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Comprobacion>, AppError> {
    let repo = ComprobacionRepository::new(state.db_pool.clone());
    let comprobacion = repo.find_by_id(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(comprobacion))
}

/// POST /api/comprobaciones
async fn create_comprobacion(
    State(state): State<AppState>,
    Json(payload): Json<CreateComprobacion>,
) -> Result<(StatusCode, Json<Comprobacion>), AppError> {
    let repo = ComprobacionRepository::new(state.db_pool.clone());
    let id = Uuid::new_v4().to_string();

    let comprobacion = repo.create(&id, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, Json(comprobacion)))
}

/// PUT /api/comprobaciones/:id
async fn update_comprobacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateComprobacion>,
) -> Result<Json<Comprobacion>, AppError> {
    let repo = ComprobacionRepository::new(state.db_pool.clone());
    let comprobacion = repo.update(&id, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(comprobacion))
}

/// DELETE /api/comprobaciones/:id
async fn delete_comprobacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = ComprobacionRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}
