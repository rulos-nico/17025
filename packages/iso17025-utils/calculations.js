/**
 * Cálculos estadísticos para laboratorio ISO 17025
 */

/**
 * Calcula la desviación estándar de un conjunto de mediciones
 * @param {number[]} valores - Array de valores numéricos
 * @returns {number} Desviación estándar
 */
export function calcularDesviacionEstandar(valores) {
  if (!valores || valores.length === 0) return 0
  
  const n = valores.length
  const media = valores.reduce((sum, val) => sum + val, 0) / n
  const varianza = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / n
  
  return Math.sqrt(varianza)
}

/**
 * Calcula la incertidumbre expandida (k=2, 95% confianza)
 * @param {number[]} mediciones - Array de mediciones
 * @param {number} k - Factor de cobertura (default 2)
 * @returns {number} Incertidumbre expandida
 */
export function calcularIncertidumbre(mediciones, k = 2) {
  const desviacion = calcularDesviacionEstandar(mediciones)
  const n = mediciones.length
  const incertidumbreTipoA = desviacion / Math.sqrt(n)
  
  return k * incertidumbreTipoA
}

/**
 * Calcula el promedio de un conjunto de valores
 * @param {number[]} valores - Array de valores
 * @returns {number} Promedio
 */
export function calcularPromedio(valores) {
  if (!valores || valores.length === 0) return 0
  return valores.reduce((sum, val) => sum + val, 0) / valores.length
}

/**
 * Verifica si un valor está dentro de límites de especificación
 * @param {number} valor - Valor medido
 * @param {number} limiteInferior - Límite inferior
 * @param {number} limiteSuperior - Límite superior
 * @returns {boolean} true si está dentro de especificación
 */
export function verificarEspecificacion(valor, limiteInferior, limiteSuperior) {
  return valor >= limiteInferior && valor <= limiteSuperior
}
