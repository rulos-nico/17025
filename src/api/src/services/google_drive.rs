use google_drive3::{
    api::File,
    hyper_rustls::HttpsConnector,
    hyper_util::{client::legacy::connect::HttpConnector, rt::TokioExecutor},
    DriveHub,
};
use yup_oauth2::{ServiceAccountAuthenticator, ServiceAccountKey};

use crate::config::Config;
use crate::errors::AppError;

type DriveHubType = DriveHub<HttpsConnector<HttpConnector>>;

#[derive(Clone)]
pub struct GoogleDriveClient {
    hub: DriveHubType,
    root_folder_id: String,
}

impl GoogleDriveClient {
    pub async fn new(config: &Config) -> Result<Self, AppError> {
        let creds_json = std::fs::read_to_string(&config.google_credentials_path)
            .map_err(|e| AppError::DriveError(format!("Failed to read credentials: {}", e)))?;

        let service_account_key: ServiceAccountKey = serde_json::from_str(&creds_json)
            .map_err(|e| AppError::DriveError(format!("Failed to parse credentials: {}", e)))?;

        let auth = ServiceAccountAuthenticator::builder(service_account_key)
            .build()
            .await
            .map_err(|e| AppError::DriveError(format!("Failed to create authenticator: {}", e)))?;

        let client = hyper_util::client::legacy::Client::builder(TokioExecutor::new())
            .build(
                hyper_rustls::HttpsConnectorBuilder::new()
                    .with_native_roots()
                    .unwrap()
                    .https_only()
                    .enable_http2()
                    .build(),
            );

        let hub = DriveHub::new(client, auth);

        Ok(Self {
            hub,
            root_folder_id: config.drive_root_folder_id.clone(),
        })
    }

    /// Crea una carpeta en Drive
    pub async fn create_folder(
        &self,
        name: &str,
        parent_id: Option<&str>,
    ) -> Result<String, AppError> {
        let parent = parent_id.unwrap_or(&self.root_folder_id);

        let file_metadata = File {
            name: Some(name.to_string()),
            mime_type: Some("application/vnd.google-apps.folder".to_string()),
            parents: Some(vec![parent.to_string()]),
            ..Default::default()
        };

        let result = self
            .hub
            .files()
            .create(file_metadata)
            .doit()
            .await
            .map_err(|e| AppError::DriveError(format!("Failed to create folder: {}", e)))?;

        result
            .1
            .id
            .ok_or_else(|| AppError::DriveError("No folder ID returned".to_string()))
    }

    /// Lista archivos en una carpeta
    pub async fn list_files(&self, folder_id: &str) -> Result<Vec<File>, AppError> {
        let query = format!("'{}' in parents and trashed = false", folder_id);

        let result = self
            .hub
            .files()
            .list()
            .q(&query)
            .doit()
            .await
            .map_err(|e| AppError::DriveError(format!("Failed to list files: {}", e)))?;

        Ok(result.1.files.unwrap_or_default())
    }

    /// Copia un archivo (útil para copiar plantillas)
    pub async fn copy_file(
        &self,
        file_id: &str,
        new_name: &str,
        parent_id: &str,
    ) -> Result<String, AppError> {
        let file_metadata = File {
            name: Some(new_name.to_string()),
            parents: Some(vec![parent_id.to_string()]),
            ..Default::default()
        };

        let result = self
            .hub
            .files()
            .copy(file_metadata, file_id)
            .doit()
            .await
            .map_err(|e| AppError::DriveError(format!("Failed to copy file: {}", e)))?;

        result
            .1
            .id
            .ok_or_else(|| AppError::DriveError("No file ID returned".to_string()))
    }
}
