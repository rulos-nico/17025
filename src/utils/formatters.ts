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
 * @example formatDate('2024-01-15') // '15-01-2024'
 */
export const formatDate = (fecha: string | Date | null | undefined, fallback = '-'): string => {
  if (!fecha) return fallback;
  try {
    return new Date(fecha).toLocaleDateString('es-CL');
  } catch {
    return fallback;
  }
};

/**
 * Formatea una fecha con formato detallado (día, mes corto, año)
 * @example formatDateLong('2024-01-15') // '15 ene 2024'
 */
export const formatDateLong = (fecha: string | Date | null | undefined, fallback = '-'): string => {
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
 * @example formatDateTime('2024-01-15T14:30:00') // '15-01-2024 14:30'
 */
export const formatDateTime = (fecha: string | Date | null | undefined, fallback = '-'): string => {
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
 * @example toISODateString(new Date()) // '2024-01-15'
 */
export const toISODateString = (fecha: string | Date = new Date()): string => {
  try {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Obtiene la fecha de hoy en formato ISO
 */
export const todayISO = (): string => toISODateString(new Date());

// ============================================
// CÁLCULOS DE FECHAS
// ============================================

/**
 * Calcula los días entre dos fechas
 */
export const daysBetween = (
  fechaInicio: string | Date | null | undefined,
  fechaFin: string | Date = new Date()
): number | null => {
  if (!fechaInicio) return null;
  try {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diff = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
};

/**
 * Alias de getDiasParaVencimiento para compatibilidad.
 * Calcula los días hasta una fecha (positivo = futuro, negativo = pasado)
 * @example daysUntil('2024-12-31') // 350 (si hoy es 15 ene 2024)
 * @see getDiasParaVencimiento en helpers.js
 */
export const daysUntil = getDiasParaVencimiento;

/**
 * Verifica si una fecha está vencida
 */
export const isExpired = (fecha: string | Date | null | undefined): boolean => {
  const dias = daysUntil(fecha);
  return dias !== null && dias < 0;
};

/**
 * Verifica si una fecha vence pronto (dentro de N días)
 */
export const expiresSoon = (fecha: string | Date | null | undefined, dias = 30): boolean => {
  const diasRestantes = daysUntil(fecha);
  return diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= dias;
};

// ============================================
// FORMATEO DE NÚMEROS Y MONEDAS
// ============================================

/**
 * Formatea un número con separadores de miles
 * @example formatNumber(1234567.89) // '1.234.567,89'
 */
export const formatNumber = (numero: number | null | undefined, decimales = 2): string => {
  if (numero === null || numero === undefined || isNaN(numero)) return '-';
  return Number(numero).toLocaleString('es-CL', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

/**
 * Formatea un valor como moneda chilena (CLP)
 * @example formatCurrency(1234567) // '$1.234.567'
 */
export const formatCurrency = (valor: number | null | undefined): string => {
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
 * @example formatPercent(75) // '75%'
 * @example formatPercent(0.75, true) // '75%'
 */
export const formatPercent = (valor: number | null | undefined, esDecimal = false): string => {
  if (valor === null || valor === undefined || isNaN(valor)) return '-';
  const porcentaje = esDecimal ? valor * 100 : valor;
  return `${Math.round(porcentaje)}%`;
};

// ============================================
// FORMATEO DE PROFUNDIDADES (ESPECÍFICO GEOTECNIA)
// ============================================

/**
 * Formatea un rango de profundidad
 * @example formatProfundidad(1.5, 3.0) // '1,50 - 3,00 m'
 */
export const formatProfundidad = (
  inicio: number | null | undefined,
  fin?: number | null,
  unidad = 'm'
): string => {
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
 */
export const truncate = (
  texto: string | null | undefined,
  maxLength = 50,
  suffix = '...'
): string => {
  if (!texto) return '';
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitaliza la primera letra de un texto
 */
export const capitalize = (texto: string | null | undefined): string => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};
