//! Service for managing ensayo (test) sheets and PDF generation
//! 
//! This service handles:
//! - Template lookup from DB (tipos_ensayo_sheets table)
//! - Drive folder hierarchy: Proyecto → Perforación → Muestra
//! - Sheet creation: copying templates to muestra folders
//! - PDF generation: exporting sheets as PDFs when tests reach E12 state

use crate::db::DbPool;
use crate::errors::AppError;
use crate::models::{Muestra, Perforacion, Proyecto};
use crate::repositories::{
    MuestraRepository, PerforacionRepository, ProyectoRepository, TipoEnsayoSheetRepository,
};
use crate::services::google_drive::GoogleDriveClient;

/// Service for managing ensayo sheets and PDFs
#[derive(Clone)]
pub struct EnsayoSheetsService {
    drive_client: GoogleDriveClient,
    sheet_repo: TipoEnsayoSheetRepository,
    db_pool: DbPool,
    root_folder_id: Option<String>,
}

impl EnsayoSheetsService {
    /// Creates a new EnsayoSheetsService
    /// 
    /// Templates are now read from the `tipos_ensayo_sheets` table in the database.
    /// Use the CRUD endpoints at /api/tipos-ensayo-sheets to manage templates.
    pub fn new(drive_client: GoogleDriveClient, db_pool: DbPool, root_folder_id: Option<String>) -> Self {
        Self {
            drive_client,
            sheet_repo: TipoEnsayoSheetRepository::new(db_pool.clone()),
            db_pool,
            root_folder_id,
        }
    }

    /// Returns a reference to the Drive client
    pub fn drive_client(&self) -> &GoogleDriveClient {
        &self.drive_client
    }

    /// Gets the template Drive ID for a specific tipo_ensayo_id from the DB
    async fn get_template_drive_id(&self, tipo_ensayo_id: &str) -> Result<String, AppError> {
        let sheet = self.sheet_repo
            .find_active_by_tipo_ensayo_id(tipo_ensayo_id)
            .await
            .map_err(|e| AppError::DatabaseError(format!("DB error: {}", e)))?
            .ok_or_else(|| AppError::BadRequest(
                format!("No active template configured for tipo_ensayo: {}", tipo_ensayo_id)
            ))?;

        sheet.drive_id.ok_or_else(|| AppError::BadRequest(
            format!("Template for tipo_ensayo {} has no drive_id", tipo_ensayo_id)
        ))
    }

    /// Checks if a test type has a template configured
    pub async fn has_template(&self, tipo_ensayo_id: &str) -> bool {
        self.sheet_repo
            .find_active_by_tipo_ensayo_id(tipo_ensayo_id)
            .await
            .ok()
            .flatten()
            .is_some()
    }

    /// Ensures the full Drive folder hierarchy exists: Proyecto → Perforación → Muestra
    ///
    /// Creates any missing folders and saves their IDs back to the database.
    /// Returns the muestra's drive_folder_id where the ensayo Sheet should be placed.
    pub async fn ensure_folder_hierarchy(
        &self,
        proyecto: &Proyecto,
        perforacion: &Perforacion,
        muestra: &Muestra,
    ) -> Result<String, AppError> {
        let proyecto_repo = ProyectoRepository::new(self.db_pool.clone());
        let perforacion_repo = PerforacionRepository::new(self.db_pool.clone());
        let muestra_repo = MuestraRepository::new(self.db_pool.clone());

        // 1. Ensure proyecto folder exists
        let proyecto_folder_id = match &proyecto.drive_folder_id {
            Some(id) => id.clone(),
            None => {
                let parent = self.root_folder_id.as_deref()
                    .ok_or_else(|| AppError::DriveError("No root folder ID configured".to_string()))?;
                let folder_name = format!("{} - {}", proyecto.codigo, proyecto.nombre);
                let folder_id = self.drive_client.create_folder(&folder_name, Some(parent)).await?;
                proyecto_repo.update_drive_folder_id(&proyecto.id, &folder_id).await
                    .map_err(|e| AppError::DatabaseError(format!("Failed to save proyecto folder: {}", e)))?;
                tracing::info!("Created Drive folder for proyecto {}: {}", proyecto.codigo, folder_id);
                folder_id
            }
        };

        // 2. Ensure perforacion folder exists
        let perforacion_folder_id = match &perforacion.drive_folder_id {
            Some(id) => id.clone(),
            None => {
                let folder_name = format!("{} - {}", perforacion.codigo, perforacion.nombre);
                let folder_id = self.drive_client.create_folder(&folder_name, Some(&proyecto_folder_id)).await?;
                perforacion_repo.update_drive_folder_id(&perforacion.id, &folder_id).await
                    .map_err(|e| AppError::DatabaseError(format!("Failed to save perforacion folder: {}", e)))?;
                tracing::info!("Created Drive folder for perforacion {}: {}", perforacion.codigo, folder_id);
                folder_id
            }
        };

        // 3. Ensure muestra folder exists
        let muestra_folder_id = match &muestra.drive_folder_id {
            Some(id) => id.clone(),
            None => {
                let folder_name = format!("{} ({} {:.2}-{:.2}m)",
                    muestra.codigo, muestra.tipo_muestra,
                    muestra.profundidad_inicio, muestra.profundidad_fin
                );
                let folder_id = self.drive_client.create_folder(&folder_name, Some(&perforacion_folder_id)).await?;
                muestra_repo.update_drive_folder_id(&muestra.id, &folder_id).await
                    .map_err(|e| AppError::DatabaseError(format!("Failed to save muestra folder: {}", e)))?;
                tracing::info!("Created Drive folder for muestra {}: {}", muestra.codigo, folder_id);
                folder_id
            }
        };

        Ok(muestra_folder_id)
    }

    /// Creates a new ensayo sheet by copying the template to the target folder
    /// 
    /// # Arguments
    /// * `tipo_ensayo_id` - The tipo_ensayo ID from the database
    /// * `ensayo_codigo` - The unique code for this test (e.g., "ENS-20250113-0001")
    /// * `folder_id` - The Google Drive folder ID where the sheet will be created
    /// 
    /// # Returns
    /// * `Ok((sheet_id, sheet_url))` - The ID and URL of the created sheet
    /// * `Err(AppError)` - If the template doesn't exist or copy fails
    pub async fn create_ensayo_sheet(
        &self,
        tipo_ensayo_id: &str,
        ensayo_codigo: &str,
        folder_id: &str,
    ) -> Result<(String, String), AppError> {
        let template_drive_id = self.get_template_drive_id(tipo_ensayo_id).await?;

        // Copy the template to the target folder
        let sheet_id = self.drive_client
            .copy_file(&template_drive_id, ensayo_codigo, folder_id)
            .await?;

        // Generate the view URL
        let sheet_url = GoogleDriveClient::get_view_url(&sheet_id);

        tracing::info!(
            "Created ensayo sheet: {} (tipo_ensayo: {}) in folder {}",
            ensayo_codigo, tipo_ensayo_id, folder_id
        );

        Ok((sheet_id, sheet_url))
    }

    /// Generates a PDF from an ensayo sheet
    pub async fn generate_pdf(&self, sheet_id: &str) -> Result<Vec<u8>, AppError> {
        let pdf_bytes = self.drive_client
            .export_as_pdf(sheet_id)
            .await?;

        tracing::info!("Generated PDF for sheet: {} ({} bytes)", sheet_id, pdf_bytes.len());

        Ok(pdf_bytes)
    }

    /// Generates a PDF and uploads it to Drive alongside the sheet
    pub async fn generate_and_upload_pdf(
        &self,
        sheet_id: &str,
        pdf_name: &str,
        folder_id: &str,
    ) -> Result<String, AppError> {
        let pdf_bytes = self.generate_pdf(sheet_id).await?;

        let pdf_id = self.drive_client
            .upload_pdf(pdf_name, folder_id, pdf_bytes)
            .await?;

        tracing::info!("Uploaded PDF: {} (id: {}) to folder {}", pdf_name, pdf_id, folder_id);

        Ok(pdf_id)
    }

    /// Downloads a previously generated PDF
    pub async fn download_pdf(&self, pdf_id: &str) -> Result<Vec<u8>, AppError> {
        self.drive_client.download_file(pdf_id).await
    }
}

/// Result of creating an ensayo with its sheet
#[derive(Debug, Clone)]
pub struct EnsayoSheetCreationResult {
    pub sheet_id: String,
    pub sheet_url: String,
}
