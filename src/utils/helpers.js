/**
 * Helpers - Utilidades defensivas y helpers de búsqueda
 *
 * Funciones para acceso seguro a datos, lookups con fallbacks,
 * y cálculos específicos del dominio de laboratorio geotécnico.
 */

import {
  WORKFLOW_STATES_INFO,
  WORKFLOW_TRANSITIONS,
  ESTADO_PROYECTO,
  ESTADO_MUESTRA,
  ESTADO_EQUIPO,
  TIPOS_ENSAYO,
  TIPOS_MUESTRA,
  ROLES,
} from '../config';

// ============================================
// LOOKUPS DEFENSIVOS PARA ESTADOS
// ============================================

/**
 * Obtiene información de un estado de equipo con fallback
 * @param {string} estado - Código del estado
 * @returns {Object} - Información del estado { label, color }
 */
export const getEstadoEquipo = estado =>
  ESTADO_EQUIPO[estado] || { label: estado || 'Desconocido', color: '#6B7280' };

/**
 * Obtiene información de un estado de proyecto con fallback
 * @param {string} estado - Código del estado
 * @returns {Object} - Información del estado { label, color }
 */
export const getEstadoProyecto = estado =>
  ESTADO_PROYECTO[estado] || { label: estado || 'Desconocido', color: '#6B7280' };

/**
 * Obtiene información de un estado de muestra con fallback
 * @param {string} estado - Código del estado
 * @returns {Object} - Información del estado { label, color }
 */
export const getEstadoMuestra = estado =>
  ESTADO_MUESTRA[estado] || { label: estado || 'Desconocido', color: '#6B7280' };

/**
 * Obtiene información de un estado de workflow con fallback
 * @param {string} state - Código del estado (E1-E15)
 * @returns {Object} - Información del estado { nombre, color, fase, descripcion }
 */
export const getWorkflowState = state =>
  WORKFLOW_STATES_INFO[state] || {
    nombre: state || 'Desconocido',
    color: '#6B7280',
    fase: 'unknown',
    descripcion: '',
  };

/**
 * Verifica si una transición de workflow es válida
 * @param {string} fromState - Estado origen
 * @param {string} toState - Estado destino
 * @returns {boolean} - true si la transición es permitida
 */
export const canTransitionTo = (fromState, toState) => {
  const allowed = WORKFLOW_TRANSITIONS[fromState] || [];
  return allowed.includes(toState);
};

/**
 * Obtiene las transiciones disponibles desde un estado
 * @param {string} currentState - Estado actual
 * @returns {Array} - Array de estados destino con su información
 */
export const getAvailableTransitions = currentState => {
  const transitions = WORKFLOW_TRANSITIONS[currentState] || [];
  return transitions.map(state => ({
    codigo: state,
    ...getWorkflowState(state),
  }));
};

// ============================================
// LOOKUPS PARA TIPOS
// ============================================

/**
 * Obtiene información de un tipo de ensayo con fallback
 * @param {string} tipoId - ID del tipo de ensayo
 * @returns {Object} - Información del tipo { id, nombre, categoria, norma }
 */
export const getTipoEnsayo = tipoId =>
  TIPOS_ENSAYO.find(t => t.id === tipoId) || {
    id: tipoId || 'unknown',
    nombre: tipoId || 'Desconocido',
    categoria: 'otro',
    norma: '',
  };

/**
 * Obtiene el nombre de un tipo de ensayo
 * @param {string} tipoId - ID del tipo de ensayo
 * @returns {string} - Nombre del tipo
 */
export const getTipoEnsayoNombre = tipoId => getTipoEnsayo(tipoId).nombre;

/**
 * Obtiene información de un tipo de muestra con fallback
 * @param {string} tipoId - ID del tipo de muestra
 * @returns {Object} - Información del tipo { id, nombre, descripcion }
 */
export const getTipoMuestra = tipoId =>
  TIPOS_MUESTRA.find(t => t.id === tipoId) || {
    id: tipoId || 'unknown',
    nombre: tipoId || 'Desconocido',
    descripcion: '',
  };

/**
 * Obtiene información de un rol con fallback
 * @param {string} rolKey - Key del rol (ADMIN, COORDINADOR, etc.)
 * @returns {Object} - Información del rol
 */
export const getRolInfo = rolKey => {
  const key = rolKey?.toUpperCase();
  return (
    ROLES[key] || {
      value: rolKey || 'unknown',
      label: rolKey || 'Desconocido',
      permisos: [],
      descripcion: '',
    }
  );
};

// ============================================
// HELPERS DE VENCIMIENTO Y ALERTAS
// ============================================

/**
 * Calcula los días hasta el vencimiento de una fecha
 * @param {string|Date} fecha - Fecha de vencimiento
 * @returns {number|null} - Días restantes (negativo si vencido)
 */
export const getDiasParaVencimiento = fecha => {
  if (!fecha) return null;
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fecha);
    vencimiento.setHours(0, 0, 0, 0);
    const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
};

/**
 * Obtiene información de alerta basada en días para vencimiento
 * @param {number|null} dias - Días hasta vencimiento
 * @returns {Object|null} - Info de alerta { color, texto, bg } o null
 */
export const getAlertaVencimiento = dias => {
  if (dias === null || dias === undefined) return null;

  if (dias < 0) {
    return { color: '#EF4444', texto: 'Vencido', bg: '#FEE2E2' };
  }
  if (dias <= 30) {
    return { color: '#F59E0B', texto: `${dias}d`, bg: '#FEF3C7' };
  }
  if (dias <= 90) {
    return { color: '#3B82F6', texto: `${dias}d`, bg: '#DBEAFE' };
  }
  return { color: '#10B981', texto: `${dias}d`, bg: '#D1FAE5' };
};

/**
 * Obtiene información de alerta de calibración para un equipo
 * @param {string|Date} fechaProximaCalibracion - Fecha de próxima calibración
 * @returns {Object} - Info completa de alerta
 */
export const getAlertaCalibracion = fechaProximaCalibracion => {
  const dias = getDiasParaVencimiento(fechaProximaCalibracion);
  const alerta = getAlertaVencimiento(dias);

  return {
    dias,
    alerta,
    requiereAccion: dias !== null && dias <= 30,
    vencido: dias !== null && dias < 0,
  };
};

// ============================================
// HELPERS DE ACCESO SEGURO A DATOS
// ============================================

/**
 * Accede de forma segura a una propiedad anidada de un objeto
 * @param {Object} obj - Objeto fuente
 * @param {string} path - Ruta de propiedades separada por puntos
 * @param {*} defaultValue - Valor por defecto si no existe
 * @returns {*} - Valor encontrado o defaultValue
 * @example safeGet(user, 'profile.address.city', 'N/A')
 */
export const safeGet = (obj, path, defaultValue = undefined) => {
  if (!obj || !path) return defaultValue;

  const result = path.split('.').reduce((acc, key) => {
    return acc && acc[key] !== undefined ? acc[key] : undefined;
  }, obj);

  return result !== undefined ? result : defaultValue;
};

/**
 * Retorna el primer valor truthy de una lista
 * @param  {...any} values - Valores a evaluar
 * @returns {*} - Primer valor truthy o el último valor
 * @example coalesce(null, undefined, '', 'valor') // 'valor'
 */
export const coalesce = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return value;
    }
  }
  return values[values.length - 1];
};

/**
 * Verifica si un valor es "vacío" (null, undefined, '', [], {})
 * @param {*} value - Valor a verificar
 * @returns {boolean} - true si está vacío
 */
export const isEmpty = value => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Verifica si un valor NO es vacío
 * @param {*} value - Valor a verificar
 * @returns {boolean} - true si NO está vacío
 */
export const isNotEmpty = value => !isEmpty(value);

// ============================================
// HELPERS PARA BÚSQUEDA Y FILTRADO
// ============================================

/**
 * Busca un elemento por ID en un array
 * @param {Array} array - Array de elementos
 * @param {string} id - ID a buscar
 * @param {string} idField - Nombre del campo ID (default: 'id')
 * @returns {Object|undefined} - Elemento encontrado o undefined
 */
export const findById = (array, id, idField = 'id') => {
  if (!Array.isArray(array) || !id) return undefined;
  return array.find(item => item[idField] === id);
};

/**
 * Busca un elemento por ID y retorna un valor específico con fallback
 * @param {Array} array - Array de elementos
 * @param {string} id - ID a buscar
 * @param {string} field - Campo a retornar
 * @param {*} fallback - Valor por defecto
 * @returns {*} - Valor del campo o fallback
 * @example getFieldById(clientes, '123', 'nombre', 'N/A')
 */
export const getFieldById = (array, id, field, fallback = 'N/A') => {
  const item = findById(array, id);
  return item ? (item[field] ?? fallback) : fallback;
};

/**
 * Filtra elementos únicos de un array por un campo
 * @param {Array} array - Array de elementos
 * @param {string} field - Campo para determinar unicidad
 * @returns {Array} - Array con elementos únicos
 */
export const uniqueBy = (array, field) => {
  if (!Array.isArray(array)) return [];
  const seen = new Set();
  return array.filter(item => {
    const value = item[field];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

/**
 * Agrupa elementos de un array por un campo
 * @param {Array} array - Array de elementos
 * @param {string} field - Campo para agrupar
 * @returns {Object} - Objeto con grupos { [fieldValue]: [items] }
 */
export const groupBy = (array, field) => {
  if (!Array.isArray(array)) return {};
  return array.reduce((groups, item) => {
    const key = item[field] ?? 'undefined';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
};

// ============================================
// HELPERS PARA LÓGICA DE NEGOCIO
// ============================================

/**
 * Obtiene el nombre del cliente para mostrar
 * @param {Object} cliente - Objeto cliente
 * @param {string} fallback - Valor por defecto
 * @returns {string} - Nombre del cliente
 */
export const getClienteNombre = (cliente, fallback = 'N/A') =>
  cliente?.nombre || cliente?.razonSocial || cliente?.razon_social || fallback;

/**
 * Obtiene el nombre completo de una persona
 * @param {Object} persona - Objeto persona
 * @param {string} fallback - Valor por defecto
 * @returns {string} - Nombre completo
 */
export const getPersonaNombre = (persona, fallback = 'N/A') => {
  if (!persona) return fallback;
  const nombre = persona.nombre || '';
  const apellido = persona.apellido || '';
  const full = `${nombre} ${apellido}`.trim();
  return full || fallback;
};

/**
 * Obtiene información del cargo de una persona
 * @param {Object} persona - Objeto persona
 * @param {Object} cargosMap - Mapa de cargos { codigo: { nombre, color } }
 * @returns {Object} - Info del cargo { nombre, color }
 */
export const getCargoInfo = (persona, cargosMap = {}) => {
  const cargo = persona?.cargo || '';
  return cargosMap[cargo] || { nombre: cargo || 'Sin cargo', color: '#6B7280' };
};

/**
 * Calcula el progreso de un proyecto basado en ensayos
 * @param {Array} ensayos - Array de ensayos del proyecto
 * @returns {Object} - Info de progreso { total, completados, porcentaje }
 */
export const calcularProgresoProyecto = (ensayos = []) => {
  const total = ensayos.length;
  const completados = ensayos.filter(e => {
    const state = e.workflowState || e.workflow_state;
    return ['E12', 'E13', 'E14', 'E15'].includes(state);
  }).length;

  return {
    total,
    completados,
    porcentaje: total > 0 ? Math.round((completados / total) * 100) : 0,
  };
};

/**
 * Cuenta ensayos por estado de workflow
 * @param {Array} ensayos - Array de ensayos
 * @returns {Object} - Conteo por estado { E1: n, E2: n, ... }
 */
export const contarEnsayosPorEstado = (ensayos = []) => {
  return ensayos.reduce((counts, ensayo) => {
    const state = ensayo.workflowState || ensayo.workflow_state || 'unknown';
    counts[state] = (counts[state] || 0) + 1;
    return counts;
  }, {});
};
