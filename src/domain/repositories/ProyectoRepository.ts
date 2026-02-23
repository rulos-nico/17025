/**
 * Repositorio: Proyecto
 * Define el contrato para acceso a datos de proyectos
 *
 * Esta interfaz permite:
 * - Desacoplar el dominio de la infraestructura
 * - Facilitar testing con implementaciones mock
 * - Cambiar la fuente de datos sin afectar el dominio
 */

import { Proyecto } from '../entities/Proyecto';
import { EstadoProyecto } from '../value-objects/EstadoProyecto';

/**
 * Criterios de búsqueda para proyectos
 */
export interface ProyectoBusquedaCriteria {
  clienteId?: string;
  estado?: EstadoProyecto;
  fechaDesde?: Date;
  fechaHasta?: Date;
  busqueda?: string; // Búsqueda por código o nombre
}

/**
 * Opciones de paginación
 */
export interface PaginacionOptions {
  page: number;
  limit: number;
  orderBy?: 'codigo' | 'nombre' | 'fechaInicio' | 'estado' | 'createdAt';
  orderDir?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interfaz del repositorio de proyectos
 * La capa de infraestructura debe implementar esta interfaz
 */
export interface ProyectoRepository {
  /**
   * Obtiene todos los proyectos
   */
  findAll(): Promise<Proyecto[]>;

  /**
   * Obtiene proyectos con paginación
   */
  findPaginated(options: PaginacionOptions): Promise<PaginatedResult<Proyecto>>;

  /**
   * Busca proyectos según criterios
   */
  findByCriteria(criteria: ProyectoBusquedaCriteria): Promise<Proyecto[]>;

  /**
   * Obtiene un proyecto por ID
   * @returns null si no existe
   */
  findById(id: string): Promise<Proyecto | null>;

  /**
   * Obtiene un proyecto por código
   * @returns null si no existe
   */
  findByCodigo(codigo: string): Promise<Proyecto | null>;

  /**
   * Obtiene proyectos de un cliente
   */
  findByClienteId(clienteId: string): Promise<Proyecto[]>;

  /**
   * Verifica si existe un proyecto con el código dado
   */
  existsByCodigo(codigo: string): Promise<boolean>;

  /**
   * Guarda un nuevo proyecto
   */
  save(proyecto: Proyecto): Promise<Proyecto>;

  /**
   * Actualiza un proyecto existente
   */
  update(proyecto: Proyecto): Promise<Proyecto>;

  /**
   * Elimina un proyecto por ID
   */
  delete(id: string): Promise<void>;

  /**
   * Cuenta el total de proyectos
   */
  count(): Promise<number>;

  /**
   * Cuenta proyectos por estado
   */
  countByEstado(estado: EstadoProyecto): Promise<number>;
}
