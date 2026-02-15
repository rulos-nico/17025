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
