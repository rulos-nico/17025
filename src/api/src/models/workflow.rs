//! Workflow states para ensayos según ISO/IEC 17025
//!
//! Define los 15 estados del workflow (E1-E15) y las transiciones permitidas.
//! Los colores y fases de UI se manejan en el frontend (src/config.js).

use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

/// Estados del workflow de ensayos
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorkflowState {
    E1,  // Sin programación
    E2,  // Programado
    E3,  // Anulado (terminal)
    E4,  // Repetición
    E5,  // Novedad
    E6,  // En ejecución
    E7,  // Espera ensayos
    E8,  // Procesamiento
    E9,  // Rev. Técnica
    E10, // Rev. Coordinación
    E11, // Rev. Dirección
    E12, // Por enviar
    E13, // Enviado
    E14, // Entregado
    E15, // Facturado (terminal)
}

impl WorkflowState {
    /// Retorna las transiciones permitidas desde este estado
    pub fn allowed_transitions(&self) -> &'static [WorkflowState] {
        use WorkflowState::*;
        match self {
            E1 => &[E2, E3],
            E2 => &[E6, E3, E5],
            E3 => &[], // Terminal
            E4 => &[E2, E6],
            E5 => &[E2, E3],
            E6 => &[E7, E8, E4, E5],
            E7 => &[E6, E8],
            E8 => &[E9, E4],
            E9 => &[E10, E8],
            E10 => &[E11, E9],
            E11 => &[E12, E10],
            E12 => &[E13],
            E13 => &[E14],
            E14 => &[E15],
            E15 => &[], // Terminal
        }
    }

    /// Verifica si se puede transicionar a otro estado
    pub fn can_transition_to(&self, target: WorkflowState) -> bool {
        self.allowed_transitions().contains(&target)
    }

    /// Indica si es un estado terminal (sin transiciones salientes)
    pub fn is_terminal(&self) -> bool {
        self.allowed_transitions().is_empty()
    }

    /// Nombre legible del estado (para logs y mensajes de error)
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::E1 => "Sin programación",
            Self::E2 => "Programado",
            Self::E3 => "Anulado",
            Self::E4 => "Repetición",
            Self::E5 => "Novedad",
            Self::E6 => "En ejecución",
            Self::E7 => "Espera ensayos",
            Self::E8 => "Procesamiento",
            Self::E9 => "Rev. Técnica",
            Self::E10 => "Rev. Coordinación",
            Self::E11 => "Rev. Dirección",
            Self::E12 => "Por enviar",
            Self::E13 => "Enviado",
            Self::E14 => "Entregado",
            Self::E15 => "Facturado",
        }
    }
}

impl Default for WorkflowState {
    fn default() -> Self {
        Self::E1
    }
}

impl fmt::Display for WorkflowState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Self::E1 => "E1",
            Self::E2 => "E2",
            Self::E3 => "E3",
            Self::E4 => "E4",
            Self::E5 => "E5",
            Self::E6 => "E6",
            Self::E7 => "E7",
            Self::E8 => "E8",
            Self::E9 => "E9",
            Self::E10 => "E10",
            Self::E11 => "E11",
            Self::E12 => "E12",
            Self::E13 => "E13",
            Self::E14 => "E14",
            Self::E15 => "E15",
        };
        write!(f, "{}", s)
    }
}

impl FromStr for WorkflowState {
    type Err = WorkflowParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_uppercase().as_str() {
            "E1" => Ok(Self::E1),
            "E2" => Ok(Self::E2),
            "E3" => Ok(Self::E3),
            "E4" => Ok(Self::E4),
            "E5" => Ok(Self::E5),
            "E6" => Ok(Self::E6),
            "E7" => Ok(Self::E7),
            "E8" => Ok(Self::E8),
            "E9" => Ok(Self::E9),
            "E10" => Ok(Self::E10),
            "E11" => Ok(Self::E11),
            "E12" => Ok(Self::E12),
            "E13" => Ok(Self::E13),
            "E14" => Ok(Self::E14),
            "E15" => Ok(Self::E15),
            _ => Err(WorkflowParseError(s.to_string())),
        }
    }
}

/// Error al parsear un estado de workflow inválido
#[derive(Debug, Clone)]
pub struct WorkflowParseError(pub String);

impl fmt::Display for WorkflowParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Estado de workflow inválido: '{}'. Valores válidos: E1-E15",
            self.0
        )
    }
}

impl std::error::Error for WorkflowParseError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transitions_from_e1() {
        let state = WorkflowState::E1;
        assert!(state.can_transition_to(WorkflowState::E2));
        assert!(state.can_transition_to(WorkflowState::E3));
        assert!(!state.can_transition_to(WorkflowState::E6));
    }

    #[test]
    fn test_terminal_states() {
        assert!(WorkflowState::E3.is_terminal());
        assert!(WorkflowState::E15.is_terminal());
        assert!(!WorkflowState::E1.is_terminal());
    }

    #[test]
    fn test_parse_and_display() {
        let state: WorkflowState = "E10".parse().unwrap();
        assert_eq!(state, WorkflowState::E10);
        assert_eq!(state.to_string(), "E10");
    }

    #[test]
    fn test_parse_case_insensitive() {
        let state: WorkflowState = "e5".parse().unwrap();
        assert_eq!(state, WorkflowState::E5);
    }

    #[test]
    fn test_parse_invalid() {
        let result: Result<WorkflowState, _> = "E99".parse();
        assert!(result.is_err());
    }

    #[test]
    fn test_default() {
        assert_eq!(WorkflowState::default(), WorkflowState::E1);
    }

    #[test]
    fn test_serde_roundtrip() {
        let state = WorkflowState::E6;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"E6\"");
        let parsed: WorkflowState = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, state);
    }
}
