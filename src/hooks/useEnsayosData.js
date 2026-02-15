/**
 * useEnsayosData - Hook para carga y gestión de datos de ensayos
 *
 * Centraliza la lógica de carga de datos y operaciones CRUD
 * para la vista de ensayos, utilizando useMultipleApiData.
 *
 * @example
 * const {
 *   ensayos, tecnicos, clientes, proyectos, perforaciones, muestras,
 *   loading, error, reload,
 *   updateEnsayoState, updateEnsayoNovedad, updateEnsayoTecnico
 * } = useEnsayosData();
 */

import { useCallback } from 'react';
import { useMultipleApiData } from './useMultipleApiData';
import {
  EnsayosAPI,
  PersonalInternoAPI,
  ClientesAPI,
  ProyectosAPI,
  PerforacionesAPI,
  MuestrasAPI,
} from '../services/apiService';
import { mapEnsayos, mapProyectos, mapPerforaciones, mapMuestras } from '../utils';

/**
 * Transforma personal interno a formato de técnicos
 * @param {Array} personal - Array de personal interno
 * @returns {Array} - Array de técnicos con formato simplificado
 */
const mapTecnicos = (personal = []) =>
  personal.map(p => ({
    id: p.id,
    nombre: p.nombre,
    apellido: p.apellido,
    email: p.email,
    cargo: p.cargo,
  }));

/**
 * Hook para gestión completa de datos de ensayos
 * @returns {Object} - Datos, estados y métodos de actualización
 */
export function useEnsayosData() {
  const { data, loading, fetching, error, reload, setData } = useMultipleApiData({
    ensayos: { api: EnsayosAPI.list, transform: mapEnsayos },
    tecnicos: { api: PersonalInternoAPI.list, transform: mapTecnicos },
    clientes: { api: ClientesAPI.list },
    proyectos: { api: ProyectosAPI.list, transform: mapProyectos },
    perforaciones: { api: PerforacionesAPI.list, transform: mapPerforaciones },
    muestras: { api: MuestrasAPI.list, transform: mapMuestras },
  });

  /**
   * Actualiza el estado de workflow de un ensayo
   * Realiza actualización optimista en el estado local
   *
   * @param {string} ensayoId - ID del ensayo
   * @param {string} nuevoEstado - Nuevo estado de workflow (E1-E15)
   * @param {string} [comentario] - Comentario opcional del cambio
   * @returns {Promise<void>}
   */
  const updateEnsayoState = useCallback(
    async (ensayoId, nuevoEstado, comentario = '') => {
      try {
        await EnsayosAPI.updateStatus(ensayoId, nuevoEstado);

        // Actualización optimista del estado local
        setData('ensayos', prevEnsayos =>
          prevEnsayos.map(e => {
            if (e.id === ensayoId) {
              return {
                ...e,
                workflowState: nuevoEstado,
                workflow_state: nuevoEstado,
                ultimoComentario: comentario,
                ultimo_comentario: comentario,
                // Limpiar novedad si el nuevo estado no es E5
                novedadRazon: nuevoEstado === 'E5' ? e.novedadRazon : null,
                novedad_razon: nuevoEstado === 'E5' ? e.novedad_razon : null,
              };
            }
            return e;
          })
        );
      } catch (err) {
        console.error('Error actualizando estado del ensayo:', err);
        throw err;
      }
    },
    [setData]
  );

  /**
   * Marca un ensayo como novedad (estado E5)
   *
   * @param {string} ensayoId - ID del ensayo
   * @param {string} razon - Razón de la novedad
   * @returns {Promise<void>}
   */
  const updateEnsayoNovedad = useCallback(
    async (ensayoId, razon) => {
      try {
        await EnsayosAPI.update(ensayoId, {
          workflow_state: 'E5',
          novedad_razon: razon,
        });

        // Actualización optimista
        setData('ensayos', prevEnsayos =>
          prevEnsayos.map(e => {
            if (e.id === ensayoId) {
              return {
                ...e,
                workflowState: 'E5',
                workflow_state: 'E5',
                novedadRazon: razon,
                novedad_razon: razon,
              };
            }
            return e;
          })
        );
      } catch (err) {
        console.error('Error registrando novedad:', err);
        throw err;
      }
    },
    [setData]
  );

  /**
   * Reasigna un técnico a un ensayo
   *
   * @param {string} ensayoId - ID del ensayo
   * @param {string} tecnicoId - ID del nuevo técnico
   * @returns {Promise<void>}
   */
  const updateEnsayoTecnico = useCallback(
    async (ensayoId, tecnicoId) => {
      try {
        await EnsayosAPI.update(ensayoId, { tecnico_id: tecnicoId });

        // Actualización optimista
        setData('ensayos', prevEnsayos =>
          prevEnsayos.map(e => {
            if (e.id === ensayoId) {
              return {
                ...e,
                tecnicoId,
                tecnico_id: tecnicoId,
              };
            }
            return e;
          })
        );
      } catch (err) {
        console.error('Error reasignando ensayo:', err);
        throw err;
      }
    },
    [setData]
  );

  return {
    // Datos
    ensayos: data.ensayos,
    tecnicos: data.tecnicos,
    clientes: data.clientes,
    proyectos: data.proyectos,
    perforaciones: data.perforaciones,
    muestras: data.muestras,

    // Estados
    loading,
    fetching,
    error,

    // Métodos
    reload,
    updateEnsayoState,
    updateEnsayoNovedad,
    updateEnsayoTecnico,
  };
}

export default useEnsayosData;
