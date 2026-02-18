/**
 * useGanttData - Hook para cargar y transformar datos para el Gantt
 *
 * Carga proyectos activos con sus perforaciones y los transforma
 * al formato requerido por DHTMLX Gantt
 */

import { useState, useEffect, useMemo } from 'react';
import { ProyectosAPI, PerforacionesAPI, ClientesAPI } from '../services/apiService';

/**
 * Calcula la duración en días entre dos fechas
 */
const calcularDuracionDias = (fechaInicio, fechaFin) => {
  if (!fechaInicio) return 30; // Default 30 días si no hay fecha inicio

  const inicio = new Date(fechaInicio);
  const fin = fechaFin ? new Date(fechaFin) : new Date();

  const diffTime = Math.abs(fin - inicio);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(diffDays, 1); // Mínimo 1 día
};

/**
 * Calcula el progreso de un proyecto (0-1)
 */
const calcularProgresoProyecto = proyecto => {
  // Si tiene fecha_fin_real, está completado
  if (proyecto.fecha_fin_real) return 1;

  // Si el estado es completado
  if (proyecto.estado === 'completado') return 1;

  // Calcular basado en tiempo transcurrido
  if (!proyecto.fecha_inicio) return 0;

  const inicio = new Date(proyecto.fecha_inicio);
  const hoy = new Date();
  const finEstimada = proyecto.fecha_fin_estimada
    ? new Date(proyecto.fecha_fin_estimada)
    : new Date(inicio.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 días por defecto

  const duracionTotal = finEstimada - inicio;
  const duracionTranscurrida = hoy - inicio;

  if (duracionTranscurrida <= 0) return 0;
  if (duracionTranscurrida >= duracionTotal) return 0.95; // Max 95% si no está completado

  return Math.min(duracionTranscurrida / duracionTotal, 0.95);
};

/**
 * Calcula el progreso de una perforación (0-1)
 */
const calcularProgresoPerforacion = perforacion => {
  const estadoProgreso = {
    completado: 1,
    activo: 0.5,
    en_proceso: 0.5,
    pendiente: 0,
  };

  return estadoProgreso[perforacion.estado?.toLowerCase()] ?? 0;
};

/**
 * Colores por estado de proyecto
 */
const COLORES_ESTADO = {
  activo: '#3B82F6', // Azul
  en_proceso: '#F59E0B', // Amarillo
  completado: '#10B981', // Verde
  cancelado: '#EF4444', // Rojo
  pendiente: '#6B7280', // Gris
};

/**
 * Transforma un proyecto al formato de tarea Gantt
 */
const proyectoToGanttTask = proyecto => {
  const fechaInicio = proyecto.fecha_inicio || new Date().toISOString().split('T')[0];

  return {
    id: proyecto.id,
    text: `${proyecto.codigo} - ${proyecto.nombre}`,
    start_date: fechaInicio,
    duration: calcularDuracionDias(
      fechaInicio,
      proyecto.fecha_fin_estimada || proyecto.fecha_fin_real
    ),
    progress: calcularProgresoProyecto(proyecto),
    type: 'project',
    open: true,
    color: COLORES_ESTADO[proyecto.estado] || COLORES_ESTADO.activo,
    // Metadata adicional
    cliente_id: proyecto.cliente_id,
    cliente_nombre: proyecto.cliente_nombre,
    estado: proyecto.estado,
    proyecto_id: proyecto.id, // Para identificar en navegación
  };
};

/**
 * Transforma una perforación al formato de tarea Gantt
 */
const perforacionToGanttTask = perforacion => {
  // Si no tiene fecha_inicio, usar la del proyecto padre o fecha actual
  const fechaInicio = perforacion.fecha_inicio || new Date().toISOString().split('T')[0];

  return {
    id: `perf-${perforacion.id}`, // Prefijo para evitar colisiones con IDs de proyectos
    text: perforacion.nombre || perforacion.codigo,
    start_date: fechaInicio,
    duration: calcularDuracionDias(fechaInicio, perforacion.fecha_fin),
    progress: calcularProgresoPerforacion(perforacion),
    parent: perforacion.proyecto_id,
    type: 'task',
    color: COLORES_ESTADO[perforacion.estado] || '#6B7280',
    // Metadata adicional
    perforacion_id: perforacion.id, // ID real para navegación
    estado: perforacion.estado,
  };
};

/**
 * Hook principal para datos del Gantt
 */
export function useGanttData(clienteIdFiltro = null) {
  const [proyectos, setProyectos] = useState([]);
  const [perforaciones, setPerforaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [proyectosRes, perforacionesRes, clientesRes] = await Promise.all([
          ProyectosAPI.list(),
          PerforacionesAPI.list(),
          ClientesAPI.list(),
        ]);

        setProyectos(proyectosRes || []);
        setPerforaciones(perforacionesRes || []);
        setClientes(clientesRes || []);
      } catch (err) {
        console.error('Error cargando datos para Gantt:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrar y transformar datos
  const ganttData = useMemo(() => {
    // Filtrar proyectos activos
    let proyectosFiltrados = proyectos.filter(
      p => p.estado === 'activo' || p.estado === 'en_proceso'
    );

    // Filtrar por cliente si se especifica
    if (clienteIdFiltro) {
      proyectosFiltrados = proyectosFiltrados.filter(p => p.cliente_id === clienteIdFiltro);
    }

    // Transformar proyectos a tareas Gantt
    const tareasProyectos = proyectosFiltrados.map(proyectoToGanttTask);

    // Obtener IDs de proyectos filtrados
    const proyectoIds = new Set(proyectosFiltrados.map(p => p.id));

    // Filtrar perforaciones de esos proyectos
    const perforacionesFiltradas = perforaciones.filter(p => proyectoIds.has(p.proyecto_id));

    // Transformar perforaciones a sub-tareas Gantt
    const tareasPerforaciones = perforacionesFiltradas.map(perforacionToGanttTask);

    return {
      tasks: [...tareasProyectos, ...tareasPerforaciones],
      links: [], // Por ahora sin dependencias
    };
  }, [proyectos, perforaciones, clienteIdFiltro]);

  return {
    // Datos transformados para el Gantt
    ganttData,

    // Datos originales (para el selector de clientes)
    clientes,

    // Estados
    loading,
    error,

    // Estadísticas
    totalProyectos: ganttData.tasks.filter(t => t.type === 'project').length,
    totalPerforaciones: ganttData.tasks.filter(t => t.type === 'task').length,
  };
}

export default useGanttData;
