use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Equipo {
    pub id: String,
    pub codigo: String,
    pub nombre: String,
    pub serie: String,
    pub placa: Option<String>,
    pub descripcion: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub ubicacion: Option<String>,
    pub estado: String,
    pub fecha_calibracion: Option<String>,
    pub proxima_calibracion: Option<String>,
    pub incertidumbre: Option<f64>,
    pub error_maximo: Option<f64>,
    pub certificado_id: Option<String>,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub activo: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateEquipo {
    pub nombre: String,
    pub serie: String,
    pub placa: Option<String>,
    pub descripcion: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub ubicacion: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEquipo {
    pub nombre: Option<String>,
    pub descripcion: Option<String>,
    pub ubicacion: Option<String>,
    pub estado: Option<String>,
    pub fecha_calibracion: Option<String>,
    pub proxima_calibracion: Option<String>,
    pub incertidumbre: Option<f64>,
    pub error_maximo: Option<f64>,
    pub certificado_id: Option<String>,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub activo: Option<bool>,
}

impl Equipo {
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 20 {
            return None;
        }
        Some(Equipo {
            id: row.get(0)?.clone(),
            codigo: row.get(1)?.clone(),
            nombre: row.get(2)?.clone(),
            serie: row.get(3)?.clone(),
            placa: row.get(4).cloned().filter(|s| !s.is_empty()),
            descripcion: row.get(5).cloned().filter(|s| !s.is_empty()),
            marca: row.get(6).cloned().filter(|s| !s.is_empty()),
            modelo: row.get(7).cloned().filter(|s| !s.is_empty()),
            ubicacion: row.get(8).cloned().filter(|s| !s.is_empty()),
            estado: row.get(9)?.clone(),
            fecha_calibracion: row.get(10).cloned().filter(|s| !s.is_empty()),
            proxima_calibracion: row.get(11).cloned().filter(|s| !s.is_empty()),
            incertidumbre: row.get(12).and_then(|s| s.parse().ok()),
            error_maximo: row.get(13).and_then(|s| s.parse().ok()),
            certificado_id: row.get(14).cloned().filter(|s| !s.is_empty()),
            responsable: row.get(15).cloned().filter(|s| !s.is_empty()),
            observaciones: row.get(16).cloned().filter(|s| !s.is_empty()),
            activo: row.get(17).map(|s| s == "true" || s == "1").unwrap_or(true),
            created_at: row.get(18)?.clone(),
            updated_at: row.get(19)?.clone(),
        })
    }

    pub fn to_row(&self) -> Vec<String> {
        vec![
            self.id.to_string(),
            self.codigo.clone(),
            self.nombre.clone(),
            self.serie.clone(),
            self.placa.clone().unwrap_or_default(),
            self.descripcion.clone().unwrap_or_default(),
            self.marca.clone().unwrap_or_default(),
            self.modelo.clone().unwrap_or_default(),
            self.ubicacion.clone().unwrap_or_default(),
            self.estado.clone(),
            self.fecha_calibracion.clone().unwrap_or_default(),
            self.proxima_calibracion.clone().unwrap_or_default(),
            self.incertidumbre
                .map(|v| v.to_string())
                .unwrap_or_default(),
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
