/**
 * Mapper: Proyecto Entity <-> DTO
 *
 * Convierte entre entidades de dominio y DTOs de aplicación
 */

import { Proyecto } from '@domain/entities';
import { getEstadoInfo } from '@domain/value-objects';
import { ProyectoResponseDTO } from '@application/dtos/ProyectoDTO';

export class ProyectoDTOMapper {
  /**
   * Convierte una entidad Proyecto a DTO de respuesta
   */
  static toResponseDTO(proyecto: Proyecto): ProyectoResponseDTO {
    const estadoInfo = getEstadoInfo(proyecto.estado);

    return {
      id: proyecto.id,
      codigo: proyecto.codigo,
      nombre: proyecto.nombre,
      clienteId: proyecto.clienteId,
      estado: proyecto.estado,
      estadoLabel: estadoInfo.label,
      estadoColor: estadoInfo.color,
      fechaInicio: proyecto.fechaInicio.toISOString(),
      fechaFin: proyecto.fechaFin?.toISOString(),
      descripcion: proyecto.descripcion,
      ubicacion: proyecto.ubicacion,
      duracionDias: proyecto.getDuracionDias(),
      estaActivo: proyecto.estaActivo(),
      estaFinalizado: proyecto.estaFinalizado(),
      createdAt: proyecto.createdAt.toISOString(),
      updatedAt: proyecto.updatedAt.toISOString(),
    };
  }

  /**
   * Convierte múltiples entidades a DTOs
   */
  static toResponseDTOList(proyectos: Proyecto[]): ProyectoResponseDTO[] {
    return proyectos.map(this.toResponseDTO);
  }
}
