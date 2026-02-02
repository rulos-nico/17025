use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Perforacion {
    pub id: String,
    pub codigo: String,
    pub proyecto_id: String,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub ubicacion: Option<String>,
    pub profundidad: Option<f64>,
    pub fecha_inicio: Option<String>,
    pub fecha_fin: Option<String>,
    pub estado: String,
    pub drive_folder_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePerforacion {
    pub proyecto_id: String,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub ubicacion: Option<String>,
    pub profundidad: Option<f64>,
    pub fecha_inicio: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePerforacion {
    pub nombre: Option<String>,
    pub descripcion: Option<String>,
    pub ubicacion: Option<String>,
    pub profundidad: Option<f64>,
    pub fecha_inicio: Option<String>,
    pub fecha_fin: Option<String>,
    pub estado: Option<String>,
}

impl Perforacion {
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 14 {
            return None;
        }
        Some(Perforacion {
            id: row.get(0)?.clone(),
            codigo: row.get(1)?.clone(),
            proyecto_id: row.get(2)?.clone(),
            nombre: row.get(3)?.clone(),
            descripcion: row.get(4).cloned().filter(|s| !s.is_empty()),
            ubicacion: row.get(5).cloned().filter(|s| !s.is_empty()),
            profundidad: row.get(6).and_then(|s| s.parse().ok()),
            fecha_inicio: row.get(7).cloned().filter(|s| !s.is_empty()),
            fecha_fin: row.get(8).cloned().filter(|s| !s.is_empty()),
            estado: row.get(9)?.clone(),
            drive_folder_id: row.get(10).cloned().filter(|s| !s.is_empty()),
            created_at: row.get(11)?.clone(),
            updated_at: row.get(12)?.clone(),
        })
    }

    pub fn to_row(&self) -> Vec<String> {
        vec![
            self.id.clone(),
            self.codigo.clone(),
            self.proyecto_id.clone(),
            self.nombre.clone(),
            self.descripcion.clone().unwrap_or_default(),
            self.ubicacion.clone().unwrap_or_default(),
            self.profundidad.map(|p| p.to_string()).unwrap_or_default(),
            self.fecha_inicio.clone().unwrap_or_default(),
            self.fecha_fin.clone().unwrap_or_default(),
            self.estado.clone(),
            self.drive_folder_id.clone().unwrap_or_default(),
            self.created_at.clone(),
            self.updated_at.clone(),
        ]
    }
}
