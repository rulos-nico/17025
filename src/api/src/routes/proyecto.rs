use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put, delete},
    Json, Router,
};
use chrono::Utc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{CreateProyecto, Proyecto, UpdateProyecto, Perforacion};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_proyectos).post(create_proyecto))
        .route("/{id}", get(get_proyecto).put(update_proyecto).delete(delete_proyecto))
        .route("/{id}/perforaciones", get(get_perforaciones_by_proyecto))
}

/// GET /api/proyectos
async fn list_proyectos(
    State(state): State<AppState>,
) -> Result<Json<Vec<Proyecto>>, AppError> {
    let rows = state.sheets_client.read_sheet("Proyectos").await?;
    let proyectos: Vec<Proyecto> = rows
        .iter()
        .filter_map(|row| Proyecto::from_row(row))
        .collect();
    Ok(Json(proyectos))
}

/// GET /api/proyectos/:id
async fn get_proyecto(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Proyecto>, AppError> {
    let row = state.sheets_client.find_by_id("Proyectos", &id).await?;
    let proyecto = Proyecto::from_row(&row).ok_or(AppError::NotFound)?;
    Ok(Json(proyecto))
}

/// POST /api/proyectos
async fn create_proyecto(
    State(state): State<AppState>,
    Json(payload): Json<CreateProyecto>,
) -> Result<(StatusCode, Json<Proyecto>), AppError> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let id = Uuid::new_v4().to_string();

    let codigo = format!(
        "PRY-{}-{:04}",
        Utc::now().format("%Y%m%d"),
        rand_suffix()
    );

    let proyecto = Proyecto {
        id,
        codigo,
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        fecha_inicio: payload.fecha_inicio,
        fecha_fin_estimada: payload.fecha_fin_estimada,
        cliente_id: payload.cliente_id,
        cliente_nombre: payload.cliente_nombre,
        contacto: payload.contacto,
        estado: "activo".to_string(),
        fecha_fin_real: None,
        drive_folder_id: None,
        created_at: now.clone(),
        updated_at: now,
        created_by: None,
    };

    state
        .sheets_client
        .append_row("Proyectos", proyecto.to_row())
        .await?;

    Ok((StatusCode::CREATED, Json(proyecto)))
}

/// PUT /api/proyectos/:id
async fn update_proyecto(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateProyecto>,
) -> Result<Json<Proyecto>, AppError> {
    let row_number = state
        .sheets_client
        .find_row_number_by_id("Proyectos", &id)
        .await?;

    let row = state.sheets_client.find_by_id("Proyectos", &id).await?;
    let mut proyecto = Proyecto::from_row(&row).ok_or(AppError::NotFound)?;

    if let Some(nombre) = payload.nombre {
        proyecto.nombre = nombre;
    }
    if let Some(descripcion) = payload.descripcion {
        proyecto.descripcion = descripcion;
    }
    if let Some(contacto) = payload.contacto {
        proyecto.contacto = Some(contacto);
    }
    if let Some(estado) = payload.estado {
        proyecto.estado = estado;
    }
    if let Some(fecha) = payload.fecha_fin_estimada {
        proyecto.fecha_fin_estimada = Some(fecha);
    }
    if let Some(fecha) = payload.fecha_fin_real {
        proyecto.fecha_fin_real = Some(fecha);
    }

    proyecto.updated_at = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    state
        .sheets_client
        .update_row("Proyectos", row_number, proyecto.to_row())
        .await?;

    Ok(Json(proyecto))
}

/// DELETE /api/proyectos/:id
async fn delete_proyecto(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let row_number = state
        .sheets_client
        .find_row_number_by_id("Proyectos", &id)
        .await?;

    state.sheets_client.delete_row("Proyectos", row_number).await?;

    Ok(StatusCode::NO_CONTENT)
}

/// GET /api/proyectos/:id/perforaciones
async fn get_perforaciones_by_proyecto(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Perforacion>>, AppError> {
    let rows = state.sheets_client.read_sheet("Perforaciones").await?;
    
    let perforaciones: Vec<Perforacion> = rows
        .iter()
        .filter_map(|row| Perforacion::from_row(row))
        .filter(|p| p.proyecto_id == id)
        .collect();

    Ok(Json(perforaciones))
}

fn rand_suffix() -> u16 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 10000) as u16
}
