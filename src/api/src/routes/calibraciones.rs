use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{Calibracion, CreateCalibracion, UpdateCalibracion};
use crate::repositories::CalibracionRepository;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_calibraciones).post(create_calibracion))
        .route("/{id}", get(get_calibracion).put(update_calibracion).delete(delete_calibracion))
        .route("/equipo/{equipo_id}", get(list_by_equipo))
}

/// GET /api/calibraciones
async fn list_calibraciones(
    State(state): State<AppState>,
) -> Result<Json<Vec<Calibracion>>, AppError> {
    let repo = CalibracionRepository::new(state.db_pool.clone());
    let calibraciones = repo.find_all().await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    Ok(Json(calibraciones))
}

/// GET /api/calibraciones/equipo/:equipo_id
async fn list_by_equipo(
    Path(equipo_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Calibracion>>, AppError> {
    let repo = CalibracionRepository::new(state.db_pool.clone());
    let calibraciones = repo.find_by_equipo(&equipo_id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    Ok(Json(calibraciones))
}

/// GET /api/calibraciones/:id
async fn get_calibracion(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Calibracion>, AppError> {
    let repo = CalibracionRepository::new(state.db_pool.clone());
    let calibracion = repo.find_by_id(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(calibracion))
}

/// POST /api/calibraciones
async fn create_calibracion(
    State(state): State<AppState>,
    Json(payload): Json<CreateCalibracion>,
) -> Result<(StatusCode, Json<Calibracion>), AppError> {
    let repo = CalibracionRepository::new(state.db_pool.clone());
    let id = Uuid::new_v4().to_string();

    let calibracion = repo.create(&id, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, Json(calibracion)))
}

/// PUT /api/calibraciones/:id
async fn update_calibracion(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateCalibracion>,
) -> Result<Json<Calibracion>, AppError> {
    let repo = CalibracionRepository::new(state.db_pool.clone());
    let calibracion = repo.update(&id, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(calibracion))
}

/// DELETE /api/calibraciones/:id
async fn delete_calibracion(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = CalibracionRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}
