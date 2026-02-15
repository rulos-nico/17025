//! SQL column constants for each entity.
//!
//! These constants eliminate duplication of SELECT column lists across repository methods.
//! Each constant contains the full column list for the corresponding table.

/// Columns for the `clientes` table
pub const CLIENTE_COLUMNS: &str = "id, codigo, nombre, rut, direccion, ciudad, telefono, email, contacto_nombre, contacto_cargo, contacto_email, contacto_telefono, activo, drive_folder_id, created_at, updated_at, synced_at, sync_source";

/// Columns for the `proyectos` table
pub const PROYECTO_COLUMNS: &str = "id, codigo, nombre, descripcion, fecha_inicio, fecha_fin_estimada, duracion_estimada, cliente_id, cliente_nombre, contacto, estado, ensayos_cotizados, fecha_fin_real, drive_folder_id, created_at, updated_at, created_by, synced_at, sync_source";

/// Columns for the `perforaciones` table
pub const PERFORACION_COLUMNS: &str = "id, codigo, proyecto_id, nombre, descripcion, ubicacion, profundidad, fecha_inicio, fecha_fin, estado, drive_folder_id, created_at, updated_at, synced_at, sync_source";

/// Columns for the `ensayos` table
pub const ENSAYO_COLUMNS: &str = "id, codigo, tipo, perforacion_id, proyecto_id, muestra, muestra_id, norma, workflow_state, fecha_solicitud, fecha_programacion, fecha_ejecucion, fecha_reporte, fecha_entrega, tecnico_id, tecnico_nombre, sheet_id, sheet_url, equipos_utilizados, observaciones, urgente, duracion_estimada, pdf_drive_id, pdf_url, pdf_generated_at, perforacion_folder_id, created_at, updated_at, synced_at, sync_source";

/// Columns for the `equipos` table
pub const EQUIPO_COLUMNS: &str = "id, codigo, nombre, serie, placa, descripcion, marca, modelo, ubicacion, estado, fecha_calibracion, proxima_calibracion, incertidumbre, error_maximo, certificado_id, responsable, observaciones, activo, created_at, updated_at, synced_at, sync_source";

/// Columns for the `sensores` table
pub const SENSOR_COLUMNS: &str = "id, codigo, tipo, marca, modelo, numero_serie, rango_medicion, precision, ubicacion, estado, fecha_calibracion, proxima_calibracion, error_maximo, certificado_id, responsable, observaciones, activo, created_at, updated_at, synced_at, sync_source, equipo_id";

/// Columns for the `personal_interno` table
pub const PERSONAL_INTERNO_COLUMNS: &str = "id, codigo, nombre, apellido, cargo, email, telefono, activo, created_at, updated_at, synced_at, sync_source";

/// Columns for the `muestras` table
pub const MUESTRA_COLUMNS: &str = "id, codigo, perforacion_id, profundidad_inicio, profundidad_fin, tipo_muestra, descripcion, created_at, updated_at, synced_at, sync_source";

// ============================================================================
// Query Builder Functions
// ============================================================================

/// Generates a SELECT query: SELECT {columns} FROM {table}
#[inline]
pub fn select_from(table: &str, columns: &str) -> String {
    format!("SELECT {} FROM {}", columns, table)
}

/// Generates a SELECT query with suffix: SELECT {columns} FROM {table} {suffix}
#[inline]
pub fn select_from_with(table: &str, columns: &str, suffix: &str) -> String {
    format!("SELECT {} FROM {} {}", columns, table, suffix)
}

/// Generates a SELECT query with WHERE: SELECT {columns} FROM {table} WHERE {where_clause}
#[inline]
pub fn select_where(table: &str, columns: &str, where_clause: &str) -> String {
    format!("SELECT {} FROM {} WHERE {}", columns, table, where_clause)
}

/// Generates a SELECT query with WHERE and suffix: SELECT {columns} FROM {table} WHERE {where_clause} {suffix}
#[inline]
pub fn select_where_with(table: &str, columns: &str, where_clause: &str, suffix: &str) -> String {
    format!(
        "SELECT {} FROM {} WHERE {} {}",
        columns, table, where_clause, suffix
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cliente_columns_not_empty() {
        assert!(!CLIENTE_COLUMNS.is_empty());
        assert!(CLIENTE_COLUMNS.contains("id"));
        assert!(CLIENTE_COLUMNS.contains("created_at"));
    }

    #[test]
    fn test_select_from() {
        let query = select_from("clientes", "id, nombre");
        assert_eq!(query, "SELECT id, nombre FROM clientes");
    }

    #[test]
    fn test_select_from_with_suffix() {
        let query = select_from_with("clientes", "id, nombre", "ORDER BY nombre");
        assert_eq!(query, "SELECT id, nombre FROM clientes ORDER BY nombre");
    }

    #[test]
    fn test_select_where() {
        let query = select_where("clientes", "id, nombre", "id = $1");
        assert_eq!(query, "SELECT id, nombre FROM clientes WHERE id = $1");
    }

    #[test]
    fn test_select_where_with() {
        let query = select_where_with("clientes", "id, nombre", "activo = true", "ORDER BY nombre");
        assert_eq!(
            query,
            "SELECT id, nombre FROM clientes WHERE activo = true ORDER BY nombre"
        );
    }
}
