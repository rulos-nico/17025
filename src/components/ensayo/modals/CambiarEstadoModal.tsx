/**
 * CambiarEstadoModal - Modal para cambiar el estado de workflow de un ensayo
 */

import { useState, type FormEvent } from 'react';
import { Modal, Badge } from '../../ui';
import { WORKFLOW_TRANSITIONS, getWorkflowInfo } from '../../../config';
import { filterTransitionsByRole } from '../../../utils/permissions';
import type { SelectedEnsayo } from '../../../hooks/useEnsayoModals';
import styles from './CambiarEstadoModal.module.css';

interface CambiarEstadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ensayo: SelectedEnsayo | null;
  onCambiar: (nuevoEstado: string, comentario?: string) => void;
  userRole: string;
}

/**
 * Modal para cambiar el estado de workflow de un ensayo
 */
export function CambiarEstadoModal({
  isOpen,
  onClose,
  ensayo,
  onCambiar,
  userRole,
}: CambiarEstadoModalProps) {
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [comentario, setComentario] = useState('');

  const estadoActual = ensayo?.workflow_state || ensayo?.workflowState || 'E1';
  const transicionesPermitidas = WORKFLOW_TRANSITIONS[estadoActual] || [];
  const transicionesDisponibles = filterTransitionsByRole(transicionesPermitidas, userRole);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (ensayo) {
      onCambiar(nuevoEstado, comentario);
      setNuevoEstado('');
      setComentario('');
    }
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
