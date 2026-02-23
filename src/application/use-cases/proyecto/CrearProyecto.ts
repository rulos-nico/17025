/**
 * Caso de Uso: Crear Proyecto
 *
 * Crea un nuevo proyecto validando que no exista otro con el mismo código
 */

import { Proyecto } from '@domain/entities';
import { ProyectoRepository } from '@domain/repositories';
import { CrearProyectoDTO, ProyectoResponseDTO } from '@application/dtos/ProyectoDTO';
import { ProyectoDTOMapper } from './ProyectoDTOMapper';

export class CrearProyecto {
  constructor(private readonly proyectoRepository: ProyectoRepository) {}

  async execute(dto: CrearProyectoDTO): Promise<ProyectoResponseDTO> {
    // Validar que no exista un proyecto con el mismo código
    const existeCodigo = await this.proyectoRepository.existsByCodigo(dto.codigo);
    if (existeCodigo) {
      throw new Error(`Ya existe un proyecto con el código ${dto.codigo}`);
    }

    // Crear la entidad (las validaciones de negocio están en la entidad)
    const proyecto = Proyecto.create({
      codigo: dto.codigo,
      nombre: dto.nombre,
      clienteId: dto.clienteId,
      fechaInicio: new Date(dto.fechaInicio),
      descripcion: dto.descripcion,
      ubicacion: dto.ubicacion,
    });

    // Persistir
    const proyectoGuardado = await this.proyectoRepository.save(proyecto);

    // Retornar DTO
    return ProyectoDTOMapper.toResponseDTO(proyectoGuardado);
  }
}
