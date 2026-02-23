/**
 * Mapper: API Response <-> Domain Entity para Proyecto
 *
 * Convierte entre la respuesta del API (snake_case) y las entidades de dominio
 */

import { Proyecto } from '@domain/entities';
import { EstadoProyecto } from '@domain/value-objects';

/**
 * Respuesta del API para un proyecto (snake_case)
 */
export interface ProyectoApiResponse {
  id: string;
  codigo: string;
  nombre: string;
  cliente_id: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  descripcion?: string | null;
  ubicacion?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request al API para crear/actualizar proyecto
 */
export interface ProyectoApiRequest {
  codigo: string;
  nombre: string;
  cliente_id: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  descripcion?: string | null;
  ubicacion?: string | null;
}

/**
 * Mapper entre API y Domain
 */
export class ProyectoApiMapper {
  /**
   * Convierte respuesta del API a entidad de dominio
   */
  static toDomain(raw: ProyectoApiResponse): Proyecto {
    return Proyecto.fromPersistence({
      id: raw.id,
      codigo: raw.codigo,
      nombre: raw.nombre,
      clienteId: raw.cliente_id,
      estado: raw.estado as EstadoProyecto,
      fechaInicio: new Date(raw.fecha_inicio),
      fechaFin: raw.fecha_fin ? new Date(raw.fecha_fin) : undefined,
      descripcion: raw.descripcion ?? undefined,
      ubicacion: raw.ubicacion ?? undefined,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
    });
  }

  /**
   * Convierte múltiples respuestas a entidades
   */
  static toDomainList(rawList: ProyectoApiResponse[]): Proyecto[] {
    return rawList.map(this.toDomain);
  }

  /**
   * Convierte entidad de dominio a request del API
   */
  static toApi(proyecto: Proyecto): ProyectoApiRequest {
    return {
      codigo: proyecto.codigo,
      nombre: proyecto.nombre,
      cliente_id: proyecto.clienteId,
      estado: proyecto.estado,
      fecha_inicio: proyecto.fechaInicio.toISOString(),
      fecha_fin: proyecto.fechaFin?.toISOString() ?? null,
      descripcion: proyecto.descripcion ?? null,
      ubicacion: proyecto.ubicacion ?? null,
    };
  }
}
