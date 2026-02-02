use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put, delete},
    Json, Router,
};
use chrono::Utc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreatePerforacion, Perforacion, UpdatePerforacion};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_perforaciones).post(create_perforacion))
        .route("/{id}", get(get_perforacion).put(update_perforacion).delete(delete_perforacion))
        .route("/{id}/ensayos", get(get_ensayos_by_perforacion))
}

/// GET /api/perforaciones
async fn list_perforaciones(
    State(state): State<AppState>,
) -> Result<Json<Vec<Perforacion>>, AppError> {
    let rows = state.sheets_client.read_sheet("Perforaciones").await?;
    let perforaciones: Vec<Perforacion> = rows
        .iter()
        .filter_map(|row| Perforacion::from_row(row))
        .collect();
    Ok(Json(perforaciones))
}

/// GET /api/perforaciones/:id
async fn get_perforacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Perforacion>, AppError> {
    let row = state.sheets_client.find_by_id("Perforaciones", &id).await?;
    let perforacion = Perforacion::from_row(&row).ok_or(AppError::NotFound)?;
    Ok(Json(perforacion))
}

/// POST /api/perforaciones
async fn create_perforacion(
    State(state): State<AppState>,
    Json(payload): Json<CreatePerforacion>,
) -> Result<(StatusCode, Json<Perforacion>), AppError> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let id = Uuid::new_v4().to_string();

    let codigo = format!(
        "PER-{}-{:04}",
        Utc::now().format("%Y%m%d"),
        rand_suffix()
    );

    let perforacion = Perforacion {
        id,
        codigo,
        proyecto_id: payload.proyecto_id,
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        ubicacion: payload.ubicacion,
        profundidad: payload.profundidad,
        fecha_inicio: payload.fecha_inicio,
        fecha_fin: None,
        estado: "activo".to_string(),
        drive_folder_id: None,
        created_at: now.clone(),
        updated_at: now,
    };

    state
        .sheets_client
        .append_row("Perforaciones", perforacion.to_row())
        .await?;

    Ok((StatusCode::CREATED, Json(perforacion)))
}

/// PUT /api/perforaciones/:id
async fn update_perforacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdatePerforacion>,
) -> Result<Json<Perforacion>, AppError> {
    let row_number = state
        .sheets_client
        .find_row_number_by_id("Perforaciones", &id)
        .await?;

    let row = state.sheets_client.find_by_id("Perforaciones", &id).await?;
    let mut perforacion = Perforacion::from_row(&row).ok_or(AppError::NotFound)?;

    if let Some(nombre) = payload.nombre {
        perforacion.nombre = nombre;
    }
    if let Some(descripcion) = payload.descripcion {
        perforacion.descripcion = Some(descripcion);
    }
    if let Some(ubicacion) = payload.ubicacion {
        perforacion.ubicacion = Some(ubicacion);
    }
    if let Some(profundidad) = payload.profundidad {
        perforacion.profundidad = Some(profundidad);
    }
    if let Some(fecha_inicio) = payload.fecha_inicio {
        perforacion.fecha_inicio = Some(fecha_inicio);
    }
    if let Some(fecha_fin) = payload.fecha_fin {
        perforacion.fecha_fin = Some(fecha_fin);
    }
    if let Some(estado) = payload.estado {
        perforacion.estado = estado;
    }

    perforacion.updated_at = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    state
        .sheets_client
        .update_row("Perforaciones", row_number, perforacion.to_row())
        .await?;

    Ok(Json(perforacion))
}

/// DELETE /api/perforaciones/:id
async fn delete_perforacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let row_number = state
        .sheets_client
        .find_row_number_by_id("Perforaciones", &id)
        .await?;

    state.sheets_client.delete_row("Perforaciones", row_number).await?;

    Ok(StatusCode::NO_CONTENT)
}

/// GET /api/perforaciones/:id/ensayos
async fn get_ensayos_by_perforacion(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Vec<crate::models::Ensayo>>, AppError> {
    let rows = state.sheets_client.read_sheet("Ensayos").await?;
    
    let ensayos: Vec<crate::models::Ensayo> = rows
        .iter()
        .filter_map(|row| crate::models::Ensayo::from_row(row))
        .filter(|e| e.perforacion_id == id)
        .collect();

    Ok(Json(ensayos))
}

fn rand_suffix() -> u16 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 10000) as u16
}
