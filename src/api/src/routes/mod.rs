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
pub mod tipo_ensayo_sheet;

use axum::{middleware, Router};
use crate::AppState;

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
        .nest("/tipos-ensayo-sheets", tipo_ensayo_sheet::routes())
        .layer(middleware::from_fn_with_state(state, auth::require_auth))
}
