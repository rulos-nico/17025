use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put, delete},
    Json, Router,
};
use chrono::Utc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreateSensor, Sensor, UpdateSensor};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_sensores).post(create_sensor))
        .route("/{id}", get(get_sensor).put(update_sensor).delete(delete_sensor))
}

/// GET /api/sensores
async fn list_sensores(
    State(state): State<AppState>,
) -> Result<Json<Vec<Sensor>>, AppError> {
    let rows = state.sheets_client.read_sheet("Sensores").await?;
    let sensores: Vec<Sensor> = rows
        .iter()
        .filter_map(|row| Sensor::from_row(row))
        .collect();
    Ok(Json(sensores))
}

/// GET /api/sensores/:id
async fn get_sensor(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Sensor>, AppError> {
    let row = state.sheets_client.find_by_id("Sensores", &id).await?;
    let sensor = Sensor::from_row(&row).ok_or(AppError::NotFound)?;
    Ok(Json(sensor))
}

/// POST /api/sensores
async fn create_sensor(
    State(state): State<AppState>,
    Json(payload): Json<CreateSensor>,
) -> Result<(StatusCode, Json<Sensor>), AppError> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let id = Uuid::new_v4().to_string();

    let codigo = format!("SNS-{:04}", rand_suffix());

    let sensor = Sensor {
        id,
        codigo,
        tipo: payload.tipo,
        marca: payload.marca,
        modelo: payload.modelo,
        numero_serie: payload.numero_serie,
        rango_medicion: payload.rango_medicion,
        precision: payload.precision,
        ubicacion: payload.ubicacion,
        estado: "operativo".to_string(),
        fecha_calibracion: None,
        proxima_calibracion: None,
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
        .append_row("Sensores", sensor.to_row())
        .await?;

    Ok((StatusCode::CREATED, Json(sensor)))
}

/// PUT /api/sensores/:id
async fn update_sensor(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateSensor>,
) -> Result<Json<Sensor>, AppError> {
    let row_number = state
        .sheets_client
        .find_row_number_by_id("Sensores", &id)
        .await?;

    let row = state.sheets_client.find_by_id("Sensores", &id).await?;
    let mut sensor = Sensor::from_row(&row).ok_or(AppError::NotFound)?;

    if let Some(tipo) = payload.tipo {
        sensor.tipo = tipo;
    }
    if let Some(marca) = payload.marca {
        sensor.marca = Some(marca);
    }
    if let Some(modelo) = payload.modelo {
        sensor.modelo = Some(modelo);
    }
    if let Some(rango_medicion) = payload.rango_medicion {
        sensor.rango_medicion = Some(rango_medicion);
    }
    if let Some(precision) = payload.precision {
        sensor.precision = Some(precision);
    }
    if let Some(ubicacion) = payload.ubicacion {
        sensor.ubicacion = Some(ubicacion);
    }
    if let Some(estado) = payload.estado {
        sensor.estado = estado;
    }
    if let Some(fecha_calibracion) = payload.fecha_calibracion {
        sensor.fecha_calibracion = Some(fecha_calibracion);
    }
    if let Some(proxima_calibracion) = payload.proxima_calibracion {
        sensor.proxima_calibracion = Some(proxima_calibracion);
    }
    if let Some(error_maximo) = payload.error_maximo {
        sensor.error_maximo = Some(error_maximo);
    }
    if let Some(certificado_id) = payload.certificado_id {
        sensor.certificado_id = Some(certificado_id);
    }
    if let Some(responsable) = payload.responsable {
        sensor.responsable = Some(responsable);
    }
    if let Some(observaciones) = payload.observaciones {
        sensor.observaciones = Some(observaciones);
    }
    if let Some(activo) = payload.activo {
        sensor.activo = activo;
    }

    sensor.updated_at = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    state
        .sheets_client
        .update_row("Sensores", row_number, sensor.to_row())
        .await?;

    Ok(Json(sensor))
}

/// DELETE /api/sensores/:id
async fn delete_sensor(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let row_number = state
        .sheets_client
        .find_row_number_by_id("Sensores", &id)
        .await?;

    state.sheets_client.delete_row("Sensores", row_number).await?;

    Ok(StatusCode::NO_CONTENT)
}

fn rand_suffix() -> u16 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 10000) as u16
}
