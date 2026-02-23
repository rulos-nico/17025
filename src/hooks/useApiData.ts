/**
 * useApiData - Hook para fetching de datos de API con estado de carga y error
 */

import { useState, useEffect, useCallback, useRef, Dispatch, SetStateAction } from 'react';

export interface UseApiDataOptions<T, R = T> {
  transform?: (data: T) => R;
  initialData?: R;
  deps?: unknown[];
  enabled?: boolean;
  fetchOnMount?: boolean;
  onSuccess?: (data: R) => void;
  onError?: (error: Error) => void;
}

export interface UseApiDataResult<R> {
  data: R;
  loading: boolean;
  fetching: boolean;
  error: string | null;
  reload: () => Promise<R | undefined>;
  setData: Dispatch<SetStateAction<R>>;
  reset: () => void;
}

/**
 * Hook para fetching de datos de API
 */
export function useApiData<T, R = T>(
  apiMethod: () => Promise<T>,
  options: UseApiDataOptions<T, R> = {}
): UseApiDataResult<R> {
  const {
    transform,
    initialData = [] as unknown as R,
    deps = [],
    enabled = true,
    fetchOnMount = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<R>(initialData);
  const [loading, setLoading] = useState(fetchOnMount && enabled);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref para evitar updates en componentes desmontados
  const mountedRef = useRef(true);
  const apiMethodRef = useRef(apiMethod);

  // Actualizar ref cuando cambia apiMethod
  useEffect(() => {
    apiMethodRef.current = apiMethod;
  }, [apiMethod]);

  // Función de fetch
  const fetchData = useCallback(
    async (isInitial = false): Promise<R | undefined> => {
      if (!enabled) return undefined;

      if (isInitial) {
        setLoading(true);
      }
      setFetching(true);
      setError(null);

      try {
        const result = await apiMethodRef.current();

        if (!mountedRef.current) return undefined;

        const transformedData = transform
          ? transform(result)
          : (result as unknown as R) || initialData;
        setData(transformedData);

        if (onSuccess) {
          onSuccess(transformedData);
        }

        return transformedData;
      } catch (err) {
        if (!mountedRef.current) return undefined;

        const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos';
        setError(errorMessage);
        console.error('useApiData error:', err);

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setFetching(false);
        }
      }
    },
    [enabled, transform, initialData, onSuccess, onError]
  );

  // Función de reload expuesta
  const reload = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  // Reset al estado inicial
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setFetching(false);
    setError(null);
  }, [initialData]);

  // Fetch inicial y cuando cambian dependencias
  useEffect(() => {
    mountedRef.current = true;

    if (fetchOnMount && enabled) {
      fetchData(true);
    }

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchOnMount, ...deps]);

  return {
    data,
    loading,
    fetching,
    error,
    reload,
    setData,
    reset,
  };
}

export default useApiData;
