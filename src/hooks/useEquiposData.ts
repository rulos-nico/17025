/**
 * useEquiposData - Hook para carga y gestion de datos de equipos y sensores
 *
 * Centraliza la logica de carga de datos y operaciones CRUD
 * para la vista de equipos, utilizando useMultipleApiData.
 *
 * NOTA: Los sensores se obtienen de dos fuentes:
 * - Como items independientes via SensoresAPI.list (para mostrar en tabla)
 * - Embebidos en equipos via sensores_asociados (para mostrar asociaciones)
 *
 * Se usa SensoresAPI.list para obtener la lista completa de sensores
 * ya que sensores_asociados solo incluye sensores activos asociados a equipos.
 */

import { useMemo, useCallback, useState } from 'react';
import { useMultipleApiData, useMutation } from './index';
import {
  EquiposAPI,
  SensoresAPI,
  ComprobacionesAPI,
  CalibracionesAPI,
} from '../services/apiService';

// ============================================
// INTERFACES
// ============================================

export interface SensorAsociado {
  id: string | number;
  codigo: string;
  nombre: string;
  tipo?: string;
  [key: string]: unknown;
}

interface EquipoRaw {
  id: string | number;
  codigo?: string;
  nombre?: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  estado?: string;
  ubicacion?: string;
  fecha_calibracion?: string;
  proxima_calibracion?: string;
  sensores_asociados?: SensorAsociado[];
  [key: string]: unknown;
}

interface SensorRaw {
  id: string | number;
  codigo?: string;
  nombre?: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  estado?: string;
  [key: string]: unknown;
}

export interface Equipo {
  id: string | number;
  codigo?: string;
  nombre?: string;
  placa?: string;
  tipo: 'equipo' | 'sensor';
  marca?: string;
  modelo?: string;
  serie?: string;
  estado?: string;
  ubicacion?: string;
  fechaCalibracion?: string;
  proximaCalibracion?: string;
  proxima_calibracion?: string;
  sensoresAsociados?: SensorAsociado[];
  [key: string]: unknown;
}

interface ComprobacionRaw {
  id: string | number;
  equipo_id: string | number;
  fecha: string;
  tipo: string;
  resultado: string;
  responsable: string;
  observaciones?: string;
}

export interface Comprobacion {
  id: string | number;
  equipoId: string | number;
  fecha: string;
  tipo: string;
  resultado: string;
  responsable: string;
  observaciones?: string;
}

interface CalibracionRaw {
  id: string | number;
  equipo_id: string | number;
  fecha: string;
  laboratorio: string;
  certificado: string;
  factor?: number;
  incertidumbre?: number;
  proxima_calibracion?: string;
}

export interface Calibracion {
  id: string | number;
  equipoId: string | number;
  fecha: string;
  laboratorio: string;
  certificado: string;
  factor?: number;
  incertidumbre?: number;
  proxima_calibracion?: string;
}

interface EquiposDataState {
  equiposRaw: EquipoRaw[];
  sensoresRaw: SensorRaw[];
  comprobacionesRaw: Comprobacion[];
  calibracionesRaw: Calibracion[];
  [key: string]: unknown;
}

interface MutationParams {
  action: 'create' | 'update' | 'delete';
  id?: string | number;
  data?: Record<string, unknown>;
}

export interface UseEquiposDataResult {
  // Datos
  equipos: Equipo[];
  comprobaciones: Comprobacion[];
  calibraciones: Calibracion[];

  // Estados
  loading: boolean;
  fetching: boolean;
  saving: boolean;
  error: string | null;

  // Métodos
  reload: () => Promise<EquiposDataState | undefined>;
  createEquipo: (formData: Record<string, unknown>) => Promise<unknown>;
  updateEquipo: (id: string | number, formData: Record<string, unknown>) => Promise<unknown>;
  deleteEquipo: (id: string | number) => Promise<unknown>;
  createSensor: (formData: Record<string, unknown>) => Promise<unknown>;
  updateSensor: (id: string | number, formData: Record<string, unknown>) => Promise<unknown>;
  deleteSensor: (id: string | number) => Promise<unknown>;
  saveItem: (item: Equipo | null, formData: Record<string, unknown>) => Promise<unknown>;
  deleteItem: (item: Equipo) => Promise<unknown>;
  clearError: () => void;
}

// ============================================
// HELPERS
// ============================================

/**
 * Transforma comprobaciones raw a formato normalizado
 */
const mapComprobaciones = (raw: ComprobacionRaw[] = []): Comprobacion[] =>
  raw.map(c => ({
    id: c.id,
    equipoId: c.equipo_id,
    fecha: c.fecha,
    tipo: c.tipo,
    resultado: c.resultado,
    responsable: c.responsable,
    observaciones: c.observaciones,
  }));

/**
 * Transforma calibraciones raw a formato normalizado
 */
const mapCalibraciones = (raw: CalibracionRaw[] = []): Calibracion[] =>
  raw.map(c => ({
    id: c.id,
    equipoId: c.equipo_id,
    fecha: c.fecha,
    laboratorio: c.laboratorio,
    certificado: c.certificado,
    factor: c.factor,
    incertidumbre: c.incertidumbre,
    proxima_calibracion: c.proxima_calibracion,
  }));

// ============================================
// HOOK
// ============================================

/**
 * Hook para gestion completa de datos de equipos
 */
export function useEquiposData(): UseEquiposDataResult {
  const [error, setError] = useState<string | null>(null);

  const { data, loading, fetching, reload } = useMultipleApiData<EquiposDataState>(
    {
      equiposRaw: { api: EquiposAPI.list as () => Promise<unknown> },
      sensoresRaw: { api: SensoresAPI.list as () => Promise<unknown> },
      comprobacionesRaw: {
        api: ComprobacionesAPI.list as () => Promise<unknown>,
        transform: (raw: unknown) => mapComprobaciones(raw as ComprobacionRaw[]),
      },
      calibracionesRaw: {
        api: CalibracionesAPI.list as () => Promise<unknown>,
        transform: (raw: unknown) => mapCalibraciones(raw as CalibracionRaw[]),
      },
    },
    { fetchOnMount: true }
  );

  // Combinar equipos y sensores con tipo
  const equipos = useMemo((): Equipo[] => {
    return [
      ...((data.equiposRaw || []) as EquipoRaw[]).map(e => ({
        ...e,
        tipo: 'equipo' as const,
        // Mapear snake_case a camelCase
        sensoresAsociados: e.sensores_asociados || [],
      })),
      ...((data.sensoresRaw || []) as SensorRaw[]).map(s => ({ ...s, tipo: 'sensor' as const })),
    ];
  }, [data.equiposRaw, data.sensoresRaw]);

  const comprobaciones = (data.comprobacionesRaw || []) as Comprobacion[];
  const calibraciones = (data.calibracionesRaw || []) as Calibracion[];

  // Mutations para operaciones CRUD de equipos
  const equipoMutation = useMutation<unknown, [MutationParams]>(
    async (params: MutationParams) => {
      if (params.action === 'create') return EquiposAPI.create(params.data!);
      if (params.action === 'update') return EquiposAPI.update(params.id!, params.data!);
      if (params.action === 'delete') return EquiposAPI.delete(params.id!);
      return undefined;
    },
    {
      onSuccess: () => reload(),
      onError: (err: Error) => setError(err.message || 'Error en operacion de equipo'),
    }
  );

  // Mutations para operaciones CRUD de sensores
  const sensorMutation = useMutation<unknown, [MutationParams]>(
    async (params: MutationParams) => {
      if (params.action === 'create') return SensoresAPI.create(params.data!);
      if (params.action === 'update') return SensoresAPI.update(params.id!, params.data!);
      if (params.action === 'delete') return SensoresAPI.delete(params.id!);
      return undefined;
    },
    {
      onSuccess: () => reload(),
      onError: (err: Error) => setError(err.message || 'Error en operacion de sensor'),
    }
  );

  const saving = equipoMutation.loading || sensorMutation.loading;

  // Crear equipo
  const createEquipo = useCallback(
    async (formData: Record<string, unknown>) => {
      setError(null);
      return equipoMutation.mutateAsync({ action: 'create', data: formData });
    },
    [equipoMutation]
  );

  // Actualizar equipo
  const updateEquipo = useCallback(
    async (id: string | number, formData: Record<string, unknown>) => {
      setError(null);
      return equipoMutation.mutateAsync({ action: 'update', id, data: formData });
    },
    [equipoMutation]
  );

  // Eliminar equipo
  const deleteEquipo = useCallback(
    async (id: string | number) => {
      setError(null);
      return equipoMutation.mutateAsync({ action: 'delete', id });
    },
    [equipoMutation]
  );

  // Crear sensor
  const createSensor = useCallback(
    async (formData: Record<string, unknown>) => {
      setError(null);
      return sensorMutation.mutateAsync({ action: 'create', data: formData });
    },
    [sensorMutation]
  );

  // Actualizar sensor
  const updateSensor = useCallback(
    async (id: string | number, formData: Record<string, unknown>) => {
      setError(null);
      return sensorMutation.mutateAsync({ action: 'update', id, data: formData });
    },
    [sensorMutation]
  );

  // Eliminar sensor
  const deleteSensor = useCallback(
    async (id: string | number) => {
      setError(null);
      return sensorMutation.mutateAsync({ action: 'delete', id });
    },
    [sensorMutation]
  );

  // Guardar item (equipo o sensor)
  const saveItem = useCallback(
    async (item: Equipo | null, formData: Record<string, unknown>) => {
      if (item?.tipo === 'sensor') {
        return item.id ? updateSensor(item.id, formData) : createSensor(formData);
      }
      return item?.id ? updateEquipo(item.id, formData) : createEquipo(formData);
    },
    [createEquipo, updateEquipo, createSensor, updateSensor]
  );

  // Eliminar item (equipo o sensor)
  const deleteItem = useCallback(
    async (item: Equipo) => {
      if (item.tipo === 'sensor') {
        return deleteSensor(item.id);
      }
      return deleteEquipo(item.id);
    },
    [deleteEquipo, deleteSensor]
  );

  return {
    // Datos
    equipos,
    comprobaciones,
    calibraciones,

    // Estados
    loading,
    fetching,
    saving,
    error,

    // Metodos
    reload,
    createEquipo,
    updateEquipo,
    deleteEquipo,
    createSensor,
    updateSensor,
    deleteSensor,
    saveItem,
    deleteItem,
    clearError: () => setError(null),
  };
}

export default useEquiposData;
