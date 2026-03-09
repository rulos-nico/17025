use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put},
    Json, Router,
};

use crate::errors::AppError;
use crate::models::{CreateEnsayo, Ensayo, UpdateEnsayo, UpdateEnsayoStatus, ValidarEnsayoRequest, ValidarEnsayoResponse, WorkflowState};
use crate::repositories::{EnsayoRepository, PerforacionRepository, PersonalInternoRepository};
use crate::services::google_drive::GoogleDriveClient;
use crate::services::scheduler::SchedulerService;
use crate::utils::id::{generate_dated_code, generate_uuid};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_ensayos).post(create_ensayo))
        .route("/{id}", get(get_ensayo).put(update_ensayo).delete(delete_ensayo))
        .route("/{id}/status", put(update_status))
        .route("/{id}/validar", post(validar_ensayo))
        .route("/{id}/pdf", get(download_pdf))
        .route("/{id}/pdf/generate", post(generate_pdf))
}

/// GET /api/ensayos
async fn list_ensayos(
    State(state): State<AppState>,
) -> Result<Json<Vec<Ensayo>>, AppError> {
    let repo = EnsayoRepository::new(state.db_pool.clone());
    let ensayos = repo.find_all().await?;
    Ok(Json(ensayos))
}

/// GET /api/ensayos/:id
async fn get_ensayo(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Ensayo>, AppError> {
    let repo = EnsayoRepository::new(state.db_pool.clone());
    let ensayo = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(ensayo))
}

/// POST /api/ensayos
/// Creates a new ensayo in PostgreSQL.
/// If a Sheet template exists for the test type AND the perforación has a Drive folder,
/// it will also create a copy of the template Sheet in that folder.
async fn create_ensayo(
    State(state): State<AppState>,
    Json(payload): Json<CreateEnsayo>,
) -> Result<(StatusCode, Json<Ensayo>), AppError> {
    let ensayo_repo = EnsayoRepository::new(state.db_pool.clone());
    let perforacion_repo = PerforacionRepository::new(state.db_pool.clone());

    // Verify the perforación exists
    let perforacion = perforacion_repo
        .find_by_id(&payload.perforacion_id)
        .await?
        .ok_or_else(|| {
            AppError::BadRequest(format!("Perforación not found: {}", payload.perforacion_id))
        })?;

    // Generate ID and code
    let id = generate_uuid();
    let codigo = generate_dated_code("ENS");

    // Create the ensayo in database
    let mut ensayo = ensayo_repo.create(&id, &codigo, payload).await?;

    // Crear Sheet desde plantilla si existe y la perforación tiene folder
    if let Some(ref sheets_service) = state.ensayo_sheets_service {
        if sheets_service.has_template(&ensayo.tipo) {
            if let Some(ref folder_id) = perforacion.drive_folder_id {
                match sheets_service
                    .create_ensayo_sheet(&ensayo.tipo, &codigo, folder_id)
                    .await
                {
                    Ok((sheet_id, sheet_url)) => {
                        ensayo_repo
                            .update_sheet_info(&id, &sheet_id, &sheet_url)
                            .await
                            .ok();
                        tracing::info!("Created Sheet for ensayo {}: {}", codigo, sheet_id);
                        ensayo.sheet_id = Some(sheet_id);
                        ensayo.sheet_url = Some(sheet_url);
                    }
                    Err(e) => {
                        tracing::warn!("Failed to create Sheet for ensayo {}: {}", codigo, e);
                    }
                }
            }
        }
    }

    // Cache the perforacion folder_id if available
    if let Some(ref folder_id) = perforacion.drive_folder_id {
        ensayo_repo
            .update_perforacion_folder_id(&id, folder_id)
            .await
            .ok();
        ensayo.perforacion_folder_id = Some(folder_id.clone());
    }

    tracing::info!("Created ensayo: {} ({})", ensayo.codigo, ensayo.id);
    Ok((StatusCode::CREATED, Json(ensayo)))
}

/// PUT /api/ensayos/:id
async fn update_ensayo(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateEnsayo>,
) -> Result<Json<Ensayo>, AppError> {
    let repo = EnsayoRepository::new(state.db_pool.clone());

    // First, get the current ensayo to validate workflow transition
    let current = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;

    // Validate workflow transition if state is being changed
    if let Some(ref new_state) = payload.workflow_state {
        if !current.workflow_state.can_transition_to(*new_state) {
            return Err(AppError::BadRequest(format!(
                "Transición inválida de {} ({}) a {} ({}). Permitidas: {:?}",
                current.workflow_state,
                current.workflow_state.display_name(),
                new_state,
                new_state.display_name(),
                current
                    .workflow_state
                    .allowed_transitions()
                    .iter()
                    .map(|s| format!("{}", s))
                    .collect::<Vec<_>>()
            )));
        }
    }

    let ensayo = repo.update(&id, payload).await?.ok_or(AppError::NotFound)?;

    Ok(Json(ensayo))
}

/// PUT /api/ensayos/:id/status
/// Updates only the workflow state.
/// When transitioning to E12 (Informe Aprobado), automatically generates PDF.
async fn update_status(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateEnsayoStatus>,
) -> Result<Json<Ensayo>, AppError> {
    let repo = EnsayoRepository::new(state.db_pool.clone());

    // Get current ensayo
    let current = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;

    let new_state = payload.workflow_state;

    // Validate transition
    if !current.workflow_state.can_transition_to(new_state) {
        return Err(AppError::BadRequest(format!(
            "Transición inválida de {} ({}) a {} ({}). Permitidas: {:?}",
            current.workflow_state,
            current.workflow_state.display_name(),
            new_state,
            new_state.display_name(),
            current
                .workflow_state
                .allowed_transitions()
                .iter()
                .map(|s| format!("{}", s))
                .collect::<Vec<_>>()
        )));
    }

    // Update the state
    repo.update_workflow_state(&id, &new_state.to_string())
        .await?;

    // Auto-generate PDF when reaching E12 (Informe Aprobado)
    if new_state == WorkflowState::E12 {
        tracing::info!(
            "Ensayo {} reached E12, triggering PDF generation",
            current.codigo
        );

        // Generar PDF automáticamente
        if let (Some(ref sheet_id), Some(ref folder_id)) =
            (&current.sheet_id, &current.perforacion_folder_id)
        {
            if let Some(ref sheets_service) = state.ensayo_sheets_service {
                let pdf_name = format!("{}.pdf", current.codigo);
                match sheets_service
                    .generate_and_upload_pdf(sheet_id, &pdf_name, folder_id)
                    .await
                {
                    Ok(pdf_id) => {
                        let pdf_url = GoogleDriveClient::get_pdf_view_url(&pdf_id);
                        repo.update_pdf_info(&id, &pdf_id, &pdf_url).await.ok();
                        tracing::info!(
                            "Generated PDF for ensayo {}: {}",
                            current.codigo,
                            pdf_id
                        );
                    }
                    Err(e) => {
                        tracing::error!(
                            "Failed to generate PDF for ensayo {}: {}",
                            current.codigo,
                            e
                        );
                    }
                }
            }
        } else {
            tracing::warn!(
                "Cannot generate PDF for ensayo {}: missing sheet_id or folder_id",
                current.codigo
            );
        }
    }

    // Return the updated ensayo
    let ensayo = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;

    Ok(Json(ensayo))
}

/// POST /api/ensayos/:id/validar
/// Valida un ensayo (E1 → E2) con asignación automática de técnico, fecha y equipos.
async fn validar_ensayo(
    Path(id): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<ValidarEnsayoRequest>,
) -> Result<Json<ValidarEnsayoResponse>, AppError> {
    let repo = EnsayoRepository::new(state.db_pool.clone());

    // Obtener ensayo actual
    let ensayo = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;

    // Solo se pueden validar ensayos en E1
    if ensayo.workflow_state != WorkflowState::E1 {
        return Err(AppError::BadRequest(format!(
            "Solo se pueden validar ensayos en estado E1 (Sin programación). Estado actual: {}",
            ensayo.workflow_state.display_name()
        )));
    }

    let scheduler = SchedulerService::new(state.db_pool.clone());

    // Determinar si es asignación automática o manual
    let (tecnico_id, tecnico_nombre, fecha_programacion, equipos_ids, automatica) =
        if payload.tecnico_id.is_some() || payload.fecha_programacion.is_some() {
            // Asignación manual (parcial o total)
            let personal_repo = PersonalInternoRepository::new(state.db_pool.clone());
            let tid = payload.tecnico_id.as_deref().unwrap_or("");
            let tnombre = if !tid.is_empty() {
                personal_repo.find_by_id(tid).await?
                    .map(|p| format!("{} {}", p.nombre, p.apellido))
                    .unwrap_or_default()
            } else {
                String::new()
            };
            let fecha = payload.fecha_programacion
                .as_deref()
                .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
                .unwrap_or_else(|| chrono::Utc::now().date_naive() + chrono::Duration::days(1));
            (tid.to_string(), tnombre, fecha, vec![], false)
        } else {
            // Asignación automática completa
            let result = scheduler.asignar(&id, &ensayo.tipo).await?;
            (result.tecnico_id, result.tecnico_nombre, result.fecha_programacion, result.equipos_ids, true)
        };

    // Actualizar ensayo: asignar técnico, fecha y equipos, cambiar a E2
    let fecha_str = fecha_programacion.to_string();
    sqlx::query(
        r#"
        UPDATE ensayos
        SET workflow_state = 'E2',
            tecnico_id = $2,
            tecnico_nombre = $3,
            fecha_programacion = $4,
            equipos_utilizados = $5,
            updated_at = NOW()
        WHERE id = $1
        "#
    )
    .bind(&id)
    .bind(&tecnico_id)
    .bind(&tecnico_nombre)
    .bind(fecha_programacion)
    .bind(&equipos_ids)
    .execute(&state.db_pool)
    .await
    .map_err(AppError::from)?;

    let ensayo_actualizado = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;

    Ok(Json(ValidarEnsayoResponse {
        ensayo: ensayo_actualizado,
        tecnico_nombre,
        fecha_programacion: fecha_str,
        equipos_asignados: equipos_ids,
        asignacion_automatica: automatica,
    }))
}

/// DELETE /api/ensayos/:id
/// Soft delete: sets workflow_state to E15 (Cancelado)
async fn delete_ensayo(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<StatusCode, AppError> {
    let repo = EnsayoRepository::new(state.db_pool.clone());
    let deleted = repo.delete(&id).await?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound)
    }
}

/// GET /api/ensayos/:id/pdf
/// Downloads the generated PDF for an ensayo.
/// The PDF must have been previously generated (ensayo must be in E12+ state).
async fn download_pdf(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<(StatusCode, axum::response::Response), AppError> {
    let repo = EnsayoRepository::new(state.db_pool.clone());

    let ensayo = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;

    // Check if PDF exists
    let pdf_drive_id = ensayo.pdf_drive_id.as_ref().ok_or_else(|| {
        AppError::BadRequest(
            "PDF not yet generated. Ensayo must reach E12 (Informe Aprobado) state first."
                .to_string(),
        )
    })?;

    if let Some(ref sheets_service) = state.ensayo_sheets_service {
        let pdf_bytes = sheets_service.download_pdf(pdf_drive_id).await?;

        let response = axum::response::Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", "application/pdf")
            .header(
                "Content-Disposition",
                format!("attachment; filename=\"{}.pdf\"", ensayo.codigo),
            )
            .body(axum::body::Body::from(pdf_bytes))
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        return Ok((StatusCode::OK, response));
    }

    Err(AppError::BadRequest(
        "PDF download service not configured. Please configure Google Drive integration."
            .to_string(),
    ))
}

/// POST /api/ensayos/:id/pdf/generate
/// Forces regeneration of the PDF from the Sheet.
/// Useful if the Sheet was updated after initial PDF generation.
async fn generate_pdf(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Ensayo>, AppError> {
    let repo = EnsayoRepository::new(state.db_pool.clone());

    let ensayo = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;

    // Check if ensayo has a Sheet
    let sheet_id = ensayo.sheet_id.as_ref().ok_or_else(|| {
        AppError::BadRequest("Ensayo does not have an associated Sheet.".to_string())
    })?;

    // Check if we have a folder to save the PDF
    let folder_id = ensayo.perforacion_folder_id.as_ref().ok_or_else(|| {
        AppError::BadRequest("Perforación does not have a Drive folder configured.".to_string())
    })?;

    if let Some(ref sheets_service) = state.ensayo_sheets_service {
        let pdf_name = format!("{}.pdf", ensayo.codigo);
        let pdf_id = sheets_service
            .generate_and_upload_pdf(sheet_id, &pdf_name, folder_id)
            .await?;
        let pdf_url = GoogleDriveClient::get_pdf_view_url(&pdf_id);

        repo.update_pdf_info(&id, &pdf_id, &pdf_url).await?;

        let updated = repo.find_by_id(&id).await?.ok_or(AppError::NotFound)?;

        tracing::info!("Regenerated PDF for ensayo {}: {}", ensayo.codigo, pdf_id);
        return Ok(Json(updated));
    }

    Err(AppError::BadRequest(
        "PDF generation service not configured. Please configure Google Drive integration."
            .to_string(),
    ))
}
