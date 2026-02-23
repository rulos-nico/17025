/**
 * Mappers - Utilidades para transformar datos entre snake_case y camelCase
 *
 * Estas funciones ayudan a normalizar los datos que vienen del backend (snake_case)
 * al formato preferido del frontend (camelCase).
 */

// ============================================
// TIPOS
// ============================================

interface ProyectoRaw {
  cliente_id?: string | number;
  clienteId?: string | number;
  ensayos_cotizados?: Record<string, number>;
  ensayosCotizados?: Record<string, number>;
  drive_folder_id?: string;
  driveFolderId?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface PerforacionRaw {
  proyecto_id?: string | number;
  proyectoId?: string | number;
  drive_folder_id?: string;
  driveFolderId?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface EnsayoRaw {
  perforacion_id?: string | number;
  perforacionId?: string | number;
  proyecto_id?: string | number;
  proyectoId?: string | number;
  muestra_id?: string | number;
  muestraId?: string | number;
  equipo_id?: string | number;
  equipoId?: string | number;
  tecnico_id?: string | number;
  tecnicoId?: string | number;
  tecnico_nombre?: string;
  tecnicoNombre?: string;
  cliente_id?: string | number;
  clienteId?: string | number;
  operador_id?: string | number;
  operadorId?: string | number;
  supervisor_id?: string | number;
  supervisorId?: string | number;
  fecha_solicitud?: string;
  fechaSolicitud?: string;
  fecha_programada?: string;
  fechaProgramada?: string;
  fecha_inicio?: string;
  fechaInicio?: string;
  fecha_fin?: string;
  fechaFin?: string;
  workflow_state?: string;
  workflowState?: string;
  workflow_history?: unknown[];
  workflowHistory?: unknown[];
  novedad_razon?: string | null;
  novedadRazon?: string | null;
  ultimo_comentario?: string;
  ultimoComentario?: string;
  spreadsheet_url?: string;
  spreadsheetUrl?: string;
  sheet_url?: string;
  sheetUrl?: string;
  drive_file_id?: string;
  driveFileId?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface MuestraRaw {
  perforacion_id?: string | number;
  perforacionId?: string | number;
  profundidad_inicio?: number;
  profundidadInicio?: number;
  profundidad_fin?: number;
  profundidadFin?: number;
  tipo_muestra?: string;
  tipoMuestra?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface EquipoRaw {
  tipo_equipo?: string;
  tipoEquipo?: string;
  numero_serie?: string;
  numeroSerie?: string;
  fecha_calibracion?: string;
  fechaCalibracion?: string;
  fecha_proxima_calibracion?: string;
  fechaProximaCalibracion?: string;
  intervalo_calibracion?: number;
  intervaloCalibacion?: number;
  sensores_ids?: (string | number)[];
  sensoresIds?: (string | number)[];
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface ClienteRaw {
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface PersonalRaw {
  fecha_ingreso?: string;
  fechaIngreso?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

// ============================================
// FUNCIONES GENÉRICAS DE TRANSFORMACIÓN
// ============================================

/**
 * Convierte una cadena de snake_case a camelCase
 * @example snakeToCamel('cliente_id') // 'clienteId'
 */
export const snakeToCamel = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return str ?? '';
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
};

/**
 * Convierte una cadena de camelCase a snake_case
 * @example camelToSnake('clienteId') // 'cliente_id'
 */
export const camelToSnake = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return str ?? '';
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Convierte todas las keys de un objeto de snake_case a camelCase
 */
export const mapKeysToCamel = <T extends Record<string, unknown>>(obj: T | null | undefined): T => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj as T;

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = snakeToCamel(key);
    const value = obj[key];

    // Recursivamente convertir objetos anidados
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      (acc as Record<string, unknown>)[camelKey] = mapKeysToCamel(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      (acc as Record<string, unknown>)[camelKey] = value.map(item =>
        typeof item === 'object' ? mapKeysToCamel(item as Record<string, unknown>) : item
      );
    } else {
      (acc as Record<string, unknown>)[camelKey] = value;
    }

    return acc;
  }, {} as T);
};

/**
 * Convierte todas las keys de un objeto de camelCase a snake_case
 */
export const mapKeysToSnake = <T extends Record<string, unknown>>(obj: T | null | undefined): T => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj as T;

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = camelToSnake(key);
    const value = obj[key];

    // Recursivamente convertir objetos anidados
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      (acc as Record<string, unknown>)[snakeKey] = mapKeysToSnake(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      (acc as Record<string, unknown>)[snakeKey] = value.map(item =>
        typeof item === 'object' ? mapKeysToSnake(item as Record<string, unknown>) : item
      );
    } else {
      (acc as Record<string, unknown>)[snakeKey] = value;
    }

    return acc;
  }, {} as T);
};

// ============================================
// MAPPERS ESPECÍFICOS POR ENTIDAD
// ============================================

/**
 * Mapea un proyecto del backend al formato frontend
 * Maneja tanto snake_case como camelCase para compatibilidad
 */
export const mapProyecto = <T extends ProyectoRaw>(p: T): T & Record<string, unknown> => ({
  ...p,
  clienteId: p.cliente_id ?? p.clienteId,
  ensayosCotizados: p.ensayos_cotizados ?? p.ensayosCotizados ?? {},
  driveFolderId: p.drive_folder_id ?? p.driveFolderId,
  createdAt: p.created_at ?? p.createdAt,
  updatedAt: p.updated_at ?? p.updatedAt,
});

/**
 * Mapea una perforación del backend al formato frontend
 */
export const mapPerforacion = <T extends PerforacionRaw>(p: T): T & Record<string, unknown> => ({
  ...p,
  proyectoId: p.proyecto_id ?? p.proyectoId,
  driveFolderId: p.drive_folder_id ?? p.driveFolderId,
  createdAt: p.created_at ?? p.createdAt,
  updatedAt: p.updated_at ?? p.updatedAt,
});

/**
 * Mapea un ensayo del backend al formato frontend
 */
export const mapEnsayo = <T extends EnsayoRaw>(e: T): T & Record<string, unknown> => ({
  ...e,
  perforacionId: e.perforacion_id ?? e.perforacionId,
  proyectoId: e.proyecto_id ?? e.proyectoId,
  muestraId: e.muestra_id ?? e.muestraId,
  equipoId: e.equipo_id ?? e.equipoId,
  tecnicoId: e.tecnico_id ?? e.tecnicoId,
  tecnicoNombre: e.tecnico_nombre ?? e.tecnicoNombre,
  clienteId: e.cliente_id ?? e.clienteId,
  operadorId: e.operador_id ?? e.operadorId,
  supervisorId: e.supervisor_id ?? e.supervisorId,
  fechaSolicitud: e.fecha_solicitud ?? e.fechaSolicitud,
  fechaProgramada: e.fecha_programada ?? e.fechaProgramada,
  fechaInicio: e.fecha_inicio ?? e.fechaInicio,
  fechaFin: e.fecha_fin ?? e.fechaFin,
  workflowState: e.workflow_state ?? e.workflowState,
  workflowHistory: e.workflow_history ?? e.workflowHistory ?? [],
  novedadRazon: e.novedad_razon ?? e.novedadRazon,
  ultimoComentario: e.ultimo_comentario ?? e.ultimoComentario,
  spreadsheetUrl: e.spreadsheet_url ?? e.spreadsheetUrl,
  sheetUrl: e.sheet_url ?? e.sheetUrl,
  driveFileId: e.drive_file_id ?? e.driveFileId,
  createdAt: e.created_at ?? e.createdAt,
  updatedAt: e.updated_at ?? e.updatedAt,
});

/**
 * Mapea una muestra del backend al formato frontend
 */
export const mapMuestra = <T extends MuestraRaw>(m: T): T & Record<string, unknown> => ({
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
 */
export const mapEquipo = <T extends EquipoRaw>(e: T): T & Record<string, unknown> => ({
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
 */
export const mapCliente = <T extends ClienteRaw>(c: T): T & Record<string, unknown> => ({
  ...c,
  createdAt: c.created_at ?? c.createdAt,
  updatedAt: c.updated_at ?? c.updatedAt,
});

/**
 * Mapea personal interno del backend al formato frontend
 */
export const mapPersonal = <T extends PersonalRaw>(p: T): T & Record<string, unknown> => ({
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
 */
export const mapProyectos = <T extends ProyectoRaw>(
  proyectos: T[] = []
): Array<T & Record<string, unknown>> => proyectos.map(mapProyecto);

/**
 * Mapea un array de perforaciones
 */
export const mapPerforaciones = <T extends PerforacionRaw>(
  perforaciones: T[] = []
): Array<T & Record<string, unknown>> => perforaciones.map(mapPerforacion);

/**
 * Mapea un array de ensayos
 */
export const mapEnsayos = <T extends EnsayoRaw>(
  ensayos: T[] = []
): Array<T & Record<string, unknown>> => ensayos.map(mapEnsayo);

/**
 * Mapea un array de muestras
 */
export const mapMuestras = <T extends MuestraRaw>(
  muestras: T[] = []
): Array<T & Record<string, unknown>> => muestras.map(mapMuestra);

/**
 * Mapea un array de equipos
 */
export const mapEquipos = <T extends EquipoRaw>(
  equipos: T[] = []
): Array<T & Record<string, unknown>> => equipos.map(mapEquipo);

/**
 * Mapea un array de clientes
 */
export const mapClientes = <T extends ClienteRaw>(
  clientes: T[] = []
): Array<T & Record<string, unknown>> => clientes.map(mapCliente);
