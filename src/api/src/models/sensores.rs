use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sensor {
    pub id: String,
    pub codigo: String,
    pub tipo: String,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: String,
    /// Proviene de la última calibración asociada (tabla `calibracion`).
    pub rango_medicion: Option<String>,
    /// Proviene de la última calibración asociada (tabla `calibracion`).
    pub precision: Option<String>,
    pub ubicacion: Option<String>,
    pub estado: String,
    /// Proviene de la última calibración asociada (tabla `calibracion`).
    pub fecha_calibracion: Option<String>,
    /// Proviene de la última calibración asociada (tabla `calibracion`).
    pub proxima_calibracion: Option<String>,
    /// Proviene de la última calibración asociada (tabla `calibracion`).
    pub error_maximo: Option<String>,
    /// Proviene de la última calibración asociada (tabla `calibracion`).
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
    pub tipo: String,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: String,
    pub ubicacion: Option<String>,
    /// ID del equipo al que pertenece este sensor (opcional)
    pub equipo_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSensor {
    pub tipo: Option<String>,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub ubicacion: Option<String>,
    pub estado: Option<String>,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub activo: Option<bool>,
    /// ID del equipo al que pertenece este sensor (opcional)
    pub equipo_id: Option<String>,
}

impl Sensor {
    /// Reconstruye un sensor a partir de una fila plana (p. ej. de Google Sheets).
    /// Las columnas calibración-dependientes se dejan en `None` porque ya no se
    /// persisten en la tabla `sensores`; el flujo de Sheets no las maneja.
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 13 {
            return None;
        }
        Some(Sensor {
            id: row.get(0)?.clone(),
            codigo: row.get(1)?.clone(),
            tipo: row.get(2)?.clone(),
            marca: row.get(3).cloned().filter(|s| !s.is_empty()),
            modelo: row.get(4).cloned().filter(|s| !s.is_empty()),
            numero_serie: row.get(5)?.clone(),
            rango_medicion: None,
            precision: None,
            ubicacion: row.get(6).cloned().filter(|s| !s.is_empty()),
            estado: row.get(7)?.clone(),
            fecha_calibracion: None,
            proxima_calibracion: None,
            error_maximo: None,
            certificado_id: None,
            responsable: row.get(8).cloned().filter(|s| !s.is_empty()),
            observaciones: row.get(9).cloned().filter(|s| !s.is_empty()),
            activo: row.get(10).map(|s| s == "true" || s == "1").unwrap_or(true),
            created_at: row.get(11)?.clone(),
            updated_at: row.get(12).cloned().unwrap_or_default(),
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
            self.ubicacion.clone().unwrap_or_default(),
            self.estado.clone(),
            self.responsable.clone().unwrap_or_default(),
            self.observaciones.clone().unwrap_or_default(),
            self.activo.to_string(),
            self.created_at.clone(),
            self.updated_at.clone(),
        ]
    }
}
