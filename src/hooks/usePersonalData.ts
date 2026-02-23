/**
 * usePersonalData - Hook para carga y gestion de datos de personal y clientes
 *
 * Centraliza la logica de carga de datos y operaciones CRUD
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClientesAPI, ProyectosAPI, PersonalInternoAPI } from '../services/apiService';
import { CARGOS } from '../config/personal';

// ============================================
// INTERFACES
// ============================================

interface ClienteRaw {
  id: string | number;
  codigo?: string;
  nombre: string;
  contacto_nombre?: string;
  contacto_email?: string;
  contacto_telefono?: string;
  email?: string;
  telefono?: string;
  rut?: string;
  activo: boolean;
  created_at?: string;
  [key: string]: unknown;
}

interface PersonalInternoRaw {
  id: string | number;
  codigo?: string;
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  cargo: string;
  departamento?: string;
  activo: boolean;
  created_at?: string;
  [key: string]: unknown;
}

interface ProyectoRaw {
  id: string | number;
  codigo?: string;
  nombre?: string;
  cliente_id?: string | number;
  clienteId?: string | number;
  [key: string]: unknown;
}

export interface Persona {
  id: string | number;
  codigo?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  cargo: string;
  departamento?: string;
  fecha_ingreso?: string;
  activo: boolean;
  foto?: string | null;
  empresa?: string | null;
  rut?: string | null;
  proyectos: (string | number)[];
  autorizaciones: string[];
  estudios: string[];
  capacitaciones: string[];
  [key: string]: unknown;
}

export interface Proyecto {
  id: string | number;
  codigo?: string;
  nombre?: string;
  clienteId: string | number;
  [key: string]: unknown;
}

export interface StatsPorCargo {
  [cargo: string]: number;
}

export interface UsePersonalDataResult {
  // Datos
  personal: Persona[];
  proyectos: Proyecto[];
  statsPorCargo: StatsPorCargo;
  totalActivos: number;

  // Estados
  loading: boolean;
  error: string | null;

  // Métodos
  createPersona: (nuevaPersona: Partial<Persona>) => Promise<Persona>;
  deletePersona: (persona: Persona) => Promise<void>;
  clearError: () => void;
}

// ============================================
// HELPERS
// ============================================

/**
 * Convierte un cliente de la API al formato de persona para la UI
 */
const mapClienteToPersona = (cliente: ClienteRaw): Persona => ({
  id: cliente.id,
  codigo: cliente.codigo,
  nombre: cliente.contacto_nombre || cliente.nombre,
  apellido: '',
  email: cliente.contacto_email || cliente.email || '',
  telefono: cliente.contacto_telefono || cliente.telefono,
  cargo: 'cliente',
  fecha_ingreso: cliente.created_at?.split('T')[0] || '',
  activo: cliente.activo,
  foto: null,
  empresa: cliente.nombre,
  rut: cliente.rut || null,
  proyectos: [],
  autorizaciones: [],
  estudios: [],
  capacitaciones: [],
});

/**
 * Convierte personal interno de la API al formato de persona para la UI
 */
const mapPersonalToPersona = (p: PersonalInternoRaw): Persona => ({
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

// ============================================
// HOOK
// ============================================

/**
 * Hook para gestion completa de datos de personal
 */
export function usePersonalData(): UsePersonalDataResult {
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const clientesComoPersonas = ((clientesRes || []) as ClienteRaw[]).map(mapClienteToPersona);

        // Convertir personal interno
        const personalInternoComoPersonas = (
          (personalInternoRes || []) as PersonalInternoRaw[]
        ).map(mapPersonalToPersona);

        // Mapear proyectos
        const proyectosMapeados: Proyecto[] = ((proyectosRes || []) as ProyectoRaw[]).map(p => ({
          ...p,
          clienteId: p.cliente_id || p.clienteId || '',
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
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setPersonal([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Crear persona (cliente o personal interno)
  const createPersona = useCallback(async (nuevaPersona: Partial<Persona>): Promise<Persona> => {
    try {
      if (nuevaPersona.cargo === 'cliente') {
        const clienteData = {
          nombre: nuevaPersona.empresa || nuevaPersona.nombre || '',
          rut: nuevaPersona.rut,
          email: nuevaPersona.email,
          telefono: nuevaPersona.telefono,
          contacto_nombre: `${nuevaPersona.nombre || ''} ${nuevaPersona.apellido || ''}`.trim(),
          contacto_email: nuevaPersona.email,
          contacto_telefono: nuevaPersona.telefono,
        };
        const clienteCreado = (await ClientesAPI.create(clienteData)) as ClienteRaw;
        const personaCliente = mapClienteToPersona(clienteCreado);
        setPersonal(prev => [...prev, personaCliente]);
        return personaCliente;
      } else {
        const cargoInfo = CARGOS[nuevaPersona.cargo as keyof typeof CARGOS];
        const personalData = {
          nombre: nuevaPersona.nombre || '',
          apellido: nuevaPersona.apellido || '',
          cargo: nuevaPersona.cargo || '',
          departamento: cargoInfo?.nombre || 'General',
          email: nuevaPersona.email || '',
          telefono: nuevaPersona.telefono || null,
        };
        const personalCreado = (await PersonalInternoAPI.create(
          personalData
        )) as PersonalInternoRaw;
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
  const deletePersona = useCallback(async (persona: Persona): Promise<void> => {
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
  const statsPorCargo = useMemo((): StatsPorCargo => {
    const stats: StatsPorCargo = {};
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
