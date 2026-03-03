/**
 * useTiposEnsayoData - Context y Provider para tipos de ensayo desde la API
 *
 * Carga la lista de tipos de ensayo disponibles desde el backend
 * y los expone globalmente via Context para toda la app.
 * Incluye helpers de lookup para resolver IDs a nombres.
 */

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
  createElement,
} from 'react';
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
  /** Busca un tipo de ensayo por ID, con fallback */
  findTipoEnsayo: (tipoId: string) => TipoEnsayo;
  /** Obtiene solo el nombre de un tipo de ensayo */
  getTipoEnsayoNombre: (tipoId: string) => string;
}

// ============================================
// FALLBACK
// ============================================

const buildFallback = (tipoId: string): TipoEnsayo => ({
  id: tipoId || 'unknown',
  nombre: tipoId || 'Desconocido',
  categoria: 'otro',
  norma: '',
});

// ============================================
// CONTEXT
// ============================================

const TiposEnsayoContext = createContext<UseTiposEnsayoDataResult | null>(null);

// ============================================
// PROVIDER
// ============================================

interface TiposEnsayoProviderProps {
  children: ReactNode;
}

/**
 * Provider de tipos de ensayo
 * Envuelve la aplicación para cargar los tipos una sola vez desde la BD
 */
export const TiposEnsayoProvider = ({ children }: TiposEnsayoProviderProps) => {
  const value = useTiposEnsayoDataInternal();
  return createElement(TiposEnsayoContext.Provider, { value }, children);
};

// ============================================
// HOOK INTERNO (lógica de fetch)
// ============================================

function useTiposEnsayoDataInternal(): UseTiposEnsayoDataResult {
  const [tiposEnsayo, setTiposEnsayo] = useState<TipoEnsayo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTiposEnsayo = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await TiposEnsayoAPI.list();
      setTiposEnsayo(data || []);
    } catch (err) {
      console.error('Error cargando tipos de ensayo:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setTiposEnsayo([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiposEnsayo();
  }, [fetchTiposEnsayo]);

  const findTipoEnsayo = useCallback(
    (tipoId: string): TipoEnsayo => {
      return tiposEnsayo.find(t => t.id === tipoId) || buildFallback(tipoId);
    },
    [tiposEnsayo]
  );

  const getTipoEnsayoNombre = useCallback(
    (tipoId: string): string => {
      return findTipoEnsayo(tipoId).nombre;
    },
    [findTipoEnsayo]
  );

  return {
    tiposEnsayo,
    loading,
    error,
    refetch: fetchTiposEnsayo,
    findTipoEnsayo,
    getTipoEnsayoNombre,
  };
}

// ============================================
// HOOK PÚBLICO
// ============================================

/**
 * Hook para consumir tipos de ensayo desde el contexto global.
 * Debe usarse dentro de TiposEnsayoProvider.
 *
 * @example
 * ```tsx
 * const { tiposEnsayo, findTipoEnsayo, getTipoEnsayoNombre } = useTiposEnsayoData();
 *
 * // Obtener nombre de un tipo
 * const nombre = getTipoEnsayoNombre(ensayo.tipo);
 *
 * // Obtener objeto completo
 * const tipo = findTipoEnsayo(ensayo.tipo);
 *
 * // Listar todos los tipos
 * tiposEnsayo.map(t => <option key={t.id}>{t.nombre}</option>)
 * ```
 */
export function useTiposEnsayoData(): UseTiposEnsayoDataResult {
  const context = useContext(TiposEnsayoContext);

  if (!context) {
    throw new Error('useTiposEnsayoData debe usarse dentro de TiposEnsayoProvider');
  }

  return context;
}

export default useTiposEnsayoData;
