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

/**
 * Transforma comprobaciones raw a formato normalizado
 */
const mapComprobaciones = (raw = []) =>
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
const mapCalibraciones = (raw = []) =>
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

/**
 * Hook para gestion completa de datos de equipos
 * @returns {Object} - Datos, estados y metodos de actualizacion
 */
export function useEquiposData() {
  const [error, setError] = useState(null);

  const { data, loading, fetching, reload } = useMultipleApiData(
    {
      equiposRaw: { api: EquiposAPI.list },
      sensoresRaw: { api: SensoresAPI.list },
      comprobacionesRaw: { api: ComprobacionesAPI.list, transform: mapComprobaciones },
      calibracionesRaw: { api: CalibracionesAPI.list, transform: mapCalibraciones },
    },
    { fetchOnMount: true }
  );

  // Combinar equipos y sensores con tipo
  const equipos = useMemo(() => {
    return [
      ...(data.equiposRaw || []).map(e => ({
        ...e,
        tipo: 'equipo',
        // Mapear snake_case a camelCase
        sensoresAsociados: e.sensores_asociados || [],
      })),
      ...(data.sensoresRaw || []).map(s => ({ ...s, tipo: 'sensor' })),
    ];
  }, [data.equiposRaw, data.sensoresRaw]);

  const comprobaciones = data.comprobacionesRaw || [];
  const calibraciones = data.calibracionesRaw || [];

  // Mutations para operaciones CRUD de equipos
  const equipoMutation = useMutation(
    async ({ action, id, data: formData }) => {
      if (action === 'create') return EquiposAPI.create(formData);
      if (action === 'update') return EquiposAPI.update(id, formData);
      if (action === 'delete') return EquiposAPI.delete(id);
    },
    {
      onSuccess: () => reload(),
      onError: err => setError(err.message || 'Error en operacion de equipo'),
    }
  );

  // Mutations para operaciones CRUD de sensores
  const sensorMutation = useMutation(
    async ({ action, id, data: formData }) => {
      if (action === 'create') return SensoresAPI.create(formData);
      if (action === 'update') return SensoresAPI.update(id, formData);
      if (action === 'delete') return SensoresAPI.delete(id);
    },
    {
      onSuccess: () => reload(),
      onError: err => setError(err.message || 'Error en operacion de sensor'),
    }
  );

  const saving = equipoMutation.loading || sensorMutation.loading;

  // Crear equipo
  const createEquipo = useCallback(
    async formData => {
      setError(null);
      return equipoMutation.mutateAsync({ action: 'create', data: formData });
    },
    [equipoMutation]
  );

  // Actualizar equipo
  const updateEquipo = useCallback(
    async (id, formData) => {
      setError(null);
      return equipoMutation.mutateAsync({ action: 'update', id, data: formData });
    },
    [equipoMutation]
  );

  // Eliminar equipo
  const deleteEquipo = useCallback(
    async id => {
      setError(null);
      return equipoMutation.mutateAsync({ action: 'delete', id });
    },
    [equipoMutation]
  );

  // Crear sensor
  const createSensor = useCallback(
    async formData => {
      setError(null);
      return sensorMutation.mutateAsync({ action: 'create', data: formData });
    },
    [sensorMutation]
  );

  // Actualizar sensor
  const updateSensor = useCallback(
    async (id, formData) => {
      setError(null);
      return sensorMutation.mutateAsync({ action: 'update', id, data: formData });
    },
    [sensorMutation]
  );

  // Eliminar sensor
  const deleteSensor = useCallback(
    async id => {
      setError(null);
      return sensorMutation.mutateAsync({ action: 'delete', id });
    },
    [sensorMutation]
  );

  // Guardar item (equipo o sensor)
  const saveItem = useCallback(
    async (item, formData) => {
      if (item?.tipo === 'sensor') {
        return item.id ? updateSensor(item.id, formData) : createSensor(formData);
      }
      return item?.id ? updateEquipo(item.id, formData) : createEquipo(formData);
    },
    [createEquipo, updateEquipo, createSensor, updateSensor]
  );

  // Eliminar item (equipo o sensor)
  const deleteItem = useCallback(
    async item => {
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
