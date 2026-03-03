pub mod auth;
pub mod calibraciones;
pub mod cliente;
pub mod comprobaciones;
pub mod ensayo;
pub mod equipos;
pub mod muestra;
pub mod perforacion;
pub mod personal_interno;
pub mod proyecto;
pub mod sensores;
pub mod tipos_ensayo;

use axum::{middleware, Router};
use crate::AppState;
use crate::errors::AppError;
use crate::services::google_sheets::GoogleSheetsClient;

/// Rutas públicas (no requieren autenticación)
pub fn public_routes() -> Router<AppState> {
    Router::new()
        .nest("/auth", auth::routes())
}

/// Rutas protegidas (requieren autenticación)
pub fn protected_routes(state: AppState) -> Router<AppState> {
    Router::new()
        .nest("/calibraciones", calibraciones::routes())
        .nest("/clientes", cliente::routes())
        .nest("/comprobaciones", comprobaciones::routes())
        .nest("/ensayos", ensayo::routes())
        .nest("/equipos", equipos::routes())
        .nest("/muestras", muestra::routes())
        .nest("/perforaciones", perforacion::routes())
        .nest("/personal-interno", personal_interno::routes())
        .nest("/proyectos", proyecto::routes())
        .nest("/sensores", sensores::routes())
        .nest("/tipos-ensayo", tipos_ensayo::routes())
        .layer(middleware::from_fn_with_state(state, auth::require_auth))
}

/// Helper para obtener el cliente de Sheets o retornar error si no está configurado
pub fn require_sheets(client: &Option<GoogleSheetsClient>) -> Result<&GoogleSheetsClient, AppError> {
    client.as_ref().ok_or_else(|| {
        AppError::BadRequest("Google Sheets not configured. Set GOOGLE_SPREADSHEET_ID to enable.".to_string())
    })
}
