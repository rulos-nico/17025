use serde::{Deserialize, Serialize};

/// Tipos de muestra válidos
pub const TIPOS_MUESTRA: &[&str] = &["alterado", "inalterado", "roca", "spt", "shelby"];

/// Representa una muestra extraída de una perforación
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Muestra {
    pub id: String,
    pub codigo: String,
    pub perforacion_id: String,
    pub profundidad_inicio: f64,
    pub profundidad_fin: f64,
    pub tipo_muestra: String,
    pub descripcion: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// DTO para crear una nueva muestra
#[derive(Debug, Deserialize)]
pub struct CreateMuestra {
    pub perforacion_id: String,
    pub profundidad_inicio: f64,
    pub profundidad_fin: f64,
    pub tipo_muestra: String,
    pub descripcion: Option<String>,
}

/// DTO para actualizar una muestra existente
#[derive(Debug, Deserialize)]
pub struct UpdateMuestra {
    pub profundidad_inicio: Option<f64>,
    pub profundidad_fin: Option<f64>,
    pub tipo_muestra: Option<String>,
    pub descripcion: Option<String>,
}

/// Información de muestra para incluir en respuestas de perforación
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MuestraInfo {
    pub id: String,
    pub codigo: String,
    pub profundidad_inicio: f64,
    pub profundidad_fin: f64,
    pub tipo_muestra: String,
    pub descripcion: Option<String>,
}

impl From<Muestra> for MuestraInfo {
    fn from(m: Muestra) -> Self {
        MuestraInfo {
            id: m.id,
            codigo: m.codigo,
            profundidad_inicio: m.profundidad_inicio,
            profundidad_fin: m.profundidad_fin,
            tipo_muestra: m.tipo_muestra,
            descripcion: m.descripcion,
        }
    }
}

impl Muestra {
    /// Convierte una fila de Sheets a una Muestra
    pub fn from_row(row: &[String]) -> Option<Self> {
        if row.len() < 9 {
            return None;
        }
        Some(Muestra {
            id: row.get(0)?.clone(),
            codigo: row.get(1)?.clone(),
            perforacion_id: row.get(2)?.clone(),
            profundidad_inicio: row.get(3).and_then(|s| s.parse().ok()).unwrap_or(0.0),
            profundidad_fin: row.get(4).and_then(|s| s.parse().ok()).unwrap_or(0.0),
            tipo_muestra: row.get(5)?.clone(),
            descripcion: row.get(6).cloned().filter(|s| !s.is_empty()),
            created_at: row.get(7)?.clone(),
            updated_at: row.get(8)?.clone(),
        })
    }

    /// Convierte la Muestra a una fila para Sheets
    pub fn to_row(&self) -> Vec<String> {
        vec![
            self.id.clone(),
            self.codigo.clone(),
            self.perforacion_id.clone(),
            self.profundidad_inicio.to_string(),
            self.profundidad_fin.to_string(),
            self.tipo_muestra.clone(),
            self.descripcion.clone().unwrap_or_default(),
            self.created_at.clone(),
            self.updated_at.clone(),
        ]
    }

    /// Formatea el rango de profundidad como string
    pub fn profundidad_display(&self) -> String {
        format!(
            "{:.2}-{:.2}m",
            self.profundidad_inicio, self.profundidad_fin
        )
    }

    /// Valida que el tipo de muestra sea válido
    pub fn is_tipo_valido(tipo: &str) -> bool {
        TIPOS_MUESTRA.contains(&tipo)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tipo_muestra_valido() {
        assert!(Muestra::is_tipo_valido("alterado"));
        assert!(Muestra::is_tipo_valido("inalterado"));
        assert!(Muestra::is_tipo_valido("roca"));
        assert!(Muestra::is_tipo_valido("spt"));
        assert!(Muestra::is_tipo_valido("shelby"));
        assert!(!Muestra::is_tipo_valido("invalido"));
    }

    #[test]
    fn test_profundidad_display() {
        let muestra = Muestra {
            id: "test".to_string(),
            codigo: "M-001".to_string(),
            perforacion_id: "per-001".to_string(),
            profundidad_inicio: 1.5,
            profundidad_fin: 2.0,
            tipo_muestra: "alterado".to_string(),
            descripcion: None,
            created_at: "2025-01-01".to_string(),
            updated_at: "2025-01-01".to_string(),
        };
        assert_eq!(muestra.profundidad_display(), "1.50-2.00m");
    }
}
