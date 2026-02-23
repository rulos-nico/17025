/**
 * useTiposEnsayoData - Hook para cargar tipos de ensayo desde la API
 *
 * Carga la lista de tipos de ensayo disponibles desde el backend.
 * Si la API falla o no está disponible, retorna una lista vacía.
 */

import { useState, useEffect } from 'react';
import { TiposEnsayoAPI } from '../services/apiService';
import type { TipoEnsayo } from '../config';

// ============================================
// INTERFACES
// ============================================

export interface UseTiposEnsayoDataResult {
  /** Lista de tipos de ensayo */
  tiposEnsayo: TipoEnsayo[];
  /** Estado de carga */
  loading: boolean;
  /** Mensaje de error si falló la carga */
  error: string | null;
  /** Función para recargar los datos */
  refetch: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook principal para cargar tipos de ensayo
 *
 * @example
 * ```tsx
 * const { tiposEnsayo, loading, error } = useTiposEnsayoData();
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 *
 * return (
 *   <select>
 *     {tiposEnsayo.map(tipo => (
 *       <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export function useTiposEnsayoData(): UseTiposEnsayoDataResult {
  const [tiposEnsayo, setTiposEnsayo] = useState<TipoEnsayo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTiposEnsayo = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await TiposEnsayoAPI.list();
      setTiposEnsayo(data || []);
    } catch (err) {
      console.error('Error cargando tipos de ensayo:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // En caso de error, retornar lista vacía (según requerimiento)
      setTiposEnsayo([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiposEnsayo();
  }, []);

  return {
    tiposEnsayo,
    loading,
    error,
    refetch: fetchTiposEnsayo,
  };
}

export default useTiposEnsayoData;
