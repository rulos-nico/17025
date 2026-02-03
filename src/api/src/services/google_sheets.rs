use google_sheets4::{
    api::{ClearValuesRequest, ValueRange},
    hyper_rustls::HttpsConnector,
    hyper_util::{client::legacy::connect::HttpConnector, rt::TokioExecutor},
    Sheets,
};
use yup_oauth2::{ServiceAccountAuthenticator, ServiceAccountKey};

use crate::config::Config;
use crate::errors::AppError;

type SheetsHub = Sheets<HttpsConnector<HttpConnector>>;

#[derive(Clone)]
pub struct GoogleSheetsClient {
    hub: SheetsHub,
    spreadsheet_id: String,
}

impl GoogleSheetsClient {
    pub async fn new(config: &Config) -> Result<Self, AppError> {
        // Verificar que tenemos spreadsheet_id configurado
        let spreadsheet_id = config.spreadsheet_id.clone()
            .ok_or_else(|| AppError::SheetsError(
                "GOOGLE_SPREADSHEET_ID not configured. Google Sheets integration disabled.".to_string()
            ))?;
        
        // Leer credenciales del service account
        let creds_json = std::fs::read_to_string(&config.google_credentials_path)
            .map_err(|e| AppError::SheetsError(format!("Failed to read credentials: {}", e)))?;

        let service_account_key: ServiceAccountKey = serde_json::from_str(&creds_json)
            .map_err(|e| AppError::SheetsError(format!("Failed to parse credentials: {}", e)))?;

        // Crear autenticador
        let auth = ServiceAccountAuthenticator::builder(service_account_key)
            .build()
            .await
            .map_err(|e| AppError::SheetsError(format!("Failed to create authenticator: {}", e)))?;

        // Crear cliente HTTPS
        let client = hyper_util::client::legacy::Client::builder(TokioExecutor::new())
            .build(
                hyper_rustls::HttpsConnectorBuilder::new()
                    .with_native_roots()
                    .unwrap()
                    .https_only()
                    .enable_http2()
                    .build(),
            );

        let hub = Sheets::new(client, auth);

        Ok(Self {
            hub,
            spreadsheet_id,
        })
    }

    /// Lee todas las filas de una hoja
    pub async fn read_sheet(&self, sheet_name: &str) -> Result<Vec<Vec<String>>, AppError> {
        let range = format!("{}!A:Z", sheet_name);

        let result = self
            .hub
            .spreadsheets()
            .values_get(&self.spreadsheet_id, &range)
            .doit()
            .await
            .map_err(|e| AppError::SheetsError(format!("Failed to read sheet: {}", e)))?;

        let values = result.1.values.unwrap_or_default();

        // Convertir a Vec<Vec<String>>, skip header row
        let rows: Vec<Vec<String>> = values
            .into_iter()
            .skip(1)
            .map(|row| row.into_iter().map(|cell| cell.to_string()).collect())
            .collect();

        Ok(rows)
    }

    /// Busca una fila por ID (asume que ID está en columna A)
    pub async fn find_by_id(&self, sheet_name: &str, id: &str) -> Result<Vec<String>, AppError> {
        let rows = self.read_sheet(sheet_name).await?;

        rows.into_iter()
            .find(|row| row.first().map(|s| s == id).unwrap_or(false))
            .ok_or(AppError::NotFound)
    }

    /// Agrega una nueva fila al final de la hoja
    pub async fn append_row(&self, sheet_name: &str, values: Vec<String>) -> Result<(), AppError> {
        let range = format!("{}!A:Z", sheet_name);

        let value_range = ValueRange {
            values: Some(vec![values.into_iter().map(|s| s.into()).collect()]),
            ..Default::default()
        };

        self.hub
            .spreadsheets()
            .values_append(value_range, &self.spreadsheet_id, &range)
            .value_input_option("USER_ENTERED")
            .doit()
            .await
            .map_err(|e| AppError::SheetsError(format!("Failed to append row: {}", e)))?;

        Ok(())
    }

    /// Actualiza una fila específica por número de fila
    pub async fn update_row(
        &self,
        sheet_name: &str,
        row_number: usize,
        values: Vec<String>,
    ) -> Result<(), AppError> {
        let range = format!("{}!A{}:Z{}", sheet_name, row_number, row_number);

        let value_range = ValueRange {
            values: Some(vec![values.into_iter().map(|s| s.into()).collect()]),
            ..Default::default()
        };

        self.hub
            .spreadsheets()
            .values_update(value_range, &self.spreadsheet_id, &range)
            .value_input_option("USER_ENTERED")
            .doit()
            .await
            .map_err(|e| AppError::SheetsError(format!("Failed to update row: {}", e)))?;

        Ok(())
    }

    /// Encuentra el número de fila por ID
    pub async fn find_row_number_by_id(
        &self,
        sheet_name: &str,
        id: &str,
    ) -> Result<usize, AppError> {
        let range = format!("{}!A:A", sheet_name);

        let result = self
            .hub
            .spreadsheets()
            .values_get(&self.spreadsheet_id, &range)
            .doit()
            .await
            .map_err(|e| AppError::SheetsError(format!("Failed to read sheet: {}", e)))?;

        let values = result.1.values.unwrap_or_default();

        for (index, row) in values.iter().enumerate() {
            if row.first().map(|s| s.to_string() == id).unwrap_or(false) {
                return Ok(index + 1); // +1 porque las filas empiezan en 1
            }
        }

        Err(AppError::NotFound)
    }

    /// Elimina una fila (la limpia, no la borra físicamente)
    pub async fn delete_row(&self, sheet_name: &str, row_number: usize) -> Result<(), AppError> {
        let range = format!("{}!A{}:Z{}", sheet_name, row_number, row_number);

        let clear_request = ClearValuesRequest::default();

        self.hub
            .spreadsheets()
            .values_clear(clear_request, &self.spreadsheet_id, &range)
            .doit()
            .await
            .map_err(|e| AppError::SheetsError(format!("Failed to delete row: {}", e)))?;

        Ok(())
    }

    /// Actualiza una fila buscándola por ID (columna A)
    pub async fn update_row_id(
        &self,
        sheet_name: &str,
        id: &str,
        values: Vec<String>,
    ) -> Result<(), AppError> {
        // Primero encontrar el número de fila
        let row_number = self.find_row_number_by_id(sheet_name, id).await?;
        
        let range = format!("{}!A{}:Z{}", sheet_name, row_number, row_number);

        let value_range = ValueRange {
            values: Some(vec![values.into_iter().map(|s| s.into()).collect()]),
            ..Default::default()
        };

        self.hub
            .spreadsheets()
            .values_update(value_range, &self.spreadsheet_id, &range)
            .value_input_option("USER_ENTERED")
            .doit()
            .await
            .map_err(|e| AppError::SheetsError(format!("Failed to update row by id: {}", e)))?;

        Ok(())
    }

    /// Lee una hoja y retorna como objetos JSON (usa la primera fila como headers)
    pub async fn read_sheet_as_objects(
        &self,
        sheet_name: &str,
    ) -> Result<Vec<serde_json::Map<String, serde_json::Value>>, AppError> {
        let range = format!("{}!A:Z", sheet_name);

        let result = self
            .hub
            .spreadsheets()
            .values_get(&self.spreadsheet_id, &range)
            .doit()
            .await
            .map_err(|e| AppError::SheetsError(format!("Failed to read sheet: {}", e)))?;

        let values = result.1.values.unwrap_or_default();
        
        if values.is_empty() {
            return Ok(vec![]);
        }

        // Primera fila son los headers
        let headers: Vec<String> = values[0].iter().map(|v| v.to_string().to_lowercase()).collect();

        // Convertir filas a objetos
        let objects: Vec<serde_json::Map<String, serde_json::Value>> = values
            .into_iter()
            .skip(1) // Skip header row
            .map(|row| {
                let mut obj = serde_json::Map::new();
                for (i, cell) in row.into_iter().enumerate() {
                    if let Some(key) = headers.get(i) {
                        obj.insert(key.clone(), serde_json::Value::String(cell.to_string()));
                    }
                }
                obj
            })
            .collect();

        Ok(objects)
    }

    /// Reemplaza todos los datos de una hoja (excepto el header)
    pub async fn replace_sheet_data(
        &self,
        sheet_name: &str,
        rows: Vec<Vec<String>>,
    ) -> Result<(), AppError> {
        // Primero limpiar los datos existentes (excepto header, fila 1)
        let clear_range = format!("{}!A2:Z10000", sheet_name);
        
        let clear_request = ClearValuesRequest::default();

        self.hub
            .spreadsheets()
            .values_clear(clear_request, &self.spreadsheet_id, &clear_range)
            .doit()
            .await
            .map_err(|e| AppError::SheetsError(format!("Failed to clear sheet: {}", e)))?;

        // Si no hay datos, terminamos aquí
        if rows.is_empty() {
            return Ok(());
        }

        // Escribir los nuevos datos
        let write_range = format!("{}!A2:Z{}", sheet_name, rows.len() + 1);

        let value_range = ValueRange {
            values: Some(
                rows.into_iter()
                    .map(|row| row.into_iter().map(|s| s.into()).collect())
                    .collect(),
            ),
            ..Default::default()
        };

        self.hub
            .spreadsheets()
            .values_update(value_range, &self.spreadsheet_id, &write_range)
            .value_input_option("USER_ENTERED")
            .doit()
            .await
            .map_err(|e| AppError::SheetsError(format!("Failed to write sheet data: {}", e)))?;

        Ok(())
    }
}
