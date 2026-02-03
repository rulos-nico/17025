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

/// Busca un usuario existente o lo crea si no existe
async fn find_or_create_user(
    state: &AppState,
    google_user: &GoogleUserInfo,
) -> Result<UserProfile, AppError> {
    // Intentar buscar usuario por email en la hoja de Usuarios
    let existing_user = find_user_by_email(state, &google_user.email).await?;
    
    if let Some(user) = existing_user {
        return Ok(user);
    }
    
    // Si no existe, crear un nuevo usuario con rol por defecto
    let new_user = UserProfile {
        id: uuid::Uuid::new_v4().to_string(),
        email: google_user.email.clone(),
        nombre: google_user.given_name.clone().unwrap_or_else(|| {
            google_user.name.clone().unwrap_or_else(|| google_user.email.clone())
        }),
        apellido: google_user.family_name.clone(),
        avatar: google_user.picture.clone(),
        rol: "tecnico".to_string(), // Rol por defecto para nuevos usuarios
        activo: true,
    };
    
    // TODO: Guardar nuevo usuario en la base de datos/sheets
    // Por ahora solo retornamos el perfil
    tracing::info!("Nuevo usuario creado: {} con rol {}", new_user.email, new_user.rol);
    
    Ok(new_user)
}

/// Busca un usuario por email en Google Sheets
async fn find_user_by_email(
    state: &AppState,
    email: &str,
) -> Result<Option<UserProfile>, AppError> {
    // Si no hay cliente de Sheets configurado, retornar None (usuario no encontrado)
    let sheets = match super::require_sheets(&state.sheets_client) {
        Ok(client) => client,
        Err(_) => {
            tracing::debug!("Google Sheets no configurado, omitiendo búsqueda de usuario");
            return Ok(None);
        }
    };
    
    // Leer usuarios de Google Sheets
    let usuarios = sheets
        .read_sheet_as_objects("Usuarios")
        .await
        .map_err(|e| AppError::SheetsError(e.to_string()))?;
    
    // Buscar por email
    for row in usuarios {
        let row_email = row.get("email").and_then(|v| v.as_str()).unwrap_or("");
        if row_email.eq_ignore_ascii_case(email) {
            let user = UserProfile {
                id: row.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                email: row_email.to_string(),
                nombre: row.get("nombre").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                apellido: row.get("apellido").and_then(|v| v.as_str()).map(|s| s.to_string()),
                avatar: None, // Sheets no guarda avatar
                rol: row.get("rol").and_then(|v| v.as_str()).unwrap_or("tecnico").to_string(),
                activo: row.get("activo").and_then(|v| v.as_str()).map(|s| s == "true" || s == "1").unwrap_or(true),
            };
            return Ok(Some(user));
        }
    }
    
    Ok(None)
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
#[allow(dead_code)]
pub async fn require_auth(
    State(state): State<AppState>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, StatusCode> {
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
            // Verificar que el usuario existe y está activo
            match find_user_by_email(&state, &google_user.email).await {
                Ok(Some(user)) if user.activo => {
                    // Usuario válido, continuar
                    Ok(next.run(req).await)
                }
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
            match find_user_by_email(&state, &google_user.email).await {
                Ok(Some(user)) if user.activo => {
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
