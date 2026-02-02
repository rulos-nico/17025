use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put},
    Json, Router,
};
use chrono::Utc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreateEquipo, Equipo, UpdateEquipo};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_equipos).post(create_equipo))
        .route("/{id}", get(get_equipo).put(update_equipo))
}

/// GET /api/equipos
async fn list_equipos(
    State(state): State<AppState>,
) -> Result<Json<Vec<Equipo>>, AppError> {
    let rows = state.sheets_client.read_sheet("Equipos").await?;
    let equipos: Vec<Equipo> = rows
        .iter()
        .filter_map(|row| Equipo::from_row(row))
        .collect();
    Ok(Json(equipos))
}

/// GET /api/equipos/:id
async fn get_equipo(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Equipo>, AppError> {
    let row = state.sheets_client.find_by_id("Equipos", &id).await?;
    let equipo = Equipo::from_row(&row).ok_or(AppError::NotFound)?;
    Ok(Json(equipo))
}

/// POST /api/equipos
async fn create_equipo(
    State(state): State<AppState>,
    Json(payload): Json<CreateEquipo>,
) -> Result<(StatusCode, Json<Equipo>), AppError> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let id = Uuid::new_v4().to_string();

    let codigo = format!("EQP-{:04}", rand_suffix());

    let equipo = Equipo {
        id,
        codigo,
        nombre: payload.nombre,
        serie: payload.serie,
        placa: payload.placa,
        descripcion: payload.descripcion,
        marca: payload.marca,
        modelo: payload.modelo,
        ubicacion: payload.ubicacion,
        estado: "operativo".to_string(),
        fecha_calibracion: None,
        proxima_calibracion: None,
        incertidumbre: None,
        error_maximo: None,
        certificado_id: None,
        responsable: None,
        observaciones: None,
        activo: true,
        created_at: now.clone(),
        updated_at: now,
    };

    state
        .sheets_client
        .append_row("Equipos", equipo.to_row())
        .await?;

    Ok((StatusCode::CREATED, Json(equipo)))
}

/// PUT /api/equipos/:id
async fn update_equipo(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateEquipo>,
) -> Result<Json<Equipo>, AppError> {
    let row_number = state
        .sheets_client
        .find_row_number_by_id("Equipos", &id)
        .await?;

    let row = state.sheets_client.find_by_id("Equipos", &id).await?;
    let mut equipo = Equipo::from_row(&row).ok_or(AppError::NotFound)?;

    if let Some(nombre) = payload.nombre {
        equipo.nombre = nombre;
    }
    if let Some(descripcion) = payload.descripcion {
        equipo.descripcion = Some(descripcion);
    }
    if let Some(ubicacion) = payload.ubicacion {
        equipo.ubicacion = Some(ubicacion);
    }
    if let Some(estado) = payload.estado {
        equipo.estado = estado;
    }
    if let Some(fecha_calibracion) = payload.fecha_calibracion {
        equipo.fecha_calibracion = Some(fecha_calibracion);
    }
    if let Some(proxima_calibracion) = payload.proxima_calibracion {
        equipo.proxima_calibracion = Some(proxima_calibracion);
    }
    if let Some(incertidumbre) = payload.incertidumbre {
        equipo.incertidumbre = Some(incertidumbre);
    }
    if let Some(error_maximo) = payload.error_maximo {
        equipo.error_maximo = Some(error_maximo);
    }
    if let Some(certificado_id) = payload.certificado_id {
        equipo.certificado_id = Some(certificado_id);
    }
    if let Some(responsable) = payload.responsable {
        equipo.responsable = Some(responsable);
    }
    if let Some(observaciones) = payload.observaciones {
        equipo.observaciones = Some(observaciones);
    }
    if let Some(activo) = payload.activo {
        equipo.activo = activo;
    }

    equipo.updated_at = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    state
        .sheets_client
        .update_row("Equipos", row_number, equipo.to_row())
        .await?;

    Ok(Json(equipo))
}

fn rand_suffix() -> u16 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 10000) as u16
}
