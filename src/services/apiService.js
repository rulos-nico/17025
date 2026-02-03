/**
 * Servicio de API para el backend Rust
 * Centraliza todas las llamadas HTTP al servidor
 *
 * Funcionalidades:
 * - Autenticación con Google OAuth tokens
 * - CRUD para todas las entidades
 * - Manejo de errores centralizado
 */

import { API_CONFIG } from '../config.js';

// ============================================
// CONFIGURACIÓN Y ESTADO
// ============================================

const BASE_URL = API_CONFIG.baseURL;
const TIMEOUT = API_CONFIG.timeout;

/**
 * Obtiene el token de autenticación actual
 * Se usa el token de Google OAuth del frontend
 */
const getAuthToken = () => {
  // Buscar el token en el estado de la app
  // Esto se integra con useGoogleAuth
  if (typeof window !== 'undefined' && window.__GOOGLE_ACCESS_TOKEN__) {
    return window.__GOOGLE_ACCESS_TOKEN__;
  }
  return null;
};

/**
 * Guarda el token de autenticación (llamado desde useGoogleAuth)
 */
export const setAuthToken = token => {
  if (typeof window !== 'undefined') {
    window.__GOOGLE_ACCESS_TOKEN__ = token;
  }
};

// ============================================
// CLIENTE HTTP BASE
// ============================================

/**
 * Realiza una petición HTTP con autenticación y manejo de errores
 */
const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  // Timeout con AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Parsear respuesta
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Manejar errores HTTP
    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('La petición excedió el tiempo límite');
    }

    throw error;
  }
};

// ============================================
// AUTENTICACIÓN
// ============================================

export const AuthAPI = {
  /**
   * Health check del servidor
   */
  health: () => request('/api/auth/health'),

  /**
   * Login con token de Google
   * @param {string} accessToken - Token de Google OAuth
   */
  login: accessToken =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    }),

  /**
   * Obtener perfil del usuario actual
   */
  profile: () => request('/api/auth/profile'),

  /**
   * Logout (notifica al backend)
   */
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

// ============================================
// PROYECTOS
// ============================================

export const ProyectosAPI = {
  /**
   * Listar todos los proyectos
   */
  list: () => request('/api/proyectos'),

  /**
   * Obtener un proyecto por ID
   */
  get: id => request(`/api/proyectos/${id}`),

  /**
   * Crear un nuevo proyecto
   */
  create: data =>
    request('/api/proyectos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Actualizar un proyecto
   */
  update: (id, data) =>
    request(`/api/proyectos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Eliminar un proyecto
   */
  delete: id =>
    request(`/api/proyectos/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Obtener perforaciones de un proyecto
   */
  perforaciones: id => request(`/api/proyectos/${id}/perforaciones`),

  /**
   * Obtener ensayos de un proyecto
   */
  ensayos: id => request(`/api/proyectos/${id}/ensayos`),
};

// ============================================
// CLIENTES
// ============================================

export const ClientesAPI = {
  list: () => request('/api/clientes'),
  get: id => request(`/api/clientes/${id}`),
  create: data =>
    request('/api/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/api/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: id => request(`/api/clientes/${id}`, { method: 'DELETE' }),
};

// ============================================
// ENSAYOS
// ============================================

export const EnsayosAPI = {
  list: () => request('/api/ensayos'),
  get: id => request(`/api/ensayos/${id}`),
  create: data =>
    request('/api/ensayos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/api/ensayos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: id => request(`/api/ensayos/${id}`, { method: 'DELETE' }),

  /**
   * Actualizar estado del workflow
   */
  updateStatus: (id, status) =>
    request(`/api/ensayos/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ workflow_state: status }),
    }),
};

// ============================================
// PERFORACIONES
// ============================================

export const PerforacionesAPI = {
  list: () => request('/api/perforaciones'),
  get: id => request(`/api/perforaciones/${id}`),
  create: data =>
    request('/api/perforaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/api/perforaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: id => request(`/api/perforaciones/${id}`, { method: 'DELETE' }),

  /**
   * Obtener ensayos de una perforación
   */
  ensayos: id => request(`/api/perforaciones/${id}/ensayos`),
};

// ============================================
// EQUIPOS
// ============================================

export const EquiposAPI = {
  list: () => request('/api/equipos'),
  get: id => request(`/api/equipos/${id}`),
  create: data =>
    request('/api/equipos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/api/equipos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: id => request(`/api/equipos/${id}`, { method: 'DELETE' }),
};

// ============================================
// SENSORES
// ============================================

export const SensoresAPI = {
  list: () => request('/api/sensores'),
  get: id => request(`/api/sensores/${id}`),
  create: data =>
    request('/api/sensores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/api/sensores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: id => request(`/api/sensores/${id}`, { method: 'DELETE' }),
};

// ============================================
// SINCRONIZACIÓN
// ============================================

export const SyncAPI = {
  /**
   * Sincronizar todo (BD <-> Sheets)
   */
  syncAll: () => request('/api/sync/all', { method: 'POST' }),

  /**
   * Sincronizar desde Sheets a BD
   */
  fromSheets: () => request('/api/sync/from-sheets', { method: 'POST' }),

  /**
   * Sincronizar desde BD a Sheets
   */
  toSheets: () => request('/api/sync/to-sheets', { method: 'POST' }),

  /**
   * Estado de última sincronización
   */
  status: () => request('/api/sync/status'),
};

// ============================================
// DASHBOARD / ESTADÍSTICAS
// ============================================

export const DashboardAPI = {
  /**
   * Obtener estadísticas generales
   */
  stats: () => request('/api/dashboard/stats'),

  /**
   * Obtener ensayos pendientes
   */
  pendientes: () => request('/api/dashboard/pendientes'),

  /**
   * Obtener actividad reciente
   */
  recientes: () => request('/api/dashboard/recientes'),
};

// ============================================
// HOOK DE USO
// ============================================

/**
 * Hook para usar las APIs con manejo de estado
 *
 * Uso:
 * ```jsx
 * import { useAPI } from '../services/apiService';
 *
 * function MyComponent() {
 *   const { data, loading, error, execute } = useAPI(ProyectosAPI.list);
 *
 *   useEffect(() => {
 *     execute();
 *   }, []);
 * }
 * ```
 */
export const createAPIHook = apiMethod => {
  return () => {
    const [state, setState] = useState({
      data: null,
      loading: false,
      error: null,
    });

    const execute = async (...args) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const data = await apiMethod(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
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
  Equipos: EquiposAPI,
  Sensores: SensoresAPI,
  Sync: SyncAPI,
  Dashboard: DashboardAPI,
  setAuthToken,
};
