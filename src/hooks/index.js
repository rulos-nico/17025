/**
 * Hooks - Barrel export para todos los hooks personalizados
 *
 * Uso:
 *   import { useApiData, useMutation, useAuth } from '@/hooks';
 *
 * O importar hooks específicos:
 *   import { useApiData } from '@/hooks/useApiData';
 *   import { useMultipleApiData } from '@/hooks/useMultipleApiData';
 *   import { useMutation, useCrudMutations } from '@/hooks/useMutation';
 */

// Auth
export { useAuth, AuthProvider } from './useAuth';

// Data fetching
export { useApiData } from './useApiData';
export { useMultipleApiData } from './useMultipleApiData';

// Mutations
export { useMutation, useCrudMutations } from './useMutation';

// Ensayo-specific hooks
export { useEnsayosData } from './useEnsayosData';
export { useEnsayoModals, MODAL_TYPES } from './useEnsayoModals';

// Equipo-specific hooks
export { useEquiposData } from './useEquiposData';
export { useEquiposModals, EQUIPO_MODAL_TYPES } from './useEquiposModals';

// Personal-specific hooks
export { usePersonalData } from './usePersonalData';
export { usePersonalModals, PERSONAL_MODAL_TYPES } from './usePersonalModals';
