use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};

use crate::errors::AppError;
use crate::models::{CreateMuestra, Muestra, UpdateMuestra};
use crate::repositories::{MuestraRepository, PerforacionRepository, EnsayoRepository};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_muestras).post(create_muestra))
        .route("/{id}", get(get_muestra).put(update_muestra).delete(delete_muestra))
        .route("/{id}/ensayos", get(get_ensayos_by_muestra))
}

/// GET /api/muestras
async fn list_muestras(
    State(state): State<AppState>,
) -> Result<Json<Vec<Muestra>>, AppError> {
    let repo = MuestraRepository::new(state.db_pool.clone());
    let muestras = repo.find_all().await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    Ok(Json(muestras))
}

/// GET /api/muestras/:id
async fn get_muestra(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Muestra>, AppError> {
    let repo = MuestraRepository::new(state.db_pool.clone());
    let muestra = repo.find_by_id(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(muestra))
}

/// POST /api/muestras
async fn create_muestra(
    State(state): State<AppState>,
    Json(payload): Json<CreateMuestra>,
) -> Result<(StatusCode, Json<Muestra>), AppError> {
    // Validar que el tipo de muestra sea válido
    if !Muestra::is_tipo_valido(&payload.tipo_muestra) {
        return Err(AppError::BadRequest(format!(
            "Tipo de muestra inválido: {}. Válidos: alterado, inalterado, roca, spt, shelby",
            payload.tipo_muestra
        )));
    }

    // Validar profundidades
    if payload.profundidad_fin < payload.profundidad_inicio {
        return Err(AppError::BadRequest(
            "La profundidad final debe ser mayor o igual a la inicial".to_string()
        ));
    }

    // Verificar que la perforación existe
    let perforacion_repo = PerforacionRepository::new(state.db_pool.clone());
    let _ = perforacion_repo.find_by_id(&payload.perforacion_id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or_else(|| AppError::BadRequest("Perforación no encontrada".to_string()))?;

    // Crear muestra
    let muestra_repo = MuestraRepository::new(state.db_pool.clone());
    let muestra = muestra_repo.create(payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, Json(muestra)))
}

/// PUT /api/muestras/:id
async fn update_muestra(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateMuestra>,
) -> Result<Json<Muestra>, AppError> {
    // Validar tipo de muestra si se proporciona
    if let Some(ref tipo) = payload.tipo_muestra {
        if !Muestra::is_tipo_valido(tipo) {
            return Err(AppError::BadRequest(format!(
                "Tipo de muestra inválido: {}. Válidos: alterado, inalterado, roca, spt, shelby",
                tipo
            )));
        }
    }

    // Validar profundidades si ambas se proporcionan
    if let (Some(inicio), Some(fin)) = (payload.profundidad_inicio, payload.profundidad_fin) {
        if fin < inicio {
            return Err(AppError::BadRequest(
                "La profundidad final debe ser mayor o igual a la inicial".to_string()
            ));
        }
    }

    let repo = MuestraRepository::new(state.db_pool.clone());
    let muestra = repo.update(&id, payload).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    Ok(Json(muestra))
}

/// DELETE /api/muestras/:id
async fn delete_muestra(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = MuestraRepository::new(state.db_pool.clone());
    
    match repo.delete(&id).await {
        Ok(true) => Ok(StatusCode::NO_CONTENT),
        Ok(false) => Err(AppError::NotFound),
        Err(e) => {
            let msg = e.to_string();
            if msg.contains("associated ensayos") {
                Err(AppError::BadRequest(msg))
            } else {
                Err(AppError::DatabaseError(msg))
            }
        }
    }
}

/// GET /api/muestras/:id/ensayos
async fn get_ensayos_by_muestra(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Vec<crate::models::Ensayo>>, AppError> {
    // Verificar que la muestra existe
    let muestra_repo = MuestraRepository::new(state.db_pool.clone());
    let _ = muestra_repo.find_by_id(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound)?;
    
    // Obtener ensayos de esta muestra
    let ensayo_repo = EnsayoRepository::new(state.db_pool.clone());
    let ensayos = ensayo_repo.find_by_muestra(&id).await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(Json(ensayos))
}
