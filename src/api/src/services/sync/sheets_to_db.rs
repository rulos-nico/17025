use tracing::{info, warn, error};

use crate::db::DbPool;
use crate::models::{Cliente, Proyecto, Ensayo, Equipo};
use crate::repositories::{
    ClienteRepository, ProyectoRepository, EnsayoRepository, EquipoRepository
};
use crate::services::google_sheets::GoogleSheetsClient;

use super::{SyncResult, SyncError, FullSyncSummary};

/// Servicio de sincronización de Google Sheets hacia la base de datos
/// 
/// Este servicio lee datos de Google Sheets y los sincroniza con PostgreSQL.
/// Usa upsert para manejar tanto inserciones como actualizaciones.
#[derive(Clone)]
pub struct SheetsToDatabaseSync {
    sheets_client: GoogleSheetsClient,
    cliente_repo: ClienteRepository,
    proyecto_repo: ProyectoRepository,
    ensayo_repo: EnsayoRepository,
    equipo_repo: EquipoRepository,
}

impl SheetsToDatabaseSync {
    pub fn new(pool: DbPool, sheets_client: GoogleSheetsClient) -> Self {
        Self {
            sheets_client,
            cliente_repo: ClienteRepository::new(pool.clone()),
            proyecto_repo: ProyectoRepository::new(pool.clone()),
            ensayo_repo: EnsayoRepository::new(pool.clone()),
            equipo_repo: EquipoRepository::new(pool),
        }
    }

    /// Ejecuta sincronización completa de todas las entidades
    pub async fn sync_all(&self) -> FullSyncSummary {
        let mut summary = FullSyncSummary::new("sheets_to_db");
        info!("Iniciando sincronización completa Sheets -> DB");

        // Sincronizar en orden de dependencias
        // 1. Clientes (sin dependencias)
        let clientes_result = self.sync_clientes().await;
        summary.add_result(clientes_result);

        // 2. Equipos (sin dependencias)
        let equipos_result = self.sync_equipos().await;
        summary.add_result(equipos_result);

        // 3. Proyectos (depende de clientes)
        let proyectos_result = self.sync_proyectos().await;
        summary.add_result(proyectos_result);

        // 4. Ensayos (depende de proyectos y perforaciones)
        let ensayos_result = self.sync_ensayos().await;
        summary.add_result(ensayos_result);

        summary.finalize();
        
        info!(
            "Sincronización Sheets -> DB completada: {} registros procesados, {} errores en {}ms",
            summary.total_processed(),
            summary.total_errors(),
            summary.total_duration_ms
        );

        summary
    }

    /// Sincroniza clientes desde Sheets
    pub async fn sync_clientes(&self) -> SyncResult {
        let mut result = SyncResult::new("clientes");
        info!("Sincronizando clientes desde Sheets...");

        match self.sheets_client.read_sheet("Clientes").await {
            Ok(rows) => {
                for row in rows {
                    if let Some(cliente) = Cliente::from_row(&row) {
                        result.total_processed += 1;
                        
                        match self.cliente_repo.upsert_from_sheets(&cliente).await {
                            Ok(_) => {
                                result.inserted += 1; // Contamos como "procesado exitosamente"
                            }
                            Err(e) => {
                                warn!("Error sincronizando cliente {}: {}", cliente.id, e);
                                result.errors.push(SyncError::new(&cliente.id, &e.to_string()));
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!("Error leyendo hoja Clientes: {}", e);
                result.errors.push(SyncError::new("sheet", &e.to_string()));
            }
        }

        result.finalize();
        info!(
            "Clientes sincronizados: {} procesados, {} errores",
            result.total_processed,
            result.errors.len()
        );
        result
    }

    /// Sincroniza proyectos desde Sheets
    pub async fn sync_proyectos(&self) -> SyncResult {
        let mut result = SyncResult::new("proyectos");
        info!("Sincronizando proyectos desde Sheets...");

        match self.sheets_client.read_sheet("Proyectos").await {
            Ok(rows) => {
                for row in rows {
                    if let Some(proyecto) = Proyecto::from_row(&row) {
                        result.total_processed += 1;
                        
                        match self.proyecto_repo.upsert_from_sheets(&proyecto).await {
                            Ok(_) => {
                                result.inserted += 1;
                            }
                            Err(e) => {
                                warn!("Error sincronizando proyecto {}: {}", proyecto.id, e);
                                result.errors.push(SyncError::new(&proyecto.id, &e.to_string()));
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!("Error leyendo hoja Proyectos: {}", e);
                result.errors.push(SyncError::new("sheet", &e.to_string()));
            }
        }

        result.finalize();
        info!(
            "Proyectos sincronizados: {} procesados, {} errores",
            result.total_processed,
            result.errors.len()
        );
        result
    }

    /// Sincroniza ensayos desde Sheets
    pub async fn sync_ensayos(&self) -> SyncResult {
        let mut result = SyncResult::new("ensayos");
        info!("Sincronizando ensayos desde Sheets...");

        match self.sheets_client.read_sheet("Ensayos").await {
            Ok(rows) => {
                for row in rows {
                    if let Some(ensayo) = Ensayo::from_row(&row) {
                        result.total_processed += 1;
                        
                        match self.ensayo_repo.upsert_from_sheets(&ensayo).await {
                            Ok(_) => {
                                result.inserted += 1;
                            }
                            Err(e) => {
                                warn!("Error sincronizando ensayo {}: {}", ensayo.id, e);
                                result.errors.push(SyncError::new(&ensayo.id, &e.to_string()));
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!("Error leyendo hoja Ensayos: {}", e);
                result.errors.push(SyncError::new("sheet", &e.to_string()));
            }
        }

        result.finalize();
        info!(
            "Ensayos sincronizados: {} procesados, {} errores",
            result.total_processed,
            result.errors.len()
        );
        result
    }

    /// Sincroniza equipos desde Sheets
    pub async fn sync_equipos(&self) -> SyncResult {
        let mut result = SyncResult::new("equipos");
        info!("Sincronizando equipos desde Sheets...");

        match self.sheets_client.read_sheet("Equipos").await {
            Ok(rows) => {
                for row in rows {
                    if let Some(equipo) = Equipo::from_row(&row) {
                        result.total_processed += 1;
                        
                        match self.equipo_repo.upsert_from_sheets(&equipo).await {
                            Ok(_) => {
                                result.inserted += 1;
                            }
                            Err(e) => {
                                warn!("Error sincronizando equipo {}: {}", equipo.id, e);
                                result.errors.push(SyncError::new(&equipo.id, &e.to_string()));
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!("Error leyendo hoja Equipos: {}", e);
                result.errors.push(SyncError::new("sheet", &e.to_string()));
            }
        }

        result.finalize();
        info!(
            "Equipos sincronizados: {} procesados, {} errores",
            result.total_processed,
            result.errors.len()
        );
        result
    }
}
