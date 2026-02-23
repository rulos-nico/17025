/**
 * Caso de Uso: Actualizar Proyecto
 *
 * Actualiza los datos de un proyecto existente
 */

import { ProyectoRepository } from '@domain/repositories';
import { ActualizarProyectoDTO, ProyectoResponseDTO } from '@application/dtos/ProyectoDTO';
import { ProyectoDTOMapper } from './ProyectoDTOMapper';

export class ActualizarProyecto {
  constructor(private readonly proyectoRepository: ProyectoRepository) {}

  async execute(id: string, dto: ActualizarProyectoDTO): Promise<ProyectoResponseDTO> {
    // Obtener proyecto existente
    const proyecto = await this.proyectoRepository.findById(id);

    if (!proyecto) {
      throw new Error(`Proyecto con ID ${id} no encontrado`);
    }

    // Actualizar (las validaciones de negocio están en la entidad)
    proyecto.actualizar({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      ubicacion: dto.ubicacion,
    });

    // Persistir cambios
    const proyectoActualizado = await this.proyectoRepository.update(proyecto);

    return ProyectoDTOMapper.toResponseDTO(proyectoActualizado);
  }
}
