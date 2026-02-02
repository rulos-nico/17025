use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ensayo {
    pub id: String,
    pub codigo: String,
    pub tipo: String,
    pub perforacion_id: String,
    pub proyecto_id: String,
    pub muestra: String,
    pub norma: String,
    pub workflow_state: String,
    pub fecha_solicitud: String,
    pub fecha_programacion: Option<String>,
    pub fecha_ejecucion: Option<String>,
    pub fecha_reporte: Option<String>,
    pub fecha_entrega: Option<String>,
    pub tecnico_id: Option<String>,
    pub tecnico_nombre: Option<String>,
    pub sheet_id: Option<String>,
    pub sheet_url: Option<String>,
    pub equipos_utilizados: Vec<String>,
    pub observaciones: Option<String>,
    pub urgente: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateEnsayo {
    pub tipo: String,
    pub perforacion_id: String,
    pub proyecto_id: String,
    pub muestra: String,
    pub norma: String,
    pub fecha_solicitud: String,
    pub urgente: Option<bool>,
    pub observaciones: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEnsayo {
    pub workflow_state: Option<String>,
    pub fecha_programacion: Option<String>,
    pub fecha_ejecucion: Option<String>,
    pub fecha_reporte: Option<String>,
    pub fecha_entrega: Option<String>,
    pub tecnico_id: Option<String>,
    pub tecnico_nombre: Option<String>,
    pub observaciones: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEnsayoStatus {
    pub workflow_state: String,
}

impl Ensayo {
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 22 {
            return None;
        }
        Some(Ensayo {
            id: row.get(0)?.clone(),
            codigo: row.get(1)?.clone(),
            tipo: row.get(2)?.clone(),
            perforacion_id: row.get(3)?.clone(),
            proyecto_id: row.get(4)?.clone(),
            muestra: row.get(5)?.clone(),
            norma: row.get(6)?.clone(),
            workflow_state: row.get(7)?.clone(),
            fecha_solicitud: row.get(8)?.clone(),
            fecha_programacion: row.get(9).cloned().filter(|s| !s.is_empty()),
            fecha_ejecucion: row.get(10).cloned().filter(|s| !s.is_empty()),
            fecha_reporte: row.get(11).cloned().filter(|s| !s.is_empty()),
            fecha_entrega: row.get(12).cloned().filter(|s| !s.is_empty()),
            tecnico_id: row.get(13).cloned().filter(|s| !s.is_empty()),
            tecnico_nombre: row.get(14).cloned().filter(|s| !s.is_empty()),
            sheet_id: row.get(15).cloned().filter(|s| !s.is_empty()),
            sheet_url: row.get(16).cloned().filter(|s| !s.is_empty()),
            equipos_utilizados: row
                .get(17)
                .map(|s| s.split(',').map(|x| x.trim().to_string()).collect())
                .unwrap_or_default(),
            observaciones: row.get(18).cloned().filter(|s| !s.is_empty()),
            urgente: row
                .get(19)
                .map(|s| s == "true" || s == "1")
                .unwrap_or(false),
            created_at: row.get(20)?.clone(),
            updated_at: row.get(21)?.clone(),
        })
    }

    pub fn to_row(&self) -> Vec<String> {
        vec![
            self.id.clone(),
            self.codigo.clone(),
            self.tipo.clone(),
            self.perforacion_id.clone(),
            self.proyecto_id.clone(),
            self.muestra.clone(),
            self.norma.clone(),
            self.workflow_state.clone(),
            self.fecha_solicitud.clone(),
            self.fecha_programacion.clone().unwrap_or_default(),
            self.fecha_ejecucion.clone().unwrap_or_default(),
            self.fecha_reporte.clone().unwrap_or_default(),
            self.fecha_entrega.clone().unwrap_or_default(),
            self.tecnico_id.clone().unwrap_or_default(),
            self.tecnico_nombre.clone().unwrap_or_default(),
            self.sheet_id.clone().unwrap_or_default(),
            self.sheet_url.clone().unwrap_or_default(),
            self.equipos_utilizados.join(","),
            self.observaciones.clone().unwrap_or_default(),
            self.urgente.to_string(),
            self.created_at.clone(),
            self.updated_at.clone(),
        ]
    }
}
