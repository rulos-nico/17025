use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put},
    Json, Router,
};
use chrono::Utc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::{Cliente, CreateCliente, UpdateCliente};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_clientes).post(create_cliente))
        .route("/{id}", get(get_cliente).put(update_cliente))
}

/// GET /api/clientes
async fn list_clientes(
    State(state): State<AppState>,
) -> Result<Json<Vec<Cliente>>, AppError> {
    let rows = state.sheets_client.read_sheet("Clientes").await?;
    let clientes: Vec<Cliente> = rows
        .iter()
        .filter_map(|row| Cliente::from_row(row))
        .collect();
    Ok(Json(clientes))
}

/// GET /api/clientes/:id
async fn get_cliente(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Cliente>, AppError> {
    let row = state.sheets_client.find_by_id("Clientes", &id).await?;
    let cliente = Cliente::from_row(&row).ok_or(AppError::NotFound)?;
    Ok(Json(cliente))
}

/// POST /api/clientes
async fn create_cliente(
    State(state): State<AppState>,
    Json(payload): Json<CreateCliente>,
) -> Result<(StatusCode, Json<Cliente>), AppError> {
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let id = Uuid::new_v4().to_string();

    let codigo = format!("CLI-{:04}", rand_suffix());

    let cliente = Cliente {
        id,
        codigo,
        nombre: payload.nombre,
        rut: payload.rut,
        direccion: payload.direccion,
        ciudad: payload.ciudad,
        telefono: payload.telefono,
        email: payload.email,
        contacto_nombre: payload.contacto_nombre,
        contacto_cargo: None,
        contacto_email: None,
        contacto_telefono: None,
        activo: true,
        drive_folder_id: None,
        created_at: now.clone(),
        updated_at: now,
    };

    state
        .sheets_client
        .append_row("Clientes", cliente.to_row())
        .await?;

    Ok((StatusCode::CREATED, Json(cliente)))
}

/// PUT /api/clientes/:id
async fn update_cliente(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateCliente>,
) -> Result<Json<Cliente>, AppError> {
    let row_number = state
        .sheets_client
        .find_row_number_by_id("Clientes", &id)
        .await?;

    let row = state.sheets_client.find_by_id("Clientes", &id).await?;
    let mut cliente = Cliente::from_row(&row).ok_or(AppError::NotFound)?;

    if let Some(nombre) = payload.nombre {
        cliente.nombre = nombre;
    }
    if let Some(rut) = payload.rut {
        cliente.rut = Some(rut);
    }
    if let Some(direccion) = payload.direccion {
        cliente.direccion = Some(direccion);
    }
    if let Some(ciudad) = payload.ciudad {
        cliente.ciudad = Some(ciudad);
    }
    if let Some(telefono) = payload.telefono {
        cliente.telefono = Some(telefono);
    }
    if let Some(email) = payload.email {
        cliente.email = Some(email);
    }
    if let Some(contacto_nombre) = payload.contacto_nombre {
        cliente.contacto_nombre = Some(contacto_nombre);
    }
    if let Some(contacto_cargo) = payload.contacto_cargo {
        cliente.contacto_cargo = Some(contacto_cargo);
    }
    if let Some(contacto_email) = payload.contacto_email {
        cliente.contacto_email = Some(contacto_email);
    }
    if let Some(contacto_telefono) = payload.contacto_telefono {
        cliente.contacto_telefono = Some(contacto_telefono);
    }
    if let Some(activo) = payload.activo {
        cliente.activo = activo;
    }

    cliente.updated_at = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    state
        .sheets_client
        .update_row("Clientes", row_number, cliente.to_row())
        .await?;

    Ok(Json(cliente))
}

fn rand_suffix() -> u16 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 10000) as u16
}
