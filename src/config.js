/**
 * Configuración centralizada de la aplicación
 * Sistema de gestión y entregables para laboratorio ISO/IEC 17025:2017
 *
 * ARQUITECTURA: Google Drive + Google Sheets como backend
 * - Drive: Almacenamiento de archivos (plantillas, ensayos, informes)
 * - Sheets: Base de datos (proyectos, clientes, ensayos, usuarios)
 */

// ============================================
// CONFIGURACIÓN DE API (Mock para desarrollo)
// ============================================
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      profile: '/api/auth/profile',
      refresh: '/api/auth/refresh',
    },
    ensayos: {
      list: '/api/ensayos',
      create: '/api/ensayos',
      detail: id => `/api/ensayos/${id}`,
      update: id => `/api/ensayos/${id}`,
      delete: id => `/api/ensayos/${id}`,
      updateStatus: id => `/api/ensayos/${id}/status`,
    },
    clientes: {
      list: '/api/clientes',
      create: '/api/clientes',
      detail: id => `/api/clientes/${id}`,
      update: id => `/api/clientes/${id}`,
      delete: id => `/api/clientes/${id}`,
    },
    reportes: {
      list: '/api/reportes',
      create: '/api/reportes',
      detail: id => `/api/reportes/${id}`,
      download: id => `/api/reportes/${id}/download`,
    },
    usuarios: {
      list: '/api/usuarios',
      create: '/api/usuarios',
      detail: id => `/api/usuarios/${id}`,
      update: id => `/api/usuarios/${id}`,
      delete: id => `/api/usuarios/${id}`,
    },
    dashboard: {
      stats: '/api/dashboard/stats',
      pending: '/api/dashboard/pendientes',
      recent: '/api/dashboard/recientes',
    },
    equipos: {
      list: '/api/equipos',
      create: '/api/equipos',
      detail: id => `/api/equipos/${id}`,
      update: id => `/api/equipos/${id}`,
      delete: id => `/api/equipos/${id}`,
    },
    proyectos: {
      list: '/api/proyectos',
      create: '/api/proyectos',
      detail: id => `/api/proyectos/${id}`,
      update: id => `/api/proyectos/${id}`,
      delete: id => `/api/proyectos/${id}`,
      perforaciones: id => `/api/proyectos/${id}/perforaciones`,
      ensayos: id => `/api/proyectos/${id}/ensayos`,
    },
    perforaciones: {
      list: '/api/perforaciones',
      create: '/api/perforaciones',
      detail: id => `/api/perforaciones/${id}`,
      update: id => `/api/perforaciones/${id}`,
      ensayos: id => `/api/perforaciones/${id}/ensayos`,
      muestras: id => `/api/perforaciones/${id}/muestras`,
    },
    muestras: {
      list: '/api/muestras',
      create: '/api/muestras',
      detail: id => `/api/muestras/${id}`,
      update: id => `/api/muestras/${id}`,
      delete: id => `/api/muestras/${id}`,
      ensayos: id => `/api/muestras/${id}/ensayos`,
    },
  },
};

// ============================================
// CONFIGURACIÓN DE GOOGLE SERVICES
// ============================================
export const GOOGLE_CONFIG = {
  // Credenciales OAuth
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,

  // Scopes requeridos
  scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'],

  // Discovery docs para las APIs
  discoveryDocs: [
    'https://sheets.googleapis.com/$discovery/rest?version=v4',
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  ],
};

// ============================================
// ESTRUCTURA DE GOOGLE DRIVE
// ============================================
export const DRIVE_CONFIG = {
  // Carpeta raíz del laboratorio
  rootFolderId: import.meta.env.VITE_DRIVE_ROOT_FOLDER_ID,

  // Estructura de carpetas (IDs se configuran en .env)
  folders: {
    // Base de datos central (Google Sheet)
    dbMaster: {
      id: import.meta.env.VITE_DRIVE_DB_MASTER_ID,
      name: '_BD_MASTER',
    },

    // Plantillas de ensayos
    plantillas: {
      id: import.meta.env.VITE_DRIVE_FOLDER_PLANTILLAS,
      name: '01_PLANTILLAS',
    },

    // Proyectos (organizados por año)
    proyectos: {
      id: import.meta.env.VITE_DRIVE_FOLDER_PROYECTOS,
      name: '02_PROYECTOS',
    },

    // Carpetas de clientes (shortcuts a proyectos)
    clientes: {
      id: import.meta.env.VITE_DRIVE_FOLDER_CLIENTES,
      name: '03_CLIENTES',
    },

    // Equipos y calibraciones
    equipos: {
      id: import.meta.env.VITE_DRIVE_FOLDER_EQUIPOS,
      name: '04_EQUIPOS',
    },

    // Sistema de calidad ISO 17025
    calidad: {
      id: import.meta.env.VITE_DRIVE_FOLDER_CALIDAD,
      name: '05_CALIDAD',
    },
  },

  // Plantillas de ensayos por tipo
  plantillas: {
    traccion: import.meta.env.VITE_PLANTILLA_TRACCION_ID,
    dureza: import.meta.env.VITE_PLANTILLA_DUREZA_ID,
    impacto: import.meta.env.VITE_PLANTILLA_IMPACTO_ID,
    compresion: import.meta.env.VITE_PLANTILLA_COMPRESION_ID,
    quimico_oes: import.meta.env.VITE_PLANTILLA_QUIMICO_OES_ID,
    quimico_xrf: import.meta.env.VITE_PLANTILLA_QUIMICO_XRF_ID,
    ultrasonido: import.meta.env.VITE_PLANTILLA_ULTRASONIDO_ID,
    radiografia: import.meta.env.VITE_PLANTILLA_RADIOGRAFIA_ID,
    metalografia: import.meta.env.VITE_PLANTILLA_METALOGRAFIA_ID,
    default: import.meta.env.VITE_PLANTILLA_DEFAULT_ID,
  },

  // Helpers para URLs
  urls: {
    folder: id => `https://drive.google.com/drive/folders/${id}`,
    file: id => `https://drive.google.com/file/d/${id}/view`,
    sheet: id => `https://docs.google.com/spreadsheets/d/${id}/edit`,
    sheetExport: (id, format = 'xlsx') =>
      `https://docs.google.com/spreadsheets/d/${id}/export?format=${format}`,
    pdfExport: id => `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf`,
  },
};

// ============================================
// ESTRUCTURA DE BASE DE DATOS (Google Sheets)
// ============================================
export const DB_CONFIG = {
  // ID del spreadsheet maestro
  spreadsheetId: import.meta.env.VITE_DRIVE_DB_MASTER_ID,

  // Hojas (tabs) de la base de datos
  sheets: {
    proyectos: {
      name: 'Proyectos',
      columns: [
        'id',
        'codigo',
        'nombre',
        'descripcion',
        'cliente_id',
        'cliente_nombre',
        'contacto',
        'estado',
        'fecha_inicio',
        'fecha_fin_estimada',
        'fecha_fin_real',
        'drive_folder_id',
        'created_at',
        'updated_at',
        'created_by',
      ],
    },
    perforaciones: {
      name: 'Perforaciones',
      columns: [
        'id',
        'codigo',
        'proyecto_id',
        'descripcion',
        'ubicacion',
        'profundidad',
        'fecha_solicitud',
        'estado',
        'drive_folder_id',
        'created_at',
        'updated_at',
      ],
    },
    ensayos: {
      name: 'Ensayos',
      columns: [
        'id',
        'codigo',
        'tipo',
        'perforacion_id',
        'proyecto_id',
        'cliente_id',
        'muestra',
        'norma',
        'workflow_state',
        'fecha_solicitud',
        'fecha_programada',
        'fecha_ejecucion',
        'fecha_entrega',
        'tecnico_id',
        'tecnico_nombre',
        'sheet_id',
        'sheet_url',
        'informe_id',
        'informe_url',
        'observaciones',
        'urgente',
        'created_at',
        'updated_at',
      ],
    },
    clientes: {
      name: 'Clientes',
      columns: [
        'id',
        'codigo',
        'nombre',
        'rut',
        'direccion',
        'ciudad',
        'telefono',
        'email',
        'contacto_nombre',
        'contacto_cargo',
        'contacto_email',
        'contacto_telefono',
        'activo',
        'drive_folder_id',
        'created_at',
        'updated_at',
      ],
    },
    usuarios: {
      name: 'Usuarios',
      columns: [
        'id',
        'email',
        'nombre',
        'apellido',
        'rol',
        'cargo',
        'telefono',
        'activo',
        'cliente_id',
        'last_login',
        'created_at',
        'updated_at',
      ],
    },
    equipos: {
      name: 'Equipos',
      columns: [
        'id',
        'codigo',
        'nombre',
        'marca',
        'modelo',
        'serie',
        'ubicacion',
        'estado',
        'fecha_calibracion',
        'proxima_calibracion',
        'certificado_id',
        'responsable',
        'observaciones',
        'created_at',
        'updated_at',
      ],
    },
    logs: {
      name: 'Logs',
      columns: [
        'id',
        'timestamp',
        'usuario_id',
        'usuario_nombre',
        'accion',
        'entidad',
        'entidad_id',
        'datos_antes',
        'datos_despues',
        'ip',
        'user_agent',
      ],
    },
  },

  // Configuración de rangos para lectura/escritura
  ranges: {
    proyectos: 'Proyectos!A:O',
    perforaciones: 'Perforaciones!A:K',
    ensayos: 'Ensayos!A:V',
    clientes: 'Clientes!A:P',
    usuarios: 'Usuarios!A:L',
    equipos: 'Equipos!A:O',
    logs: 'Logs!A:K',
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
export const WORKFLOW_STATES_INFO = {
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
export const WORKFLOW_TRANSITIONS = {
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
export const getWorkflowInfo = state =>
  WORKFLOW_STATES_INFO[state] || {
    nombre: 'Desconocido',
    color: '#6B7280',
    fase: 'unknown',
    descripcion: '',
  };

/**
 * Helper para verificar si una transición es válida
 */
export const canTransition = (fromState, toState) => {
  const allowed = WORKFLOW_TRANSITIONS[fromState] || [];
  return allowed.includes(toState);
};

/**
 * Helper para obtener las transiciones disponibles desde un estado
 */
export const getAvailableTransitions = currentState => {
  const transitions = WORKFLOW_TRANSITIONS[currentState] || [];
  return transitions.map(state => ({
    codigo: state,
    ...WORKFLOW_STATES_INFO[state],
  }));
};

// ============================================
// ESTADOS DE ENTIDADES
// ============================================

export const ESTADO_PROYECTO = {
  activo: { label: 'Activo', color: '#10B981' },
  pausado: { label: 'Pausado', color: '#F59E0B' },
  completado: { label: 'Completado', color: '#6B7280' },
  cancelado: { label: 'Cancelado', color: '#EF4444' },
};

export const ESTADO_MUESTRA = {
  pendiente: { label: 'Pendiente', color: '#F59E0B' },
  en_proceso: { label: 'En Proceso', color: '#3B82F6' },
  completado: { label: 'Completado', color: '#10B981' },
};

export const ESTADO_EQUIPO = {
  operativo: { label: 'Operativo', color: '#10B981' },
  en_calibracion: { label: 'En Calibración', color: '#F59E0B' },
  fuera_servicio: { label: 'Fuera de Servicio', color: '#EF4444' },
  baja: { label: 'Dado de Baja', color: '#6B7280' },
};

// ============================================
// TIPOS DE ENSAYOS
// ============================================
export const TIPOS_ENSAYO = [
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
export const getTipoEnsayo = tipoId =>
  TIPOS_ENSAYO.find(t => t.id === tipoId) || {
    id: tipoId,
    nombre: tipoId,
    categoria: 'otro',
    norma: '',
  };

// ============================================
// TIPOS DE MUESTRAS
// ============================================
export const TIPOS_MUESTRA = [
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
export const getTipoMuestra = tipoId =>
  TIPOS_MUESTRA.find(t => t.id === tipoId) || {
    id: tipoId,
    nombre: tipoId,
    descripcion: '',
  };

// ============================================
// ROLES Y PERMISOS
// ============================================
export const ROLES = {
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
export const NAV_ITEMS = [
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
export const DASHBOARD_STATS = [
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
