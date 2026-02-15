use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comprobacion {
    pub id: String,
    pub equipo_id: String,
    pub fecha: String,
    pub tipo: String,
    pub resultado: String, // "Conforme" | "No Conforme"
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateComprobacion {
    pub equipo_id: String,
    pub fecha: String,
    pub tipo: String,
    pub resultado: String,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateComprobacion {
    pub fecha: Option<String>,
    pub tipo: Option<String>,
    pub resultado: Option<String>,
    pub responsable: Option<String>,
    pub observaciones: Option<String>,
}

impl Comprobacion {
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 9 {
            return None;
        }
        Some(Comprobacion {
            id: row.get(0)?.clone(),
            equipo_id: row.get(1)?.clone(),
            fecha: row.get(2)?.clone(),
            tipo: row.get(3)?.clone(),
            resultado: row.get(4)?.clone(),
            responsable: row.get(5).cloned().filter(|s| !s.is_empty()),
            observaciones: row.get(6).cloned().filter(|s| !s.is_empty()),
            created_at: row.get(7)?.clone(),
            updated_at: row.get(8)?.clone(),
        })
    }

    pub fn to_row(&self) -> Vec<String> {
        vec![
            self.id.clone(),
            self.equipo_id.clone(),
            self.fecha.clone(),
            self.tipo.clone(),
            self.resultado.clone(),
            self.responsable.clone().unwrap_or_default(),
            self.observaciones.clone().unwrap_or_default(),
            self.created_at.clone(),
            self.updated_at.clone(),
        ]
    }
}
