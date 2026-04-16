//! Service for managing ensayo (test) sheets and PDF generation
//! 
//! This service handles:
//! - Template lookup from DB (tipos_ensayo_sheets table)
//! - Sheet creation: copying templates to perforacion folders
//! - PDF generation: exporting sheets as PDFs when tests reach E12 state

use crate::db::DbPool;
use crate::errors::AppError;
use crate::repositories::TipoEnsayoSheetRepository;
use crate::services::google_drive::GoogleDriveClient;

/// Service for managing ensayo sheets and PDFs
#[derive(Clone)]
pub struct EnsayoSheetsService {
    drive_client: GoogleDriveClient,
    sheet_repo: TipoEnsayoSheetRepository,
}

impl EnsayoSheetsService {
    /// Creates a new EnsayoSheetsService
    /// 
    /// Templates are now read from the `tipos_ensayo_sheets` table in the database.
    /// Use the CRUD endpoints at /api/tipos-ensayo-sheets to manage templates.
    pub fn new(drive_client: GoogleDriveClient, db_pool: DbPool) -> Self {
        Self {
            drive_client,
            sheet_repo: TipoEnsayoSheetRepository::new(db_pool),
        }
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

    /// Creates a new ensayo sheet by copying the template to the perforacion folder
    /// 
    /// # Arguments
    /// * `tipo_ensayo_id` - The tipo_ensayo ID from the database
    /// * `ensayo_codigo` - The unique code for this test (e.g., "ENS-20250113-0001")
    /// * `perforacion_folder_id` - The Google Drive folder ID for the perforacion
    /// 
    /// # Returns
    /// * `Ok((sheet_id, sheet_url))` - The ID and URL of the created sheet
    /// * `Err(AppError)` - If the template doesn't exist or copy fails
    pub async fn create_ensayo_sheet(
        &self,
        tipo_ensayo_id: &str,
        ensayo_codigo: &str,
        perforacion_folder_id: &str,
    ) -> Result<(String, String), AppError> {
        let template_drive_id = self.get_template_drive_id(tipo_ensayo_id).await?;

        // Copy the template to the perforacion folder
        let sheet_id = self.drive_client
            .copy_file(&template_drive_id, ensayo_codigo, perforacion_folder_id)
            .await?;

        // Generate the view URL
        let sheet_url = GoogleDriveClient::get_view_url(&sheet_id);

        tracing::info!(
            "Created ensayo sheet: {} (tipo_ensayo: {}) in folder {}",
            ensayo_codigo, tipo_ensayo_id, perforacion_folder_id
        );

        Ok((sheet_id, sheet_url))
    }

    /// Generates a PDF from an ensayo sheet
    /// 
    /// # Arguments
    /// * `sheet_id` - The Google Drive file ID of the ensayo sheet
    /// 
    /// # Returns
    /// * `Ok(Vec<u8>)` - The PDF content as bytes
    /// * `Err(AppError)` - If export fails
    pub async fn generate_pdf(&self, sheet_id: &str) -> Result<Vec<u8>, AppError> {
        let pdf_bytes = self.drive_client
            .export_as_pdf(sheet_id)
            .await?;

        tracing::info!("Generated PDF for sheet: {} ({} bytes)", sheet_id, pdf_bytes.len());

        Ok(pdf_bytes)
    }

    /// Generates a PDF and uploads it to Drive alongside the sheet
    /// 
    /// # Arguments
    /// * `sheet_id` - The Google Drive file ID of the ensayo sheet
    /// * `pdf_name` - Name for the PDF file (e.g., "ENS-20250113-0001.pdf")
    /// * `folder_id` - The folder to save the PDF in
    /// 
    /// # Returns
    /// * `Ok(String)` - The Drive file ID of the uploaded PDF
    /// * `Err(AppError)` - If generation or upload fails
    pub async fn generate_and_upload_pdf(
        &self,
        sheet_id: &str,
        pdf_name: &str,
        folder_id: &str,
    ) -> Result<String, AppError> {
        // Generate the PDF
        let pdf_bytes = self.generate_pdf(sheet_id).await?;

        // Upload to Drive
        let pdf_id = self.drive_client
            .upload_pdf(pdf_name, folder_id, pdf_bytes)
            .await?;

        tracing::info!("Uploaded PDF: {} (id: {}) to folder {}", pdf_name, pdf_id, folder_id);

        Ok(pdf_id)
    }

    /// Downloads a previously generated PDF
    /// 
    /// # Arguments
    /// * `pdf_id` - The Google Drive file ID of the PDF
    /// 
    /// # Returns
    /// * `Ok(Vec<u8>)` - The PDF content as bytes
    /// * `Err(AppError)` - If download fails
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
