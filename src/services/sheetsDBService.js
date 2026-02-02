/**
 * Servicio de Base de Datos con Google Sheets
 * Laboratorio ISO 17025
 * 
 * Usa un Google Sheet como base de datos:
 * - Cada hoja (tab) es una tabla
 * - Primera fila son los headers
 * - Cada fila es un registro
 * 
 * Operaciones CRUD completas para todas las entidades
 * 
 * MODO BYPASS: Si VITE_AUTH_BYPASS=true, retorna datos vacíos/mock
 */

import { DB_CONFIG } from '../config.js';
import { getAccessToken } from './driveService.js';

// ============================================
// CONFIGURACIÓN
// ============================================

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';

// ============================================
// UTILIDADES INTERNAS
// ============================================

/**
 * Ejecuta una petición a la API de Sheets
 * En modo bypass, retorna datos vacíos
 */
const sheetsRequest = async (endpoint, options = {}) => {
  // En modo bypass, simular respuesta vacía
  if (AUTH_BYPASS) {
    return { values: [] };
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error('No autenticado. Configure las credenciales de Google.');
  }
  
  const url = `${SHEETS_API_BASE}/${DB_CONFIG.spreadsheetId}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Error ${response.status}`);
  }
  
  return response.json();
};

/**
 * Convierte filas de Sheet a objetos
 * @param {Array} rows - Filas del sheet (primera es header)
 * @param {Array} columns - Definición de columnas esperadas
 * @returns {Array} - Array de objetos
 */
const rowsToObjects = (rows, _columns) => {
  if (!rows || rows.length < 2) return [];
  
  const headers = rows[0];
  const data = rows.slice(1);
  
  return data.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || null;
    });
    return obj;
  });
};

/**
 * Convierte un objeto a fila de Sheet
 * @param {Object} obj - Objeto a convertir
 * @param {Array} columns - Orden de columnas
 * @returns {Array} - Fila para el sheet
 */
const objectToRow = (obj, columns) => {
  return columns.map(col => obj[col] ?? '');
};

/**
 * Genera un ID único
 */
const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};

/**
 * Obtiene timestamp actual ISO
 */
const now = () => new Date().toISOString();

// ============================================
// OPERACIONES GENÉRICAS CRUD
// ============================================

/**
 * Lee todos los registros de una tabla
 * @param {string} tableName - Nombre de la tabla (proyectos, ensayos, etc.)
 * @returns {Promise<Array>} - Array de objetos
 */
export const findAll = async (tableName) => {
  const config = DB_CONFIG.sheets[tableName];
  if (!config) {
    throw new Error(`Tabla no configurada: ${tableName}`);
  }
  
  const range = DB_CONFIG.ranges[tableName];
  const data = await sheetsRequest(`/values/${encodeURIComponent(range)}`);
  
  return rowsToObjects(data.values, config.columns);
};

/**
 * Busca un registro por ID
 * @param {string} tableName - Nombre de la tabla
 * @param {string} id - ID del registro
 * @returns {Promise<Object|null>} - Objeto encontrado o null
 */
export const findById = async (tableName, id) => {
  const all = await findAll(tableName);
  return all.find(item => item.id === id) || null;
};

/**
 * Busca registros que coincidan con un filtro
 * @param {string} tableName - Nombre de la tabla
 * @param {Object} filter - Objeto con campos a filtrar
 * @returns {Promise<Array>} - Array de objetos que coinciden
 */
export const findWhere = async (tableName, filter) => {
  const all = await findAll(tableName);
  
  return all.filter(item => {
    return Object.entries(filter).every(([key, value]) => {
      if (Array.isArray(value)) {
        return value.includes(item[key]);
      }
      return item[key] === value;
    });
  });
};

/**
 * Crea un nuevo registro
 * @param {string} tableName - Nombre de la tabla
 * @param {Object} data - Datos del registro
 * @returns {Promise<Object>} - Registro creado con ID
 */
export const create = async (tableName, data) => {
  const config = DB_CONFIG.sheets[tableName];
  if (!config) {
    throw new Error(`Tabla no configurada: ${tableName}`);
  }
  
  const record = {
    id: data.id || generateId(tableName.substring(0, 3)),
    ...data,
    created_at: now(),
    updated_at: now(),
  };
  
  const row = objectToRow(record, config.columns);
  const range = `${config.name}!A:${String.fromCharCode(64 + config.columns.length)}`;
  
  await sheetsRequest(`/values/${encodeURIComponent(range)}:append`, {
    method: 'POST',
    body: JSON.stringify({
      values: [row],
    }),
  });
  
  return record;
};

/**
 * Actualiza un registro existente
 * @param {string} tableName - Nombre de la tabla
 * @param {string} id - ID del registro
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} - Registro actualizado
 */
export const update = async (tableName, id, data) => {
  const config = DB_CONFIG.sheets[tableName];
  if (!config) {
    throw new Error(`Tabla no configurada: ${tableName}`);
  }
  
  // Obtener todos los registros para encontrar el índice
  const range = DB_CONFIG.ranges[tableName];
  const response = await sheetsRequest(`/values/${encodeURIComponent(range)}`);
  const rows = response.values || [];
  
  if (rows.length < 2) {
    throw new Error(`Registro no encontrado: ${id}`);
  }
  
  const headers = rows[0];
  const idIndex = headers.indexOf('id');
  
  if (idIndex === -1) {
    throw new Error('Columna "id" no encontrada en la tabla');
  }
  
  // Encontrar el índice de la fila (1-indexed, +1 por header)
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[idIndex] === id);
  
  if (rowIndex === -1) {
    throw new Error(`Registro no encontrado: ${id}`);
  }
  
  // Construir registro actualizado
  const currentRow = rows[rowIndex];
  const currentObj = {};
  headers.forEach((header, i) => {
    currentObj[header] = currentRow[i] || null;
  });
  
  const updatedRecord = {
    ...currentObj,
    ...data,
    id, // Mantener el ID original
    updated_at: now(),
  };
  
  const newRow = objectToRow(updatedRecord, config.columns);
  const updateRange = `${config.name}!A${rowIndex + 1}:${String.fromCharCode(64 + config.columns.length)}${rowIndex + 1}`;
  
  await sheetsRequest(`/values/${encodeURIComponent(updateRange)}`, {
    method: 'PUT',
    body: JSON.stringify({
      values: [newRow],
    }),
  });
  
  return updatedRecord;
};

/**
 * Elimina un registro (soft delete marcando como eliminado)
 * @param {string} tableName - Nombre de la tabla
 * @param {string} id - ID del registro
 * @returns {Promise<boolean>} - true si se eliminó
 */
export const remove = async (tableName, id) => {
  // Por seguridad, hacemos soft delete si existe el campo 'deleted_at'
  // Si no, actualizamos el estado a 'eliminado'
  try {
    await update(tableName, id, { 
      deleted_at: now(),
      activo: false,
    });
    return true;
  } catch {
    return false;
  }
};

// ============================================
// OPERACIONES ESPECÍFICAS: PROYECTOS
// ============================================

export const Proyectos = {
  findAll: () => findAll('proyectos'),
  findById: (id) => findById('proyectos', id),
  findByCliente: (clienteId) => findWhere('proyectos', { cliente_id: clienteId }),
  findByEstado: (estado) => findWhere('proyectos', { estado }),
  
  create: (data) => create('proyectos', {
    codigo: data.codigo,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    cliente_id: data.cliente_id,
    cliente_nombre: data.cliente_nombre,
    contacto: data.contacto || '',
    estado: 'activo',
    fecha_inicio: data.fecha_inicio || now().split('T')[0],
    fecha_fin_estimada: data.fecha_fin_estimada || '',
    fecha_fin_real: '',
    drive_folder_id: data.drive_folder_id || '',
    created_by: data.created_by || '',
  }),
  
  update: (id, data) => update('proyectos', id, data),
  delete: (id) => remove('proyectos', id),
  
  // Cambiar estado del proyecto
  updateEstado: (id, estado) => update('proyectos', id, { estado }),
};

// ============================================
// OPERACIONES ESPECÍFICAS: PERFORACIONES
// ============================================

export const Perforaciones = {
  findAll: () => findAll('perforaciones'),
  findById: (id) => findById('perforaciones', id),
  findByProyecto: (proyectoId) => findWhere('perforaciones', { proyecto_id: proyectoId }),
  
  create: (data) => create('perforaciones', {
    codigo: data.codigo,
    proyecto_id: data.proyecto_id,
    descripcion: data.descripcion || '',
    ubicacion: data.ubicacion || '',
    profundidad: data.profundidad || '',
    fecha_solicitud: data.fecha_solicitud || now().split('T')[0],
    estado: 'pendiente',
    drive_folder_id: data.drive_folder_id || '',
  }),
  
  update: (id, data) => update('perforaciones', id, data),
  delete: (id) => remove('perforaciones', id),
};

// ============================================
// OPERACIONES ESPECÍFICAS: ENSAYOS
// ============================================

export const Ensayos = {
  findAll: () => findAll('ensayos'),
  findById: (id) => findById('ensayos', id),
  findByProyecto: (proyectoId) => findWhere('ensayos', { proyecto_id: proyectoId }),
  findByPerforacion: (perforacionId) => findWhere('ensayos', { perforacion_id: perforacionId }),
  findByCliente: (clienteId) => findWhere('ensayos', { cliente_id: clienteId }),
  findByEstado: (estado) => findWhere('ensayos', { workflow_state: estado }),
  findByEstados: (estados) => findWhere('ensayos', { workflow_state: estados }),
  
  create: (data) => create('ensayos', {
    codigo: data.codigo,
    tipo: data.tipo,
    perforacion_id: data.perforacion_id,
    proyecto_id: data.proyecto_id,
    cliente_id: data.cliente_id,
    muestra: data.muestra || '',
    norma: data.norma || '',
    workflow_state: 'E1',
    fecha_solicitud: data.fecha_solicitud || now().split('T')[0],
    fecha_programada: data.fecha_programada || '',
    fecha_ejecucion: '',
    fecha_entrega: '',
    tecnico_id: data.tecnico_id || '',
    tecnico_nombre: data.tecnico_nombre || '',
    sheet_id: data.sheet_id || '',
    sheet_url: data.sheet_url || '',
    informe_id: '',
    informe_url: '',
    observaciones: data.observaciones || '',
    urgente: data.urgente ? 'true' : 'false',
  }),
  
  update: (id, data) => update('ensayos', id, data),
  delete: (id) => remove('ensayos', id),
  
  // Transición de workflow
  updateWorkflowState: async (id, newState, userId, userName, comentario = '') => {
    const ensayo = await findById('ensayos', id);
    if (!ensayo) throw new Error('Ensayo no encontrado');
    
    // Registrar en logs
    await Logs.create({
      usuario_id: userId,
      usuario_nombre: userName,
      accion: 'workflow_transition',
      entidad: 'ensayos',
      entidad_id: id,
      datos_antes: JSON.stringify({ workflow_state: ensayo.workflow_state }),
      datos_despues: JSON.stringify({ workflow_state: newState, comentario }),
    });
    
    return update('ensayos', id, { workflow_state: newState });
  },
};

// ============================================
// OPERACIONES ESPECÍFICAS: CLIENTES
// ============================================

export const Clientes = {
  findAll: () => findAll('clientes'),
  findById: (id) => findById('clientes', id),
  findActivos: () => findWhere('clientes', { activo: 'true' }),
  
  create: (data) => create('clientes', {
    codigo: data.codigo,
    nombre: data.nombre,
    rut: data.rut || '',
    direccion: data.direccion || '',
    ciudad: data.ciudad || '',
    telefono: data.telefono || '',
    email: data.email || '',
    contacto_nombre: data.contacto_nombre || '',
    contacto_cargo: data.contacto_cargo || '',
    contacto_email: data.contacto_email || '',
    contacto_telefono: data.contacto_telefono || '',
    activo: 'true',
    drive_folder_id: data.drive_folder_id || '',
  }),
  
  update: (id, data) => update('clientes', id, data),
  delete: (id) => remove('clientes', id),
};

// ============================================
// OPERACIONES ESPECÍFICAS: USUARIOS
// ============================================

export const Usuarios = {
  findAll: () => findAll('usuarios'),
  findById: (id) => findById('usuarios', id),
  findByEmail: async (email) => {
    const all = await findAll('usuarios');
    return all.find(u => u.email === email) || null;
  },
  findByRol: (rol) => findWhere('usuarios', { rol }),
  findByCliente: (clienteId) => findWhere('usuarios', { cliente_id: clienteId }),
  findActivos: () => findWhere('usuarios', { activo: 'true' }),
  
  create: (data) => create('usuarios', {
    email: data.email,
    nombre: data.nombre,
    apellido: data.apellido || '',
    rol: data.rol,
    cargo: data.cargo || '',
    telefono: data.telefono || '',
    activo: 'true',
    cliente_id: data.cliente_id || '',
    last_login: '',
  }),
  
  update: (id, data) => update('usuarios', id, data),
  delete: (id) => remove('usuarios', id),
  
  // Actualizar último login
  updateLastLogin: (id) => update('usuarios', id, { last_login: now() }),
};

// ============================================
// OPERACIONES ESPECÍFICAS: EQUIPOS
// ============================================

export const Equipos = {
  findAll: () => findAll('equipos'),
  findById: (id) => findById('equipos', id),
  findByEstado: (estado) => findWhere('equipos', { estado }),
  
  // Equipos que requieren calibración pronto (próximos 30 días)
  findProximosACalibracion: async () => {
    const all = await findAll('equipos');
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);
    
    return all.filter(equipo => {
      if (!equipo.proxima_calibracion) return false;
      const fecha = new Date(equipo.proxima_calibracion);
      return fecha >= hoy && fecha <= limite;
    });
  },
  
  create: (data) => create('equipos', {
    codigo: data.codigo,
    nombre: data.nombre,
    marca: data.marca || '',
    modelo: data.modelo || '',
    serie: data.serie || '',
    ubicacion: data.ubicacion || '',
    estado: 'operativo',
    fecha_calibracion: data.fecha_calibracion || '',
    proxima_calibracion: data.proxima_calibracion || '',
    certificado_id: data.certificado_id || '',
    responsable: data.responsable || '',
    observaciones: data.observaciones || '',
  }),
  
  update: (id, data) => update('equipos', id, data),
  delete: (id) => remove('equipos', id),
};

// ============================================
// OPERACIONES ESPECÍFICAS: LOGS
// ============================================

export const Logs = {
  findAll: () => findAll('logs'),
  findByUsuario: (usuarioId) => findWhere('logs', { usuario_id: usuarioId }),
  findByEntidad: (entidad, entidadId) => findWhere('logs', { entidad, entidad_id: entidadId }),
  
  create: (data) => create('logs', {
    timestamp: now(),
    usuario_id: data.usuario_id || '',
    usuario_nombre: data.usuario_nombre || '',
    accion: data.accion,
    entidad: data.entidad,
    entidad_id: data.entidad_id || '',
    datos_antes: data.datos_antes || '',
    datos_despues: data.datos_despues || '',
    ip: data.ip || '',
    user_agent: data.user_agent || '',
  }),
};

// ============================================
// ESTADÍSTICAS Y DASHBOARD
// ============================================

export const Dashboard = {
  /**
   * Obtiene estadísticas generales
   */
  getStats: async () => {
    const [proyectos, ensayos, clientes] = await Promise.all([
      findAll('proyectos'),
      findAll('ensayos'),
      findAll('clientes'),
    ]);
    
    const ensayosPorEstado = {};
    ensayos.forEach(e => {
      const estado = e.workflow_state || 'E1';
      ensayosPorEstado[estado] = (ensayosPorEstado[estado] || 0) + 1;
    });
    
    return {
      proyectos_activos: proyectos.filter(p => p.estado === 'activo').length,
      ensayos_pendientes: ensayos.filter(e => ['E1', 'E2'].includes(e.workflow_state)).length,
      ensayos_en_proceso: ensayos.filter(e => ['E6', 'E7', 'E8'].includes(e.workflow_state)).length,
      ensayos_en_revision: ensayos.filter(e => ['E9', 'E10', 'E11'].includes(e.workflow_state)).length,
      ensayos_completados: ensayos.filter(e => ['E12', 'E13', 'E14', 'E15'].includes(e.workflow_state)).length,
      clientes_activos: clientes.filter(c => c.activo === 'true').length,
      total_ensayos: ensayos.length,
      ensayos_por_estado: ensayosPorEstado,
    };
  },
  
  /**
   * Obtiene ensayos pendientes/recientes
   */
  getPendientes: async (limit = 10) => {
    const ensayos = await findWhere('ensayos', { workflow_state: ['E1', 'E2', 'E6', 'E7', 'E8'] });
    return ensayos.slice(0, limit);
  },
  
  /**
   * Obtiene actividad reciente
   */
  getActividadReciente: async (limit = 20) => {
    const logs = await findAll('logs');
    return logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  },
};

// ============================================
// SERVICIO EXPORTADO
// ============================================

const SheetsDBService = {
  // Operaciones genéricas
  findAll,
  findById,
  findWhere,
  create,
  update,
  remove,
  
  // Entidades específicas
  Proyectos,
  Perforaciones,
  Ensayos,
  Clientes,
  Usuarios,
  Equipos,
  Logs,
  
  // Dashboard
  Dashboard,
};

export default SheetsDBService;
