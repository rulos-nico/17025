use chrono::{DateTime, Utc};
use tracing::{info, warn, error};

use crate::db::DbPool;
use crate::repositories::{
    ClienteRepository, ProyectoRepository, EnsayoRepository, EquipoRepository
};
use crate::services::google_sheets::GoogleSheetsClient;

use super::{SyncResult, SyncError, FullSyncSummary};

/// Servicio de sincronización de la base de datos hacia Google Sheets
/// 
/// Este servicio detecta cambios en PostgreSQL y los propaga a Google Sheets.
/// Solo sincroniza registros cuyo `sync_source = 'db'` (modificados localmente).
#[derive(Clone)]
pub struct DatabaseToSheetsSync {
    sheets_client: GoogleSheetsClient,
    cliente_repo: ClienteRepository,
    proyecto_repo: ProyectoRepository,
    ensayo_repo: EnsayoRepository,
    equipo_repo: EquipoRepository,
}

impl DatabaseToSheetsSync {
    pub fn new(pool: DbPool, sheets_client: GoogleSheetsClient) -> Self {
        Self {
            sheets_client,
            cliente_repo: ClienteRepository::new(pool.clone()),
            proyecto_repo: ProyectoRepository::new(pool.clone()),
            ensayo_repo: EnsayoRepository::new(pool.clone()),
            equipo_repo: EquipoRepository::new(pool),
        }
    }

    /// Ejecuta sincronización de cambios desde una fecha específica
    pub async fn sync_changes_since(&self, since: DateTime<Utc>) -> FullSyncSummary {
        let mut summary = FullSyncSummary::new("db_to_sheets");
        info!("Iniciando sincronización DB -> Sheets desde {:?}", since);

        // Sincronizar cada entidad
        let clientes_result = self.sync_clientes_since(since).await;
        summary.add_result(clientes_result);

        let equipos_result = self.sync_equipos_since(since).await;
        summary.add_result(equipos_result);

        let proyectos_result = self.sync_proyectos_since(since).await;
        summary.add_result(proyectos_result);

        let ensayos_result = self.sync_ensayos_since(since).await;
        summary.add_result(ensayos_result);

        summary.finalize();
        
        info!(
            "Sincronización DB -> Sheets completada: {} registros procesados, {} errores en {}ms",
            summary.total_processed(),
            summary.total_errors(),
            summary.total_duration_ms
        );

        summary
    }

    /// Sincroniza todos los datos de DB a Sheets (sobrescribe todo)
    pub async fn sync_all(&self) -> FullSyncSummary {
        let mut summary = FullSyncSummary::new("db_to_sheets_full");
        info!("Iniciando sincronización completa DB -> Sheets");

        let clientes_result = self.sync_all_clientes().await;
        summary.add_result(clientes_result);

        let equipos_result = self.sync_all_equipos().await;
        summary.add_result(equipos_result);

        let proyectos_result = self.sync_all_proyectos().await;
        summary.add_result(proyectos_result);

        let ensayos_result = self.sync_all_ensayos().await;
        summary.add_result(ensayos_result);

        summary.finalize();
        summary
    }

    /// Sincroniza clientes modificados desde una fecha
    async fn sync_clientes_since(&self, since: DateTime<Utc>) -> SyncResult {
        let mut result = SyncResult::new("clientes");
        info!("Sincronizando clientes modificados a Sheets...");

        match self.cliente_repo.find_modified_since(since).await {
            Ok(clientes) => {
                for cliente in clientes {
                    result.total_processed += 1;
                    let row = cliente.to_row();
                    
                    match self.sheets_client.update_row_id("Clientes", &cliente.id, row).await {
                        Ok(_) => {
                            result.updated += 1;
                        }
                        Err(e) => {
                            // Si no existe, intentar agregar
                            let row_for_append = cliente.to_row();
                            match self.sheets_client.append_row("Clientes", row_for_append).await {
                                Ok(_) => {
                                    result.inserted += 1;
                                }
                                Err(append_err) => {
                                    warn!("Error sincronizando cliente {} a Sheets: {} / {}", 
                                          cliente.id, e, append_err);
                                    result.errors.push(SyncError::new(&cliente.id, &append_err.to_string()));
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!("Error obteniendo clientes modificados: {}", e);
                result.errors.push(SyncError::new("db", &e.to_string()));
            }
        }

        result.finalize();
        result
    }

    /// Sincroniza proyectos modificados desde una fecha
    async fn sync_proyectos_since(&self, since: DateTime<Utc>) -> SyncResult {
        let mut result = SyncResult::new("proyectos");
        info!("Sincronizando proyectos modificados a Sheets...");

        match self.proyecto_repo.find_modified_since(since).await {
            Ok(proyectos) => {
                for proyecto in proyectos {
                    result.total_processed += 1;
                    let row = proyecto.to_row();
                    
                    match self.sheets_client.update_row_id("Proyectos", &proyecto.id, row).await {
                        Ok(_) => {
                            result.updated += 1;
                        }
                        Err(e) => {
                            let row_for_append = proyecto.to_row();
                            match self.sheets_client.append_row("Proyectos", row_for_append).await {
                                Ok(_) => {
                                    result.inserted += 1;
                                }
                                Err(append_err) => {
                                    warn!("Error sincronizando proyecto {} a Sheets: {} / {}", 
                                          proyecto.id, e, append_err);
                                    result.errors.push(SyncError::new(&proyecto.id, &append_err.to_string()));
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!("Error obteniendo proyectos modificados: {}", e);
                result.errors.push(SyncError::new("db", &e.to_string()));
            }
        }

        result.finalize();
        result
    }

    /// Sincroniza ensayos modificados desde una fecha
    async fn sync_ensayos_since(&self, since: DateTime<Utc>) -> SyncResult {
        let mut result = SyncResult::new("ensayos");
        info!("Sincronizando ensayos modificados a Sheets...");

        match self.ensayo_repo.find_modified_since(since).await {
            Ok(ensayos) => {
                for ensayo in ensayos {
                    result.total_processed += 1;
                    let row = ensayo.to_row();
                    
                    match self.sheets_client.update_row_id("Ensayos", &ensayo.id, row).await {
                        Ok(_) => {
                            result.updated += 1;
                        }
                        Err(e) => {
                            let row_for_append = ensayo.to_row();
                            match self.sheets_client.append_row("Ensayos", row_for_append).await {
                                Ok(_) => {
                                    result.inserted += 1;
                                }
                                Err(append_err) => {
                                    warn!("Error sincronizando ensayo {} a Sheets: {} / {}", 
                                          ensayo.id, e, append_err);
                                    result.errors.push(SyncError::new(&ensayo.id, &append_err.to_string()));
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!("Error obteniendo ensayos modificados: {}", e);
                result.errors.push(SyncError::new("db", &e.to_string()));
            }
        }

        result.finalize();
        result
    }

    /// Sincroniza equipos modificados desde una fecha
    async fn sync_equipos_since(&self, since: DateTime<Utc>) -> SyncResult {
        let mut result = SyncResult::new("equipos");
        info!("Sincronizando equipos modificados a Sheets...");

        match self.equipo_repo.find_modified_since(since).await {
            Ok(equipos) => {
                for equipo in equipos {
                    result.total_processed += 1;
                    let row = equipo.to_row();
                    
                    match self.sheets_client.update_row_id("Equipos", &equipo.id, row).await {
                        Ok(_) => {
                            result.updated += 1;
                        }
                        Err(e) => {
                            let row_for_append = equipo.to_row();
                            match self.sheets_client.append_row("Equipos", row_for_append).await {
                                Ok(_) => {
                                    result.inserted += 1;
                                }
                                Err(append_err) => {
                                    warn!("Error sincronizando equipo {} a Sheets: {} / {}", 
                                          equipo.id, e, append_err);
                                    result.errors.push(SyncError::new(&equipo.id, &append_err.to_string()));
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!("Error obteniendo equipos modificados: {}", e);
                result.errors.push(SyncError::new("db", &e.to_string()));
            }
        }

        result.finalize();
        result
    }

    // ============== Métodos de sincronización completa ==============

    /// Sincroniza todos los clientes a Sheets
    async fn sync_all_clientes(&self) -> SyncResult {
        let mut result = SyncResult::new("clientes");
        info!("Sincronizando todos los clientes a Sheets...");

        match self.cliente_repo.find_all().await {
            Ok(clientes) => {
                // Construir todas las filas
                let rows: Vec<Vec<String>> = clientes.iter().map(|c| c.to_row()).collect();
                result.total_processed = rows.len();

                // Limpiar y reescribir toda la hoja
                match self.sheets_client.replace_sheet_data("Clientes", rows).await {
                    Ok(_) => {
                        result.inserted = result.total_processed;
                        info!("Clientes sincronizados completamente: {}", result.total_processed);
                    }
                    Err(e) => {
                        error!("Error reemplazando datos de Clientes: {}", e);
                        result.errors.push(SyncError::new("sheet", &e.to_string()));
                    }
                }
            }
            Err(e) => {
                error!("Error obteniendo clientes: {}", e);
                result.errors.push(SyncError::new("db", &e.to_string()));
            }
        }

        result.finalize();
        result
    }

    /// Sincroniza todos los proyectos a Sheets
    async fn sync_all_proyectos(&self) -> SyncResult {
        let mut result = SyncResult::new("proyectos");
        info!("Sincronizando todos los proyectos a Sheets...");

        match self.proyecto_repo.find_all().await {
            Ok(proyectos) => {
                let rows: Vec<Vec<String>> = proyectos.iter().map(|p| p.to_row()).collect();
                result.total_processed = rows.len();

                match self.sheets_client.replace_sheet_data("Proyectos", rows).await {
                    Ok(_) => {
                        result.inserted = result.total_processed;
                    }
                    Err(e) => {
                        error!("Error reemplazando datos de Proyectos: {}", e);
                        result.errors.push(SyncError::new("sheet", &e.to_string()));
                    }
                }
            }
            Err(e) => {
                error!("Error obteniendo proyectos: {}", e);
                result.errors.push(SyncError::new("db", &e.to_string()));
            }
        }

        result.finalize();
        result
    }

    /// Sincroniza todos los ensayos a Sheets
    async fn sync_all_ensayos(&self) -> SyncResult {
        let mut result = SyncResult::new("ensayos");
        info!("Sincronizando todos los ensayos a Sheets...");

        match self.ensayo_repo.find_all().await {
            Ok(ensayos) => {
                let rows: Vec<Vec<String>> = ensayos.iter().map(|e| e.to_row()).collect();
                result.total_processed = rows.len();

                match self.sheets_client.replace_sheet_data("Ensayos", rows).await {
                    Ok(_) => {
                        result.inserted = result.total_processed;
                    }
                    Err(e) => {
                        error!("Error reemplazando datos de Ensayos: {}", e);
                        result.errors.push(SyncError::new("sheet", &e.to_string()));
                    }
                }
            }
            Err(e) => {
                error!("Error obteniendo ensayos: {}", e);
                result.errors.push(SyncError::new("db", &e.to_string()));
            }
        }

        result.finalize();
        result
    }

    /// Sincroniza todos los equipos a Sheets
    async fn sync_all_equipos(&self) -> SyncResult {
        let mut result = SyncResult::new("equipos");
        info!("Sincronizando todos los equipos a Sheets...");

        match self.equipo_repo.find_all().await {
            Ok(equipos) => {
                let rows: Vec<Vec<String>> = equipos.iter().map(|e| e.to_row()).collect();
                result.total_processed = rows.len();

                match self.sheets_client.replace_sheet_data("Equipos", rows).await {
                    Ok(_) => {
                        result.inserted = result.total_processed;
                    }
                    Err(e) => {
                        error!("Error reemplazando datos de Equipos: {}", e);
                        result.errors.push(SyncError::new("sheet", &e.to_string()));
                    }
                }
            }
            Err(e) => {
                error!("Error obteniendo equipos: {}", e);
                result.errors.push(SyncError::new("db", &e.to_string()));
            }
        }

        result.finalize();
        result
    }
}
