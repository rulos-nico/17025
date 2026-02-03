mod config;
mod db;
mod errors;
mod models;
mod repositories;
mod routes;
mod services;

use axum::Router;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::db::DbPool;
use crate::services::google_sheets::GoogleSheetsClient;
use crate::services::google_drive::GoogleDriveClient;
use crate::services::ensayo_sheets::EnsayoSheetsService;

#[derive(Clone)]
pub struct AppState {
    pub sheets_client: Option<GoogleSheetsClient>,
    pub ensayo_sheets_service: Option<EnsayoSheetsService>,
    pub db_pool: DbPool,
    pub config: Config,
}

#[tokio::main]
async fn main() {
    // Inicializar logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Cargar configuración
    dotenvy::dotenv().ok();
    let config = Config::from_env();

    // Inicializar conexión a base de datos
    let db_pool = db::create_pool(&config.database_url)
        .await
        .expect("Failed to create database pool");

    // Ejecutar migraciones si está configurado
    if config.run_migrations {
        tracing::info!("Running database migrations...");
        db::run_migrations(&db_pool)
            .await
            .expect("Failed to run migrations");
        tracing::info!("Migrations completed successfully");
    }

    // Inicializar cliente de Google Sheets (opcional)
    let sheets_client = if config.has_google_sheets() {
        match GoogleSheetsClient::new(&config).await {
            Ok(client) => {
                tracing::info!("Google Sheets client initialized successfully");
                Some(client)
            }
            Err(e) => {
                tracing::warn!("Google Sheets disabled: {}", e);
                None
            }
        }
    } else {
        tracing::info!("Google Sheets not configured - running in database-only mode");
        None
    };

    // Inicializar EnsayoSheetsService (para plantillas y PDFs)
    let ensayo_sheets_service = if config.has_google_drive() {
        match GoogleDriveClient::new(&config).await {
            Ok(drive_client) => {
                tracing::info!("Google Drive client initialized successfully");
                let service = EnsayoSheetsService::new(drive_client);
                tracing::info!("EnsayoSheetsService initialized - PDF generation enabled");
                Some(service)
            }
            Err(e) => {
                tracing::warn!("EnsayoSheetsService disabled: {}", e);
                None
            }
        }
    } else {
        tracing::info!("Google Drive not configured - PDF generation disabled");
        None
    };

    let state = AppState {
        sheets_client,
        ensayo_sheets_service,
        db_pool,
        config: config.clone(),
    };

    // Configurar CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Construir router
    let app = Router::new()
        .nest("/api", routes::api_routes())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Iniciar servidor
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
