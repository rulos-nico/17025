/**
 * Caso de Uso: Eliminar Proyecto
 *
 * Elimina un proyecto existente
 */

import { ProyectoRepository } from '@domain/repositories';

export class EliminarProyecto {
  constructor(private readonly proyectoRepository: ProyectoRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que existe
    const proyecto = await this.proyectoRepository.findById(id);

    if (!proyecto) {
      throw new Error(`Proyecto con ID ${id} no encontrado`);
    }

    // Validaciones de negocio antes de eliminar
    // Por ejemplo: no permitir eliminar proyectos activos con ensayos
    // Esto podría expandirse según las reglas del negocio
    if (proyecto.estaActivo()) {
      throw new Error(
        'No se puede eliminar un proyecto activo. ' + 'Primero debe completarlo o cancelarlo.'
      );
    }

    await this.proyectoRepository.delete(id);
  }
}
