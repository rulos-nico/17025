use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};

use crate::errors::AppError;
use crate::models::{TipoEnsayo, CreateTipoEnsayo, UpdateTipoEnsayo};
use crate::repositories::TipoEnsayoRepository;
use crate::utils::id::generate_uuid;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_tipos_ensayo).post(create_tipo_ensayo))
        .route("/activos", get(list_tipos_ensayo_activos))
        .route("/{id}", get(get_tipo_ensayo).put(update_tipo_ensayo).delete(delete_tipo_ensayo))
}

/// GET /api/tipos-ensayo
async fn list_tipos_ensayo(
    State(state): State<AppState>,
) -> Result<Json<Vec<TipoEnsayo>>, AppError> {
    let repo = TipoEnsayoRepository::new(state.db_pool.clone());
    let tipos = repo.find_all().await?;
    Ok(Json(tipos))
}

/// GET /api/tipos-ensayo/activos
async fn list_tipos_ensayo_activos(
    State(state): State<AppState>,
) -> Result<Json<Vec<TipoEnsayo>>, AppError> {
    let repo = TipoEnsayoRepository::new(state.db_pool.clone());
    let tipos = repo.find_active().await?;
    Ok(Json(tipos))
}

/// GET /api/tipos-ensayo/:id
async fn get_tipo_ensayo(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<TipoEnsayo>, AppError> {
    let repo = TipoEnsayoRepository::new(state.db_pool.clone());
    let tipo = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(tipo))
}

/// Valores válidos para el campo `acre` (enum acreditacion en PostgreSQL)
const ACRE_VALIDOS: &[&str] = &["ISO 17025:2017", "ISO 9001:2015", "Otra"];

/// POST /api/tipos-ensayo
async fn create_tipo_ensayo(
    State(state): State<AppState>,
    Json(mut payload): Json<CreateTipoEnsayo>,
) -> Result<(StatusCode, Json<TipoEnsayo>), AppError> {
    // Trim de campos de texto
    payload.nombre = payload.nombre.trim().to_string();
    payload.norma = payload.norma.trim().to_string();
    payload.categoria = payload.categoria.map(|c| c.trim().to_string()).filter(|c| !c.is_empty());

    // Validar campos requeridos
    if payload.nombre.is_empty() {
        return Err(AppError::BadRequest("El nombre del tipo de ensayo es requerido".into()));
    }

    if payload.norma.is_empty() {
        return Err(AppError::BadRequest("La norma de referencia es requerida".into()));
    }

    if !ACRE_VALIDOS.contains(&payload.acre.as_str()) {
        return Err(AppError::BadRequest(
            format!(
                "Valor de acreditación inválido: '{}'. Valores válidos: {}",
                payload.acre,
                ACRE_VALIDOS.join(", ")
            )
        ));
    }

    let repo = TipoEnsayoRepository::new(state.db_pool.clone());
    let id = generate_uuid();
    let tipo = repo.create(&id, payload).await?;

    Ok((StatusCode::CREATED, Json(tipo)))
}

/// PUT /api/tipos-ensayo/:id
async fn update_tipo_ensayo(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateTipoEnsayo>,
) -> Result<Json<TipoEnsayo>, AppError> {
    let repo = TipoEnsayoRepository::new(state.db_pool.clone());
    let tipo = repo.update(&id, payload).await?.ok_or(AppError::NotFound)?;
    Ok(Json(tipo))
}

/// DELETE /api/tipos-ensayo/:id
async fn delete_tipo_ensayo(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = TipoEnsayoRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}
