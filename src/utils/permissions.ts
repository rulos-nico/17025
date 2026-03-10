/**
 * Permissions - Helpers para verificar permisos basados en roles
 *
 * Centraliza la lógica de autorización para evitar duplicación
 * y facilitar el mantenimiento de reglas de negocio.
 *
 * REGLA: El rol 'admin' tiene acceso total a todas las funcionalidades.
 */

// ============================================
// CONSTANTES DE ROLES
// ============================================

export const ROLES_CON_CAMBIO_ESTADO = ['admin', 'coordinador', 'tecnico'];
export const ROLES_CON_REASIGNACION = ['admin', 'coordinador'];
export const ROLES_CON_APROBACION = ['admin', 'coordinador'];
export const ROLES_CON_NOVEDAD = ['admin', 'coordinador', 'tecnico'];

// Estados que no permiten marcar como novedad
export const ESTADOS_SIN_NOVEDAD = ['E3', 'E5', 'E15'];

// Estados de aprobación (solo coordinador/admin pueden aprobar)
export const ESTADOS_APROBACION = ['E10', 'E11', 'E12'];

// ============================================
// ADMIN BYPASS
// ============================================

/**
 * Verifica si el rol es administrador.
 * El admin tiene acceso total a todas las funcionalidades.
 */
export const isAdmin = (rol: string): boolean => rol === 'admin';

// ============================================
// HELPERS DE VERIFICACIÓN DE PERMISOS
// ============================================

/**
 * Verifica si el rol puede cambiar estado de ensayos
 */
export const canChangeState = (rol: string): boolean =>
  isAdmin(rol) || ROLES_CON_CAMBIO_ESTADO.includes(rol);

/**
 * Verifica si el rol puede reasignar técnicos a ensayos
 */
export const canReassign = (rol: string): boolean =>
  isAdmin(rol) || ROLES_CON_REASIGNACION.includes(rol);

/**
 * Verifica si el rol puede aprobar/rechazar revisiones
 */
export const canApproveReject = (rol: string): boolean =>
  isAdmin(rol) || ROLES_CON_APROBACION.includes(rol);

/**
 * Verifica si el rol puede marcar ensayos como novedad
 */
export const canMarkAsNovedad = (rol: string): boolean =>
  isAdmin(rol) || ROLES_CON_NOVEDAD.includes(rol);

/**
 * Verifica si el rol es de tipo cliente
 */
export const isClienteRole = (rol: string): boolean => rol === 'cliente';

/**
 * Verifica si un ensayo puede ser marcado como novedad según su estado
 */
export const canEnsayoHaveNovedad = (workflowState: string): boolean =>
  !ESTADOS_SIN_NOVEDAD.includes(workflowState);

// ============================================
// FILTRADO DE TRANSICIONES POR ROL
// ============================================

/**
 * Filtra las transiciones de workflow disponibles según el rol del usuario.
 * Admin ve todas las transiciones. Los técnicos no pueden aprobar (E10, E11, E12).
 */
export const filterTransitionsByRole = (transiciones: string[], userRole: string): string[] => {
  if (!Array.isArray(transiciones)) return [];

  // Admin puede hacer todas las transiciones
  if (isAdmin(userRole)) return transiciones;

  if (userRole === 'tecnico') {
    return transiciones.filter(estado => !ESTADOS_APROBACION.includes(estado));
  }

  return transiciones;
};

/**
 * Verifica si el usuario puede realizar una transición específica
 */
export const canPerformTransition = (
  _fromState: string,
  toState: string,
  userRole: string,
  allowedTransitions: string[] = []
): boolean => {
  // Admin puede hacer cualquier transición permitida por el workflow
  if (isAdmin(userRole)) return allowedTransitions.includes(toState);

  // Verificar que la transición esté permitida en general
  if (!allowedTransitions.includes(toState)) {
    return false;
  }

  // Verificar restricciones por rol
  const filteredTransitions = filterTransitionsByRole(allowedTransitions, userRole);
  return filteredTransitions.includes(toState);
};
