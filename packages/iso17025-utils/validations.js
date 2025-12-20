/**
 * Validaciones de datos para laboratorio
 */

/**
 * Valida formato de código de muestra (ej: LAB-2025-001)
 * @param {string} codigo - Código de muestra
 * @returns {boolean} true si es válido
 */
export function validarCodigoMuestra(codigo) {
  const regex = /^[A-Z]{2,4}-\d{4}-\d{3,}$/
  return regex.test(codigo)
}

/**
 * Valida rango de temperatura aceptable
 * @param {number} temperatura - Temperatura en °C
 * @param {number} min - Temperatura mínima
 * @param {number} max - Temperatura máxima
 * @returns {boolean} true si está en rango
 */
export function validarRangoTemperatura(temperatura, min = -20, max = 100) {
  return temperatura >= min && temperatura <= max
}

/**
 * Valida formato de fecha ISO
 * @param {string} fecha - Fecha en formato ISO
 * @returns {boolean} true si es válida
 */
export function validarFecha(fecha) {
  const date = new Date(fecha)
  return date instanceof Date && !isNaN(date)
}
