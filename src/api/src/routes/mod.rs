pub mod auth;
pub mod cliente;
pub mod ensayo;
pub mod equipos;
pub mod perforacion;
pub mod proyecto;
pub mod sensores;
pub mod sync;

use axum::Router;
use crate::AppState;

pub fn api_routes() -> Router<AppState> {
    Router::new()
        .nest("/auth", auth::routes())
        .nest("/clientes", cliente::routes())
        .nest("/ensayos", ensayo::routes())
        .nest("/equipos", equipos::routes())
        .nest("/perforaciones", perforacion::routes())
        .nest("/proyectos", proyecto::routes())
        .nest("/sensores", sensores::routes())
        .nest("/sync", sync::routes())
}
