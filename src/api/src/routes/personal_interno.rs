use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};

use crate::errors::AppError;
use crate::models::{CreatePersonalInterno, PersonalInterno, UpdatePersonalInterno};
use crate::repositories::PersonalInternoRepository;
use crate::utils::id::{generate_simple_code, generate_uuid};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_personal_interno).post(create_personal_interno))
        .route("/{id}", get(get_personal_interno).put(update_personal_interno).delete(delete_personal_interno))
}

/// GET /api/personal-interno
async fn list_personal_interno(
    State(state): State<AppState>,
) -> Result<Json<Vec<PersonalInterno>>, AppError> {
    let repo = PersonalInternoRepository::new(state.db_pool.clone());
    let personal = repo.find_all().await?;
    Ok(Json(personal))
}

/// GET /api/personal-interno/:id
async fn get_personal_interno(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<PersonalInterno>, AppError> {
    let repo = PersonalInternoRepository::new(state.db_pool.clone());
    let personal = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(personal))
}

/// POST /api/personal-interno
async fn create_personal_interno(
    State(state): State<AppState>,
    Json(payload): Json<CreatePersonalInterno>,
) -> Result<(StatusCode, Json<PersonalInterno>), AppError> {
    let repo = PersonalInternoRepository::new(state.db_pool.clone());
    let id = generate_uuid();
    let codigo = generate_simple_code("PER");

    let personal = repo.create(&id, &codigo, payload).await?;

    Ok((StatusCode::CREATED, Json(personal)))
}

/// PUT /api/personal-interno/:id
async fn update_personal_interno(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdatePersonalInterno>,
) -> Result<Json<PersonalInterno>, AppError> {
    let repo = PersonalInternoRepository::new(state.db_pool.clone());
    let personal = repo.update(&id, payload).await?.ok_or(AppError::NotFound)?;
    Ok(Json(personal))
}

/// DELETE /api/personal-interno/:id
async fn delete_personal_interno(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = PersonalInternoRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}
