use chrono::DateTime;
use chrono::Utc;
use sqlx::FromRow;
use crate::db::DbPool;
use crate::routes::auth::UserProfile;

#[derive(Debug, Clone, FromRow)]
pub struct UsuarioRow {
    pub id: String,
    pub email: String,
    pub nombre: String,
    pub apellido: Option<String>,
    pub avatar: Option<String>,
    pub rol: String,
    pub activo: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<UsuarioRow> for UserProfile {
    fn from(row: UsuarioRow) -> Self {
        UserProfile {
            id: row.id,
            email: row.email,
            nombre: row.nombre,
            apellido: row.apellido,
            avatar: row.avatar,
            rol: row.rol,
            activo: row.activo,
        }
    }
}

#[derive(Clone)]
pub struct UsuarioRepository {
    pool: DbPool,
}

impl UsuarioRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_email(&self, email: &str) -> Result<Option<UserProfile>, sqlx::Error> {
        let row = sqlx::query_as::<_, UsuarioRow>(
            "SELECT id, email, nombre, apellido, avatar, rol, activo, created_at, updated_at FROM usuarios WHERE LOWER(email) = LOWER($1)"
        )
        .bind(email)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(UserProfile::from))
    }

    pub async fn upsert(&self, id: &str, email: &str, nombre: &str, apellido: Option<&str>, avatar: Option<&str>) -> Result<UserProfile, sqlx::Error> {
        let row = sqlx::query_as::<_, UsuarioRow>(
            r#"
            INSERT INTO usuarios (id, email, nombre, apellido, avatar, rol, activo)
            VALUES ($1, $2, $3, $4, $5, 'tecnico', true)
            ON CONFLICT (email) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                apellido = COALESCE(EXCLUDED.apellido, usuarios.apellido),
                avatar = COALESCE(EXCLUDED.avatar, usuarios.avatar),
                updated_at = NOW()
            RETURNING id, email, nombre, apellido, avatar, rol, activo, created_at, updated_at
            "#
        )
        .bind(id)
        .bind(email)
        .bind(nombre)
        .bind(apellido)
        .bind(avatar)
        .fetch_one(&self.pool)
        .await?;
        Ok(UserProfile::from(row))
    }
}
