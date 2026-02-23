/**
 * useMultipleApiData - Hook para fetching paralelo de múltiples APIs
 */

import { useState, useEffect, useCallback, useRef, SetStateAction } from 'react';

export interface ApiConfig<T = unknown, R = T> {
  api: () => Promise<T>;
  transform?: (data: T) => R;
  initialData?: R;
}

export type ApisConfig = Record<string, ApiConfig>;

export interface UseMultipleApiDataOptions {
  deps?: unknown[];
  enabled?: boolean;
  fetchOnMount?: boolean;
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

export interface UseMultipleApiDataResult<T extends Record<string, unknown>> {
  data: T;
  loading: boolean;
  fetching: boolean;
  error: string | null;
  reload: () => Promise<T | undefined>;
  reloadOne: (key: keyof T) => Promise<unknown>;
  setData: <K extends keyof T>(key: K, newData: SetStateAction<T[K]>) => void;
  reset: () => void;
}

/**
 * Hook para fetching paralelo de múltiples APIs
 */
export function useMultipleApiData<T extends Record<string, unknown> = Record<string, unknown>>(
  apisConfig: ApisConfig,
  options: UseMultipleApiDataOptions = {}
): UseMultipleApiDataResult<T> {
  const { deps = [], enabled = true, fetchOnMount = true, onSuccess, onError } = options;

  // Construir estado inicial
  const buildInitialData = useCallback((): T => {
    const initial: Record<string, unknown> = {};
    Object.keys(apisConfig).forEach(key => {
      initial[key] = apisConfig[key].initialData ?? [];
    });
    return initial as T;
  }, [apisConfig]);

  const [data, setDataState] = useState<T>(buildInitialData);
  const [loading, setLoading] = useState(fetchOnMount && enabled);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mountedRef = useRef(true);
  const apisConfigRef = useRef(apisConfig);

  // Actualizar ref cuando cambia config
  useEffect(() => {
    apisConfigRef.current = apisConfig;
  }, [apisConfig]);

  // Fetch de todos los datos en paralelo
  const fetchAll = useCallback(
    async (isInitial = false): Promise<T | undefined> => {
      if (!enabled) return undefined;

      const config = apisConfigRef.current;
      const keys = Object.keys(config);

      if (isInitial) {
        setLoading(true);
      }
      setFetching(true);
      setError(null);

      try {
        // Ejecutar todas las APIs en paralelo
        const promises = keys.map(key => config[key].api());
        const results = await Promise.all(promises);

        if (!mountedRef.current) return undefined;

        // Transformar y construir objeto de datos
        const newData: Record<string, unknown> = {};
        keys.forEach((key, index) => {
          const result = results[index];
          const transform = config[key].transform;
          const initialData = config[key].initialData ?? [];
          newData[key] = transform ? transform(result) : result || initialData;
        });

        setDataState(newData as T);

        if (onSuccess) {
          onSuccess(newData);
        }

        return newData as T;
      } catch (err) {
        if (!mountedRef.current) return undefined;

        const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos';
        setError(errorMessage);
        console.error('useMultipleApiData error:', err);

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
    [enabled, onSuccess, onError]
  );

  // Reload todos
  const reload = useCallback(() => {
    return fetchAll(false);
  }, [fetchAll]);

  // Reload solo una key
  const reloadOne = useCallback(async (key: keyof T): Promise<unknown> => {
    const config = apisConfigRef.current;
    const keyStr = key as string;
    if (!config[keyStr]) {
      console.warn(`useMultipleApiData: key "${keyStr}" not found`);
      return undefined;
    }

    setFetching(true);
    setError(null);

    try {
      const result = await config[keyStr].api();

      if (!mountedRef.current) return undefined;

      const transform = config[keyStr].transform;
      const initialData = config[keyStr].initialData ?? [];
      const transformedData = transform ? transform(result) : result || initialData;

      setDataState(prev => ({
        ...prev,
        [keyStr]: transformedData,
      }));

      return transformedData;
    } catch (err) {
      if (!mountedRef.current) return undefined;

      const errorMessage = err instanceof Error ? err.message : `Error al cargar ${keyStr}`;
      setError(errorMessage);
      console.error(`useMultipleApiData error (${keyStr}):`, err);

      throw err;
    } finally {
      if (mountedRef.current) {
        setFetching(false);
      }
    }
  }, []);

  // Setter para una key específica
  const setData = useCallback(<K extends keyof T>(key: K, newData: SetStateAction<T[K]>) => {
    setDataState(prev => ({
      ...prev,
      [key]: typeof newData === 'function' ? (newData as (prev: T[K]) => T[K])(prev[key]) : newData,
    }));
  }, []);

  // Reset al estado inicial
  const reset = useCallback(() => {
    setDataState(buildInitialData());
    setLoading(false);
    setFetching(false);
    setError(null);
  }, [buildInitialData]);

  // Fetch inicial
  useEffect(() => {
    mountedRef.current = true;

    if (fetchOnMount && enabled) {
      fetchAll(true);
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
    reloadOne,
    setData,
    reset,
  };
}

export default useMultipleApiData;
