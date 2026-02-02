#[derive(Clone)]
pub struct Config {
    pub port: u16,
    pub google_credentials_path: String,
    pub spreadsheet_id: String,
    pub drive_root_folder_id: String,
    pub allowed_origins: Vec<String>,
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
            spreadsheet_id: std::env::var("GOOGLE_SPREADSHEET_ID")
                .expect("GOOGLE_SPREADSHEET_ID is required"),
            drive_root_folder_id: std::env::var("GOOGLE_DRIVE_ROOT_FOLDER_ID")
                .unwrap_or_default(),
            allowed_origins: std::env::var("ALLOWED_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:5173".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
        }
    }
}
