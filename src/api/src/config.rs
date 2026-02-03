#[derive(Clone)]
pub struct Config {
    pub port: u16,
    pub google_credentials_path: String,
    pub spreadsheet_id: Option<String>,
    pub drive_root_folder_id: Option<String>,
    pub allowed_origins: Vec<String>,
    pub database_url: String,
    pub run_migrations: bool,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            port: std::env::var("API_PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .unwrap_or(3000),
            google_credentials_path: std::env::var("GOOGLE_CREDENTIALS_PATH")
                .unwrap_or_else(|_| "credentials.json".to_string()),
            spreadsheet_id: std::env::var("GOOGLE_SPREADSHEET_ID").ok(),
            drive_root_folder_id: std::env::var("GOOGLE_DRIVE_ROOT_FOLDER_ID").ok(),
            allowed_origins: std::env::var("ALLOWED_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:5173".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://localhost/lab17025".to_string()),
            run_migrations: std::env::var("RUN_MIGRATIONS")
                .map(|v| v == "true" || v == "1")
                .unwrap_or(true),
        }
    }

    /// Verifica si Google Sheets está configurado
    pub fn has_google_sheets(&self) -> bool {
        self.spreadsheet_id.is_some()
    }

    /// Verifica si Google Drive está configurado
    pub fn has_google_drive(&self) -> bool {
        std::path::Path::new(&self.google_credentials_path).exists()
    }
}
