/**
 * useMutation - Hook para operaciones de mutación (create, update, delete)
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseMutationOptions<TData, TVariables extends unknown[]> {
  onSuccess?: (data: TData, ...args: TVariables) => void;
  onError?: (error: Error, ...args: TVariables) => void;
  onSettled?: (data: TData | null, error: Error | null, ...args: TVariables) => void;
  throwOnError?: boolean;
}

export interface UseMutationResult<TData, TVariables extends unknown[]> {
  mutate: (...args: TVariables) => Promise<TData | undefined>;
  mutateAsync: (...args: TVariables) => Promise<TData>;
  loading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: TData | null;
  reset: () => void;
}

/**
 * Hook para operaciones de mutación
 */
export function useMutation<TData, TVariables extends unknown[] = unknown[]>(
  mutationFn: (...args: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled, throwOnError = false } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const mountedRef = useRef(true);
  const mutationFnRef = useRef(mutationFn);

  // Actualizar ref cuando cambia la función (en effect, no durante render)
  useEffect(() => {
    mutationFnRef.current = mutationFn;
  }, [mutationFn]);

  // Reset del estado
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    setIsSuccess(false);
    setIsError(false);
  }, []);

  // Mutación async (siempre lanza errores)
  const mutateAsync = useCallback(
    async (...args: TVariables): Promise<TData> => {
      setLoading(true);
      setError(null);
      setIsSuccess(false);
      setIsError(false);

      try {
        const result = await mutationFnRef.current(...args);

        if (mountedRef.current) {
          setData(result);
          setIsSuccess(true);
          setLoading(false);
        }

        if (onSuccess) {
          onSuccess(result, ...args);
        }

        if (onSettled) {
          onSettled(result, null, ...args);
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error en la operación';

        if (mountedRef.current) {
          setError(errorMessage);
          setIsError(true);
          setLoading(false);
        }

        console.error('useMutation error:', err);

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage), ...args);
        }

        if (onSettled) {
          onSettled(null, err instanceof Error ? err : new Error(errorMessage), ...args);
        }

        throw err;
      }
    },
    [onSuccess, onError, onSettled]
  );

  // Mutación que no lanza errores (a menos que throwOnError sea true)
  const mutate = useCallback(
    async (...args: TVariables): Promise<TData | undefined> => {
      try {
        return await mutateAsync(...args);
      } catch (err) {
        if (throwOnError) {
          throw err;
        }
        // Error ya fue manejado, no hacer nada
        return undefined;
      }
    },
    [mutateAsync, throwOnError]
  );

  return {
    mutate,
    mutateAsync,
    loading,
    isSuccess,
    isError,
    error,
    data,
    reset,
  };
}

interface CrudApis<TCreate, TUpdate, TDelete> {
  create: (...args: unknown[]) => Promise<TCreate>;
  update: (...args: unknown[]) => Promise<TUpdate>;
  delete: (...args: unknown[]) => Promise<TDelete>;
}

interface CrudMutationsOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook de conveniencia para operaciones CRUD comunes
 */
export function useCrudMutations<TCreate, TUpdate, TDelete>(
  apis: CrudApis<TCreate, TUpdate, TDelete>,
  options: CrudMutationsOptions = {}
) {
  const { onSuccess, onError } = options;

  const createMutation = useMutation(apis.create, { onSuccess, onError });
  const updateMutation = useMutation(apis.update, { onSuccess, onError });
  const deleteMutation = useMutation(apis.delete, { onSuccess, onError });

  const saving = createMutation.loading || updateMutation.loading || deleteMutation.loading;

  return {
    create: createMutation,
    update: updateMutation,
    remove: deleteMutation, // 'delete' es palabra reservada
    saving,
    // Shortcuts
    isCreating: createMutation.loading,
    isUpdating: updateMutation.loading,
    isDeleting: deleteMutation.loading,
  };
}

export default useMutation;
