/**
 * Configuración centralizada de la aplicación
 * Sistema de gestión y entregables para laboratorio ISO/IEC 17025:2017
 */

// ============================================
// TYPES
// ============================================

interface CrudEndpoints {
  list: string;
  create: string;
  detail: (id: string | number) => string;
  update: (id: string | number) => string;
  delete: (id: string | number) => string;
}

interface AuthEndpoints {
  health: string;
  login: string;
  logout: string;
  refresh: string;
  profile: string;
}

interface ProyectosEndpoints extends CrudEndpoints {
  perforaciones: (id: string | number) => string;
  ensayos: (id: string | number) => string;
}

interface EnsayosEndpoints extends CrudEndpoints {
  updateStatus: (id: string | number) => string;
}

interface PerforacionesEndpoints extends CrudEndpoints {
  ensayos: (id: string | number) => string;
  muestras: (id: string | number) => string;
}

interface MuestrasEndpoints extends CrudEndpoints {
  ensayos: (id: string | number) => string;
}

interface ComprobacionesEndpoints extends CrudEndpoints {
  byEquipo: (equipoId: string | number) => string;
}

interface CalibracionesEndpoints extends CrudEndpoints {
  byEquipo: (equipoId: string | number) => string;
}

interface ReportesEndpoints extends CrudEndpoints {
  download: (id: string | number) => string;
}

interface DashboardEndpoints {
  stats: string;
  pending: string;
  recent: string;
}

interface TiposEnsayoEndpoints {
  list: string;
  get: (id: string | number) => string;
}

interface ApiEndpoints {
  auth: AuthEndpoints;
  proyectos: ProyectosEndpoints;
  clientes: CrudEndpoints;
  ensayos: EnsayosEndpoints;
  perforaciones: PerforacionesEndpoints;
  muestras: MuestrasEndpoints;
  equipos: CrudEndpoints;
  sensores: CrudEndpoints;
  personalInterno: CrudEndpoints;
  comprobaciones: ComprobacionesEndpoints;
  calibraciones: CalibracionesEndpoints;
  usuarios: CrudEndpoints;
  reportes: ReportesEndpoints;
  dashboard: DashboardEndpoints;
  tiposEnsayo: TiposEnsayoEndpoints;
}

interface ApiConfig {
  baseURL: string;
  timeout: number;
  endpoints: ApiEndpoints;
}

export interface WorkflowStateInfo {
  nombre: string;
  color: string;
  fase: string;
  descripcion: string;
}

export interface EstadoInfo {
  label: string;
  color: string;
}

export interface TipoEnsayo {
  id: string;
  nombre: string;
  categoria: string;
  norma: string;
}

export interface TipoMuestra {
  id: string;
  nombre: string;
  descripcion: string;
  color?: string;
}

export interface RolInfo {
  value: string;
  label: string;
  permisos: string[];
  descripcion: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: string[];
}

export interface DashboardStat {
  key: string;
  label: string;
  icon: string;
  estados: string[];
}

// ============================================
// CONFIGURACIÓN DE API
// ============================================

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Validación en producción
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  throw new Error('Falta VITE_API_URL en producción');
}

/**
 * Helper para generar endpoints CRUD estándar
 */
const createCrudEndpoints = (basePath: string): CrudEndpoints => ({
  list: basePath,
  create: basePath,
  detail: (id: string | number) => `${basePath}/${id}`,
  update: (id: string | number) => `${basePath}/${id}`,
  delete: (id: string | number) => `${basePath}/${id}`,
});

export const API_CONFIG: ApiConfig = {
  baseURL: BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 10000),

  endpoints: {
    auth: {
      health: '/api/auth/health',
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      profile: '/api/auth/profile',
    },

    proyectos: {
      ...createCrudEndpoints('/api/proyectos'),
      perforaciones: (id: string | number) => `/api/proyectos/${id}/perforaciones`,
      ensayos: (id: string | number) => `/api/proyectos/${id}/ensayos`,
    },

    clientes: createCrudEndpoints('/api/clientes'),

    ensayos: {
      ...createCrudEndpoints('/api/ensayos'),
      updateStatus: (id: string | number) => `/api/ensayos/${id}/status`,
    },

    perforaciones: {
      ...createCrudEndpoints('/api/perforaciones'),
      ensayos: (id: string | number) => `/api/perforaciones/${id}/ensayos`,
      muestras: (id: string | number) => `/api/perforaciones/${id}/muestras`,
    },

    muestras: {
      ...createCrudEndpoints('/api/muestras'),
      ensayos: (id: string | number) => `/api/muestras/${id}/ensayos`,
    },

    equipos: createCrudEndpoints('/api/equipos'),

    sensores: createCrudEndpoints('/api/sensores'),

    personalInterno: createCrudEndpoints('/api/personal-interno'),

    comprobaciones: {
      ...createCrudEndpoints('/api/comprobaciones'),
      byEquipo: (equipoId: string | number) => `/api/comprobaciones/equipo/${equipoId}`,
    },

    calibraciones: {
      ...createCrudEndpoints('/api/calibraciones'),
      byEquipo: (equipoId: string | number) => `/api/calibraciones/equipo/${equipoId}`,
    },

    usuarios: createCrudEndpoints('/api/usuarios'),

    reportes: {
      ...createCrudEndpoints('/api/reportes'),
      download: (id: string | number) => `/api/reportes/${id}/download`,
    },

    dashboard: {
      stats: '/api/dashboard/stats',
      pending: '/api/dashboard/pendientes',
      recent: '/api/dashboard/recientes',
    },

    tiposEnsayo: {
      list: '/api/tipos-ensayo',
      get: (id: string | number) => `/api/tipos-ensayo/${id}`,
    },
  },
};

// ============================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ============================================
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Laboratorio Ingetec',
  env: import.meta.env.VITE_APP_ENV || 'development',
  version: '1.0.0',
  labName: 'Laboratorio Ingetec',
  accreditation: 'ISO/IEC 17025:2017',

  // Prefijos para códigos
  prefixes: {
    proyecto: 'PRY',
    perforacion: 'PER',
    ensayo: 'ENS',
    informe: 'INF',
    cliente: 'CLI',
    equipo: 'EQP',
  },

  // Formato de fechas
  dateFormat: 'DD/MM/YYYY',
  dateTimeFormat: 'DD/MM/YYYY HH:mm',
};

// ============================================
// ESTADOS DE WORKFLOW (Fuente única de verdad)
// ============================================

/**
 * Información completa de estados del workflow de ensayos
 * E1-E15: Estados desde solicitud hasta facturación
 */
export const WORKFLOW_STATES_INFO: Record<string, WorkflowStateInfo> = {
  E1: {
    nombre: 'Sin programación',
    color: '#9CA3AF',
    fase: 'inicial',
    descripcion: 'Esperando programación',
  },
  E2: {
    nombre: 'Programado',
    color: '#F59E0B',
    fase: 'inicial',
    descripcion: 'Programado sin ejecutar',
  },
  E3: { nombre: 'Anulado', color: '#EF4444', fase: 'terminal', descripcion: 'Ensayo anulado' },
  E4: {
    nombre: 'Repetición',
    color: '#F97316',
    fase: 'inicial',
    descripcion: 'Requiere repetición',
  },
  E5: { nombre: 'Novedad', color: '#EAB308', fase: 'inicial', descripcion: 'Presenta novedad' },
  E6: {
    nombre: 'En ejecución',
    color: '#3B82F6',
    fase: 'ejecucion',
    descripcion: 'Ensayo en curso',
  },
  E7: {
    nombre: 'Espera ensayos',
    color: '#6366F1',
    fase: 'ejecucion',
    descripcion: 'Esperando otros ensayos',
  },
  E8: {
    nombre: 'Procesamiento',
    color: '#8B5CF6',
    fase: 'ejecucion',
    descripcion: 'Procesando datos',
  },
  E9: {
    nombre: 'Rev. Técnica',
    color: '#A855F7',
    fase: 'revision',
    descripcion: 'En revisión técnica',
  },
  E10: {
    nombre: 'Rev. Coordinación',
    color: '#D946EF',
    fase: 'revision',
    descripcion: 'En revisión de coordinación',
  },
  E11: {
    nombre: 'Rev. Dirección',
    color: '#EC4899',
    fase: 'revision',
    descripcion: 'En revisión de dirección',
  },
  E12: {
    nombre: 'Por enviar',
    color: '#14B8A6',
    fase: 'entrega',
    descripcion: 'Listo para enviar',
  },
  E13: { nombre: 'Enviado', color: '#10B981', fase: 'entrega', descripcion: 'Enviado al cliente' },
  E14: {
    nombre: 'Entregado',
    color: '#22C55E',
    fase: 'entrega',
    descripcion: 'Entregado y confirmado',
  },
  E15: {
    nombre: 'Facturado',
    color: '#16A34A',
    fase: 'terminal',
    descripcion: 'Facturado y cerrado',
  },
};

/**
 * Transiciones permitidas en el workflow
 */
export const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  E1: ['E2', 'E3'], // Sin programación → Programado o Anulado
  E2: ['E6', 'E3', 'E5'], // Programado → En ejecución, Anulado o Novedad
  E3: [], // Anulado (terminal)
  E4: ['E2', 'E6'], // Repetición → Programado o En ejecución
  E5: ['E2', 'E3'], // Novedad → Programado o Anulado
  E6: ['E7', 'E8', 'E4', 'E5'], // En ejecución → Espera, Procesamiento, Repetición o Novedad
  E7: ['E6', 'E8'], // Espera → En ejecución o Procesamiento
  E8: ['E9', 'E4'], // Procesamiento → Rev. Técnica o Repetición
  E9: ['E10', 'E8'], // Rev. Técnica → Rev. Coordinación o Procesamiento
  E10: ['E11', 'E9'], // Rev. Coordinación → Rev. Dirección o Rev. Técnica
  E11: ['E12', 'E10'], // Rev. Dirección → Por enviar o Rev. Coordinación
  E12: ['E13'], // Por enviar → Enviado
  E13: ['E14'], // Enviado → Entregado
  E14: ['E15'], // Entregado → Facturado
  E15: [], // Facturado (terminal)
};

/**
 * Helper para obtener info de un estado de workflow
 */
export const getWorkflowInfo = (state: string): WorkflowStateInfo =>
  WORKFLOW_STATES_INFO[state] || {
    nombre: 'Desconocido',
    color: '#6B7280',
    fase: 'unknown',
    descripcion: '',
  };

/**
 * Helper para verificar si una transición es válida
 */
export const canTransition = (fromState: string, toState: string): boolean => {
  const allowed = WORKFLOW_TRANSITIONS[fromState] || [];
  return allowed.includes(toState);
};

/**
 * Helper para obtener las transiciones disponibles desde un estado
 */
export const getAvailableTransitions = (currentState: string) => {
  const transitions = WORKFLOW_TRANSITIONS[currentState] || [];
  return transitions.map(state => ({
    codigo: state,
    ...WORKFLOW_STATES_INFO[state],
  }));
};

// ============================================
// ESTADOS DE ENTIDADES
// ============================================

export const ESTADO_PROYECTO: Record<string, EstadoInfo> = {
  activo: { label: 'Activo', color: '#10B981' },
  pausado: { label: 'Pausado', color: '#F59E0B' },
  completado: { label: 'Completado', color: '#6B7280' },
  cancelado: { label: 'Cancelado', color: '#EF4444' },
};

export const ESTADO_MUESTRA: Record<string, EstadoInfo> = {
  pendiente: { label: 'Pendiente', color: '#F59E0B' },
  en_proceso: { label: 'En Proceso', color: '#3B82F6' },
  completado: { label: 'Completado', color: '#10B981' },
};

export const ESTADO_EQUIPO: Record<string, EstadoInfo> = {
  operativo: { label: 'Operativo', color: '#10B981' },
  en_calibracion: { label: 'En Calibración', color: '#F59E0B' },
  fuera_servicio: { label: 'Fuera de Servicio', color: '#EF4444' },
  baja: { label: 'Dado de Baja', color: '#6B7280' },
};

// ============================================
// TIPOS DE ENSAYOS
// ============================================
export const TIPOS_ENSAYO: TipoEnsayo[] = [
  { id: 'traccion', nombre: 'Ensayo de Tracción', categoria: 'mecanico', norma: 'ASTM E8' },
  { id: 'dureza', nombre: 'Ensayo de Dureza', categoria: 'mecanico', norma: 'ASTM E18' },
  { id: 'impacto', nombre: 'Ensayo de Impacto', categoria: 'mecanico', norma: 'ASTM E23' },
  { id: 'compresion', nombre: 'Ensayo de Compresión', categoria: 'mecanico', norma: 'ASTM E9' },
  { id: 'quimico_oes', nombre: 'Análisis Químico OES', categoria: 'quimico', norma: 'ASTM E415' },
  { id: 'quimico_xrf', nombre: 'Análisis XRF', categoria: 'quimico', norma: 'ASTM E1621' },
  { id: 'ultrasonido', nombre: 'Ultrasonido Industrial', categoria: 'end', norma: 'ASTM E114' },
  { id: 'radiografia', nombre: 'Radiografía Industrial', categoria: 'end', norma: 'ASTM E94' },
  {
    id: 'metalografia',
    nombre: 'Análisis Metalográfico',
    categoria: 'metalografia',
    norma: 'ASTM E3',
  },
  {
    id: 'calibracion',
    nombre: 'Calibración de Equipos',
    categoria: 'calibracion',
    norma: 'ISO 17025',
  },
];

/**
 * Helper para obtener info de tipo de ensayo
 */
export const getTipoEnsayo = (tipoId: string): TipoEnsayo =>
  TIPOS_ENSAYO.find(t => t.id === tipoId) || {
    id: tipoId,
    nombre: tipoId,
    categoria: 'otro',
    norma: '',
  };

// ============================================
// TIPOS DE MUESTRAS
// ============================================
export const TIPOS_MUESTRA: TipoMuestra[] = [
  {
    id: 'alterado',
    nombre: 'Suelo Alterado',
    descripcion: 'Muestra de suelo con estructura perturbada',
  },
  {
    id: 'inalterado',
    nombre: 'Suelo Inalterado',
    descripcion: 'Muestra de suelo con estructura preservada',
  },
  { id: 'roca', nombre: 'Núcleo de Roca', descripcion: 'Muestra de roca obtenida con corona' },
  { id: 'spt', nombre: 'SPT', descripcion: 'Muestra del ensayo de penetración estándar' },
  { id: 'shelby', nombre: 'Shelby', descripcion: 'Muestra inalterada obtenida con tubo Shelby' },
];

/**
 * Helper para obtener info de tipo de muestra
 */
export const getTipoMuestra = (tipoId: string): TipoMuestra =>
  TIPOS_MUESTRA.find(t => t.id === tipoId) || {
    id: tipoId,
    nombre: tipoId,
    descripcion: '',
  };

// ============================================
// ROLES Y PERMISOS
// ============================================
export const ROLES: Record<string, RolInfo> = {
  ADMIN: {
    value: 'admin',
    label: 'Administrador',
    permisos: ['all'],
    descripcion: 'Acceso total al sistema',
  },
  COORDINADOR: {
    value: 'coordinador',
    label: 'Coordinador',
    permisos: ['proyectos', 'ensayos', 'reportes', 'clientes', 'equipos', 'revision'],
    descripcion: 'Gestión de proyectos y revisión técnica',
  },
  TECNICO: {
    value: 'tecnico',
    label: 'Técnico',
    permisos: ['ensayos', 'reportes', 'equipos'],
    descripcion: 'Ejecución de ensayos y reportes',
  },
  CLIENTE: {
    value: 'cliente',
    label: 'Cliente',
    permisos: ['ver_proyectos', 'ver_ensayos', 'ver_reportes', 'solicitar_ensayos'],
    descripcion: 'Acceso a sus proyectos y reportes',
  },
  DISENO: {
    value: 'diseno',
    label: 'Diseño',
    permisos: ['diseno_reportes'],
    descripcion: 'Diseño y formato de informes',
  },
};

// ============================================
// NAVEGACIÓN
// ============================================
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    roles: ['admin', 'coordinador', 'tecnico', 'cliente'],
  },
  {
    label: 'Proyectos',
    path: '/proyectos',
    icon: 'folder',
    roles: ['admin', 'coordinador', 'tecnico'],
  },
  { label: 'Mis Proyectos', path: '/mis-proyectos', icon: 'folder', roles: ['cliente'] },
  { label: 'Ensayos', path: '/ensayos', icon: 'test', roles: ['admin', 'coordinador', 'tecnico'] },
  {
    label: 'Equipos',
    path: '/equipos',
    icon: 'equipment',
    roles: ['admin', 'coordinador', 'tecnico'],
  },
  { label: 'Personal', path: '/usuarios', icon: 'users', roles: ['admin', 'coordinador'] },
];

// ============================================
// ESTADÍSTICAS DASHBOARD
// ============================================
export const DASHBOARD_STATS: DashboardStat[] = [
  { key: 'pendientes', label: 'Pendientes', icon: 'pending', estados: ['E1', 'E2'] },
  { key: 'en_proceso', label: 'En Proceso', icon: 'process', estados: ['E6', 'E7', 'E8'] },
  { key: 'en_revision', label: 'En Revisión', icon: 'review', estados: ['E9', 'E10', 'E11'] },
  {
    key: 'completados',
    label: 'Completados',
    icon: 'completed',
    estados: ['E12', 'E13', 'E14', 'E15'],
  },
  { key: 'otros', label: 'Otros', icon: 'others', estados: ['E3', 'E4', 'E5'] },
];
