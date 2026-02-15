//! Utilidades para generación de IDs y códigos únicos.
//!
//! Este módulo centraliza la lógica de generación de identificadores
//! que anteriormente estaba duplicada en múltiples archivos de rutas.

use chrono::Utc;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

/// Genera un sufijo aleatorio de 4 dígitos basado en nanosegundos.
///
/// # Returns
/// Un número entre 0 y 9999.
///
/// # Example
/// ```
/// let suffix = rand_suffix();
/// assert!(suffix < 10000);
/// ```
pub fn rand_suffix() -> u16 {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    (nanos % 10000) as u16
}

/// Genera un UUID v4 como String.
///
/// # Example
/// ```
/// let id = generate_uuid();
/// // Returns something like "550e8400-e29b-41d4-a716-446655440000"
/// ```
pub fn generate_uuid() -> String {
    Uuid::new_v4().to_string()
}

/// Genera un código con formato: PREFIX-YYYYMMDD-XXXX
///
/// # Arguments
/// * `prefix` - Prefijo del código (ej: "PRY", "ENS", "PERF")
///
/// # Example
/// ```
/// let code = generate_dated_code("PRY");
/// // Returns something like "PRY-20260214-1234"
/// ```
pub fn generate_dated_code(prefix: &str) -> String {
    format!(
        "{}-{}-{:04}",
        prefix,
        Utc::now().format("%Y%m%d"),
        rand_suffix()
    )
}

/// Genera un código con formato: PREFIX-XXXX
///
/// # Arguments
/// * `prefix` - Prefijo del código (ej: "CLI", "SEN")
///
/// # Example
/// ```
/// let code = generate_simple_code("CLI");
/// // Returns something like "CLI-1234"
/// ```
pub fn generate_simple_code(prefix: &str) -> String {
    format!("{}-{:04}", prefix, rand_suffix())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rand_suffix_range() {
        for _ in 0..100 {
            let suffix = rand_suffix();
            assert!(suffix < 10000);
        }
    }

    #[test]
    fn test_generate_uuid_format() {
        let uuid = generate_uuid();
        assert_eq!(uuid.len(), 36);
        assert!(uuid.contains('-'));
    }

    #[test]
    fn test_generate_dated_code_format() {
        let code = generate_dated_code("PRY");
        assert!(code.starts_with("PRY-"));
        assert_eq!(code.len(), 17); // PRY-YYYYMMDD-XXXX
    }

    #[test]
    fn test_generate_simple_code_format() {
        let code = generate_simple_code("CLI");
        assert!(code.starts_with("CLI-"));
        assert_eq!(code.len(), 8); // CLI-XXXX
    }
}
