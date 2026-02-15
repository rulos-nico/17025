use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Calibracion {
    pub id: String,
    pub equipo_id: String,
    pub fecha: String,
    pub laboratorio: String,
    pub certificado: Option<String>,
    pub factor: Option<f64>,
    pub incertidumbre: Option<String>,
    pub proxima_calibracion: Option<String>,
    pub observaciones: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCalibracion {
    pub equipo_id: String,
    pub fecha: String,
    pub laboratorio: String,
    pub certificado: Option<String>,
    pub factor: Option<f64>,
    pub incertidumbre: Option<String>,
    pub proxima_calibracion: Option<String>,
    pub observaciones: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCalibracion {
    pub fecha: Option<String>,
    pub laboratorio: Option<String>,
    pub certificado: Option<String>,
    pub factor: Option<f64>,
    pub incertidumbre: Option<String>,
    pub proxima_calibracion: Option<String>,
    pub observaciones: Option<String>,
}

impl Calibracion {
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 11 {
            return None;
        }
        Some(Calibracion {
            id: row.get(0)?.clone(),
            equipo_id: row.get(1)?.clone(),
            fecha: row.get(2)?.clone(),
            laboratorio: row.get(3)?.clone(),
            certificado: row.get(4).cloned().filter(|s| !s.is_empty()),
            factor: row.get(5).and_then(|s| s.parse().ok()),
            incertidumbre: row.get(6).cloned().filter(|s| !s.is_empty()),
            proxima_calibracion: row.get(7).cloned().filter(|s| !s.is_empty()),
            observaciones: row.get(8).cloned().filter(|s| !s.is_empty()),
            created_at: row.get(9)?.clone(),
            updated_at: row.get(10)?.clone(),
        })
    }

    pub fn to_row(&self) -> Vec<String> {
        vec![
            self.id.clone(),
            self.equipo_id.clone(),
            self.fecha.clone(),
            self.laboratorio.clone(),
            self.certificado.clone().unwrap_or_default(),
            self.factor.map(|f| f.to_string()).unwrap_or_default(),
            self.incertidumbre.clone().unwrap_or_default(),
            self.proxima_calibracion.clone().unwrap_or_default(),
            self.observaciones.clone().unwrap_or_default(),
            self.created_at.clone(),
            self.updated_at.clone(),
        ]
    }
}
