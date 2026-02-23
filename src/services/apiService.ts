/**
 * Servicio de API para el backend
 * Centraliza todas las llamadas HTTP al servidor
 */

import { API_CONFIG } from '../config';
import { useState } from 'react';

// Extend window type for auth token
declare global {
  interface Window {
    __AUTH_TOKEN__?: string;
  }
}

// ============================================
// TYPES
// ============================================

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface CrudEndpointConfig {
  list: string;
  create: string;
  detail: (id: string | number) => string;
  update: (id: string | number) => string;
  delete: (id: string | number) => string;
}

interface CrudAPI<T = unknown> {
  list: () => Promise<T[]>;
  get: (id: string | number) => Promise<T>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string | number, data: Partial<T>) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================
// CONFIGURACIÓN Y ESTADO
// ============================================

const { baseURL, timeout, endpoints } = API_CONFIG;

/**
 * Obtiene el token de autenticación actual
 */
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined' && window.__AUTH_TOKEN__) {
    return window.__AUTH_TOKEN__;
  }
  return null;
};

/**
 * Guarda el token de autenticación
 */
export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    window.__AUTH_TOKEN__ = token;
  }
};

// ============================================
// CLIENTE HTTP BASE
// ============================================

interface HttpError extends Error {
  status?: number;
  data?: unknown;
}

/**
 * Realiza una petición HTTP con autenticación y manejo de errores
 */
const request = async <T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const url = `${baseURL}${endpoint}`;
  const token = getAuthToken();

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  // Timeout con AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Parsear respuesta
    const contentType = response.headers.get('content-type');
    let data: T;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as unknown as T;
    }

    // Manejar errores HTTP
    if (!response.ok) {
      const error: HttpError = new Error(
        (data as { error?: string })?.error || `HTTP ${response.status}`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La petición excedió el tiempo límite');
    }

    throw error;
  }
};

// ============================================
// FACTORY PARA CREAR APIs CRUD
// ============================================

/**
 * Crea un objeto API con operaciones CRUD estándar
 */
const createCrudAPI = <T = unknown>(endpointConfig: CrudEndpointConfig): CrudAPI<T> => ({
  list: () => request<T[]>(endpointConfig.list),
  get: (id: string | number) => request<T>(endpointConfig.detail(id)),
  create: (data: Partial<T>) =>
    request<T>(endpointConfig.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string | number, data: Partial<T>) =>
    request<T>(endpointConfig.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string | number) =>
    request<void>(endpointConfig.delete(id), {
      method: 'DELETE',
    }),
});

// ============================================
// AUTENTICACIÓN
// ============================================

export const AuthAPI = {
  health: () => request(endpoints.auth.health),

  login: (accessToken: string) =>
    request(endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    }),

  profile: () => request(endpoints.auth.profile),

  logout: () =>
    request(endpoints.auth.logout, {
      method: 'POST',
    }),

  refresh: () =>
    request(endpoints.auth.refresh, {
      method: 'POST',
    }),
};

// ============================================
// PROYECTOS
// ============================================

export const ProyectosAPI = {
  ...createCrudAPI(endpoints.proyectos),
  perforaciones: (id: string | number) => request(endpoints.proyectos.perforaciones(id)),
  ensayos: (id: string | number) => request(endpoints.proyectos.ensayos(id)),
};

// ============================================
// CLIENTES
// ============================================

export const ClientesAPI = createCrudAPI(endpoints.clientes);

// ============================================
// ENSAYOS
// ============================================

export const EnsayosAPI = {
  ...createCrudAPI(endpoints.ensayos),
  updateStatus: (id: string | number, status: string) =>
    request(endpoints.ensayos.updateStatus(id), {
      method: 'PUT',
      body: JSON.stringify({ workflow_state: status }),
    }),
};

// ============================================
// PERFORACIONES
// ============================================

export const PerforacionesAPI = {
  ...createCrudAPI(endpoints.perforaciones),
  ensayos: (id: string | number) => request(endpoints.perforaciones.ensayos(id)),
  muestras: (id: string | number) => request(endpoints.perforaciones.muestras(id)),
};

// ============================================
// MUESTRAS
// ============================================

export const MuestrasAPI = {
  ...createCrudAPI(endpoints.muestras),
  ensayos: (id: string | number) => request(endpoints.muestras.ensayos(id)),
};

// ============================================
// EQUIPOS
// ============================================

export const EquiposAPI = createCrudAPI(endpoints.equipos);

// ============================================
// SENSORES
// ============================================

export const SensoresAPI = createCrudAPI(endpoints.sensores);

// ============================================
// PERSONAL INTERNO
// ============================================

export const PersonalInternoAPI = createCrudAPI(endpoints.personalInterno);

// ============================================
// COMPROBACIONES (Verificaciones de equipos)
// ============================================

export const ComprobacionesAPI = {
  ...createCrudAPI(endpoints.comprobaciones),
  listByEquipo: (equipoId: string | number) => request(endpoints.comprobaciones.byEquipo(equipoId)),
};

// ============================================
// CALIBRACIONES (Certificaciones de equipos)
// ============================================

export const CalibracionesAPI = {
  ...createCrudAPI(endpoints.calibraciones),
  listByEquipo: (equipoId: string | number) => request(endpoints.calibraciones.byEquipo(equipoId)),
};

// ============================================
// USUARIOS
// ============================================

export const UsuariosAPI = createCrudAPI(endpoints.usuarios);

// ============================================
// REPORTES
// ============================================

export const ReportesAPI = {
  ...createCrudAPI(endpoints.reportes),
  download: (id: string | number) => request(endpoints.reportes.download(id)),
};

// ============================================
// DASHBOARD / ESTADÍSTICAS
// ============================================

export const DashboardAPI = {
  stats: () => request(endpoints.dashboard.stats),
  pendientes: () => request(endpoints.dashboard.pending),
  recientes: () => request(endpoints.dashboard.recent),
};

// ============================================
// TIPOS DE ENSAYO
// ============================================

import type { TipoEnsayo } from '../config';

export const TiposEnsayoAPI = {
  list: () => request<TipoEnsayo[]>(endpoints.tiposEnsayo.list),
  get: (id: string | number) => request<TipoEnsayo>(endpoints.tiposEnsayo.get(id)),
};

// ============================================
// HOOK DE USO
// ============================================

type ApiMethod<T, Args extends unknown[]> = (...args: Args) => Promise<T>;

/**
 * Hook factory para usar las APIs con manejo de estado
 */
export const createAPIHook = <T, Args extends unknown[]>(apiMethod: ApiMethod<T, Args>) => {
  return () => {
    const [state, setState] = useState<ApiState<T>>({
      data: null,
      loading: false,
      error: null,
    });

    const execute = async (...args: Args): Promise<T> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const data = await apiMethod(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        throw error;
      }
    };

    return { ...state, execute };
  };
};

// ============================================
// EXPORTAR TODO
// ============================================

export default {
  Auth: AuthAPI,
  Proyectos: ProyectosAPI,
  Clientes: ClientesAPI,
  Ensayos: EnsayosAPI,
  Perforaciones: PerforacionesAPI,
  Muestras: MuestrasAPI,
  Equipos: EquiposAPI,
  Sensores: SensoresAPI,
  PersonalInterno: PersonalInternoAPI,
  Comprobaciones: ComprobacionesAPI,
  Calibraciones: CalibracionesAPI,
  Usuarios: UsuariosAPI,
  Reportes: ReportesAPI,
  Dashboard: DashboardAPI,
  TiposEnsayo: TiposEnsayoAPI,
  setAuthToken,
};
