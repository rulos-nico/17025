use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};

use crate::errors::AppError;
use crate::models::{CreateEquipo, Equipo, UpdateEquipo};
use crate::repositories::EquipoRepository;
use crate::utils::id::{generate_simple_code, generate_uuid};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_equipos).post(create_equipo))
        .route("/{id}", get(get_equipo).put(update_equipo).delete(delete_equipo))
}

/// GET /api/equipos
async fn list_equipos(
    State(state): State<AppState>,
) -> Result<Json<Vec<Equipo>>, AppError> {
    let repo = EquipoRepository::new(state.db_pool.clone());
    let equipos = repo.find_all().await?;
    Ok(Json(equipos))
}

/// GET /api/equipos/:id
async fn get_equipo(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Equipo>, AppError> {
    let repo = EquipoRepository::new(state.db_pool.clone());
    let equipo = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(equipo))
}

/// POST /api/equipos
async fn create_equipo(
    State(state): State<AppState>,
    Json(payload): Json<CreateEquipo>,
) -> Result<(StatusCode, Json<Equipo>), AppError> {
    let repo = EquipoRepository::new(state.db_pool.clone());
    let id = generate_uuid();
    let codigo = generate_simple_code("EQP");
    let equipo = repo.create(&id, &codigo, payload).await?;

    Ok((StatusCode::CREATED, Json(equipo)))
}

/// PUT /api/equipos/:id
async fn update_equipo(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateEquipo>,
) -> Result<Json<Equipo>, AppError> {
    let repo = EquipoRepository::new(state.db_pool.clone());
    let equipo = repo.update(&id, payload).await?.ok_or(AppError::NotFound)?;
    Ok(Json(equipo))
}

/// DELETE /api/equipos/:id
async fn delete_equipo(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = EquipoRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}
