use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};

use crate::errors::AppError;
use crate::models::{Cliente, CreateCliente, UpdateCliente};
use crate::repositories::ClienteRepository;
use crate::utils::id::{generate_simple_code, generate_uuid};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_clientes).post(create_cliente))
        .route("/{id}", get(get_cliente).put(update_cliente).delete(delete_cliente))
}

/// GET /api/clientes
async fn list_clientes(
    State(state): State<AppState>,
) -> Result<Json<Vec<Cliente>>, AppError> {
    let repo = ClienteRepository::new(state.db_pool.clone());
    let clientes = repo.find_all().await?;
    Ok(Json(clientes))
}

/// GET /api/clientes/:id
async fn get_cliente(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Cliente>, AppError> {
    let repo = ClienteRepository::new(state.db_pool.clone());
    let cliente = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(cliente))
}

/// POST /api/clientes
async fn create_cliente(
    State(state): State<AppState>,
    Json(payload): Json<CreateCliente>,
) -> Result<(StatusCode, Json<Cliente>), AppError> {
    let repo = ClienteRepository::new(state.db_pool.clone());
    let id = generate_uuid();
    let codigo = generate_simple_code("CLI");

    let cliente = repo.create(&id, &codigo, payload).await?;

    Ok((StatusCode::CREATED, Json(cliente)))
}

/// PUT /api/clientes/:id
async fn update_cliente(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateCliente>,
) -> Result<Json<Cliente>, AppError> {
    let repo = ClienteRepository::new(state.db_pool.clone());
    let cliente = repo.update(&id, payload).await?.ok_or(AppError::NotFound)?;
    Ok(Json(cliente))
}

/// DELETE /api/clientes/:id
async fn delete_cliente(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = ClienteRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}
