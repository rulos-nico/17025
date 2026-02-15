use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("No se encontró el recurso")]
    NotFound,

    #[error("Error interno del servidor")]
    InternalServerError,

    #[error("Solicitud inválida: {0}")]
    BadRequest(String),

    #[error("Google Sheets error: {0}")]
    SheetsError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Autenticación fallida")]
    Unauthorized,

    #[error("Google Drive error: {0}")]
    DriveError(String),
}

// Implementar From<sqlx::Error> para eliminar .map_err() repetidos
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::DatabaseError(err.to_string())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match &self {
            AppError::NotFound => (StatusCode::NOT_FOUND, self.to_string()),
            AppError::InternalServerError => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::SheetsError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            AppError::DatabaseError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, self.to_string()),
            AppError::DriveError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
        };

        let body = Json(json!({
            "error": error_message,
            "status": status.as_u16()
        }));

        (status, body).into_response()
    }
}
