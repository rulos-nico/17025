use axum::{
    extract::State,
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};

use crate::errors::AppError;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/health", get(health_check))
        .route("/login", post(login_with_google))
        .route("/profile", get(get_profile))
        .route("/logout", post(logout))
}

// ============================================
// MODELOS
// ============================================

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
}

/// Request para login con token de Google
#[derive(Deserialize)]
pub struct GoogleLoginRequest {
    /// Token de acceso de Google OAuth
    pub access_token: String,
}

/// Información del usuario de Google
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleUserInfo {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub picture: Option<String>,
    pub verified_email: Option<bool>,
}

/// Respuesta de login exitoso
#[derive(Serialize)]
pub struct LoginResponse {
    pub success: bool,
    pub user: UserProfile,
    pub message: String,
}

/// Perfil de usuario para el frontend
#[derive(Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: String,
    pub email: String,
    pub nombre: String,
    pub apellido: Option<String>,
    pub avatar: Option<String>,
    pub rol: String,
    pub activo: bool,
}

/// Respuesta genérica de éxito
#[derive(Serialize)]
pub struct SuccessResponse {
    pub success: bool,
    pub message: String,
}

// ============================================
// HANDLERS
// ============================================

/// Health check endpoint
async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

/// Login con token de Google
///
/// El frontend envía el access_token de Google OAuth.
/// El backend valida el token contra la API de Google y
/// retorna información del usuario.
async fn login_with_google(
    State(state): State<AppState>,
    Json(payload): Json<GoogleLoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    // Validar el token contra Google
    let google_user = validate_google_token(&payload.access_token).await?;

    // Buscar o crear usuario en la base de datos
    let user = find_or_create_user(&state, &google_user).await?;

    // Verificar que el usuario esté activo
    if !user.activo {
        return Err(AppError::Unauthorized);
    }

    tracing::info!("Usuario autenticado: {} ({})", user.email, user.rol);

    Ok(Json(LoginResponse {
        success: true,
        user,
        message: "Login exitoso".to_string(),
    }))
}

/// Obtener perfil del usuario actual
///
/// Requiere el header Authorization con el token de Google
async fn get_profile(
    State(state): State<AppState>,
    req: Request<axum::body::Body>,
) -> Result<Json<UserProfile>, AppError> {
    // Extraer token del header
    let token = extract_bearer_token(&req)?;

    // Validar token y obtener usuario
    let google_user = validate_google_token(&token).await?;
    let user = find_or_create_user(&state, &google_user).await?;

    Ok(Json(user))
}

/// Logout (principalmente para logging en el backend)
async fn logout() -> Json<SuccessResponse> {
    // El logout real ocurre en el frontend revocando el token de Google
    // Aquí solo confirmamos la acción
    Json(SuccessResponse {
        success: true,
        message: "Sesión cerrada".to_string(),
    })
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/// Valida un token de acceso de Google
async fn validate_google_token(access_token: &str) -> Result<GoogleUserInfo, AppError> {
    let client = reqwest::Client::new();

    let response = client
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Error validando token de Google: {}", e);
            AppError::Unauthorized
        })?;

    if !response.status().is_success() {
        tracing::warn!("Token de Google inválido o expirado");
        return Err(AppError::Unauthorized);
    }

    let user_info: GoogleUserInfo = response.json().await.map_err(|e| {
        tracing::error!("Error parseando respuesta de Google: {}", e);
        AppError::Unauthorized
    })?;

    Ok(user_info)
}

/// Busca o crea un usuario en PostgreSQL usando upsert
async fn find_or_create_user(
    state: &AppState,
    google_user: &GoogleUserInfo,
) -> Result<UserProfile, AppError> {
    let repo = crate::repositories::UsuarioRepository::new(state.db_pool.clone());
    let id = uuid::Uuid::new_v4().to_string();
    let nombre = google_user.given_name.clone()
        .unwrap_or_else(|| google_user.name.clone().unwrap_or_else(|| google_user.email.clone()));
    let apellido = google_user.family_name.as_deref();
    let avatar = google_user.picture.as_deref();
    let user = repo.upsert(&id, &google_user.email, &nombre, apellido, avatar).await
        .map_err(|e| { tracing::error!("DB error on upsert user: {}", e); AppError::InternalServerError })?;
    tracing::info!("Usuario autenticado/creado: {} ({})", user.email, user.rol);
    Ok(user)
}

/// Extrae el token Bearer del header Authorization
fn extract_bearer_token<B>(req: &Request<B>) -> Result<String, AppError> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or(AppError::Unauthorized)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized);
    }

    Ok(auth_header[7..].to_string())
}

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================

/// Middleware que valida la autenticación en rutas protegidas
///
/// Uso:
/// ```rust
/// Router::new()
///     .route("/protected", get(handler))
///     .layer(axum::middleware::from_fn_with_state(state.clone(), require_auth))
/// ```
pub async fn require_auth(
    State(state): State<AppState>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    // Si require_auth está deshabilitado (dev mode), dejar pasar sin validar
    if !state.config.require_auth {
        tracing::debug!("Auth bypass: REQUIRE_AUTH is disabled");
        return Ok(next.run(req).await);
    }

    // Extraer token
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok());

    let token = match auth_header {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    // Validar token
    match validate_google_token(token).await {
        Ok(google_user) => {
            match find_or_create_user(&state, &google_user).await {
                Ok(user) if user.activo => Ok(next.run(req).await),
                _ => Err(StatusCode::UNAUTHORIZED),
            }
        }
        Err(_) => Err(StatusCode::UNAUTHORIZED),
    }
}

/// Middleware que requiere un rol específico
///
/// Uso:
/// ```rust
/// Router::new()
///     .route("/admin", get(handler))
///     .layer(axum::middleware::from_fn_with_state(
///         (state.clone(), vec!["admin".to_string()]),
///         require_role
///     ))
/// ```
#[allow(dead_code)]
pub async fn require_role(
    State((state, allowed_roles)): State<(AppState, Vec<String>)>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok());

    let token = match auth_header {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    match validate_google_token(token).await {
        Ok(google_user) => {
            match find_or_create_user(&state, &google_user).await {
                Ok(user) if user.activo => {
                    // Verificar rol
                    if allowed_roles.contains(&user.rol) || user.rol == "admin" {
                        Ok(next.run(req).await)
                    } else {
                        Err(StatusCode::FORBIDDEN)
                    }
                }
                _ => Err(StatusCode::UNAUTHORIZED),
            }
        }
        Err(_) => Err(StatusCode::UNAUTHORIZED),
    }
}
