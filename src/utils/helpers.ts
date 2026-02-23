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
  type WorkflowStateInfo,
  type EstadoInfo,
  type TipoEnsayo,
  type TipoMuestra,
  type RolInfo,
} from '../config';

// ============================================
// INTERFACES
// ============================================

export interface AlertaVencimiento {
  color: string;
  texto: string;
  bg: string;
}

export interface AlertaCalibracion {
  dias: number | null;
  alerta: AlertaVencimiento | null;
  requiereAccion: boolean;
  vencido: boolean;
}

export interface ProgresoProyecto {
  total: number;
  completados: number;
  porcentaje: number;
}

interface Ensayo {
  workflowState?: string;
  workflow_state?: string;
  [key: string]: unknown;
}

interface Cliente {
  nombre?: string;
  razonSocial?: string;
  razon_social?: string;
  [key: string]: unknown;
}

interface Persona {
  nombre?: string;
  apellido?: string;
  cargo?: string;
  [key: string]: unknown;
}

interface CargoInfo {
  nombre: string;
  color: string;
}

// ============================================
// LOOKUPS DEFENSIVOS PARA ESTADOS
// ============================================

/**
 * Obtiene información de un estado de equipo con fallback
 */
export const getEstadoEquipo = (estado: string): EstadoInfo =>
  ESTADO_EQUIPO[estado] || { label: estado || 'Desconocido', color: '#6B7280' };

/**
 * Obtiene información de un estado de proyecto con fallback
 */
export const getEstadoProyecto = (estado: string): EstadoInfo =>
  ESTADO_PROYECTO[estado] || { label: estado || 'Desconocido', color: '#6B7280' };

/**
 * Obtiene información de un estado de muestra con fallback
 */
export const getEstadoMuestra = (estado: string): EstadoInfo =>
  ESTADO_MUESTRA[estado] || { label: estado || 'Desconocido', color: '#6B7280' };

/**
 * Obtiene información de un estado de workflow con fallback
 */
export const getWorkflowState = (state: string): WorkflowStateInfo =>
  WORKFLOW_STATES_INFO[state] || {
    nombre: state || 'Desconocido',
    color: '#6B7280',
    fase: 'unknown',
    descripcion: '',
  };

/**
 * Verifica si una transición de workflow es válida
 */
export const canTransitionTo = (fromState: string, toState: string): boolean => {
  const allowed = WORKFLOW_TRANSITIONS[fromState] || [];
  return allowed.includes(toState);
};

/**
 * Obtiene las transiciones disponibles desde un estado
 */
export const getAvailableTransitions = (
  currentState: string
): Array<{ codigo: string } & WorkflowStateInfo> => {
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
 */
export const getTipoEnsayo = (tipoId: string): TipoEnsayo =>
  TIPOS_ENSAYO.find(t => t.id === tipoId) || {
    id: tipoId || 'unknown',
    nombre: tipoId || 'Desconocido',
    categoria: 'otro',
    norma: '',
  };

/**
 * Obtiene el nombre de un tipo de ensayo
 */
export const getTipoEnsayoNombre = (tipoId: string): string => getTipoEnsayo(tipoId).nombre;

/**
 * Obtiene información de un tipo de muestra con fallback
 */
export const getTipoMuestra = (tipoId: string): TipoMuestra =>
  TIPOS_MUESTRA.find(t => t.id === tipoId) || {
    id: tipoId || 'unknown',
    nombre: tipoId || 'Desconocido',
    descripcion: '',
  };

/**
 * Obtiene información de un rol con fallback
 */
export const getRolInfo = (rolKey: string | null | undefined): RolInfo => {
  const key = rolKey?.toUpperCase() ?? '';
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
 */
export const getDiasParaVencimiento = (fecha: string | Date | null | undefined): number | null => {
  if (!fecha) return null;
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fecha);
    vencimiento.setHours(0, 0, 0, 0);
    const diff = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
};

/**
 * Obtiene información de alerta basada en días para vencimiento
 */
export const getAlertaVencimiento = (dias: number | null | undefined): AlertaVencimiento | null => {
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
 */
export const getAlertaCalibracion = (
  fechaProximaCalibracion: string | Date | null | undefined
): AlertaCalibracion => {
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
 * @example safeGet(user, 'profile.address.city', 'N/A')
 */
export const safeGet = <T = unknown>(
  obj: Record<string, unknown> | null | undefined,
  path: string,
  defaultValue: T | undefined = undefined
): T | undefined => {
  if (!obj || !path) return defaultValue;

  const result = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  return result !== undefined ? (result as T) : defaultValue;
};

/**
 * Retorna el primer valor truthy de una lista
 * @example coalesce(null, undefined, '', 'valor') // 'valor'
 */
export const coalesce = <T>(...values: T[]): T | undefined => {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return value;
    }
  }
  return values[values.length - 1];
};

/**
 * Verifica si un valor es "vacío" (null, undefined, '', [], {})
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Verifica si un valor NO es vacío
 */
export const isNotEmpty = (value: unknown): boolean => !isEmpty(value);

// ============================================
// HELPERS PARA BÚSQUEDA Y FILTRADO
// ============================================

/**
 * Busca un elemento por ID en un array
 */
export const findById = <T extends Record<string, unknown>>(
  array: T[] | null | undefined,
  id: string | number | null | undefined,
  idField = 'id'
): T | undefined => {
  if (!Array.isArray(array) || !id) return undefined;
  return array.find(item => item[idField] === id);
};

/**
 * Busca un elemento por ID y retorna un valor específico con fallback
 * @example getFieldById(clientes, '123', 'nombre', 'N/A')
 */
export const getFieldById = <T extends Record<string, unknown>, V = unknown>(
  array: T[] | null | undefined,
  id: string | number | null | undefined,
  field: string,
  fallback: V = 'N/A' as V
): V => {
  const item = findById(array, id);
  return item ? ((item[field] ?? fallback) as V) : fallback;
};

/**
 * Filtra elementos únicos de un array por un campo
 */
export const uniqueBy = <T extends Record<string, unknown>>(
  array: T[] | null | undefined,
  field: string
): T[] => {
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
 */
export const groupBy = <T extends Record<string, unknown>>(
  array: T[] | null | undefined,
  field: string
): Record<string, T[]> => {
  if (!Array.isArray(array)) return {};
  return array.reduce(
    (groups, item) => {
      const key = String(item[field] ?? 'undefined');
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
};

// ============================================
// HELPERS PARA LÓGICA DE NEGOCIO
// ============================================

/**
 * Obtiene el nombre del cliente para mostrar
 */
export const getClienteNombre = (cliente: Cliente | null | undefined, fallback = 'N/A'): string =>
  cliente?.nombre || cliente?.razonSocial || cliente?.razon_social || fallback;

/**
 * Obtiene el nombre completo de una persona
 */
export const getPersonaNombre = (persona: Persona | null | undefined, fallback = 'N/A'): string => {
  if (!persona) return fallback;
  const nombre = persona.nombre || '';
  const apellido = persona.apellido || '';
  const full = `${nombre} ${apellido}`.trim();
  return full || fallback;
};

/**
 * Obtiene información del cargo de una persona
 */
export const getCargoInfo = (
  persona: Persona | null | undefined,
  cargosMap: Record<string, CargoInfo> = {}
): CargoInfo => {
  const cargo = persona?.cargo || '';
  return cargosMap[cargo] || { nombre: cargo || 'Sin cargo', color: '#6B7280' };
};

/**
 * Calcula el progreso de un proyecto basado en ensayos
 */
export const calcularProgresoProyecto = (ensayos: Ensayo[] = []): ProgresoProyecto => {
  const total = ensayos.length;
  const completados = ensayos.filter(e => {
    const state = e.workflowState || e.workflow_state;
    return ['E12', 'E13', 'E14', 'E15'].includes(state as string);
  }).length;

  return {
    total,
    completados,
    porcentaje: total > 0 ? Math.round((completados / total) * 100) : 0,
  };
};

/**
 * Cuenta ensayos por estado de workflow
 */
export const contarEnsayosPorEstado = (ensayos: Ensayo[] = []): Record<string, number> => {
  return ensayos.reduce(
    (counts, ensayo) => {
      const state = ensayo.workflowState || ensayo.workflow_state || 'unknown';
      counts[state as string] = (counts[state as string] || 0) + 1;
      return counts;
    },
    {} as Record<string, number>
  );
};
