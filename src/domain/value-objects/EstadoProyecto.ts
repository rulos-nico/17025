/**
 * Value Object: Estado del Proyecto
 * Define los posibles estados de un proyecto y sus metadatos
 */

export enum EstadoProyecto {
  ACTIVO = 'activo',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

export interface EstadoProyectoInfo {
  label: string;
  color: string;
  descripcion: string;
}

export const ESTADO_PROYECTO_INFO: Record<EstadoProyecto, EstadoProyectoInfo> = {
  [EstadoProyecto.ACTIVO]: {
    label: 'Activo',
    color: '#10B981',
    descripcion: 'Proyecto en curso con actividad normal',
  },
  [EstadoProyecto.PAUSADO]: {
    label: 'Pausado',
    color: '#F59E0B',
    descripcion: 'Proyecto temporalmente detenido',
  },
  [EstadoProyecto.COMPLETADO]: {
    label: 'Completado',
    color: '#6B7280',
    descripcion: 'Proyecto finalizado exitosamente',
  },
  [EstadoProyecto.CANCELADO]: {
    label: 'Cancelado',
    color: '#EF4444',
    descripcion: 'Proyecto cancelado',
  },
};

/**
 * Transiciones permitidas entre estados de proyecto
 */
export const TRANSICIONES_PROYECTO: Record<EstadoProyecto, EstadoProyecto[]> = {
  [EstadoProyecto.ACTIVO]: [
    EstadoProyecto.PAUSADO,
    EstadoProyecto.COMPLETADO,
    EstadoProyecto.CANCELADO,
  ],
  [EstadoProyecto.PAUSADO]: [EstadoProyecto.ACTIVO, EstadoProyecto.CANCELADO],
  [EstadoProyecto.COMPLETADO]: [], // Estado terminal
  [EstadoProyecto.CANCELADO]: [], // Estado terminal
};

/**
 * Verifica si una transición de estado es válida
 */
export function puedeTransicionar(desde: EstadoProyecto, hacia: EstadoProyecto): boolean {
  return TRANSICIONES_PROYECTO[desde].includes(hacia);
}

/**
 * Obtiene las transiciones disponibles desde un estado
 */
export function getTransicionesDisponibles(estado: EstadoProyecto): EstadoProyecto[] {
  return TRANSICIONES_PROYECTO[estado];
}

/**
 * Obtiene la información de un estado
 */
export function getEstadoInfo(estado: EstadoProyecto): EstadoProyectoInfo {
  return ESTADO_PROYECTO_INFO[estado];
}
