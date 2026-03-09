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

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Autenticación fallida")]
    Unauthorized,

    #[error("Google Drive error: {0}")]
    DriveError(String),
}

// Implementar From<sqlx::Error> con manejo inteligente de errores de Postgres
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        // Inspeccionar errores específicos de PostgreSQL
        if let sqlx::Error::Database(ref db_err) = err {
            if let Some(code) = db_err.code() {
                match code.as_ref() {
                    // 23505 = unique_violation (ej: nombre duplicado)
                    "23505" => {
                        return AppError::BadRequest("Ya existe un registro con esos datos".into());
                    }
                    // 22P02 = invalid_text_representation (ej: valor inválido para enum)
                    "22P02" => {
                        return AppError::BadRequest(
                            "Valor inválido para uno de los campos".into(),
                        );
                    }
                    // 23503 = foreign_key_violation (ej: referencia a registro inexistente)
                    "23503" => {
                        return AppError::BadRequest(
                            "Referencia inválida: el registro relacionado no existe".into(),
                        );
                    }
                    // 23502 = not_null_violation
                    "23502" => {
                        return AppError::BadRequest("Falta un campo requerido".into());
                    }
                    _ => {}
                }
            }
        }

        // Fallback: loguear el error real pero devolver mensaje genérico
        tracing::error!("Database error: {}", err);
        AppError::DatabaseError("Error de base de datos".into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match &self {
            AppError::NotFound => (StatusCode::NOT_FOUND, self.to_string()),
            AppError::InternalServerError => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
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
