use serde::{Deserialize, Serialize};
use super::Equipo;

#[derive(Debug, Clone, Serialize, Deserialize)]
 
pub struct SensorResumen {
    pub id: String,
    pub codigo: String,
    pub tipo: String,
    pub marca: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: String,
    pub rango_medicion: Option<String>,
    pub estado: String,
    pub proxima_calibracion: Option<String>,
}
// Nuevo struct para equipo con sensores
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EquipoConSensores {
    #[serde(flatten)]
    pub equipo: Equipo,
    pub sensores_asociados: Vec<SensorResumen>,
}
