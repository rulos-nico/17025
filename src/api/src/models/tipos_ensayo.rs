use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TipoEnsayo {
    pub id: String,
    pub nombre: String,
    pub categoria: Option<String>,
    pub vigente_desde: Option<String>,
    pub norma: String,
    pub acre: String,
    pub activo: bool,
    pub orden: i32,
    pub tiempo_estimado_dias: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTipoEnsayo {
    pub nombre: String,
    pub categoria: Option<String>,
    pub vigente_desde: Option<String>,
    pub norma: String,
    pub acre: String,
    pub orden: Option<i32>,
    pub tiempo_estimado_dias: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTipoEnsayo {
    pub nombre: Option<String>,
    pub categoria: Option<String>,
    pub vigente_desde: Option<String>,
    pub norma: Option<String>,
    pub acre: Option<String>,
    pub activo: Option<bool>,
    pub orden: Option<i32>,
    pub tiempo_estimado_dias: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TipoEnsayoInfo {
    pub id: String,
    pub nombre: String,
    pub categoria: Option<String>,
    pub norma: String,
    pub acre: String,
    pub orden: i32,
    pub tiempo_estimado_dias: Option<i32>,
}

impl From<TipoEnsayo> for TipoEnsayoInfo {
    fn from(tipo: TipoEnsayo) -> Self {
        TipoEnsayoInfo {
            id: tipo.id,
            nombre: tipo.nombre,
            categoria: tipo.categoria,
            norma: tipo.norma,
            acre: tipo.acre,
            orden: tipo.orden,
            tiempo_estimado_dias: tipo.tiempo_estimado_dias,
        }
    }
}
