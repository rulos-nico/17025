use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Calibracion {
    pub id: String,
    pub sensor_id: String,
    pub fecha_calibracion: String,
    pub proxima_calibracion: String,
    pub rango_medicion: Option<String>,
    pub precision: Option<String>,
    pub error_maximo: Option<String>,
    pub incertidumbre: Option<String>,
    pub certificado_id: Option<String>,
    pub estado: String,
    pub factor: Decimal,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCalibracion {
    pub sensor_id: String,
    pub fecha_calibracion: String,
    pub proxima_calibracion: String,
    pub rango_medicion: Option<String>,
    pub precision: Option<String>,
    pub error_maximo: Option<String>,
    pub incertidumbre: Option<String>,
    pub certificado_id: Option<String>,
    pub estado: String,
    pub factor: Decimal,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCalibracion {
    pub fecha_calibracion: Option<String>,
    pub proxima_calibracion: Option<String>,
    pub rango_medicion: Option<String>,
    pub precision: Option<String>,
    pub error_maximo: Option<String>,
    pub incertidumbre: Option<String>,
    pub certificado_id: Option<String>,
    pub estado: Option<String>,
    pub factor: Option<Decimal>,
}
