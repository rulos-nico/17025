/**
 * useMutation - Hook para operaciones de mutación (create, update, delete)
 *
 * Proporciona estado de carga y error para operaciones que modifican datos,
 * con callbacks de éxito/error y reseteo automático del estado.
 *
 * @example
 * const { mutate, loading, error, reset } = useMutation(EnsayosAPI.create, {
 *   onSuccess: (data) => {
 *     toast.success('Ensayo creado');
 *     reload(); // recargar lista
 *   },
 *   onError: (err) => toast.error(err.message),
 * });
 *
 * // Uso
 * const handleCreate = async (formData) => {
 *   await mutate(formData);
 * };
 *
 * @example
 * // Múltiples mutaciones
 * const createMutation = useMutation(EnsayosAPI.create);
 * const updateMutation = useMutation(EnsayosAPI.update);
 * const deleteMutation = useMutation(EnsayosAPI.delete);
 */

import { useState, useCallback, useRef } from 'react';

/**
 * @typedef {Object} UseMutationOptions
 * @property {Function} [onSuccess] - Callback cuando la mutación es exitosa
 * @property {Function} [onError] - Callback cuando hay error
 * @property {Function} [onSettled] - Callback que se ejecuta siempre (success o error)
 * @property {boolean} [throwOnError] - Si true, lanza el error (default: false)
 */

/**
 * @typedef {Object} UseMutationResult
 * @property {Function} mutate - Función para ejecutar la mutación
 * @property {Function} mutateAsync - Función que retorna Promise (siempre lanza errores)
 * @property {boolean} loading - Estado de carga
 * @property {boolean} isSuccess - Si la última mutación fue exitosa
 * @property {boolean} isError - Si la última mutación tuvo error
 * @property {string|null} error - Mensaje de error o null
 * @property {*} data - Datos retornados por la última mutación exitosa
 * @property {Function} reset - Resetea el estado
 */

/**
 * Hook para operaciones de mutación
 * @param {Function} mutationFn - Función de mutación que retorna una Promise
 * @param {UseMutationOptions} [options] - Opciones de configuración
 * @returns {UseMutationResult}
 */
export function useMutation(mutationFn, options = {}) {
  const { onSuccess, onError, onSettled, throwOnError = false } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const mountedRef = useRef(true);
  const mutationFnRef = useRef(mutationFn);

  // Actualizar ref cuando cambia la función
  mutationFnRef.current = mutationFn;

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
    async (...args) => {
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
        const errorMessage = err.message || 'Error en la operación';

        if (mountedRef.current) {
          setError(errorMessage);
          setIsError(true);
          setLoading(false);
        }

        console.error('useMutation error:', err);

        if (onError) {
          onError(err, ...args);
        }

        if (onSettled) {
          onSettled(null, err, ...args);
        }

        throw err;
      }
    },
    [onSuccess, onError, onSettled]
  );

  // Mutación que no lanza errores (a menos que throwOnError sea true)
  const mutate = useCallback(
    async (...args) => {
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

/**
 * Hook de conveniencia para operaciones CRUD comunes
 * Crea mutaciones para create, update y delete
 *
 * @example
 * const { create, update, remove, saving } = useCrudMutations({
 *   create: EnsayosAPI.create,
 *   update: EnsayosAPI.update,
 *   delete: EnsayosAPI.delete,
 * }, {
 *   onSuccess: () => reload(),
 * });
 */
export function useCrudMutations(apis, options = {}) {
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
