/**
 * EnsayoCard - Tarjeta de ensayo para vista Kanban
 */

import { Badge } from '../ui';
import { TIPOS_ENSAYO, getWorkflowInfo, WORKFLOW_TRANSITIONS } from '../../config';
import {
  canChangeState,
  canMarkAsNovedad,
  canReassign,
  isClienteRole,
  canEnsayoHaveNovedad,
} from '../../utils/permissions';
import styles from './EnsayoCard.module.css';

/**
 * Tarjeta individual de ensayo para el tablero Kanban
 *
 * @param {Object} props
 * @param {Object} props.ensayo - Datos del ensayo
 * @param {Array} props.tecnicos - Lista de tecnicos
 * @param {Function} props.onClick - Callback al hacer click en la tarjeta
 * @param {Function} props.onCambiarEstado - Callback para cambiar estado
 * @param {Function} props.onNovedad - Callback para marcar como novedad
 * @param {Function} props.onReasignar - Callback para reasignar
 * @param {string} props.userRole - Rol del usuario actual
 * @param {boolean} props.isOwnEnsayo - Si el ensayo pertenece al usuario actual
 */
export function EnsayoCard({
  ensayo,
  tecnicos,
  onClick,
  onCambiarEstado,
  onNovedad,
  onReasignar,
  userRole,
  isOwnEnsayo,
}) {
  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);
  const tecnicoId = ensayo.tecnicoId || ensayo.tecnico_id;
  const tecnico = tecnicos.find(t => t.id === tecnicoId);
  const workflowState = ensayo.workflow_state || ensayo.workflowState || 'E1';
  const estadoInfo = getWorkflowInfo(workflowState);
  const novedadRazon = ensayo.novedad_razon || ensayo.novedadRazon;

  const showActions = !isClienteRole(userRole);
  const puedeAvanzar = canChangeState(userRole) && WORKFLOW_TRANSITIONS[workflowState]?.length > 0;
  const puedeNovedad = canMarkAsNovedad(userRole) && canEnsayoHaveNovedad(workflowState);

  return (
    <div className={isOwnEnsayo ? styles.cardOwn : styles.card} onClick={onClick}>
      <div className={styles.header}>
        <div className={styles.codigo}>{ensayo.codigo}</div>
        <Badge color={estadoInfo.color} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
          {workflowState}
        </Badge>
      </div>

      <div className={styles.tipo}>{tipoEnsayo?.nombre || ensayo.tipo}</div>

      <div className={styles.muestra}>{ensayo.muestra}</div>

      {tecnico && (
        <div className={styles.tecnico}>
          Tecnico: {tecnico.nombre} {tecnico.apellido}
        </div>
      )}

      {novedadRazon && (
        <div className={styles.novedad}>Novedad: {novedadRazon.substring(0, 50)}...</div>
      )}

      {showActions && (
        <div className={styles.actions} onClick={e => e.stopPropagation()}>
          {puedeAvanzar && (
            <button onClick={() => onCambiarEstado(ensayo)} className={styles.btnPrimary}>
              Cambiar
            </button>
          )}
          {puedeNovedad && (
            <button onClick={() => onNovedad(ensayo)} className={styles.btnWarning}>
              Novedad
            </button>
          )}
          {canReassign(userRole) && (
            <button onClick={() => onReasignar(ensayo)} className={styles.btnSecondary}>
              Reasignar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EnsayoCard;
