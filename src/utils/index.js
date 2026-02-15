/**
 * Utils - Barrel export para todas las utilidades
 *
 * Uso:
 *   import { formatDate, mapProyecto, getEstadoEquipo } from '@/utils';
 *
 * O importar módulos específicos:
 *   import { formatDate, formatCurrency } from '@/utils/formatters';
 *   import { mapProyecto, mapEnsayo } from '@/utils/mappers';
 *   import { getEstadoEquipo, getDiasParaVencimiento } from '@/utils/helpers';
 */

// ============================================
// MAPPERS - Transformación de datos
// ============================================
export {
  // Funciones genéricas
  snakeToCamel,
  camelToSnake,
  mapKeysToCamel,
  mapKeysToSnake,
  // Mappers por entidad (singular)
  mapProyecto,
  mapPerforacion,
  mapEnsayo,
  mapMuestra,
  mapEquipo,
  mapCliente,
  mapPersonal,
  // Mappers por entidad (plural - conveniencia)
  mapProyectos,
  mapPerforaciones,
  mapEnsayos,
  mapMuestras,
  mapEquipos,
  mapClientes,
} from './mappers';

// ============================================
// FORMATTERS - Formateo de datos para UI
// ============================================
export {
  // Fechas
  formatDate,
  formatDateLong,
  formatDateTime,
  toISODateString,
  todayISO,
  // Cálculos de fechas
  daysBetween,
  daysUntil,
  isExpired,
  expiresSoon,
  // Números y monedas
  formatNumber,
  formatCurrency,
  formatPercent,
  // Específico geotecnia
  formatProfundidad,
  // Texto
  truncate,
  capitalize,
} from './formatters';

// ============================================
// HELPERS - Funciones defensivas y de negocio
// ============================================
export {
  // Lookups de estados
  getEstadoEquipo,
  getEstadoProyecto,
  getEstadoMuestra,
  getWorkflowState,
  canTransitionTo,
  getAvailableTransitions,
  // Lookups de tipos
  getTipoEnsayo,
  getTipoEnsayoNombre,
  getTipoMuestra,
  getRolInfo,
  // Vencimientos y alertas
  getDiasParaVencimiento,
  getAlertaVencimiento,
  getAlertaCalibracion,
  // Acceso seguro a datos
  safeGet,
  coalesce,
  isEmpty,
  isNotEmpty,
  // Búsqueda y filtrado
  findById,
  getFieldById,
  uniqueBy,
  groupBy,
  // Lógica de negocio
  getClienteNombre,
  getPersonaNombre,
  getCargoInfo,
  calcularProgresoProyecto,
  contarEnsayosPorEstado,
} from './helpers';
