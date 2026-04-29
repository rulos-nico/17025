/**
 * useCalibracionesData - Hook para carga y CRUD de calibraciones de sensores
 */

import { useCallback, useMemo, useState } from 'react';
import { useMultipleApiData, useMutation } from './index';
import { CalibracionesAPI, SensoresAPI } from '../services/apiService';
import type { SensorLite } from './useComprobacionesData';

// ============================================
// INTERFACES
// ============================================

export interface CalibracionRaw {
  id: string;
  sensor_id: string;
  fecha_calibracion: string;
  proxima_calibracion: string;
  rango_medicion?: string;
  precision?: string;
  error_maximo?: string;
  certificado_id?: string;
  estado: string;
  factor: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface Calibracion {
  id: string;
  sensorId: string;
  fechaCalibracion: string;
  proximaCalibracion: string;
  rangoMedicion?: string;
  precision?: string;
  errorMaximo?: string;
  certificadoId?: string;
  estado: string;
  factor: number | string;
  createdAt?: string;
  updatedAt?: string;
}

interface CalibracionesDataState {
  calibracionesRaw: Calibracion[];
  sensores: SensorLite[];
  [key: string]: unknown;
}

interface MutationParams {
  action: 'create' | 'update' | 'delete';
  id?: string;
  data?: Record<string, unknown>;
}

export interface UseCalibracionesDataResult {
  calibraciones: Calibracion[];
  sensores: SensorLite[];
  loading: boolean;
  fetching: boolean;
  saving: boolean;
  error: string | null;
  reload: () => Promise<CalibracionesDataState | undefined>;
  createCalibracion: (data: Record<string, unknown>) => Promise<unknown>;
  updateCalibracion: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  deleteCalibracion: (id: string) => Promise<unknown>;
  clearError: () => void;
}

const mapCalibraciones = (raw: CalibracionRaw[] = []): Calibracion[] =>
  raw.map(c => ({
    id: String(c.id),
    sensorId: String(c.sensor_id),
    fechaCalibracion: c.fecha_calibracion,
    proximaCalibracion: c.proxima_calibracion,
    rangoMedicion: c.rango_medicion,
    precision: c.precision,
    errorMaximo: c.error_maximo,
    certificadoId: c.certificado_id,
    estado: c.estado,
    factor: c.factor,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

export function useCalibracionesData(): UseCalibracionesDataResult {
  const [error, setError] = useState<string | null>(null);

  const { data, loading, fetching, reload } = useMultipleApiData<CalibracionesDataState>(
    {
      calibracionesRaw: {
        api: CalibracionesAPI.list as () => Promise<unknown>,
        transform: (raw: unknown) => mapCalibraciones(raw as CalibracionRaw[]),
      },
      sensores: { api: SensoresAPI.list as () => Promise<unknown> },
    },
    { fetchOnMount: true }
  );

  const calibraciones = useMemo(
    () => (data.calibracionesRaw || []) as Calibracion[],
    [data.calibracionesRaw]
  );
  const sensores = useMemo(() => (data.sensores || []) as SensorLite[], [data.sensores]);

  const mutation = useMutation<unknown, [MutationParams]>(
    async (params: MutationParams) => {
      if (params.action === 'create') return CalibracionesAPI.create(params.data!);
      if (params.action === 'update') return CalibracionesAPI.update(params.id!, params.data!);
      if (params.action === 'delete') return CalibracionesAPI.delete(params.id!);
      return undefined;
    },
    {
      onSuccess: () => reload(),
      onError: (err: Error) => setError(err.message || 'Error en operación de calibración'),
    }
  );

  const createCalibracion = useCallback(
    async (formData: Record<string, unknown>) => {
      setError(null);
      return mutation.mutateAsync({ action: 'create', data: formData });
    },
    [mutation]
  );
  const updateCalibracion = useCallback(
    async (id: string, formData: Record<string, unknown>) => {
      setError(null);
      return mutation.mutateAsync({ action: 'update', id, data: formData });
    },
    [mutation]
  );
  const deleteCalibracion = useCallback(
    async (id: string) => {
      setError(null);
      return mutation.mutateAsync({ action: 'delete', id });
    },
    [mutation]
  );

  return {
    calibraciones,
    sensores,
    loading,
    fetching,
    saving: mutation.loading,
    error,
    reload,
    createCalibracion,
    updateCalibracion,
    deleteCalibracion,
    clearError: () => setError(null),
  };
}

export default useCalibracionesData;
