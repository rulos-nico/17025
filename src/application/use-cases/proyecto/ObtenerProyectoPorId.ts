/**
 * Caso de Uso: Obtener Proyecto por ID
 *
 * Obtiene un proyecto específico por su ID
 */

import { ProyectoRepository } from '@domain/repositories';
import { ProyectoResponseDTO } from '@application/dtos/ProyectoDTO';
import { ProyectoDTOMapper } from './ProyectoDTOMapper';

export class ObtenerProyectoPorId {
  constructor(private readonly proyectoRepository: ProyectoRepository) {}

  async execute(id: string): Promise<ProyectoResponseDTO> {
    const proyecto = await this.proyectoRepository.findById(id);

    if (!proyecto) {
      throw new Error(`Proyecto con ID ${id} no encontrado`);
    }

    return ProyectoDTOMapper.toResponseDTO(proyecto);
  }
}
