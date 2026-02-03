use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreateSensor, Sensor, UpdateSensor};
use crate::repositories::SensorRepository;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_sensores).post(create_sensor))
        .route("/{id}", get(get_sensor).put(update_sensor).delete(delete_sensor))
}

/// GET /api/sensores
async fn list_sensores(
    State(state): State<AppState>,
) -> Result<Json<Vec<Sensor>>, AppError> {
    let repo = SensorRepository::new(state.db_pool.clone());
    let sensores = repo.find_all().await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    Ok(Json(sensores))
}

/// GET /api/sensores/:id
async fn get_sensor(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Sensor>, AppError> {
    let repo = SensorRepository::new(state.db_pool.clone());
    let sensor = repo.find_by_id(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(sensor))
}

/// POST /api/sensores
async fn create_sensor(
    State(state): State<AppState>,
    Json(payload): Json<CreateSensor>,
) -> Result<(StatusCode, Json<Sensor>), AppError> {
    let repo = SensorRepository::new(state.db_pool.clone());
    let id = Uuid::new_v4().to_string();
    let codigo = format!("SNS-{:04}", rand_suffix());

    let sensor = repo.create(&id, &codigo, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, Json(sensor)))
}

/// PUT /api/sensores/:id
async fn update_sensor(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateSensor>,
) -> Result<Json<Sensor>, AppError> {
    let repo = SensorRepository::new(state.db_pool.clone());
    let sensor = repo.update(&id, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(sensor))
}

/// DELETE /api/sensores/:id
async fn delete_sensor(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = SensorRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}

fn rand_suffix() -> u16 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 10000) as u16
}
