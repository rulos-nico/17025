pub mod cliente_repo;
pub mod ensayo_repo;
pub mod equipo_repo;
pub mod perforacion_repo;
pub mod proyecto_repo;
pub mod sensor_repo;

pub use cliente_repo::ClienteRepository;
pub use ensayo_repo::EnsayoRepository;
pub use equipo_repo::EquipoRepository;
pub use perforacion_repo::PerforacionRepository;
pub use proyecto_repo::ProyectoRepository;
pub use sensor_repo::SensorRepository;

use crate::db::DbPool;

/// Trait común para todos los repositorios
#[async_trait::async_trait]
pub trait Repository<T, CreateDto, UpdateDto> {
    async fn find_all(&self) -> Result<Vec<T>, sqlx::Error>;
    async fn find_by_id(&self, id: &str) -> Result<Option<T>, sqlx::Error>;
    async fn create(&self, dto: CreateDto) -> Result<T, sqlx::Error>;
    async fn update(&self, id: &str, dto: UpdateDto) -> Result<Option<T>, sqlx::Error>;
    async fn delete(&self, id: &str) -> Result<bool, sqlx::Error>;
}

/// Estructura base que contiene el pool de conexiones
#[derive(Clone)]
pub struct BaseRepository {
    pub pool: DbPool,
}

impl BaseRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }
}
