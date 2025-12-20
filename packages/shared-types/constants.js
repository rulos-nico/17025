/**
 * Constantes del sistema
 */

export const MENSAJES_ERROR = {
  NO_AUTORIZADO: 'No tienes permisos para realizar esta acción',
  SESION_EXPIRADA: 'Tu sesión ha expirado',
  ERROR_SERVIDOR: 'Error en el servidor. Intenta nuevamente',
  DATOS_INVALIDOS: 'Los datos ingresados no son válidos',
  RECURSO_NO_ENCONTRADO: 'Recurso no encontrado'
}

export const MENSAJES_EXITO = {
  GUARDADO: 'Guardado exitosamente',
  ELIMINADO: 'Eliminado correctamente',
  ACTUALIZADO: 'Actualizado correctamente'
}

export const RUTAS_API = {
  AUTH: '/api/auth',
  ENTREGABLES: '/api/entregables',
  MUESTRAS: '/api/muestras',
  INFORMES: '/api/informes',
  CLIENTES: '/api/clientes',
  EQUIPOS: '/api/equipos',
  PERSONAL: '/api/personal',
  USUARIOS: '/api/usuarios'
}

export const CONFIGURACION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  TIMEOUT_REQUEST: 30000, // 30 segundos
  ITEMS_PER_PAGE: 20
}
