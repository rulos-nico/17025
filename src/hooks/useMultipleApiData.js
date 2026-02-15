/**
 * useMultipleApiData - Hook para fetching paralelo de múltiples APIs
 *
 * Proporciona un patrón consistente para cargar múltiples fuentes de datos
 * en paralelo usando Promise.all, con transformación individual por entidad.
 *
 * @example
 * const { data, loading, error, reload } = useMultipleApiData({
 *   proyectos: { api: ProyectosAPI.list, transform: mapProyectos },
 *   clientes: { api: ClientesAPI.list },
 *   perforaciones: { api: PerforacionesAPI.list, transform: mapPerforaciones },
 * });
 *
 * // Acceso a datos
 * const { proyectos, clientes, perforaciones } = data;
 *
 * @example
 * // Con dependencias
 * const { data, loading, reload } = useMultipleApiData({
 *   perforaciones: { api: () => PerforacionesAPI.listByProyecto(id) },
 *   ensayos: { api: () => EnsayosAPI.listByProyecto(id) },
 * }, { deps: [id], enabled: !!id });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @typedef {Object} ApiConfig
 * @property {Function} api - Método de API que retorna una Promise
 * @property {Function} [transform] - Función para transformar los datos
 * @property {*} [initialData] - Datos iniciales (default: [])
 */

/**
 * @typedef {Object.<string, ApiConfig>} ApisConfig
 */

/**
 * @typedef {Object} UseMultipleApiDataOptions
 * @property {Array} [deps] - Dependencias adicionales que disparan re-fetch
 * @property {boolean} [enabled] - Si false, no hace fetch automático (default: true)
 * @property {boolean} [fetchOnMount] - Si true, hace fetch al montar (default: true)
 * @property {Function} [onSuccess] - Callback cuando todos los fetches son exitosos
 * @property {Function} [onError] - Callback cuando hay error
 */

/**
 * @typedef {Object} UseMultipleApiDataResult
 * @property {Object} data - Objeto con los datos de cada API { [key]: data }
 * @property {boolean} loading - Estado de carga inicial
 * @property {boolean} fetching - Estado de cualquier carga
 * @property {string|null} error - Mensaje de error o null
 * @property {Function} reload - Función para recargar todos los datos
 * @property {Function} reloadOne - Función para recargar una sola API por key
 * @property {Function} setData - Setter para actualizar datos de una key
 * @property {Function} reset - Resetea al estado inicial
 */

/**
 * Hook para fetching paralelo de múltiples APIs
 * @param {ApisConfig} apisConfig - Configuración de APIs { key: { api, transform?, initialData? } }
 * @param {UseMultipleApiDataOptions} [options] - Opciones de configuración
 * @returns {UseMultipleApiDataResult}
 */
export function useMultipleApiData(apisConfig, options = {}) {
  const { deps = [], enabled = true, fetchOnMount = true, onSuccess, onError } = options;

  // Construir estado inicial
  const buildInitialData = useCallback(() => {
    const initial = {};
    Object.keys(apisConfig).forEach(key => {
      initial[key] = apisConfig[key].initialData ?? [];
    });
    return initial;
  }, [apisConfig]);

  const [data, setDataState] = useState(buildInitialData);
  const [loading, setLoading] = useState(fetchOnMount && enabled);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const mountedRef = useRef(true);
  const apisConfigRef = useRef(apisConfig);

  // Actualizar ref cuando cambia config
  useEffect(() => {
    apisConfigRef.current = apisConfig;
  }, [apisConfig]);

  // Fetch de todos los datos en paralelo
  const fetchAll = useCallback(
    async (isInitial = false) => {
      if (!enabled) return;

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

        if (!mountedRef.current) return;

        // Transformar y construir objeto de datos
        const newData = {};
        keys.forEach((key, index) => {
          const result = results[index];
          const transform = config[key].transform;
          const initialData = config[key].initialData ?? [];
          newData[key] = transform ? transform(result) : result || initialData;
        });

        setDataState(newData);

        if (onSuccess) {
          onSuccess(newData);
        }

        return newData;
      } catch (err) {
        if (!mountedRef.current) return;

        const errorMessage = err.message || 'Error al cargar los datos';
        setError(errorMessage);
        console.error('useMultipleApiData error:', err);

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
    [enabled, onSuccess, onError]
  );

  // Reload todos
  const reload = useCallback(() => {
    return fetchAll(false);
  }, [fetchAll]);

  // Reload solo una key
  const reloadOne = useCallback(async key => {
    const config = apisConfigRef.current;
    if (!config[key]) {
      console.warn(`useMultipleApiData: key "${key}" not found`);
      return;
    }

    setFetching(true);
    setError(null);

    try {
      const result = await config[key].api();

      if (!mountedRef.current) return;

      const transform = config[key].transform;
      const initialData = config[key].initialData ?? [];
      const transformedData = transform ? transform(result) : result || initialData;

      setDataState(prev => ({
        ...prev,
        [key]: transformedData,
      }));

      return transformedData;
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage = err.message || `Error al cargar ${key}`;
      setError(errorMessage);
      console.error(`useMultipleApiData error (${key}):`, err);

      throw err;
    } finally {
      if (mountedRef.current) {
        setFetching(false);
      }
    }
  }, []);

  // Setter para una key específica
  const setData = useCallback((key, newData) => {
    setDataState(prev => ({
      ...prev,
      [key]: typeof newData === 'function' ? newData(prev[key]) : newData,
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
