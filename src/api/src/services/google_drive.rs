use std::io::Cursor;

use google_drive3::{
    api::File,
    hyper_rustls::HttpsConnector,
    hyper_util::{client::legacy::connect::HttpConnector, rt::TokioExecutor},
    DriveHub,
};
use http_body_util::BodyExt;
use yup_oauth2::{ServiceAccountAuthenticator, ServiceAccountKey};

use crate::config::Config;
use crate::errors::AppError;

type DriveHubType = DriveHub<HttpsConnector<HttpConnector>>;

/// MIME type for PDF export
const MIME_PDF: &str = "application/pdf";

#[derive(Clone)]
pub struct GoogleDriveClient {
    hub: DriveHubType,
    root_folder_id: Option<String>,
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
        let parent = match parent_id {
            Some(id) => id.to_string(),
            None => self.root_folder_id.clone()
                .ok_or_else(|| AppError::DriveError("No root folder ID configured".to_string()))?,
        };

        let file_metadata = File {
            name: Some(name.to_string()),
            mime_type: Some("application/vnd.google-apps.folder".to_string()),
            parents: Some(vec![parent.to_string()]),
            ..Default::default()
        };

        // Para crear una carpeta, usamos upload con un cursor vacío
        let empty_content = Cursor::new(Vec::<u8>::new());
        
        let result = self
            .hub
            .files()
            .create(file_metadata)
            .upload(empty_content, "application/octet-stream".parse().unwrap())
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

    /// Exporta un Google Sheet como PDF y devuelve los bytes
    pub async fn export_as_pdf(&self, file_id: &str) -> Result<Vec<u8>, AppError> {
        let response = self
            .hub
            .files()
            .export(file_id, MIME_PDF)
            .doit()
            .await
            .map_err(|e| AppError::DriveError(format!("Failed to export as PDF: {}", e)))?;

        // Collect the body bytes
        let bytes = response
            .into_body()
            .collect()
            .await
            .map_err(|e| AppError::DriveError(format!("Failed to read PDF response: {}", e)))?
            .to_bytes()
            .to_vec();

        Ok(bytes)
    }

    /// Sube un archivo PDF a Drive
    pub async fn upload_pdf(
        &self,
        name: &str,
        parent_id: &str,
        content: Vec<u8>,
    ) -> Result<String, AppError> {
        let file_metadata = File {
            name: Some(name.to_string()),
            mime_type: Some(MIME_PDF.to_string()),
            parents: Some(vec![parent_id.to_string()]),
            ..Default::default()
        };

        let cursor = Cursor::new(content);

        let result = self
            .hub
            .files()
            .create(file_metadata)
            .upload(cursor, MIME_PDF.parse().unwrap())
            .await
            .map_err(|e| AppError::DriveError(format!("Failed to upload PDF: {}", e)))?;

        result
            .1
            .id
            .ok_or_else(|| AppError::DriveError("No file ID returned".to_string()))
    }

    /// Obtiene información de un archivo
    pub async fn get_file_info(&self, file_id: &str) -> Result<File, AppError> {
        let (_, file) = self
            .hub
            .files()
            .get(file_id)
            .param("fields", "id,name,mimeType,webViewLink,webContentLink,parents")
            .doit()
            .await
            .map_err(|e| AppError::DriveError(format!("Failed to get file info: {}", e)))?;

        Ok(file)
    }

    /// Descarga el contenido de un archivo
    pub async fn download_file(&self, file_id: &str) -> Result<Vec<u8>, AppError> {
        let response = self
            .hub
            .files()
            .get(file_id)
            .param("alt", "media")
            .doit()
            .await
            .map_err(|e| AppError::DriveError(format!("Failed to download file: {}", e)))?;

        let bytes = response
            .0
            .into_body()
            .collect()
            .await
            .map_err(|e| AppError::DriveError(format!("Failed to read file content: {}", e)))?
            .to_bytes()
            .to_vec();

        Ok(bytes)
    }

    /// Genera la URL pública de visualización de un archivo
    pub fn get_view_url(file_id: &str) -> String {
        format!("https://docs.google.com/spreadsheets/d/{}/edit", file_id)
    }

    /// Genera la URL pública de visualización de un PDF
    pub fn get_pdf_view_url(file_id: &str) -> String {
        format!("https://drive.google.com/file/d/{}/view", file_id)
    }

    /// Genera la URL de exportación PDF de un Sheet
    pub fn get_pdf_export_url(file_id: &str) -> String {
        format!("https://docs.google.com/spreadsheets/d/{}/export?format=pdf", file_id)
    }
}
