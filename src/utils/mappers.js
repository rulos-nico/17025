/**
 * Mappers - Utilidades para transformar datos entre snake_case y camelCase
 *
 * Estas funciones ayudan a normalizar los datos que vienen del backend (snake_case)
 * al formato preferido del frontend (camelCase).
 */

/**
 * Convierte una cadena de snake_case a camelCase
 * @param {string} str - La cadena en snake_case
 * @returns {string} - La cadena en camelCase
 * @example snakeToCamel('cliente_id') // 'clienteId'
 */
export const snakeToCamel = str => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convierte una cadena de camelCase a snake_case
 * @param {string} str - La cadena en camelCase
 * @returns {string} - La cadena en snake_case
 * @example camelToSnake('clienteId') // 'cliente_id'
 */
export const camelToSnake = str => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Convierte todas las keys de un objeto de snake_case a camelCase
 * @param {Object} obj - El objeto con keys en snake_case
 * @returns {Object} - El objeto con keys en camelCase
 */
export const mapKeysToCamel = obj => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = snakeToCamel(key);
    const value = obj[key];

    // Recursivamente convertir objetos anidados
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      acc[camelKey] = mapKeysToCamel(value);
    } else if (Array.isArray(value)) {
      acc[camelKey] = value.map(item => (typeof item === 'object' ? mapKeysToCamel(item) : item));
    } else {
      acc[camelKey] = value;
    }

    return acc;
  }, {});
};

/**
 * Convierte todas las keys de un objeto de camelCase a snake_case
 * @param {Object} obj - El objeto con keys en camelCase
 * @returns {Object} - El objeto con keys en snake_case
 */
export const mapKeysToSnake = obj => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = camelToSnake(key);
    const value = obj[key];

    // Recursivamente convertir objetos anidados
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      acc[snakeKey] = mapKeysToSnake(value);
    } else if (Array.isArray(value)) {
      acc[snakeKey] = value.map(item => (typeof item === 'object' ? mapKeysToSnake(item) : item));
    } else {
      acc[snakeKey] = value;
    }

    return acc;
  }, {});
};

// ============================================
// MAPPERS ESPECÍFICOS POR ENTIDAD
// ============================================

/**
 * Mapea un proyecto del backend al formato frontend
 * Maneja tanto snake_case como camelCase para compatibilidad
 * @param {Object} p - Proyecto del backend
 * @returns {Object} - Proyecto normalizado
 */
export const mapProyecto = p => ({
  ...p,
  clienteId: p.cliente_id ?? p.clienteId,
  ensayosCotizados: p.ensayos_cotizados ?? p.ensayosCotizados ?? {},
  driveFolderId: p.drive_folder_id ?? p.driveFolderId,
  createdAt: p.created_at ?? p.createdAt,
  updatedAt: p.updated_at ?? p.updatedAt,
});

/**
 * Mapea una perforación del backend al formato frontend
 * @param {Object} p - Perforación del backend
 * @returns {Object} - Perforación normalizada
 */
export const mapPerforacion = p => ({
  ...p,
  proyectoId: p.proyecto_id ?? p.proyectoId,
  driveFolderId: p.drive_folder_id ?? p.driveFolderId,
  createdAt: p.created_at ?? p.createdAt,
  updatedAt: p.updated_at ?? p.updatedAt,
});

/**
 * Mapea un ensayo del backend al formato frontend
 * @param {Object} e - Ensayo del backend
 * @returns {Object} - Ensayo normalizado
 */
export const mapEnsayo = e => ({
  ...e,
  perforacionId: e.perforacion_id ?? e.perforacionId,
  proyectoId: e.proyecto_id ?? e.proyectoId,
  muestraId: e.muestra_id ?? e.muestraId,
  equipoId: e.equipo_id ?? e.equipoId,
  operadorId: e.operador_id ?? e.operadorId,
  supervisorId: e.supervisor_id ?? e.supervisorId,
  fechaProgramada: e.fecha_programada ?? e.fechaProgramada,
  fechaInicio: e.fecha_inicio ?? e.fechaInicio,
  fechaFin: e.fecha_fin ?? e.fechaFin,
  workflowState: e.workflow_state ?? e.workflowState,
  workflowHistory: e.workflow_history ?? e.workflowHistory ?? [],
  driveFileId: e.drive_file_id ?? e.driveFileId,
  createdAt: e.created_at ?? e.createdAt,
  updatedAt: e.updated_at ?? e.updatedAt,
});

/**
 * Mapea una muestra del backend al formato frontend
 * @param {Object} m - Muestra del backend
 * @returns {Object} - Muestra normalizada
 */
export const mapMuestra = m => ({
  ...m,
  perforacionId: m.perforacion_id ?? m.perforacionId,
  profundidadInicio: m.profundidad_inicio ?? m.profundidadInicio ?? 0,
  profundidadFin: m.profundidad_fin ?? m.profundidadFin ?? 0,
  tipoMuestra: m.tipo_muestra ?? m.tipoMuestra ?? '',
  createdAt: m.created_at ?? m.createdAt,
  updatedAt: m.updated_at ?? m.updatedAt,
});

/**
 * Mapea un equipo del backend al formato frontend
 * @param {Object} e - Equipo del backend
 * @returns {Object} - Equipo normalizado
 */
export const mapEquipo = e => ({
  ...e,
  tipoEquipo: e.tipo_equipo ?? e.tipoEquipo,
  numeroSerie: e.numero_serie ?? e.numeroSerie,
  fechaCalibracion: e.fecha_calibracion ?? e.fechaCalibracion,
  fechaProximaCalibracion: e.fecha_proxima_calibracion ?? e.fechaProximaCalibracion,
  intervaloCalibacion: e.intervalo_calibracion ?? e.intervaloCalibacion,
  sensoresIds: e.sensores_ids ?? e.sensoresIds ?? [],
  createdAt: e.created_at ?? e.createdAt,
  updatedAt: e.updated_at ?? e.updatedAt,
});

/**
 * Mapea un cliente del backend al formato frontend
 * @param {Object} c - Cliente del backend
 * @returns {Object} - Cliente normalizado
 */
export const mapCliente = c => ({
  ...c,
  createdAt: c.created_at ?? c.createdAt,
  updatedAt: c.updated_at ?? c.updatedAt,
});

/**
 * Mapea personal interno del backend al formato frontend
 * @param {Object} p - Personal del backend
 * @returns {Object} - Personal normalizado
 */
export const mapPersonal = p => ({
  ...p,
  fechaIngreso: p.fecha_ingreso ?? p.fechaIngreso,
  createdAt: p.created_at ?? p.createdAt,
  updatedAt: p.updated_at ?? p.updatedAt,
});

// ============================================
// MAPPERS PARA ARRAYS (CONVENIENCIA)
// ============================================

/**
 * Mapea un array de proyectos
 * @param {Array} proyectos - Array de proyectos del backend
 * @returns {Array} - Array de proyectos normalizados
 */
export const mapProyectos = (proyectos = []) => proyectos.map(mapProyecto);

/**
 * Mapea un array de perforaciones
 * @param {Array} perforaciones - Array de perforaciones del backend
 * @returns {Array} - Array de perforaciones normalizadas
 */
export const mapPerforaciones = (perforaciones = []) => perforaciones.map(mapPerforacion);

/**
 * Mapea un array de ensayos
 * @param {Array} ensayos - Array de ensayos del backend
 * @returns {Array} - Array de ensayos normalizados
 */
export const mapEnsayos = (ensayos = []) => ensayos.map(mapEnsayo);

/**
 * Mapea un array de muestras
 * @param {Array} muestras - Array de muestras del backend
 * @returns {Array} - Array de muestras normalizadas
 */
export const mapMuestras = (muestras = []) => muestras.map(mapMuestra);

/**
 * Mapea un array de equipos
 * @param {Array} equipos - Array de equipos del backend
 * @returns {Array} - Array de equipos normalizados
 */
export const mapEquipos = (equipos = []) => equipos.map(mapEquipo);

/**
 * Mapea un array de clientes
 * @param {Array} clientes - Array de clientes del backend
 * @returns {Array} - Array de clientes normalizados
 */
export const mapClientes = (clientes = []) => clientes.map(mapCliente);
