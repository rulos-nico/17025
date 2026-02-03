//! Service for managing ensayo (test) sheets and PDF generation
//! 
//! This service handles:
//! - Template mapping: which Sheet template to use for each test type
//! - Sheet creation: copying templates to perforacion folders
//! - PDF generation: exporting sheets as PDFs when tests reach E12 state

use std::collections::HashMap;

use crate::errors::AppError;
use crate::services::google_drive::GoogleDriveClient;

/// Configuration for an ensayo template
#[derive(Debug, Clone)]
pub struct EnsayoTemplate {
    /// Google Drive file ID of the template Sheet
    pub template_id: String,
    /// Human-readable name of the test type
    pub name: String,
    /// Norma/standard associated with this test
    pub norma: String,
}

/// Service for managing ensayo sheets and PDFs
#[derive(Clone)]
pub struct EnsayoSheetsService {
    drive_client: GoogleDriveClient,
    templates: HashMap<String, EnsayoTemplate>,
}

impl EnsayoSheetsService {
    /// Creates a new EnsayoSheetsService
    /// 
    /// Templates are configured here. To add new test types:
    /// 1. Create a Google Sheet template
    /// 2. Get the file ID from the URL
    /// 3. Add an entry in the templates HashMap below
    pub fn new(drive_client: GoogleDriveClient) -> Self {
        let templates = HashMap::new();

        // ============================================================
        // TEMPLATE CONFIGURATION
        // Add your test type templates here
        // Format: templates.insert("TIPO_CODIGO", EnsayoTemplate { ... });
        // ============================================================
        
        // Ejemplo: Ensayo de Compresión Simple
        // templates.insert(
        //     "COMPRESION_SIMPLE".to_string(),
        //     EnsayoTemplate {
        //         template_id: "1ABC123...".to_string(), // ID del Sheet de plantilla
        //         name: "Compresión Simple".to_string(),
        //         norma: "ASTM D2166".to_string(),
        //     },
        // );

        // Ejemplo: Ensayo de Consolidación
        // templates.insert(
        //     "CONSOLIDACION".to_string(),
        //     EnsayoTemplate {
        //         template_id: "1DEF456...".to_string(),
        //         name: "Consolidación".to_string(),
        //         norma: "ASTM D2435".to_string(),
        //     },
        // );

        // Ejemplo: Ensayo Triaxial
        // templates.insert(
        //     "TRIAXIAL_UU".to_string(),
        //     EnsayoTemplate {
        //         template_id: "1GHI789...".to_string(),
        //         name: "Triaxial UU".to_string(),
        //         norma: "ASTM D2850".to_string(),
        //     },
        // );

        // Ejemplo: Límites de Atterberg
        // templates.insert(
        //     "LIMITES_ATTERBERG".to_string(),
        //     EnsayoTemplate {
        //         template_id: "1JKL012...".to_string(),
        //         name: "Límites de Atterberg".to_string(),
        //         norma: "ASTM D4318".to_string(),
        //     },
        // );

        // Ejemplo: Granulometría
        // templates.insert(
        //     "GRANULOMETRIA".to_string(),
        //     EnsayoTemplate {
        //         template_id: "1MNO345...".to_string(),
        //         name: "Granulometría".to_string(),
        //         norma: "ASTM D422".to_string(),
        //     },
        // );

        // Ejemplo: Humedad Natural
        // templates.insert(
        //     "HUMEDAD_NATURAL".to_string(),
        //     EnsayoTemplate {
        //         template_id: "1PQR678...".to_string(),
        //         name: "Humedad Natural".to_string(),
        //         norma: "ASTM D2216".to_string(),
        //     },
        // );

        Self {
            drive_client,
            templates,
        }
    }

    /// Gets the template for a specific test type
    pub fn get_template(&self, tipo_ensayo: &str) -> Option<&EnsayoTemplate> {
        self.templates.get(tipo_ensayo)
    }

    /// Returns all available test types with templates
    pub fn get_available_types(&self) -> Vec<(&String, &EnsayoTemplate)> {
        self.templates.iter().collect()
    }

    /// Checks if a test type has a template configured
    pub fn has_template(&self, tipo_ensayo: &str) -> bool {
        self.templates.contains_key(tipo_ensayo)
    }

    /// Creates a new ensayo sheet by copying the template to the perforacion folder
    /// 
    /// # Arguments
    /// * `tipo_ensayo` - The test type code (e.g., "COMPRESION_SIMPLE")
    /// * `ensayo_codigo` - The unique code for this test (e.g., "ENS-20250113-0001")
    /// * `perforacion_folder_id` - The Google Drive folder ID for the perforacion
    /// 
    /// # Returns
    /// * `Ok((sheet_id, sheet_url))` - The ID and URL of the created sheet
    /// * `Err(AppError)` - If the template doesn't exist or copy fails
    pub async fn create_ensayo_sheet(
        &self,
        tipo_ensayo: &str,
        ensayo_codigo: &str,
        perforacion_folder_id: &str,
    ) -> Result<(String, String), AppError> {
        // Get the template for this test type
        let template = self.get_template(tipo_ensayo)
            .ok_or_else(|| AppError::BadRequest(
                format!("No template configured for test type: {}", tipo_ensayo)
            ))?;

        // Copy the template to the perforacion folder
        let sheet_id = self.drive_client
            .copy_file(&template.template_id, ensayo_codigo, perforacion_folder_id)
            .await?;

        // Generate the view URL
        let sheet_url = GoogleDriveClient::get_view_url(&sheet_id);

        tracing::info!(
            "Created ensayo sheet: {} (type: {}) in folder {}",
            ensayo_codigo, tipo_ensayo, perforacion_folder_id
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_template_url_generation() {
        let sheet_id = "1ABC123xyz";
        let view_url = GoogleDriveClient::get_view_url(sheet_id);
        assert!(view_url.contains(sheet_id));
        assert!(view_url.contains("edit"));
    }
}
