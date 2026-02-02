/**
 * Hook para usar Google Sheets DB en componentes React
 * Laboratorio ISO 17025
 * 
 * Usa sheetsDBService.js para operaciones de base de datos
 */

import { useState, useCallback } from 'react';
import { useGoogleAuth } from './useGoogleAuth.jsx';
import SheetsDBService from '../services/sheetsDBService.js';

const {
  Proyectos,
  Perforaciones,
  Ensayos,
  Clientes,
  Usuarios,
  Equipos,
  Dashboard,
} = SheetsDBService;

// ============================================
// HOOK GENÉRICO PARA QUERIES
// ============================================

/**
 * Hook para realizar queries a la base de datos
 * @param {Function} queryFn - Función async que ejecuta la query
 * @param {Object} options - Opciones { autoFetch, dependencies }
 */
export const useQuery = (queryFn, _options = {}) => {
  const { isAuthenticated } = useGoogleAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!isAuthenticated) {
      setError('No autenticado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Error en la consulta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, isAuthenticated]);

  return {
    data,
    isLoading,
    error,
    fetch,
    refetch: fetch,
  };
};

/**
 * Hook para realizar mutaciones (create, update, delete)
 * @param {Function} mutationFn - Función async que ejecuta la mutación
 */
export const useMutation = (mutationFn) => {
  const { isAuthenticated } = useGoogleAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(async (...args) => {
    if (!isAuthenticated) {
      setError('No autenticado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Error en la operación');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, isAuthenticated]);

  return {
    mutate,
    data,
    isLoading,
    error,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
};

// ============================================
// HOOKS ESPECÍFICOS POR ENTIDAD
// ============================================

/**
 * Hook para proyectos
 */
export const useProyectos = () => {
  const query = useQuery(() => Proyectos.findAll());
  
  const createMutation = useMutation((data) => Proyectos.create(data));
  const updateMutation = useMutation((id, data) => Proyectos.update(id, data));
  const deleteMutation = useMutation((id) => Proyectos.delete(id));
  const updateEstadoMutation = useMutation((id, estado) => Proyectos.updateEstado(id, estado));

  return {
    // Query
    proyectos: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    fetch: query.fetch,
    refetch: query.refetch,
    
    // Mutations
    create: createMutation.mutate,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    updateEstado: updateEstadoMutation.mutate,
    
    // Estados de mutations
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
  };
};

/**
 * Hook para perforaciones
 */
export const usePerforaciones = (proyectoId = null) => {
  const queryFn = proyectoId 
    ? () => Perforaciones.findByProyecto(proyectoId)
    : () => Perforaciones.findAll();
  
  const query = useQuery(queryFn);
  const createMutation = useMutation((data) => Perforaciones.create(data));
  const updateMutation = useMutation((id, data) => Perforaciones.update(id, data));

  return {
    perforaciones: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    fetch: query.fetch,
    refetch: query.refetch,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
  };
};

/**
 * Hook para ensayos
 */
export const useEnsayos = (filters = {}) => {
  const queryFn = useCallback(() => {
    if (filters.proyectoId) {
      return Ensayos.findByProyecto(filters.proyectoId);
    }
    if (filters.perforacionId) {
      return Ensayos.findByPerforacion(filters.perforacionId);
    }
    if (filters.clienteId) {
      return Ensayos.findByCliente(filters.clienteId);
    }
    if (filters.estado) {
      return Ensayos.findByEstado(filters.estado);
    }
    if (filters.estados) {
      return Ensayos.findByEstados(filters.estados);
    }
    return Ensayos.findAll();
  }, [filters.proyectoId, filters.perforacionId, filters.clienteId, filters.estado, filters.estados]);

  const query = useQuery(queryFn);
  const createMutation = useMutation((data) => Ensayos.create(data));
  const updateMutation = useMutation((id, data) => Ensayos.update(id, data));
  const workflowMutation = useMutation((id, state, userId, userName, comentario) => 
    Ensayos.updateWorkflowState(id, state, userId, userName, comentario)
  );

  return {
    ensayos: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    fetch: query.fetch,
    refetch: query.refetch,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    updateWorkflowState: workflowMutation.mutate,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
  };
};

/**
 * Hook para clientes
 */
export const useClientes = (soloActivos = false) => {
  const queryFn = soloActivos 
    ? () => Clientes.findActivos()
    : () => Clientes.findAll();
  
  const query = useQuery(queryFn);
  const createMutation = useMutation((data) => Clientes.create(data));
  const updateMutation = useMutation((id, data) => Clientes.update(id, data));

  return {
    clientes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    fetch: query.fetch,
    refetch: query.refetch,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
  };
};

/**
 * Hook para usuarios
 */
export const useUsuarios = (rol = null) => {
  const queryFn = rol 
    ? () => Usuarios.findByRol(rol)
    : () => Usuarios.findAll();
  
  const query = useQuery(queryFn);

  return {
    usuarios: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    fetch: query.fetch,
    refetch: query.refetch,
  };
};

/**
 * Hook para equipos
 */
export const useEquipos = () => {
  const query = useQuery(() => Equipos.findAll());
  const proximosCalibracion = useQuery(() => Equipos.findProximosACalibracion());
  const createMutation = useMutation((data) => Equipos.create(data));
  const updateMutation = useMutation((id, data) => Equipos.update(id, data));

  return {
    equipos: query.data || [],
    equiposProximosCalibracion: proximosCalibracion.data || [],
    isLoading: query.isLoading,
    error: query.error,
    fetch: query.fetch,
    refetch: query.refetch,
    fetchProximosCalibracion: proximosCalibracion.fetch,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
  };
};

/**
 * Hook para el dashboard
 */
export const useDashboard = () => {
  const stats = useQuery(() => Dashboard.getStats());
  const pendientes = useQuery(() => Dashboard.getPendientes());
  const actividad = useQuery(() => Dashboard.getActividadReciente());

  return {
    stats: stats.data,
    pendientes: pendientes.data || [],
    actividad: actividad.data || [],
    isLoading: stats.isLoading || pendientes.isLoading || actividad.isLoading,
    error: stats.error || pendientes.error || actividad.error,
    fetchAll: () => {
      stats.fetch();
      pendientes.fetch();
      actividad.fetch();
    },
  };
};

// ============================================
// RE-EXPORTAR useGoogleAuth PARA COMPATIBILIDAD
// ============================================

export { useGoogleAuth } from './useGoogleAuth.jsx';

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  useQuery,
  useMutation,
  useProyectos,
  usePerforaciones,
  useEnsayos,
  useClientes,
  useUsuarios,
  useEquipos,
  useDashboard,
};
