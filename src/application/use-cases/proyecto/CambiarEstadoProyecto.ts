/**
 * Caso de Uso: Cambiar Estado Proyecto
 *
 * Cambia el estado de un proyecto siguiendo las reglas de transición
 */

import { ProyectoRepository } from '@domain/repositories';
import { EstadoProyecto, getTransicionesDisponibles } from '@domain/value-objects';
import { ProyectoResponseDTO } from '@application/dtos/ProyectoDTO';
import { ProyectoDTOMapper } from './ProyectoDTOMapper';

export class CambiarEstadoProyecto {
  constructor(private readonly proyectoRepository: ProyectoRepository) {}

  async execute(id: string, nuevoEstado: EstadoProyecto): Promise<ProyectoResponseDTO> {
    // Obtener proyecto
    const proyecto = await this.proyectoRepository.findById(id);

    if (!proyecto) {
      throw new Error(`Proyecto con ID ${id} no encontrado`);
    }

    // Verificar si la transición es válida (la entidad también valida, pero damos mejor mensaje)
    if (!proyecto.puedeTransicionarA(nuevoEstado)) {
      const transicionesValidas = getTransicionesDisponibles(proyecto.estado);
      throw new Error(
        `No se puede cambiar de ${proyecto.estado} a ${nuevoEstado}. ` +
          `Transiciones válidas: ${transicionesValidas.join(', ') || 'ninguna'}`
      );
    }

    // Ejecutar transición según el estado destino
    switch (nuevoEstado) {
      case EstadoProyecto.PAUSADO:
        proyecto.pausar();
        break;
      case EstadoProyecto.ACTIVO:
        proyecto.reactivar();
        break;
      case EstadoProyecto.COMPLETADO:
        proyecto.completar();
        break;
      case EstadoProyecto.CANCELADO:
        proyecto.cancelar();
        break;
      default:
        throw new Error(`Estado ${nuevoEstado} no soportado`);
    }

    // Persistir
    const proyectoActualizado = await this.proyectoRepository.update(proyecto);

    return ProyectoDTOMapper.toResponseDTO(proyectoActualizado);
  }

  /**
   * Obtiene las transiciones disponibles para un proyecto
   */
  async getTransicionesDisponibles(id: string): Promise<EstadoProyecto[]> {
    const proyecto = await this.proyectoRepository.findById(id);

    if (!proyecto) {
      throw new Error(`Proyecto con ID ${id} no encontrado`);
    }

    return getTransicionesDisponibles(proyecto.estado);
  }
}
