use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{Cliente, CreateCliente, UpdateCliente};
use crate::repositories::ClienteRepository;
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
    let clientes = repo.find_all().await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    Ok(Json(clientes))
}

/// GET /api/clientes/:id
async fn get_cliente(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Cliente>, AppError> {
    let repo = ClienteRepository::new(state.db_pool.clone());
    let cliente = repo.find_by_id(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(cliente))
}

/// POST /api/clientes
async fn create_cliente(
    State(state): State<AppState>,
    Json(payload): Json<CreateCliente>,
) -> Result<(StatusCode, Json<Cliente>), AppError> {
    let repo = ClienteRepository::new(state.db_pool.clone());
    let id = Uuid::new_v4().to_string();
    let codigo = format!("CLI-{:04}", rand_suffix());

    let cliente = repo.create(&id, &codigo, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, Json(cliente)))
}

/// PUT /api/clientes/:id
async fn update_cliente(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateCliente>,
) -> Result<Json<Cliente>, AppError> {
    let repo = ClienteRepository::new(state.db_pool.clone());
    let cliente = repo.update(&id, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(cliente))
}

/// DELETE /api/clientes/:id
async fn delete_cliente(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = ClienteRepository::new(state.db_pool.clone());
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
