/**
 * useComprobacionesData - Hook para carga y CRUD de comprobaciones de sensores
 *
 * Carga en paralelo:
 *  - lista de comprobaciones (todas)
 *  - lista de sensores (para selección y mostrar código/tipo)
 */

import { useCallback, useMemo, useState } from 'react';
import { useMultipleApiData, useMutation } from './index';
import { ComprobacionesAPI, SensoresAPI } from '../services/apiService';

// ============================================
// INTERFACES
// ============================================

export interface ComprobacionDataShape {
  replicas?: number[];
  ambiente?: Record<string, number | string>;
  [key: string]: unknown;
}

export interface ComprobacionRaw {
  id: string;
  sensor_id: string;
  fecha: string;
  data?: ComprobacionDataShape | unknown;
  resultado: string;
  responsable: string;
  observaciones?: string;
  valor_patron?: number | null;
  unidad?: string | null;
  n_replicas?: number | null;
  media?: number | null;
  desviacion_std?: number | null;
  error?: number | null;
  incertidumbre?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Comprobacion {
  id: string;
  sensorId: string;
  fecha: string;
  data?: ComprobacionDataShape | unknown;
  resultado: string;
  responsable: string;
  observaciones?: string;
  valorPatron?: number;
  unidad?: string;
  nReplicas?: number;
  media?: number;
  desviacionStd?: number;
  error?: number;
  incertidumbre?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SensorLite {
  id: string;
  codigo?: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  ubicacion?: string;
  estado?: string;
  equipo_id?: string;
  [key: string]: unknown;
}

interface ComprobacionesDataState {
  comprobacionesRaw: Comprobacion[];
  sensores: SensorLite[];
  [key: string]: unknown;
}

interface MutationParams {
  action: 'create' | 'update' | 'delete';
  id?: string;
  data?: Record<string, unknown>;
}

export interface UseComprobacionesDataResult {
  comprobaciones: Comprobacion[];
  sensores: SensorLite[];
  loading: boolean;
  fetching: boolean;
  saving: boolean;
  error: string | null;
  reload: () => Promise<ComprobacionesDataState | undefined>;
  createComprobacion: (data: Record<string, unknown>) => Promise<unknown>;
  updateComprobacion: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  deleteComprobacion: (id: string) => Promise<unknown>;
  clearError: () => void;
}

// ============================================
// HELPERS
// ============================================

const toNum = (v: number | null | undefined): number | undefined =>
  v === null || v === undefined ? undefined : v;

const mapComprobaciones = (raw: ComprobacionRaw[] = []): Comprobacion[] =>
  raw.map(c => ({
    id: String(c.id),
    sensorId: String(c.sensor_id),
    fecha: c.fecha,
    data: c.data,
    resultado: c.resultado,
    responsable: c.responsable,
    observaciones: c.observaciones,
    valorPatron: toNum(c.valor_patron),
    unidad: c.unidad ?? undefined,
    nReplicas: toNum(c.n_replicas),
    media: toNum(c.media),
    desviacionStd: toNum(c.desviacion_std),
    error: toNum(c.error),
    incertidumbre: toNum(c.incertidumbre),
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

// ============================================
// HOOK
// ============================================

export function useComprobacionesData(): UseComprobacionesDataResult {
  const [error, setError] = useState<string | null>(null);

  const { data, loading, fetching, reload } = useMultipleApiData<ComprobacionesDataState>(
    {
      comprobacionesRaw: {
        api: ComprobacionesAPI.list as () => Promise<unknown>,
        transform: (raw: unknown) => mapComprobaciones(raw as ComprobacionRaw[]),
      },
      sensores: { api: SensoresAPI.list as () => Promise<unknown> },
    },
    { fetchOnMount: true }
  );

  const comprobaciones = useMemo(
    () => (data.comprobacionesRaw || []) as Comprobacion[],
    [data.comprobacionesRaw]
  );
  const sensores = useMemo(() => (data.sensores || []) as SensorLite[], [data.sensores]);

  const mutation = useMutation<unknown, [MutationParams]>(
    async (params: MutationParams) => {
      if (params.action === 'create') return ComprobacionesAPI.create(params.data!);
      if (params.action === 'update') return ComprobacionesAPI.update(params.id!, params.data!);
      if (params.action === 'delete') return ComprobacionesAPI.delete(params.id!);
      return undefined;
    },
    {
      onSuccess: () => reload(),
      onError: (err: Error) => setError(err.message || 'Error en operación de comprobación'),
    }
  );

  const createComprobacion = useCallback(
    async (formData: Record<string, unknown>) => {
      setError(null);
      return mutation.mutateAsync({ action: 'create', data: formData });
    },
    [mutation]
  );

  const updateComprobacion = useCallback(
    async (id: string, formData: Record<string, unknown>) => {
      setError(null);
      return mutation.mutateAsync({ action: 'update', id, data: formData });
    },
    [mutation]
  );

  const deleteComprobacion = useCallback(
    async (id: string) => {
      setError(null);
      return mutation.mutateAsync({ action: 'delete', id });
    },
    [mutation]
  );

  return {
    comprobaciones,
    sensores,
    loading,
    fetching,
    saving: mutation.loading,
    error,
    reload,
    createComprobacion,
    updateComprobacion,
    deleteComprobacion,
    clearError: () => setError(null),
  };
}

export default useComprobacionesData;
