use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proyecto {
    pub id: String,
    pub codigo: String,
    pub nombre: String,
    pub descripcion: String,
    pub fecha_inicio: String,
    pub fecha_fin_estimada: Option<String>,
    pub cliente_id: String,
    pub cliente_nombre: String,
    pub contacto: Option<String>,
    pub estado: String,
    pub fecha_fin_real: Option<String>,
    pub drive_folder_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProyecto {
    pub nombre: String,
    pub descripcion: String,
    pub fecha_inicio: String,
    pub fecha_fin_estimada: Option<String>,
    pub cliente_id: String,
    pub cliente_nombre: String,
    pub contacto: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProyecto {
    pub nombre: Option<String>,
    pub descripcion: Option<String>,
    pub fecha_fin_estimada: Option<String>,
    pub contacto: Option<String>,
    pub estado: Option<String>,
    pub fecha_fin_real: Option<String>,
}

impl Proyecto {
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 15 {
            return None;
        }
        Some(Proyecto {
            id: row.get(0)?.clone(),
            codigo: row.get(1)?.clone(),
            nombre: row.get(2)?.clone(),
            descripcion: row.get(3)?.clone(),
            fecha_inicio: row.get(4)?.clone(),
            fecha_fin_estimada: row.get(5).cloned().filter(|s| !s.is_empty()),
            cliente_id: row.get(6)?.clone(),
            cliente_nombre: row.get(7)?.clone(),
            contacto: row.get(8).cloned().filter(|s| !s.is_empty()),
            estado: row.get(9)?.clone(),
            fecha_fin_real: row.get(10).cloned().filter(|s| !s.is_empty()),
            drive_folder_id: row.get(11).cloned().filter(|s| !s.is_empty()),
            created_at: row.get(12)?.clone(),
            updated_at: row.get(13)?.clone(),
            created_by: row.get(14).cloned().filter(|s| !s.is_empty()),
        })
    }

    pub fn to_row(&self) -> Vec<String> {
        vec![
            self.id.clone(),
            self.codigo.clone(),
            self.nombre.clone(),
            self.descripcion.clone(),
            self.fecha_inicio.clone(),
            self.fecha_fin_estimada.clone().unwrap_or_default(),
            self.cliente_id.clone(),
            self.cliente_nombre.clone(),
            self.contacto.clone().unwrap_or_default(),
            self.estado.clone(),
            self.fecha_fin_real.clone().unwrap_or_default(),
            self.drive_folder_id.clone().unwrap_or_default(),
            self.created_at.clone(),
            self.updated_at.clone(),
            self.created_by.clone().unwrap_or_default(),
        ]
    }
}
