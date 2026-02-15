//! Utilidades para parseo y manejo de fechas.
//!
//! Este módulo centraliza la lógica de parseo de fechas que anteriormente
//! estaba duplicada en múltiples repositorios.

use chrono::{NaiveDate, Utc};

/// Parsea una fecha opcional en formato YYYY-MM-DD.
///
/// # Arguments
/// * `date_str` - Referencia opcional a un String con la fecha
///
/// # Returns
/// * `Some(NaiveDate)` si el parseo es exitoso
/// * `None` si la fecha es None o el parseo falla
///
/// # Example
/// ```
/// let date = parse_date(Some(&"2026-02-14".to_string()));
/// assert!(date.is_some());
///
/// let none_date = parse_date(None);
/// assert!(none_date.is_none());
/// ```
pub fn parse_date(date_str: Option<&String>) -> Option<NaiveDate> {
    date_str.and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
}

/// Parsea una fecha requerida en formato YYYY-MM-DD.
/// Si el parseo falla, retorna la fecha actual.
///
/// # Arguments
/// * `date_str` - String con la fecha en formato YYYY-MM-DD
///
/// # Returns
/// * `NaiveDate` parseada o la fecha actual si falla
///
/// # Example
/// ```
/// let date = parse_date_required("2026-02-14");
/// // Returns NaiveDate for 2026-02-14
///
/// let fallback = parse_date_required("invalid");
/// // Returns today's date
/// ```
pub fn parse_date_required(date_str: &str) -> NaiveDate {
    NaiveDate::parse_from_str(date_str, "%Y-%m-%d").unwrap_or_else(|_| Utc::now().date_naive())
}

/// Parsea una fecha desde un Option<String> con valor por defecto.
///
/// # Arguments
/// * `date_str` - Option<String> con la fecha
/// * `default` - Fecha por defecto si no se puede parsear
///
/// # Returns
/// * `NaiveDate` parseada o el valor por defecto
pub fn parse_date_or(date_str: &Option<String>, default: NaiveDate) -> NaiveDate {
    date_str
        .as_ref()
        .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
        .unwrap_or(default)
}

/// Formatea una NaiveDate a String en formato YYYY-MM-DD.
///
/// # Arguments
/// * `date` - La fecha a formatear
///
/// # Returns
/// * String en formato YYYY-MM-DD
pub fn format_date(date: NaiveDate) -> String {
    date.format("%Y-%m-%d").to_string()
}

/// Obtiene la fecha actual como NaiveDate.
pub fn today() -> NaiveDate {
    Utc::now().date_naive()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_date_valid() {
        let date = parse_date(Some(&"2026-02-14".to_string()));
        assert!(date.is_some());
        let d = date.unwrap();
        assert_eq!(d.year(), 2026);
        assert_eq!(d.month(), 2);
        assert_eq!(d.day(), 14);
    }

    #[test]
    fn test_parse_date_none() {
        let date = parse_date(None);
        assert!(date.is_none());
    }

    #[test]
    fn test_parse_date_invalid() {
        let date = parse_date(Some(&"invalid".to_string()));
        assert!(date.is_none());
    }

    #[test]
    fn test_parse_date_required_valid() {
        let date = parse_date_required("2026-02-14");
        assert_eq!(date.year(), 2026);
    }

    #[test]
    fn test_parse_date_required_invalid_returns_today() {
        let date = parse_date_required("invalid");
        assert_eq!(date, today());
    }

    #[test]
    fn test_format_date() {
        let date = NaiveDate::from_ymd_opt(2026, 2, 14).unwrap();
        assert_eq!(format_date(date), "2026-02-14");
    }
}

use chrono::Datelike;
