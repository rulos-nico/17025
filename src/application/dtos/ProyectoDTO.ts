/**
 * DTOs para Proyecto
 *
 * Los DTOs (Data Transfer Objects) definen la estructura de datos
 * para comunicación entre capas. Son objetos simples sin lógica.
 */

import { EstadoProyecto } from '@domain/value-objects';

// ============================================
// REQUEST DTOs (entrada desde UI/API)
// ============================================

/**
 * DTO para crear un nuevo proyecto
 */
export interface CrearProyectoDTO {
  codigo: string;
  nombre: string;
  clienteId: string;
  fechaInicio: string; // ISO 8601
  descripcion?: string;
  ubicacion?: string;
}

/**
 * DTO para actualizar un proyecto existente
 */
export interface ActualizarProyectoDTO {
  nombre?: string;
  descripcion?: string;
  ubicacion?: string;
}

/**
 * DTO para cambiar el estado de un proyecto
 */
export interface CambiarEstadoProyectoDTO {
  proyectoId: string;
  nuevoEstado: EstadoProyecto;
}

/**
 * DTO para filtrar proyectos
 */
export interface FiltrarProyectosDTO {
  clienteId?: string;
  estado?: EstadoProyecto;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
}

// ============================================
// RESPONSE DTOs (salida hacia UI/API)
// ============================================

/**
 * DTO de respuesta para un proyecto
 */
export interface ProyectoResponseDTO {
  id: string;
  codigo: string;
  nombre: string;
  clienteId: string;
  estado: EstadoProyecto;
  estadoLabel: string;
  estadoColor: string;
  fechaInicio: string;
  fechaFin?: string;
  descripcion?: string;
  ubicacion?: string;
  duracionDias: number;
  estaActivo: boolean;
  estaFinalizado: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO de respuesta para proyecto con datos relacionados
 */
export interface ProyectoDetalleResponseDTO extends ProyectoResponseDTO {
  clienteNombre: string;
  totalPerforaciones: number;
  totalMuestras: number;
  totalEnsayos: number;
  ensayosPorEstado: Record<string, number>;
}

/**
 * DTO de respuesta para lista de proyectos (versión resumida)
 */
export interface ProyectoListItemDTO {
  id: string;
  codigo: string;
  nombre: string;
  clienteId: string;
  clienteNombre: string;
  estado: EstadoProyecto;
  estadoLabel: string;
  estadoColor: string;
  fechaInicio: string;
  totalPerforaciones: number;
  totalEnsayos: number;
}

/**
 * DTO para respuesta paginada
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
