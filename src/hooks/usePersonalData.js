/**
 * usePersonalData - Hook para carga y gestion de datos de personal y clientes
 *
 * Centraliza la logica de carga de datos y operaciones CRUD
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClientesAPI, ProyectosAPI, PersonalInternoAPI } from '../services/apiService';
import { CARGOS } from '../config/personal';

/**
 * Convierte un cliente de la API al formato de persona para la UI
 */
const mapClienteToPersona = cliente => ({
  id: cliente.id,
  codigo: cliente.codigo,
  nombre: cliente.contacto_nombre || cliente.nombre,
  apellido: '',
  email: cliente.contacto_email || cliente.email,
  telefono: cliente.contacto_telefono || cliente.telefono,
  cargo: 'cliente',
  fecha_ingreso: cliente.created_at?.split('T')[0] || '',
  activo: cliente.activo,
  foto: null,
  empresa: cliente.nombre,
  rut: cliente.rut,
  proyectos: [],
  autorizaciones: [],
  estudios: [],
  capacitaciones: [],
});

/**
 * Convierte personal interno de la API al formato de persona para la UI
 */
const mapPersonalToPersona = p => ({
  id: p.id,
  codigo: p.codigo,
  nombre: p.nombre,
  apellido: p.apellido || '',
  email: p.email,
  telefono: p.telefono || '',
  cargo: p.cargo,
  departamento: p.departamento,
  fecha_ingreso: p.created_at?.split('T')[0] || '',
  activo: p.activo,
  foto: null,
  empresa: null,
  rut: null,
  proyectos: [],
  autorizaciones: [],
  estudios: [],
  capacitaciones: [],
});

/**
 * Hook para gestion completa de datos de personal
 */
export function usePersonalData() {
  const [personal, setPersonal] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientesRes, personalInternoRes, proyectosRes] = await Promise.all([
          ClientesAPI.list(),
          PersonalInternoAPI.list().catch(() => []),
          ProyectosAPI.list(),
        ]);

        // Convertir clientes
        const clientesComoPersonas = (clientesRes || []).map(mapClienteToPersona);

        // Convertir personal interno
        const personalInternoComoPersonas = (personalInternoRes || []).map(mapPersonalToPersona);

        // Mapear proyectos
        const proyectosMapeados = (proyectosRes || []).map(p => ({
          ...p,
          clienteId: p.cliente_id || p.clienteId,
        }));

        // Asignar proyectos a cada cliente
        clientesComoPersonas.forEach(cliente => {
          cliente.proyectos = proyectosMapeados
            .filter(p => p.clienteId === cliente.id)
            .map(p => p.id);
        });

        setPersonal([...personalInternoComoPersonas, ...clientesComoPersonas]);
        setProyectos(proyectosMapeados);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err.message);
        setPersonal([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Crear persona (cliente o personal interno)
  const createPersona = useCallback(async nuevaPersona => {
    try {
      if (nuevaPersona.cargo === 'cliente') {
        const clienteData = {
          nombre: nuevaPersona.empresa || nuevaPersona.nombre,
          rut: nuevaPersona.rut,
          email: nuevaPersona.email,
          telefono: nuevaPersona.telefono,
          contacto_nombre: `${nuevaPersona.nombre} ${nuevaPersona.apellido}`.trim(),
          contacto_email: nuevaPersona.email,
          contacto_telefono: nuevaPersona.telefono,
        };
        const clienteCreado = await ClientesAPI.create(clienteData);
        const personaCliente = mapClienteToPersona(clienteCreado);
        setPersonal(prev => [...prev, personaCliente]);
        return personaCliente;
      } else {
        const personalData = {
          nombre: nuevaPersona.nombre,
          apellido: nuevaPersona.apellido || '',
          cargo: nuevaPersona.cargo,
          departamento: CARGOS[nuevaPersona.cargo]?.nombre || 'General',
          email: nuevaPersona.email,
          telefono: nuevaPersona.telefono || null,
        };
        const personalCreado = await PersonalInternoAPI.create(personalData);
        const personaInterno = mapPersonalToPersona(personalCreado);
        setPersonal(prev => [...prev, personaInterno]);
        return personaInterno;
      }
    } catch (err) {
      console.error('Error creando persona:', err);
      throw err;
    }
  }, []);

  // Eliminar persona (cliente o personal interno)
  const deletePersona = useCallback(async persona => {
    try {
      if (persona.cargo === 'cliente') {
        await ClientesAPI.delete(persona.id);
      } else {
        await PersonalInternoAPI.delete(persona.id);
      }
      setPersonal(prev => prev.filter(p => p.id !== persona.id));
    } catch (err) {
      console.error('Error eliminando persona:', err);
      throw err;
    }
  }, []);

  // Estadisticas por cargo
  const statsPorCargo = useMemo(() => {
    const stats = {};
    Object.keys(CARGOS).forEach(cargo => {
      stats[cargo] = personal.filter(p => p.cargo === cargo && p.activo).length;
    });
    return stats;
  }, [personal]);

  // Total activos
  const totalActivos = useMemo(() => personal.filter(p => p.activo).length, [personal]);

  return {
    // Datos
    personal,
    proyectos,
    statsPorCargo,
    totalActivos,

    // Estados
    loading,
    error,

    // Metodos
    createPersona,
    deletePersona,
    clearError: () => setError(null),
  };
}

export default usePersonalData;
