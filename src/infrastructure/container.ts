/**
 * Container de Dependencias
 *
 * Este módulo implementa Dependency Injection para conectar las capas.
 * Crea instancias únicas (singleton) de repositorios y casos de uso.
 *
 * Uso:
 *   import { container } from '@infrastructure/container';
 *   const proyectos = await container.useCases.proyecto.obtenerProyectos.execute();
 */

import { apiClient } from './api';
import { ApiProyectoRepository } from './repositories';
import {
  CrearProyecto,
  ObtenerProyectos,
  ObtenerProyectoPorId,
  ActualizarProyecto,
  CambiarEstadoProyecto,
  EliminarProyecto,
} from '@application/use-cases';

/**
 * Tipo para los casos de uso de Proyecto
 */
interface ProyectoUseCases {
  crearProyecto: CrearProyecto;
  obtenerProyectos: ObtenerProyectos;
  obtenerProyectoPorId: ObtenerProyectoPorId;
  actualizarProyecto: ActualizarProyecto;
  cambiarEstadoProyecto: CambiarEstadoProyecto;
  eliminarProyecto: EliminarProyecto;
}

/**
 * Tipo para todos los casos de uso
 */
interface UseCases {
  proyecto: ProyectoUseCases;
}

/**
 * Tipo para todos los repositorios
 */
interface Repositories {
  proyecto: ApiProyectoRepository;
}

/**
 * Tipo del container de dependencias
 */
interface Container {
  repositories: Repositories;
  useCases: UseCases;
}

/**
 * Crea el container con todas las dependencias
 */
function createContainer(): Container {
  // Repositorios (singleton)
  const proyectoRepository = new ApiProyectoRepository(apiClient);

  // Casos de uso - Proyecto
  const proyectoUseCases: ProyectoUseCases = {
    crearProyecto: new CrearProyecto(proyectoRepository),
    obtenerProyectos: new ObtenerProyectos(proyectoRepository),
    obtenerProyectoPorId: new ObtenerProyectoPorId(proyectoRepository),
    actualizarProyecto: new ActualizarProyecto(proyectoRepository),
    cambiarEstadoProyecto: new CambiarEstadoProyecto(proyectoRepository),
    eliminarProyecto: new EliminarProyecto(proyectoRepository),
  };

  return {
    repositories: {
      proyecto: proyectoRepository,
    },
    useCases: {
      proyecto: proyectoUseCases,
    },
  };
}

/**
 * Container singleton con todas las dependencias
 */
export const container = createContainer();

/**
 * Acceso directo a los casos de uso de proyecto
 */
export const proyectoUseCases = container.useCases.proyecto;

/**
 * Tipos exportados para uso en otros módulos
 */
export type { Container, UseCases, Repositories, ProyectoUseCases };
