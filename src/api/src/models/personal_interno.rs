use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalInterno {
    pub id: String,
    pub codigo: String,
    pub nombre: String,
    pub apellido: String,
    pub cargo: String,
    pub email: String,
    pub telefono: Option<String>,
    pub activo: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePersonalInterno {
    pub nombre: String,
    pub apellido: String,
    pub cargo: String,
    pub email: String,
    pub telefono: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePersonalInterno {
    pub nombre: Option<String>,
    pub apellido: Option<String>,
    pub cargo: Option<String>,
    pub email: Option<String>,
    pub telefono: Option<String>,
    pub activo: Option<bool>,
}

impl PersonalInterno {
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 10 {
            return None;
        }
        Some(PersonalInterno {
            id: row.get(0)?.clone(),
            codigo: row.get(1)?.clone(),
            nombre: row.get(2)?.clone(),
            apellido: row.get(3)?.clone(),
            cargo: row.get(4)?.clone(),
            email: row.get(5)?.clone(),
            telefono: row.get(6).cloned().filter(|s| !s.is_empty()),
            activo: row.get(7).map(|s| s == "true" || s == "1").unwrap_or(true),
            created_at: row.get(8)?.clone(),
            updated_at: row.get(9)?.clone(),
        })
    }

    pub fn to_row(&self) -> Vec<String> {
        vec![
            self.id.clone(),
            self.codigo.clone(),
            self.nombre.clone(),
            self.apellido.clone(),
            self.cargo.clone(),
            self.email.clone(),
            self.telefono.clone().unwrap_or_default(),
            self.activo.to_string(),
            self.created_at.clone(),
            self.updated_at.clone(),
        ]
    }
}
