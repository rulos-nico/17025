use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comprobacion {
    pub id: String,
    pub sensor_id: String,
    pub fecha: String,
    pub data: JsonValue,
    pub resultado: String,   // FK a comprobacion_resultados
    pub responsable: String, // FK a usuarios.id
    pub observaciones: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateComprobacion {
    pub sensor_id: String,
    pub fecha: String,
    pub data: JsonValue,
    pub resultado: String,
    pub responsable: String,
    pub observaciones: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateComprobacion {
    pub fecha: Option<String>,
    pub data: Option<JsonValue>,
    pub resultado: Option<String>,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
}
