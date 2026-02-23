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

// ============================================
// INTERFACES
// ============================================

export interface Tecnico {
  id: string | number;
  nombre: string;
  apellido: string;
  email: string;
  cargo: string;
  [key: string]: unknown;
}

export interface Cliente {
  id: string | number;
  nombre: string;
  email?: string;
  telefono?: string;
  rut?: string;
  [key: string]: unknown;
}

export interface Proyecto {
  id: string | number;
  codigo: string;
  nombre: string;
  clienteId: string | number;
  cliente_id?: string | number;
  estado: string;
  fechaInicio?: string;
  fechaFinEstimada?: string;
  ensayosCotizados?: Record<string, number>;
  [key: string]: unknown;
}

export interface Perforacion {
  id: string | number;
  codigo: string;
  nombre: string;
  proyectoId: string | number;
  proyecto_id?: string | number;
  profundidadInicio?: number;
  profundidadFin?: number;
  estado: string;
  [key: string]: unknown;
}

export interface Muestra {
  id: string | number;
  codigo: string;
  perforacionId: string | number;
  perforacion_id?: string | number;
  tipoMuestra: string;
  tipo_muestra?: string;
  profundidadInicio?: number;
  profundidadFin?: number;
  [key: string]: unknown;
}

export interface Ensayo {
  id: string | number;
  codigo?: string;
  tipo: string;
  norma?: string;
  muestraId: string | number;
  muestra_id?: string | number;
  perforacionId: string | number;
  perforacion_id?: string | number;
  proyectoId: string | number;
  proyecto_id?: string | number;
  tecnicoId?: string | number;
  tecnico_id?: string | number;
  workflowState: string;
  workflow_state: string;
  novedadRazon?: string | null;
  novedad_razon?: string | null;
  ultimoComentario?: string;
  ultimo_comentario?: string;
  fechaCreacion?: string;
  fechaSolicitud?: string;
  clienteId?: string | number;
  cliente_id?: string | number;
  [key: string]: unknown;
}

interface PersonalInterno {
  id: string | number;
  nombre: string;
  apellido: string;
  email: string;
  cargo: string;
  [key: string]: unknown;
}

interface EnsayosDataState {
  ensayos: Ensayo[];
  tecnicos: Tecnico[];
  clientes: Cliente[];
  proyectos: Proyecto[];
  perforaciones: Perforacion[];
  muestras: Muestra[];
  [key: string]: unknown;
}

export interface UseEnsayosDataResult {
  // Datos
  ensayos: Ensayo[];
  tecnicos: Tecnico[];
  clientes: Cliente[];
  proyectos: Proyecto[];
  perforaciones: Perforacion[];
  muestras: Muestra[];

  // Estados
  loading: boolean;
  fetching: boolean;
  error: string | null;

  // Métodos
  reload: () => Promise<EnsayosDataState | undefined>;
  updateEnsayoState: (
    ensayoId: string | number,
    nuevoEstado: string,
    comentario?: string
  ) => Promise<void>;
  updateEnsayoNovedad: (ensayoId: string | number, razon: string) => Promise<void>;
  updateEnsayoTecnico: (ensayoId: string | number, tecnicoId: string | number) => Promise<void>;
}

// ============================================
// HELPERS
// ============================================

/**
 * Transforma personal interno a formato de técnicos
 */
const mapTecnicos = (personal: PersonalInterno[] = []): Tecnico[] =>
  personal.map(p => ({
    id: p.id,
    nombre: p.nombre,
    apellido: p.apellido,
    email: p.email,
    cargo: p.cargo,
  }));

// ============================================
// HOOK
// ============================================

/**
 * Hook para gestión completa de datos de ensayos
 */
export function useEnsayosData(): UseEnsayosDataResult {
  const { data, loading, fetching, error, reload, setData } = useMultipleApiData<EnsayosDataState>({
    ensayos: {
      api: EnsayosAPI.list as () => Promise<unknown>,
      transform: (data: unknown) => mapEnsayos(data as Ensayo[]),
    },
    tecnicos: {
      api: PersonalInternoAPI.list as () => Promise<unknown>,
      transform: (data: unknown) => mapTecnicos(data as PersonalInterno[]),
    },
    clientes: { api: ClientesAPI.list as () => Promise<unknown> },
    proyectos: {
      api: ProyectosAPI.list as () => Promise<unknown>,
      transform: (data: unknown) => mapProyectos(data as Proyecto[]),
    },
    perforaciones: {
      api: PerforacionesAPI.list as () => Promise<unknown>,
      transform: (data: unknown) => mapPerforaciones(data as Perforacion[]),
    },
    muestras: {
      api: MuestrasAPI.list as () => Promise<unknown>,
      transform: (data: unknown) => mapMuestras(data as Muestra[]),
    },
  });

  /**
   * Actualiza el estado de workflow de un ensayo
   * Realiza actualización optimista en el estado local
   */
  const updateEnsayoState = useCallback(
    async (ensayoId: string | number, nuevoEstado: string, comentario = ''): Promise<void> => {
      try {
        await EnsayosAPI.updateStatus(ensayoId, nuevoEstado);

        // Actualización optimista del estado local
        setData('ensayos', (prevEnsayos: Ensayo[]) =>
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
   */
  const updateEnsayoNovedad = useCallback(
    async (ensayoId: string | number, razon: string): Promise<void> => {
      try {
        await EnsayosAPI.update(ensayoId, {
          workflow_state: 'E5',
          novedad_razon: razon,
        });

        // Actualización optimista
        setData('ensayos', (prevEnsayos: Ensayo[]) =>
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
   */
  const updateEnsayoTecnico = useCallback(
    async (ensayoId: string | number, tecnicoId: string | number): Promise<void> => {
      try {
        await EnsayosAPI.update(ensayoId, { tecnico_id: tecnicoId });

        // Actualización optimista
        setData('ensayos', (prevEnsayos: Ensayo[]) =>
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
    ensayos: data.ensayos ?? [],
    tecnicos: data.tecnicos ?? [],
    clientes: data.clientes ?? [],
    proyectos: data.proyectos ?? [],
    perforaciones: data.perforaciones ?? [],
    muestras: data.muestras ?? [],

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
