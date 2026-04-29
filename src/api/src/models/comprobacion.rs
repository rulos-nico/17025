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
    pub valor_patron: Option<f64>,
    pub unidad: Option<String>,
    pub n_replicas: Option<i32>,
    pub media: Option<f64>,
    pub desviacion_std: Option<f64>,
    pub error: Option<f64>,
    pub incertidumbre: Option<f64>,
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
    pub valor_patron: Option<f64>,
    pub unidad: Option<String>,
    pub n_replicas: Option<i32>,
    pub media: Option<f64>,
    pub desviacion_std: Option<f64>,
    pub error: Option<f64>,
    pub incertidumbre: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateComprobacion {
    pub fecha: Option<String>,
    pub data: Option<JsonValue>,
    pub resultado: Option<String>,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub valor_patron: Option<f64>,
    pub unidad: Option<String>,
    pub n_replicas: Option<i32>,
    pub media: Option<f64>,
    pub desviacion_std: Option<f64>,
    pub error: Option<f64>,
    pub incertidumbre: Option<f64>,
}
