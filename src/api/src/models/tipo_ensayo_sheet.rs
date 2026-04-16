use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TipoEnsayoSheet {
    pub id: String,
    pub tipo_ensayo_id: String,
    pub url: String,
    pub drive_id: Option<String>,
    pub activo: bool,
    pub created_at: String,
    pub updated_at: String,
}
#[derive(Debug, Deserialize)]
pub struct CreateTipoEnsayoSheet {
    pub url: String,
    pub drive_id: Option<String>,
}
#[derive(Debug, Deserialize)]
pub struct UpdateTipoEnsayoSheet {
    pub url: Option<String>,
    pub drive_id: Option<String>,
    pub activo: Option<bool>,
}
