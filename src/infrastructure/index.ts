/**
 * Infrastructure Layer - Barrel export
 *
 * Exporta todas las implementaciones de infraestructura:
 * - API Client y utilidades HTTP
 * - Mappers para conversión API ↔ Domain
 * - Implementaciones de repositorios
 */

// API
export { ApiClient, apiClient, ApiError, type RequestOptions } from './api';

// Mappers
export { ProyectoApiMapper, type ProyectoApiResponse, type ProyectoApiRequest } from './mappers';

// Repositories
export { ApiProyectoRepository } from './repositories';

// Dependency Injection Container
export {
  container,
  proyectoUseCases,
  type Container,
  type UseCases,
  type Repositories,
  type ProyectoUseCases,
} from './container';
