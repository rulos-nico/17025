use sqlx::{postgres::PgPoolOptions, PgPool};

/// Pool de conexiones a PostgreSQL
pub type DbPool = PgPool;

/// Crea y configura el pool de conexiones a la base de datos
pub async fn create_pool(database_url: &str) -> Result<DbPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .min_connections(2)
        .acquire_timeout(std::time::Duration::from_secs(30))
        .idle_timeout(std::time::Duration::from_secs(600))
        .connect(database_url)
        .await
}

/// Ejecuta las migraciones pendientes
pub async fn run_migrations(pool: &DbPool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!("./migrations").run(pool).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_pool_creation() {
        // Este test requiere una base de datos de prueba
        let url = std::env::var("DATABASE_URL_TEST")
            .unwrap_or_else(|_| "postgres://localhost/test_17025".to_string());
        
        let result = create_pool(&url).await;
        // Solo verificamos que no panic, el resultado depende de si hay DB disponible
        let _ = result;
    }
}
