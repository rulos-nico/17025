/**
 * Domain Layer - Barrel export
 *
 * Esta capa contiene:
 * - Entidades: Objetos con identidad y ciclo de vida
 * - Value Objects: Objetos inmutables sin identidad
 * - Repositories: Interfaces para acceso a datos
 * - Services: Lógica de dominio que no pertenece a una entidad
 */

// Entities
export * from './entities';

// Value Objects
export * from './value-objects';

// Repositories (interfaces)
export * from './repositories';

// Services (cuando se agreguen)
// export * from './services';
