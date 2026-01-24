/**
 * Configuración centralizada de la aplicación
 * Sistema de gestión y entregables para laboratorio ISO/IEC 17025:2017
 */

// Configuración de API
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  endpoints: {
    // Autenticación
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      profile: '/api/auth/profile',
      refresh: '/api/auth/refresh',
    },
    // Ensayos
    ensayos: {
      list: '/api/ensayos',
      create: '/api/ensayos',
      detail: (id) => `/api/ensayos/${id}`,
      update: (id) => `/api/ensayos/${id}`,
      delete: (id) => `/api/ensayos/${id}`,
      updateStatus: (id) => `/api/ensayos/${id}/status`,
      assign: (id) => `/api/ensayos/${id}/asignar`,
    },
    // Clientes
    clientes: {
      list: '/api/clientes',
      create: '/api/clientes',
      detail: (id) => `/api/clientes/${id}`,
      update: (id) => `/api/clientes/${id}`,
      delete: (id) => `/api/clientes/${id}`,
      ensayos: (id) => `/api/clientes/${id}/ensayos`,
    },
    // Reportes y Entregables
    reportes: {
      list: '/api/reportes',
      create: '/api/reportes',
      detail: (id) => `/api/reportes/${id}`,
      download: (id) => `/api/reportes/${id}/download`,
      upload: (id) => `/api/reportes/${id}/upload`,
      approve: (id) => `/api/reportes/${id}/aprobar`,
    },
    // Usuarios y Personal
    usuarios: {
      list: '/api/usuarios',
      create: '/api/usuarios',
      detail: (id) => `/api/usuarios/${id}`,
      update: (id) => `/api/usuarios/${id}`,
      delete: (id) => `/api/usuarios/${id}`,
    },
    // Dashboard y Estadísticas
    dashboard: {
      stats: '/api/dashboard/stats',
      pending: '/api/dashboard/pendientes',
      recent: '/api/dashboard/recientes',
    },
    // Equipos y Calibración
    equipos: {
      list: '/api/equipos',
      detail: (id) => `/api/equipos/${id}`,
      marcas: '/api/equipos/marcas',
      modelos: '/api/equipos/modelos',
      tipos: '/api/equipos/tipos',
      localizaciones: '/api/equipos/localizaciones',
      placas: '/api/equipos/placas',
      calibration: (id) => `/api/equipos/${id}/calibracion`,
      incertidumbre: (id) => `/api/equipos/${id}/incertidumbre`,
      error_maximo: (id) => `/api/equipos/${id}/error_maximo`,
      tolerancia: (id) => `/api/equipos/${id}/tolerancia`,
      sensores: {
        list: '/api/equipos/sensores',
        byEquipo: (id) => `/api/equipos/${id}/sensores`,
        detail: (id) => `/api/sensores/${id}`,
      },
    },
  },
};

// Configuración de la aplicación
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Laboratorio Ingetec',
  env: import.meta.env.VITE_APP_ENV || 'development',
  version: '1.0.0',
  labName: 'Laboratorio Ingetec',
  accreditation: 'ISO/IEC 17025:2017',
};

// Información del laboratorio
export const LAB_INFO = {
  email: import.meta.env.VITE_CONTACT_EMAIL || 'contacto@labmat17025.com',
  phone: import.meta.env.VITE_CONTACT_PHONE || '+123 456 7890',
  address: 'Tra ##, Av ##',
  city: 'Ciudad, País',
  postalCode: 'CP 12345',
};

// Estados de ensayos
export const ENSAYO_STATUS = {
  PENDIENTE: { value: 'pendiente', label: 'Pendiente', color: '#f59e0b' },
  EN_PROCESO: { value: 'en_proceso', label: 'En Proceso', color: '#3b82f6' },
  COMPLETADO: { value: 'completado', label: 'Completado', color: '#10b981' },
  REVISION: { value: 'revision', label: 'En Revisión', color: '#8b5cf6' },
  APROBADO: { value: 'aprobado', label: 'Aprobado', color: '#059669' },
  RECHAZADO: { value: 'rechazado', label: 'Rechazado', color: '#ef4444' },
};

// Tipos de ensayos
export const TIPOS_ENSAYO = [
  { id: 'traccion', nombre: 'Ensayo de Tracción', categoria: 'mecanico' },
  { id: 'dureza', nombre: 'Ensayo de Dureza', categoria: 'mecanico' },
  { id: 'impacto', nombre: 'Ensayo de Impacto', categoria: 'mecanico' },
  { id: 'compresion', nombre: 'Ensayo de Compresión', categoria: 'mecanico' },
  { id: 'quimico_oes', nombre: 'Análisis Químico OES', categoria: 'quimico' },
  { id: 'quimico_xrf', nombre: 'Análisis XRF', categoria: 'quimico' },
  { id: 'ultrasonido', nombre: 'Ultrasonido Industrial', categoria: 'end' },
  { id: 'radiografia', nombre: 'Radiografía Industrial', categoria: 'end' },
  { id: 'metalografia', nombre: 'Análisis Metalográfico', categoria: 'metalografia' },
  { id: 'calibracion', nombre: 'Calibración de Equipos', categoria: 'calibracion' },
];

// Módulos del sistema
export const MODULOS = [
  {
    id: 'dashboard',
    nombre: 'Dashboard',
    icono: 'dashboard',
    ruta: '/dashboard',
    descripcion: 'Vista general del laboratorio',
    permisos: ['admin', 'tecnico', 'cliente'],
  },
  {
    id: 'ensayos',
    nombre: 'Ensayos',
    icono: 'test',
    ruta: '/ensayos',
    descripcion: 'Gestión de ensayos y solicitudes',
    permisos: ['admin', 'tecnico'],
  },
  {
    id: 'clientes',
    nombre: 'Clientes',
    icono: 'clients',
    ruta: '/clientes',
    descripcion: 'Gestión de clientes',
    permisos: ['admin', 'tecnico'],
  },
  {
    id: 'reportes',
    nombre: 'Reportes',
    icono: 'reports',
    ruta: '/reportes',
    descripcion: 'Informes y entregables',
    permisos: ['admin', 'tecnico', 'cliente'],
  },
  {
    id: 'equipos',
    nombre: 'Equipos',
    icono: 'equipment',
    ruta: '/equipos',
    descripcion: 'Equipos y calibración',
    permisos: ['admin', 'tecnico'],
  },
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    icono: 'users',
    ruta: '/usuarios',
    descripcion: 'Gestión de usuarios',
    permisos: ['admin'],
  },
  {
    id: 'relacion_muestras',
    nombre: 'Relación Muestras',
    icono: 'reports',
    ruta: '/relacion_muestras',
    descripcion: 'Relación de muestras y ensayos',
    permisos: ['admin', 'tecnico'],
  }
];

// Roles de usuario
export const ROLES = {
  ADMIN: { value: 'admin', label: 'Administrador', permisos: ['all'] },
  TECNICO: { value: 'tecnico', label: 'Técnico', permisos: ['ensayos', 'reportes', 'equipos'] },
  CLIENTE: { value: 'cliente', label: 'Cliente', permisos: ['ver_ensayos', 'ver_reportes'] },
  DISENO: { value: 'diseno', label: 'Diseño', permisos: ['diseno_reportes'] },
};
// Navegación principal 
export const NAV_ITEMS = [ 
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['admin', 'tecnico', 'cliente'] },
  { label: 'Ensayos', path: '/ensayos', icon: 'test', roles: ['admin', 'tecnico'] },
  { label: 'Reportes', path: '/reportes', icon: 'reports', roles: ['admin', 'tecnico', 'cliente'] },
  { label: 'Relacion Muestras', path: '/relacion_muestras', icon: 'reports', roles: ['admin', 'tecnico'] },
  { label: 'Equipos', path: '/equipos', icon: 'equipment', roles: ['admin', 'tecnico'] },
  { label: 'Usuarios', path: '/usuarios', icon: 'users', roles: ['admin'] },
];

// Estadísticas del dashboard
export const DASHBOARD_STATS = [
  { key: 'pendientes', label: 'Ensayos Pendientes', icon: 'pending' },
  { key: 'en_proceso', label: 'En Proceso', icon: 'process' },
  { key: 'completados_mes', label: 'Completados Este Mes', icon: 'completed' },
  { key: 'clientes_activos', label: 'Clientes Activos', icon: 'clients' },
];
