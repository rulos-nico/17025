pub mod auth;
pub mod cliente;
pub mod ensayo;
pub mod equipos;
pub mod muestra;
pub mod perforacion;
pub mod proyecto;
pub mod sensores;
pub mod sync;

use axum::Router;
use crate::AppState;
use crate::errors::AppError;
use crate::services::google_sheets::GoogleSheetsClient;

pub fn api_routes() -> Router<AppState> {
    Router::new()
        .nest("/auth", auth::routes())
        .nest("/clientes", cliente::routes())
        .nest("/ensayos", ensayo::routes())
        .nest("/equipos", equipos::routes())
        .nest("/muestras", muestra::routes())
        .nest("/perforaciones", perforacion::routes())
        .nest("/proyectos", proyecto::routes())
        .nest("/sensores", sensores::routes())
        .nest("/sync", sync::routes())
}

/// Helper para obtener el cliente de Sheets o retornar error si no está configurado
pub fn require_sheets(client: &Option<GoogleSheetsClient>) -> Result<&GoogleSheetsClient, AppError> {
    client.as_ref().ok_or_else(|| {
        AppError::BadRequest("Google Sheets not configured. Set GOOGLE_SPREADSHEET_ID to enable.".to_string())
    })
}
