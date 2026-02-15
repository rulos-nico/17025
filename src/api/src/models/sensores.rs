use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sensor {
    pub id: String,
    pub codigo: String,
    pub tipo: String,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: String,
    pub rango_medicion: Option<String>,
    pub precision: Option<String>,
    pub ubicacion: Option<String>,
    pub estado: String,
    pub fecha_calibracion: Option<String>,
    pub proxima_calibracion: Option<String>,
    pub error_maximo: Option<f64>,
    pub certificado_id: Option<String>,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub activo: bool,
    pub created_at: String,
    pub updated_at: String,
    /// ID del equipo al que pertenece este sensor (opcional)
    pub equipo_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSensor {
    pub codigo: String,
    pub tipo: String,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: String,
    pub rango_medicion: Option<String>,
    pub precision: Option<String>,
    pub ubicacion: Option<String>,
    /// ID del equipo al que pertenece este sensor (opcional)
    pub equipo_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSensor {
    pub tipo: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub rango_medicion: Option<String>,
    pub precision: Option<String>,
    pub ubicacion: Option<String>,
    pub estado: Option<String>,
    pub fecha_calibracion: Option<String>,
    pub proxima_calibracion: Option<String>,
    pub error_maximo: Option<f64>,
    pub certificado_id: Option<String>,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub activo: Option<bool>,
    /// ID del equipo al que pertenece este sensor (opcional)
    pub equipo_id: Option<String>,
}

impl Sensor {
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 18 {
            return None;
        }
        Some(Sensor {
            id: row.get(0)?.clone(),
            codigo: row.get(1)?.clone(),
            tipo: row.get(2)?.clone(),
            marca: row.get(3).cloned().filter(|s| !s.is_empty()),
            modelo: row.get(4).cloned().filter(|s| !s.is_empty()),
            numero_serie: row.get(5)?.clone(),
            rango_medicion: row.get(6).cloned().filter(|s| !s.is_empty()),
            precision: row.get(7).cloned().filter(|s| !s.is_empty()),
            ubicacion: row.get(8).cloned().filter(|s| !s.is_empty()),
            estado: row.get(9)?.clone(),
            fecha_calibracion: row.get(10).cloned().filter(|s| !s.is_empty()),
            proxima_calibracion: row.get(11).cloned().filter(|s| !s.is_empty()),
            error_maximo: row.get(12).and_then(|s| s.parse().ok()),
            certificado_id: row.get(13).cloned().filter(|s| !s.is_empty()),
            responsable: row.get(14).cloned().filter(|s| !s.is_empty()),
            observaciones: row.get(15).cloned().filter(|s| !s.is_empty()),
            activo: row.get(16).map(|s| s == "true" || s == "1").unwrap_or(true),
            created_at: row.get(17)?.clone(),
            updated_at: row.get(18).cloned().unwrap_or_default(),
            // equipo_id no viene de Sheets, siempre None al sincronizar
            equipo_id: None,
        })
    }

    pub fn to_row(&self) -> Vec<String> {
        vec![
            self.id.clone(),
            self.codigo.clone(),
            self.tipo.clone(),
            self.marca.clone().unwrap_or_default(),
            self.modelo.clone().unwrap_or_default(),
            self.numero_serie.clone(),
            self.rango_medicion.clone().unwrap_or_default(),
            self.precision.clone().unwrap_or_default(),
            self.ubicacion.clone().unwrap_or_default(),
            self.estado.clone(),
            self.fecha_calibracion.clone().unwrap_or_default(),
            self.proxima_calibracion.clone().unwrap_or_default(),
            self.error_maximo.map(|v| v.to_string()).unwrap_or_default(),
            self.certificado_id.clone().unwrap_or_default(),
            self.responsable.clone().unwrap_or_default(),
            self.observaciones.clone().unwrap_or_default(),
            self.activo.to_string(),
            self.created_at.clone(),
            self.updated_at.clone(),
        ]
    }
}
