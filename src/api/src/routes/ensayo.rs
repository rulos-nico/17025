use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put},
    Json, Router,
};
use chrono::Utc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreateEnsayo, Ensayo, UpdateEnsayo, UpdateEnsayoStatus};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_ensayos).post(create_ensayo))
        .route("/{id}", get(get_ensayo).put(update_ensayo))
        .route("/{id}/status", put(update_status))
}

/// GET /api/ensayos
async fn list_ensayos(
    State(state): State<AppState>,
) -> Result<Json<Vec<Ensayo>>, AppError> {
    let rows = state.sheets_client.read_sheet("Ensayos").await?;
    let ensayos: Vec<Ensayo> = rows
        .iter()
        .filter_map(|row| Ensayo::from_row(row))
        .collect();
    Ok(Json(ensayos))
}

/// GET /api/ensayos/:id
async fn get_ensayo(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Ensayo>, AppError> {
    let row = state.sheets_client.find_by_id("Ensayos", &id).await?;
    let ensayo = Ensayo::from_row(&row).ok_or(AppError::NotFound)?;
    Ok(Json(ensayo))
}

/// POST /api/ensayos
async fn create_ensayo(
    State(state): State<AppState>,
    Json(payload): Json<CreateEnsayo>,
) -> Result<(StatusCode, Json<Ensayo>), AppError> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let id = Uuid::new_v4().to_string();

    let codigo = format!(
        "ENS-{}-{:04}",
        Utc::now().format("%Y%m%d"),
        rand_suffix()
    );

    let ensayo = Ensayo {
        id,
        codigo,
        tipo: payload.tipo,
        perforacion_id: payload.perforacion_id,
        proyecto_id: payload.proyecto_id,
        muestra: payload.muestra,
        norma: payload.norma,
        workflow_state: "E1".to_string(),
        fecha_solicitud: payload.fecha_solicitud,
        fecha_programacion: None,
        fecha_ejecucion: None,
        fecha_reporte: None,
        fecha_entrega: None,
        tecnico_id: None,
        tecnico_nombre: None,
        sheet_id: None,
        sheet_url: None,
        equipos_utilizados: vec![],
        observaciones: payload.observaciones,
        urgente: payload.urgente.unwrap_or(false),
        created_at: now.clone(),
        updated_at: now,
    };

    state
        .sheets_client
        .append_row("Ensayos", ensayo.to_row())
        .await?;

    Ok((StatusCode::CREATED, Json(ensayo)))
}

/// PUT /api/ensayos/:id
async fn update_ensayo(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateEnsayo>,
) -> Result<Json<Ensayo>, AppError> {
    let row_number = state
        .sheets_client
        .find_row_number_by_id("Ensayos", &id)
        .await?;

    let row = state.sheets_client.find_by_id("Ensayos", &id).await?;
    let mut ensayo = Ensayo::from_row(&row).ok_or(AppError::NotFound)?;

    if let Some(workflow_state) = payload.workflow_state {
        ensayo.workflow_state = workflow_state;
    }
    if let Some(fecha_programacion) = payload.fecha_programacion {
        ensayo.fecha_programacion = Some(fecha_programacion);
    }
    if let Some(fecha_ejecucion) = payload.fecha_ejecucion {
        ensayo.fecha_ejecucion = Some(fecha_ejecucion);
    }
    if let Some(fecha_reporte) = payload.fecha_reporte {
        ensayo.fecha_reporte = Some(fecha_reporte);
    }
    if let Some(fecha_entrega) = payload.fecha_entrega {
        ensayo.fecha_entrega = Some(fecha_entrega);
    }
    if let Some(tecnico_id) = payload.tecnico_id {
        ensayo.tecnico_id = Some(tecnico_id);
    }
    if let Some(tecnico_nombre) = payload.tecnico_nombre {
        ensayo.tecnico_nombre = Some(tecnico_nombre);
    }
    if let Some(observaciones) = payload.observaciones {
        ensayo.observaciones = Some(observaciones);
    }

    ensayo.updated_at = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    state
        .sheets_client
        .update_row("Ensayos", row_number, ensayo.to_row())
        .await?;

    Ok(Json(ensayo))
}

/// PUT /api/ensayos/:id/status
async fn update_status(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateEnsayoStatus>,
) -> Result<Json<Ensayo>, AppError> {
    let row_number = state
        .sheets_client
        .find_row_number_by_id("Ensayos", &id)
        .await?;

    let row = state.sheets_client.find_by_id("Ensayos", &id).await?;
    let mut ensayo = Ensayo::from_row(&row).ok_or(AppError::NotFound)?;

    // TODO: Validar transición de estado según WORKFLOW_TRANSITIONS
    ensayo.workflow_state = payload.workflow_state;
    ensayo.updated_at = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    state
        .sheets_client
        .update_row("Ensayos", row_number, ensayo.to_row())
        .await?;

    Ok(Json(ensayo))
}

fn rand_suffix() -> u16 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 10000) as u16
}
