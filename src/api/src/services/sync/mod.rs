pub mod sheets_to_db;
pub mod db_to_sheets;

pub use sheets_to_db::SheetsToDatabaseSync;
pub use db_to_sheets::DatabaseToSheetsSync;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Resultado de una operación de sincronización
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub entity_type: String,
    pub total_processed: usize,
    pub inserted: usize,
    pub updated: usize,
    pub errors: Vec<SyncError>,
    pub started_at: DateTime<Utc>,
    pub completed_at: DateTime<Utc>,
    pub duration_ms: i64,
}

impl SyncResult {
    pub fn new(entity_type: &str) -> Self {
        let now = Utc::now();
        Self {
            entity_type: entity_type.to_string(),
            total_processed: 0,
            inserted: 0,
            updated: 0,
            errors: Vec::new(),
            started_at: now,
            completed_at: now,
            duration_ms: 0,
        }
    }

    pub fn finalize(&mut self) {
        self.completed_at = Utc::now();
        self.duration_ms = (self.completed_at - self.started_at).num_milliseconds();
    }

    pub fn is_success(&self) -> bool {
        self.errors.is_empty()
    }
}

/// Error durante sincronización
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncError {
    pub entity_id: String,
    pub message: String,
    pub timestamp: DateTime<Utc>,
}

impl SyncError {
    pub fn new(entity_id: &str, message: &str) -> Self {
        Self {
            entity_id: entity_id.to_string(),
            message: message.to_string(),
            timestamp: Utc::now(),
        }
    }
}

/// Resumen completo de sincronización
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FullSyncSummary {
    pub direction: String,
    pub results: Vec<SyncResult>,
    pub total_duration_ms: i64,
    pub started_at: DateTime<Utc>,
    pub completed_at: DateTime<Utc>,
}

impl FullSyncSummary {
    pub fn new(direction: &str) -> Self {
        Self {
            direction: direction.to_string(),
            results: Vec::new(),
            total_duration_ms: 0,
            started_at: Utc::now(),
            completed_at: Utc::now(),
        }
    }

    pub fn add_result(&mut self, result: SyncResult) {
        self.results.push(result);
    }

    pub fn finalize(&mut self) {
        self.completed_at = Utc::now();
        self.total_duration_ms = (self.completed_at - self.started_at).num_milliseconds();
    }

    pub fn total_processed(&self) -> usize {
        self.results.iter().map(|r| r.total_processed).sum()
    }

    pub fn total_errors(&self) -> usize {
        self.results.iter().map(|r| r.errors.len()).sum()
    }

    pub fn is_success(&self) -> bool {
        self.results.iter().all(|r| r.is_success())
    }
}

/// Estado de sincronización guardado para control incremental
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncState {
    pub last_sync_sheets_to_db: Option<DateTime<Utc>>,
    pub last_sync_db_to_sheets: Option<DateTime<Utc>>,
    pub last_full_sync: Option<DateTime<Utc>>,
}

impl Default for SyncState {
    fn default() -> Self {
        Self {
            last_sync_sheets_to_db: None,
            last_sync_db_to_sheets: None,
            last_full_sync: None,
        }
    }
}
