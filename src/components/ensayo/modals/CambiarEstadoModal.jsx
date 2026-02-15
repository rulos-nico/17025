/**
 * CambiarEstadoModal - Modal para cambiar el estado de workflow de un ensayo
 */

import { useState } from 'react';
import { Modal } from '../../ui';
import { Badge } from '../../ui';
import { WORKFLOW_TRANSITIONS, getWorkflowInfo } from '../../../config';
import { filterTransitionsByRole } from '../../../utils/permissions';
import styles from './CambiarEstadoModal.module.css';

/**
 * Modal para cambiar el estado de workflow de un ensayo
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal esta abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.ensayo - Ensayo a modificar
 * @param {Function} props.onCambiar - Callback al cambiar estado (ensayoId, nuevoEstado, comentario)
 * @param {string} props.userRole - Rol del usuario actual
 */
export function CambiarEstadoModal({ isOpen, onClose, ensayo, onCambiar, userRole }) {
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [comentario, setComentario] = useState('');

  const estadoActual = ensayo?.workflow_state || ensayo?.workflowState || 'E1';
  const transicionesPermitidas = WORKFLOW_TRANSITIONS[estadoActual] || [];
  const transicionesDisponibles = filterTransitionsByRole(transicionesPermitidas, userRole);

  const handleSubmit = e => {
    e.preventDefault();
    onCambiar(ensayo.id, nuevoEstado, comentario);
    setNuevoEstado('');
    setComentario('');
  };

  const handleClose = () => {
    setNuevoEstado('');
    setComentario('');
    onClose();
  };

  if (!ensayo) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Cambiar Estado - ${ensayo.codigo}`}>
      <form onSubmit={handleSubmit}>
        <div className={styles.content}>
          <div className={styles.estadoActual}>
            <strong>Estado actual:</strong>
            <Badge color={getWorkflowInfo(estadoActual).color}>
              {estadoActual} - {getWorkflowInfo(estadoActual).nombre}
            </Badge>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Nuevo Estado *</label>
            <select
              value={nuevoEstado}
              onChange={e => setNuevoEstado(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Seleccionar...</option>
              {transicionesDisponibles.map(estado => {
                const info = getWorkflowInfo(estado);
                return (
                  <option key={estado} value={estado}>
                    {estado} - {info.nombre}
                  </option>
                );
              })}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Comentario</label>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              rows={3}
              placeholder="Observaciones del cambio de estado..."
              className={styles.textarea}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={handleClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button type="submit" disabled={!nuevoEstado} className={styles.btnSubmit}>
              Cambiar Estado
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default CambiarEstadoModal;
