/**
 * Tipos compartidos para la página de Proyectos
 *
 * Estos tipos son específicos de la UI y complementan los DTOs de application layer
 */

import { EstadoProyecto } from '@domain/value-objects';

// ============================================
// TIPOS DE UI
// ============================================

/**
 * Rol del usuario en el sistema
 */
export type UserRole = 'admin' | 'coordinador' | 'tecnico' | 'cliente';

/**
 * Información de estado con label y color para UI
 */
export interface EstadoInfo {
  label: string;
  color: string;
}

/**
 * Mapa de estados de proyecto
 */
export const ESTADO_PROYECTO_UI: Record<string, EstadoInfo> = {
  activo: { label: 'Activo', color: '#10B981' },
  pausado: { label: 'Pausado', color: '#F59E0B' },
  completado: { label: 'Completado', color: '#6366F1' },
  cancelado: { label: 'Cancelado', color: '#EF4444' },
};

/**
 * Estados de perforación
 */
export const ESTADO_PERFORACION_UI: Record<string, EstadoInfo> = {
  sin_relacionar: { label: 'Sin relacionar', color: '#9CA3AF' },
  relacionado: { label: 'Relacionado', color: '#10B981' },
};

// ============================================
// TIPOS DE DATOS (temporales hasta migrar otras entidades)
// ============================================

/**
 * Cliente (simplificado para UI)
 */
export interface ClienteUI {
  id: string;
  nombre: string;
  contacto_nombre?: string;
  email?: string;
}

/**
 * Perforación (simplificado para UI)
 */
export interface PerforacionUI {
  id: string;
  proyectoId: string;
  codigo: string;
  nombre?: string;
  descripcion?: string;
  ubicacion?: string;
  profundidad?: number;
  estado: 'sin_relacionar' | 'relacionado';
  muestraFisica?: string;
  fecha_recepcion?: string;
  [key: string]: unknown;
}

/**
 * Muestra (simplificado para UI)
 */
export interface MuestraUI {
  id: string;
  perforacionId: string;
  codigo: string;
  profundidadInicio: number;
  profundidadFin: number;
  tipoMuestra: string;
  descripcion?: string;
  [key: string]: unknown;
}

/**
 * Ensayo (simplificado para UI)
 */
export interface EnsayoUI {
  id: string;
  codigo: string;
  tipo: string;
  perforacionId: string;
  muestraId?: string;
  proyectoId: string;
  workflow_state: string;
  spreadsheet_url?: string;
  fecha_solicitud?: string;
}

/**
 * Proyecto para la UI (extiende el DTO con datos de relaciones)
 */
export interface ProyectoUI {
  id: string;
  codigo: string;
  nombre: string;
  clienteId: string;
  clienteNombre?: string;
  estado: EstadoProyecto;
  fechaInicio: string;
  fechaFinEstimada?: string;
  descripcion?: string;
  ubicacion?: string;
  contacto?: string;
  ensayosCotizados?: Record<string, number>;
  [key: string]: unknown;
}

// ============================================
// TIPOS DE FORMULARIOS
// ============================================

/**
 * Datos para crear un nuevo proyecto
 */
export interface NuevoProyectoFormData {
  nombre: string;
  descripcion: string;
  clienteId: string;
  contacto: string;
  fecha_fin_estimada: string;
  perforaciones: {
    codigo: string;
    descripcion: string;
    ubicacion: string;
  }[];
  ensayosCotizados: Record<string, number>;
}

/**
 * Datos para editar un proyecto
 */
export interface EditarProyectoFormData {
  nombre: string;
  descripcion: string;
  contacto: string;
  fecha_fin_estimada: string;
  estado: string;
}

/**
 * Datos para editar una perforación
 */
export interface EditarPerforacionFormData {
  nombre: string;
  descripcion: string;
  ubicacion: string;
}

/**
 * Datos para relacionar muestra física
 */
export interface RelacionarMuestraFormData {
  perforacionId: string;
  codigoMuestra: string;
  fechaRecepcion: string;
  observaciones: string;
  condicionMuestra: 'buena' | 'regular' | 'deteriorada';
  muestras: {
    profundidadInicio: string;
    profundidadFin: string;
    tipoMuestra: string;
    descripcion: string;
  }[];
}

/**
 * Datos para agregar una muestra
 */
export interface AgregarMuestraFormData {
  perforacionId: string;
  codigo: string;
  profundidadInicio: number;
  profundidadFin: number;
  tipoMuestra: string;
  descripcion: string;
}

/**
 * Datos para solicitar un ensayo
 */
export interface SolicitarEnsayoFormData {
  tipo: string;
  perforacionId: string;
  proyectoId: string;
  muestraId?: string;
  muestra?: string;
  muestraDescripcion?: string;
  norma?: string;
  urgente?: boolean;
  observaciones?: string;
}

// ============================================
// TIPOS DE MODALES
// ============================================

/**
 * Item a eliminar
 */
export interface ItemToDelete {
  type: 'proyecto' | 'perforacion';
  item: ProyectoUI | PerforacionUI;
}

// ============================================
// HELPERS DE PERMISOS
// ============================================

export const canCreateProject = (rol: UserRole): boolean => ['admin', 'coordinador'].includes(rol);

export const canEditProject = (rol: UserRole): boolean => ['admin', 'coordinador'].includes(rol);

export const canDeleteProject = (rol: UserRole): boolean => ['admin', 'coordinador'].includes(rol);

export const canRelatePhysicalSample = (rol: UserRole): boolean =>
  ['admin', 'coordinador', 'tecnico'].includes(rol);

export const canAddMuestras = (rol: UserRole): boolean =>
  ['admin', 'coordinador', 'tecnico'].includes(rol);

export const canRequestTest = (rol: UserRole): boolean => ['cliente'].includes(rol);

export const canCreatePerforations = (rol: UserRole): boolean =>
  ['admin', 'coordinador'].includes(rol);

// ============================================
// HELPERS DE ESTADO
// ============================================

export const getEstadoProyecto = (estado: string): EstadoInfo =>
  ESTADO_PROYECTO_UI[estado] || { label: estado, color: '#6B7280' };

export const getEstadoPerforacion = (estado: string): EstadoInfo =>
  ESTADO_PERFORACION_UI[estado] || { label: estado, color: '#6B7280' };

// ============================================
// ROLES DISPONIBLES
// ============================================

export const ROLES_DISPONIBLES: { id: UserRole; nombre: string }[] = [
  { id: 'admin', nombre: 'Administrador' },
  { id: 'coordinador', nombre: 'Coordinador' },
  { id: 'tecnico', nombre: 'Técnico' },
  { id: 'cliente', nombre: 'Cliente' },
];
