/**
 * Permissions - Helpers para verificar permisos basados en roles
 *
 * Centraliza la lógica de autorización para evitar duplicación
 * y facilitar el mantenimiento de reglas de negocio.
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
// HELPERS DE VERIFICACIÓN DE PERMISOS
// ============================================

/**
 * Verifica si el rol puede cambiar estado de ensayos
 * @param {string} rol - Rol del usuario
 * @returns {boolean}
 */
export const canChangeState = rol => ROLES_CON_CAMBIO_ESTADO.includes(rol);

/**
 * Verifica si el rol puede reasignar técnicos a ensayos
 * @param {string} rol - Rol del usuario
 * @returns {boolean}
 */
export const canReassign = rol => ROLES_CON_REASIGNACION.includes(rol);

/**
 * Verifica si el rol puede aprobar/rechazar revisiones
 * @param {string} rol - Rol del usuario
 * @returns {boolean}
 */
export const canApproveReject = rol => ROLES_CON_APROBACION.includes(rol);

/**
 * Verifica si el rol puede marcar ensayos como novedad
 * @param {string} rol - Rol del usuario
 * @returns {boolean}
 */
export const canMarkAsNovedad = rol => ROLES_CON_NOVEDAD.includes(rol);

/**
 * Verifica si el rol es de tipo cliente
 * @param {string} rol - Rol del usuario
 * @returns {boolean}
 */
export const isClienteRole = rol => rol === 'cliente';

/**
 * Verifica si un ensayo puede ser marcado como novedad según su estado
 * @param {string} workflowState - Estado actual del ensayo
 * @returns {boolean}
 */
export const canEnsayoHaveNovedad = workflowState => !ESTADOS_SIN_NOVEDAD.includes(workflowState);

// ============================================
// FILTRADO DE TRANSICIONES POR ROL
// ============================================

/**
 * Filtra las transiciones de workflow disponibles según el rol del usuario
 * Los técnicos no pueden aprobar revisiones (E10, E11, E12)
 *
 * @param {Array<string>} transiciones - Array de estados de destino permitidos
 * @param {string} userRole - Rol del usuario actual
 * @returns {Array<string>} - Transiciones filtradas según el rol
 */
export const filterTransitionsByRole = (transiciones, userRole) => {
  if (!Array.isArray(transiciones)) return [];

  if (userRole === 'tecnico') {
    return transiciones.filter(estado => !ESTADOS_APROBACION.includes(estado));
  }

  return transiciones;
};

/**
 * Verifica si el usuario puede realizar una transición específica
 * @param {string} fromState - Estado origen
 * @param {string} toState - Estado destino
 * @param {string} userRole - Rol del usuario
 * @param {Array<string>} allowedTransitions - Transiciones permitidas desde el estado origen
 * @returns {boolean}
 */
export const canPerformTransition = (fromState, toState, userRole, allowedTransitions = []) => {
  // Verificar que la transición esté permitida en general
  if (!allowedTransitions.includes(toState)) {
    return false;
  }

  // Verificar restricciones por rol
  const filteredTransitions = filterTransitionsByRole(allowedTransitions, userRole);
  return filteredTransitions.includes(toState);
};
