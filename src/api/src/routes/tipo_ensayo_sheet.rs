use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};

use crate::errors::AppError;
use crate::models::{TipoEnsayoSheet, CreateTipoEnsayoSheet, UpdateTipoEnsayoSheet};
use crate::repositories::TipoEnsayoSheetRepository;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/tipo-ensayo/{tipo_ensayo_id}", get(list_by_tipo).post(create_sheet))
        .route("/{id}", get(get_sheet).put(update_sheet).delete(delete_sheet))
}

/// GET /api/tipos-ensayo-sheets/tipo-ensayo/:tipo_ensayo_id
async fn list_by_tipo(
    Path(tipo_ensayo_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Vec<TipoEnsayoSheet>>, AppError> {
    let repo = TipoEnsayoSheetRepository::new(state.db_pool.clone());
    let sheets = repo.find_by_tipo_ensayo_id(&tipo_ensayo_id).await?;
    Ok(Json(sheets))
}

/// POST /api/tipos-ensayo-sheets/tipo-ensayo/:tipo_ensayo_id
async fn create_sheet(
    Path(tipo_ensayo_id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<CreateTipoEnsayoSheet>,
) -> Result<(StatusCode, Json<TipoEnsayoSheet>), AppError> {
    let repo = TipoEnsayoSheetRepository::new(state.db_pool.clone());
    let sheet = repo.create(&tipo_ensayo_id, payload).await?;
    Ok((StatusCode::CREATED, Json(sheet)))
}

/// GET /api/tipos-ensayo-sheets/:id
async fn get_sheet(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<TipoEnsayoSheet>, AppError> {
    let repo = TipoEnsayoSheetRepository::new(state.db_pool.clone());
    let sheet = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(sheet))
}

/// PUT /api/tipos-ensayo-sheets/:id
async fn update_sheet(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateTipoEnsayoSheet>,
) -> Result<Json<TipoEnsayoSheet>, AppError> {
    let repo = TipoEnsayoSheetRepository::new(state.db_pool.clone());
    let sheet = repo.update(&id, payload).await?.ok_or(AppError::NotFound)?;
    Ok(Json(sheet))
}

/// DELETE /api/tipos-ensayo-sheets/:id
async fn delete_sheet(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = TipoEnsayoSheetRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}
