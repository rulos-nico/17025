/**
 * useProyectos - Hook para gestión de proyectos
 *
 * Este hook encapsula toda la lógica de interacción con proyectos
 * usando los casos de uso de la capa de aplicación.
 *
 * Características:
 * - Estado de carga y errores
 * - Cache local de datos
 * - Operaciones CRUD completas
 * - Filtrado y búsqueda
 */

import { useState, useCallback, useEffect } from 'react';
import { proyectoUseCases } from '@infrastructure/container';
import type {
  ProyectoResponseDTO,
  CrearProyectoDTO,
  ActualizarProyectoDTO,
  FiltrarProyectosDTO,
} from '@application/dtos';
import { EstadoProyecto } from '@domain/value-objects';

/**
 * Estado del hook
 */
interface UseProyectosState {
  proyectos: ProyectoResponseDTO[];
  proyectoSeleccionado: ProyectoResponseDTO | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  paginacion: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

/**
 * Resultado del hook
 */
interface UseProyectosResult extends UseProyectosState {
  // Consultas
  cargarProyectos: () => Promise<void>;
  cargarProyectosPaginados: (page: number, limit?: number) => Promise<void>;
  cargarProyecto: (id: string) => Promise<void>;
  filtrarProyectos: (filtros: FiltrarProyectosDTO) => Promise<void>;

  // Mutaciones
  crearProyecto: (datos: CrearProyectoDTO) => Promise<ProyectoResponseDTO>;
  actualizarProyecto: (id: string, datos: ActualizarProyectoDTO) => Promise<ProyectoResponseDTO>;
  cambiarEstado: (id: string, nuevoEstado: EstadoProyecto) => Promise<ProyectoResponseDTO>;
  eliminarProyecto: (id: string) => Promise<void>;

  // Utilidades
  limpiarError: () => void;
  limpiarSeleccion: () => void;
  refrescar: () => Promise<void>;
}

/**
 * Hook principal para gestión de proyectos
 */
export function useProyectos(cargarAlMontar: boolean = false): UseProyectosResult {
  const [state, setState] = useState<UseProyectosState>({
    proyectos: [],
    proyectoSeleccionado: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
    paginacion: null,
  });

  // Helper para actualizar estado
  const updateState = useCallback((updates: Partial<UseProyectosState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper para manejar errores
  const handleError = useCallback(
    (error: unknown, mensaje: string) => {
      const errorMessage = error instanceof Error ? error.message : mensaje;
      updateState({ error: errorMessage, isLoading: false, isSubmitting: false });
      console.error(`[useProyectos] ${mensaje}:`, error);
    },
    [updateState]
  );

  // ============================================
  // CONSULTAS
  // ============================================

  const cargarProyectos = useCallback(async () => {
    updateState({ isLoading: true, error: null });
    try {
      const proyectos = await proyectoUseCases.obtenerProyectos.execute();
      updateState({ proyectos, isLoading: false, paginacion: null });
    } catch (error) {
      handleError(error, 'Error al cargar proyectos');
    }
  }, [updateState, handleError]);

  const cargarProyectosPaginados = useCallback(
    async (page: number, limit: number = 10) => {
      // TODO: Implementar paginación en el backend
      // Por ahora, hacemos paginación en el cliente
      updateState({ isLoading: true, error: null });
      try {
        const todosProyectos = await proyectoUseCases.obtenerProyectos.execute();
        const total = todosProyectos.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const proyectosPaginados = todosProyectos.slice(startIndex, startIndex + limit);

        updateState({
          proyectos: proyectosPaginados,
          isLoading: false,
          paginacion: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      } catch (error) {
        handleError(error, 'Error al cargar proyectos paginados');
      }
    },
    [updateState, handleError]
  );

  const cargarProyecto = useCallback(
    async (id: string) => {
      updateState({ isLoading: true, error: null });
      try {
        const proyecto = await proyectoUseCases.obtenerProyectoPorId.execute(id);
        updateState({ proyectoSeleccionado: proyecto, isLoading: false });
      } catch (error) {
        handleError(error, 'Error al cargar proyecto');
      }
    },
    [updateState, handleError]
  );

  const filtrarProyectos = useCallback(
    async (filtros: FiltrarProyectosDTO) => {
      updateState({ isLoading: true, error: null });
      try {
        const proyectos = await proyectoUseCases.obtenerProyectos.executeWithFilters(filtros);
        updateState({ proyectos, isLoading: false, paginacion: null });
      } catch (error) {
        handleError(error, 'Error al filtrar proyectos');
      }
    },
    [updateState, handleError]
  );

  // ============================================
  // MUTACIONES
  // ============================================

  const crearProyecto = useCallback(
    async (datos: CrearProyectoDTO): Promise<ProyectoResponseDTO> => {
      updateState({ isSubmitting: true, error: null });
      try {
        const nuevoProyecto = await proyectoUseCases.crearProyecto.execute(datos);
        setState(prev => ({
          ...prev,
          proyectos: [nuevoProyecto, ...prev.proyectos],
          isSubmitting: false,
        }));
        return nuevoProyecto;
      } catch (error) {
        handleError(error, 'Error al crear proyecto');
        throw error;
      }
    },
    [updateState, handleError]
  );

  const actualizarProyecto = useCallback(
    async (id: string, datos: ActualizarProyectoDTO): Promise<ProyectoResponseDTO> => {
      updateState({ isSubmitting: true, error: null });
      try {
        const proyectoActualizado = await proyectoUseCases.actualizarProyecto.execute(id, datos);
        setState(prev => ({
          ...prev,
          proyectos: prev.proyectos.map(p => (p.id === id ? proyectoActualizado : p)),
          proyectoSeleccionado:
            prev.proyectoSeleccionado?.id === id ? proyectoActualizado : prev.proyectoSeleccionado,
          isSubmitting: false,
        }));
        return proyectoActualizado;
      } catch (error) {
        handleError(error, 'Error al actualizar proyecto');
        throw error;
      }
    },
    [updateState, handleError]
  );

  const cambiarEstado = useCallback(
    async (id: string, nuevoEstado: EstadoProyecto): Promise<ProyectoResponseDTO> => {
      updateState({ isSubmitting: true, error: null });
      try {
        const proyectoActualizado = await proyectoUseCases.cambiarEstadoProyecto.execute(
          id,
          nuevoEstado
        );
        setState(prev => ({
          ...prev,
          proyectos: prev.proyectos.map(p => (p.id === id ? proyectoActualizado : p)),
          proyectoSeleccionado:
            prev.proyectoSeleccionado?.id === id ? proyectoActualizado : prev.proyectoSeleccionado,
          isSubmitting: false,
        }));
        return proyectoActualizado;
      } catch (error) {
        handleError(error, 'Error al cambiar estado del proyecto');
        throw error;
      }
    },
    [updateState, handleError]
  );

  const eliminarProyecto = useCallback(
    async (id: string): Promise<void> => {
      updateState({ isSubmitting: true, error: null });
      try {
        await proyectoUseCases.eliminarProyecto.execute(id);
        setState(prev => ({
          ...prev,
          proyectos: prev.proyectos.filter(p => p.id !== id),
          proyectoSeleccionado:
            prev.proyectoSeleccionado?.id === id ? null : prev.proyectoSeleccionado,
          isSubmitting: false,
        }));
      } catch (error) {
        handleError(error, 'Error al eliminar proyecto');
        throw error;
      }
    },
    [updateState, handleError]
  );

  // ============================================
  // UTILIDADES
  // ============================================

  const limpiarError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const limpiarSeleccion = useCallback(() => {
    updateState({ proyectoSeleccionado: null });
  }, [updateState]);

  const refrescar = useCallback(async () => {
    if (state.paginacion) {
      await cargarProyectosPaginados(state.paginacion.page, state.paginacion.limit);
    } else {
      await cargarProyectos();
    }
  }, [state.paginacion, cargarProyectos, cargarProyectosPaginados]);

  // Cargar al montar si se solicita
  useEffect(() => {
    if (cargarAlMontar) {
      cargarProyectos();
    }
  }, [cargarAlMontar, cargarProyectos]);

  return {
    // Estado
    ...state,

    // Consultas
    cargarProyectos,
    cargarProyectosPaginados,
    cargarProyecto,
    filtrarProyectos,

    // Mutaciones
    crearProyecto,
    actualizarProyecto,
    cambiarEstado,
    eliminarProyecto,

    // Utilidades
    limpiarError,
    limpiarSeleccion,
    refrescar,
  };
}

export default useProyectos;
