use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use chrono::Utc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreateProyecto, Proyecto, UpdateProyecto, Perforacion};
use crate::repositories::{ProyectoRepository, PerforacionRepository};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_proyectos).post(create_proyecto))
        .route("/{id}", get(get_proyecto).put(update_proyecto).delete(delete_proyecto))
        .route("/{id}/perforaciones", get(get_perforaciones_by_proyecto))
}

/// GET /api/proyectos
async fn list_proyectos(
    State(state): State<AppState>,
) -> Result<Json<Vec<Proyecto>>, AppError> {
    let repo = ProyectoRepository::new(state.db_pool.clone());
    let proyectos = repo.find_all().await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    Ok(Json(proyectos))
}

/// GET /api/proyectos/:id
async fn get_proyecto(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Proyecto>, AppError> {
    let repo = ProyectoRepository::new(state.db_pool.clone());
    let proyecto = repo.find_by_id(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(proyecto))
}

/// POST /api/proyectos
async fn create_proyecto(
    State(state): State<AppState>,
    Json(payload): Json<CreateProyecto>,
) -> Result<(StatusCode, Json<Proyecto>), AppError> {
    let repo = ProyectoRepository::new(state.db_pool.clone());
    let id = Uuid::new_v4().to_string();
    let codigo = format!(
        "PRY-{}-{:04}",
        Utc::now().format("%Y%m%d"),
        rand_suffix()
    );

    let proyecto = repo.create(&id, &codigo, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, Json(proyecto)))
}

/// PUT /api/proyectos/:id
async fn update_proyecto(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateProyecto>,
) -> Result<Json<Proyecto>, AppError> {
    let repo = ProyectoRepository::new(state.db_pool.clone());
    let proyecto = repo.update(&id, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(proyecto))
}

/// DELETE /api/proyectos/:id
async fn delete_proyecto(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = ProyectoRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}

/// GET /api/proyectos/:id/perforaciones
async fn get_perforaciones_by_proyecto(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Perforacion>>, AppError> {
    let repo = PerforacionRepository::new(state.db_pool.clone());
    let perforaciones = repo.find_by_proyecto(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    Ok(Json(perforaciones))
}

fn rand_suffix() -> u16 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 10000) as u16
}
