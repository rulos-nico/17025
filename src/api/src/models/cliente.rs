use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cliente {
    pub id: String,
    pub codigo: String,
    pub nombre: String,
    pub rut: Option<String>,
    pub direccion: Option<String>,
    pub ciudad: Option<String>,
    pub telefono: Option<String>,
    pub email: Option<String>,
    pub contacto_nombre: Option<String>,
    pub contacto_cargo: Option<String>,
    pub contacto_email: Option<String>,
    pub contacto_telefono: Option<String>,
    pub activo: bool,
    pub drive_folder_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCliente {
    pub nombre: String,
    pub rut: Option<String>,
    pub direccion: Option<String>,
    pub ciudad: Option<String>,
    pub telefono: Option<String>,
    pub email: Option<String>,
    pub contacto_nombre: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCliente {
    pub nombre: Option<String>,
    pub rut: Option<String>,
    pub direccion: Option<String>,
    pub ciudad: Option<String>,
    pub telefono: Option<String>,
    pub email: Option<String>,
    pub contacto_nombre: Option<String>,
    pub contacto_cargo: Option<String>,
    pub contacto_email: Option<String>,
    pub contacto_telefono: Option<String>,
    pub activo: Option<bool>,
}

impl Cliente {
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 16 {
            return None;
        }
        Some(Cliente {
            id: row.get(0)?.clone(),
            codigo: row.get(1)?.clone(),
            nombre: row.get(2)?.clone(),
            rut: row.get(3).cloned().filter(|s| !s.is_empty()),
            direccion: row.get(4).cloned().filter(|s| !s.is_empty()),
            ciudad: row.get(5).cloned().filter(|s| !s.is_empty()),
            telefono: row.get(6).cloned().filter(|s| !s.is_empty()),
            email: row.get(7).cloned().filter(|s| !s.is_empty()),
            contacto_nombre: row.get(8).cloned().filter(|s| !s.is_empty()),
            contacto_cargo: row.get(9).cloned().filter(|s| !s.is_empty()),
            contacto_email: row.get(10).cloned().filter(|s| !s.is_empty()),
            contacto_telefono: row.get(11).cloned().filter(|s| !s.is_empty()),
            activo: row.get(12).map(|s| s == "true" || s == "1").unwrap_or(true),
            drive_folder_id: row.get(13).cloned().filter(|s| !s.is_empty()),
            created_at: row.get(14)?.clone(),
            updated_at: row.get(15)?.clone(),
        })
    }

    pub fn to_row(&self) -> Vec<String> {
        vec![
            self.id.clone(),
            self.codigo.clone(),
            self.nombre.clone(),
            self.rut.clone().unwrap_or_default(),
            self.direccion.clone().unwrap_or_default(),
            self.ciudad.clone().unwrap_or_default(),
            self.telefono.clone().unwrap_or_default(),
            self.email.clone().unwrap_or_default(),
            self.contacto_nombre.clone().unwrap_or_default(),
            self.contacto_cargo.clone().unwrap_or_default(),
            self.contacto_email.clone().unwrap_or_default(),
            self.contacto_telefono.clone().unwrap_or_default(),
            self.activo.to_string(),
            self.drive_folder_id.clone().unwrap_or_default(),
            self.created_at.clone(),
            self.updated_at.clone(),
        ]
    }
}
