/**
 * Caso de Uso: Obtener Proyectos
 *
 * Obtiene todos los proyectos o filtrados por criterios
 */

import { ProyectoRepository, ProyectoBusquedaCriteria } from '@domain/repositories';
import { FiltrarProyectosDTO, ProyectoResponseDTO } from '@application/dtos/ProyectoDTO';
import { ProyectoDTOMapper } from './ProyectoDTOMapper';

export class ObtenerProyectos {
  constructor(private readonly proyectoRepository: ProyectoRepository) {}

  /**
   * Obtiene todos los proyectos
   */
  async execute(): Promise<ProyectoResponseDTO[]> {
    const proyectos = await this.proyectoRepository.findAll();
    return ProyectoDTOMapper.toResponseDTOList(proyectos);
  }

  /**
   * Obtiene proyectos filtrados
   */
  async executeWithFilters(filtros: FiltrarProyectosDTO): Promise<ProyectoResponseDTO[]> {
    const criteria: ProyectoBusquedaCriteria = {
      clienteId: filtros.clienteId,
      estado: filtros.estado,
      fechaDesde: filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined,
      fechaHasta: filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined,
      busqueda: filtros.busqueda,
    };

    const proyectos = await this.proyectoRepository.findByCriteria(criteria);
    return ProyectoDTOMapper.toResponseDTOList(proyectos);
  }

  /**
   * Obtiene proyectos de un cliente específico
   */
  async executeByCliente(clienteId: string): Promise<ProyectoResponseDTO[]> {
    const proyectos = await this.proyectoRepository.findByClienteId(clienteId);
    return ProyectoDTOMapper.toResponseDTOList(proyectos);
  }
}
