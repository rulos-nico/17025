/**
 * useApiData - Hook para fetching de datos de API con estado de carga y error
 *
 * Proporciona un patrón consistente para:
 * - Carga inicial de datos
 * - Estados de loading/error
 * - Función de recarga
 * - Transformación de datos opcional
 *
 * @example
 * // Uso básico
 * const { data, loading, error, reload } = useApiData(EnsayosAPI.list);
 *
 * @example
 * // Con transformación
 * const { data: ensayos, loading, error, reload } = useApiData(
 *   EnsayosAPI.list,
 *   { transform: mapEnsayos }
 * );
 *
 * @example
 * // Con dependencias (re-fetch cuando cambian)
 * const { data: perforaciones } = useApiData(
 *   () => PerforacionesAPI.listByProyecto(proyectoId),
 *   { deps: [proyectoId], enabled: !!proyectoId }
 * );
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @typedef {Object} UseApiDataOptions
 * @property {Function} [transform] - Función para transformar los datos después de recibirlos
 * @property {*} [initialData] - Datos iniciales (default: [])
 * @property {Array} [deps] - Dependencias adicionales que disparan re-fetch
 * @property {boolean} [enabled] - Si false, no hace fetch automático (default: true)
 * @property {boolean} [fetchOnMount] - Si true, hace fetch al montar (default: true)
 * @property {Function} [onSuccess] - Callback cuando el fetch es exitoso
 * @property {Function} [onError] - Callback cuando hay error
 */

/**
 * @typedef {Object} UseApiDataResult
 * @property {*} data - Los datos obtenidos (transformados si aplica)
 * @property {boolean} loading - Estado de carga inicial
 * @property {boolean} fetching - Estado de cualquier carga (inicial o reload)
 * @property {string|null} error - Mensaje de error o null
 * @property {Function} reload - Función para recargar los datos
 * @property {Function} setData - Setter para actualizar datos manualmente
 * @property {Function} reset - Resetea al estado inicial
 */

/**
 * Hook para fetching de datos de API
 * @param {Function} apiMethod - Método de API que retorna una Promise
 * @param {UseApiDataOptions} [options] - Opciones de configuración
 * @returns {UseApiDataResult}
 */
export function useApiData(apiMethod, options = {}) {
  const {
    transform,
    initialData = [],
    deps = [],
    enabled = true,
    fetchOnMount = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(fetchOnMount && enabled);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  // Ref para evitar updates en componentes desmontados
  const mountedRef = useRef(true);
  const apiMethodRef = useRef(apiMethod);

  // Actualizar ref cuando cambia apiMethod
  useEffect(() => {
    apiMethodRef.current = apiMethod;
  }, [apiMethod]);

  // Función de fetch
  const fetchData = useCallback(
    async (isInitial = false) => {
      if (!enabled) return;

      if (isInitial) {
        setLoading(true);
      }
      setFetching(true);
      setError(null);

      try {
        const result = await apiMethodRef.current();

        if (!mountedRef.current) return;

        const transformedData = transform ? transform(result) : result || initialData;
        setData(transformedData);

        if (onSuccess) {
          onSuccess(transformedData);
        }

        return transformedData;
      } catch (err) {
        if (!mountedRef.current) return;

        const errorMessage = err.message || 'Error al cargar los datos';
        setError(errorMessage);
        console.error('useApiData error:', err);

        if (onError) {
          onError(err);
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
