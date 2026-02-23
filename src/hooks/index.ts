/**
 * Hooks - Barrel export para todos los hooks personalizados
 *
 * Uso:
 *   import { useApiData, useMutation, useAuth } from '@/hooks';
 */

// Auth
export { useAuth, AuthProvider } from './useAuth';
export type { AuthUser } from './useAuth';

// Data fetching
export { useApiData } from './useApiData';
export type { UseApiDataOptions, UseApiDataResult } from './useApiData';
export { useMultipleApiData } from './useMultipleApiData';

// Mutations
export { useMutation, useCrudMutations } from './useMutation';
export type { UseMutationOptions, UseMutationResult } from './useMutation';

// Ensayo-specific hooks
export { useEnsayosData } from './useEnsayosData';
export { useEnsayoModals, MODAL_TYPES } from './useEnsayoModals';

// Equipo-specific hooks
export { useEquiposData } from './useEquiposData';
export { useEquiposModals, EQUIPO_MODAL_TYPES } from './useEquiposModals';

// Personal-specific hooks
export { usePersonalData } from './usePersonalData';
export { usePersonalModals, PERSONAL_MODAL_TYPES } from './usePersonalModals';
