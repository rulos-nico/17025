/**
 * Formatters - Utilidades para formatear fechas, números y monedas
 *
 * Centraliza todo el formateo de datos para mantener consistencia en la UI.
 */

import { getDiasParaVencimiento } from './helpers';

// ============================================
// FORMATEO DE FECHAS
// ============================================

/**
 * Formatea una fecha al formato chileno (dd-mm-yyyy)
 * @param {string|Date} fecha - La fecha a formatear
 * @param {string} fallback - Valor por defecto si la fecha es inválida
 * @returns {string} - Fecha formateada o el fallback
 * @example formatDate('2024-01-15') // '15-01-2024'
 */
export const formatDate = (fecha, fallback = '-') => {
  if (!fecha) return fallback;
  try {
    return new Date(fecha).toLocaleDateString('es-CL');
  } catch {
    return fallback;
  }
};

/**
 * Formatea una fecha con formato detallado (día, mes corto, año)
 * @param {string|Date} fecha - La fecha a formatear
 * @param {string} fallback - Valor por defecto si la fecha es inválida
 * @returns {string} - Fecha formateada o el fallback
 * @example formatDateLong('2024-01-15') // '15 ene 2024'
 */
export const formatDateLong = (fecha, fallback = '-') => {
  if (!fecha) return fallback;
  try {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fallback;
  }
};

/**
 * Formatea una fecha con hora
 * @param {string|Date} fecha - La fecha a formatear
 * @param {string} fallback - Valor por defecto si la fecha es inválida
 * @returns {string} - Fecha y hora formateada
 * @example formatDateTime('2024-01-15T14:30:00') // '15-01-2024 14:30'
 */
export const formatDateTime = (fecha, fallback = '-') => {
  if (!fecha) return fallback;
  try {
    return new Date(fecha).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fallback;
  }
};

/**
 * Obtiene solo la parte de fecha ISO (yyyy-mm-dd) de una fecha
 * Útil para inputs type="date"
 * @param {string|Date} fecha - La fecha
 * @returns {string} - Fecha en formato ISO
 * @example toISODateString(new Date()) // '2024-01-15'
 */
export const toISODateString = (fecha = new Date()) => {
  try {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Obtiene la fecha de hoy en formato ISO
 * @returns {string} - Fecha de hoy en formato ISO
 */
export const todayISO = () => toISODateString(new Date());

// ============================================
// CÁLCULOS DE FECHAS
// ============================================

/**
 * Calcula los días entre dos fechas
 * @param {string|Date} fechaInicio - Fecha de inicio
 * @param {string|Date} fechaFin - Fecha de fin (default: hoy)
 * @returns {number|null} - Número de días o null si las fechas son inválidas
 */
export const daysBetween = (fechaInicio, fechaFin = new Date()) => {
  if (!fechaInicio) return null;
  try {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diff = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
};

/**
 * Alias de getDiasParaVencimiento para compatibilidad.
 * Calcula los días hasta una fecha (positivo = futuro, negativo = pasado)
 * @param {string|Date} fecha - La fecha objetivo
 * @returns {number|null} - Días hasta la fecha o null si es inválida
 * @example daysUntil('2024-12-31') // 350 (si hoy es 15 ene 2024)
 * @see getDiasParaVencimiento en helpers.js
 */
export const daysUntil = getDiasParaVencimiento;

/**
 * Verifica si una fecha está vencida
 * @param {string|Date} fecha - La fecha a verificar
 * @returns {boolean} - true si la fecha ya pasó
 */
export const isExpired = fecha => {
  const dias = daysUntil(fecha);
  return dias !== null && dias < 0;
};

/**
 * Verifica si una fecha vence pronto (dentro de N días)
 * @param {string|Date} fecha - La fecha a verificar
 * @param {number} dias - Número de días para considerar "pronto"
 * @returns {boolean} - true si vence dentro del período
 */
export const expiresSoon = (fecha, dias = 30) => {
  const diasRestantes = daysUntil(fecha);
  return diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= dias;
};

// ============================================
// FORMATEO DE NÚMEROS Y MONEDAS
// ============================================

/**
 * Formatea un número con separadores de miles
 * @param {number} numero - El número a formatear
 * @param {number} decimales - Número de decimales
 * @returns {string} - Número formateado
 * @example formatNumber(1234567.89) // '1.234.567,89'
 */
export const formatNumber = (numero, decimales = 2) => {
  if (numero === null || numero === undefined || isNaN(numero)) return '-';
  return Number(numero).toLocaleString('es-CL', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

/**
 * Formatea un valor como moneda chilena (CLP)
 * @param {number} valor - El valor a formatear
 * @returns {string} - Valor formateado como moneda
 * @example formatCurrency(1234567) // '$1.234.567'
 */
export const formatCurrency = valor => {
  if (valor === null || valor === undefined || isNaN(valor)) return '-';
  return Number(valor).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Formatea un porcentaje
 * @param {number} valor - El valor (0-100 o 0-1)
 * @param {boolean} esDecimal - Si el valor está en formato decimal (0-1)
 * @returns {string} - Porcentaje formateado
 * @example formatPercent(75) // '75%'
 * @example formatPercent(0.75, true) // '75%'
 */
export const formatPercent = (valor, esDecimal = false) => {
  if (valor === null || valor === undefined || isNaN(valor)) return '-';
  const porcentaje = esDecimal ? valor * 100 : valor;
  return `${Math.round(porcentaje)}%`;
};

// ============================================
// FORMATEO DE PROFUNDIDADES (ESPECÍFICO GEOTECNIA)
// ============================================

/**
 * Formatea un rango de profundidad
 * @param {number} inicio - Profundidad inicial
 * @param {number} fin - Profundidad final
 * @param {string} unidad - Unidad de medida
 * @returns {string} - Rango formateado
 * @example formatProfundidad(1.5, 3.0) // '1,50 - 3,00 m'
 */
export const formatProfundidad = (inicio, fin, unidad = 'm') => {
  if (inicio === null || inicio === undefined) return '-';
  if (fin === null || fin === undefined) {
    return `${Number(inicio).toFixed(2).replace('.', ',')} ${unidad}`;
  }
  return `${Number(inicio).toFixed(2).replace('.', ',')} - ${Number(fin).toFixed(2).replace('.', ',')} ${unidad}`;
};

// ============================================
// FORMATEO DE TEXTO
// ============================================

/**
 * Trunca un texto a una longitud máxima
 * @param {string} texto - El texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo a agregar si se trunca
 * @returns {string} - Texto truncado
 */
export const truncate = (texto, maxLength = 50, suffix = '...') => {
  if (!texto) return '';
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitaliza la primera letra de un texto
 * @param {string} texto - El texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
export const capitalize = texto => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};
