/**
 * NovedadModal - Modal para marcar un ensayo como novedad
 */

import { useState } from 'react';
import { Modal } from '../../ui';
import styles from './NovedadModal.module.css';

/**
 * Modal para marcar un ensayo como novedad (estado E5)
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal esta abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.ensayo - Ensayo a marcar como novedad
 * @param {Function} props.onMarcar - Callback al marcar (ensayoId, razon)
 */
export function NovedadModal({ isOpen, onClose, ensayo, onMarcar }) {
  const [razon, setRazon] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    onMarcar(ensayo.id, razon);
    setRazon('');
  };

  const handleClose = () => {
    setRazon('');
    onClose();
  };

  if (!ensayo) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Marcar como Novedad - ${ensayo.codigo}`}>
      <form onSubmit={handleSubmit}>
        <div className={styles.content}>
          <div className={styles.warning}>
            <strong>Advertencia:</strong> Al marcar como novedad, el ensayo quedara pausado hasta
            que se resuelva el problema.
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Razon de la Novedad *</label>
            <textarea
              value={razon}
              onChange={e => setRazon(e.target.value)}
              required
              rows={4}
              placeholder="Describe detalladamente la razon de la novedad..."
              className={styles.textarea}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={handleClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button type="submit" disabled={!razon.trim()} className={styles.btnSubmit}>
              Marcar como Novedad
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default NovedadModal;
