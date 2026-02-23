/**
 * NovedadModal - Modal para marcar un ensayo como novedad
 */

import { useState, type FormEvent } from 'react';
import { Modal } from '../../ui';
import type { SelectedEnsayo } from '../../../hooks/useEnsayoModals';
import styles from './NovedadModal.module.css';

interface NovedadModalProps {
  isOpen: boolean;
  onClose: () => void;
  ensayo: SelectedEnsayo | null;
  onMarcar: (razon: string) => void;
}

/**
 * Modal para marcar un ensayo como novedad (estado E5)
 */
export function NovedadModal({ isOpen, onClose, ensayo, onMarcar }: NovedadModalProps) {
  const [razon, setRazon] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (ensayo) {
      onMarcar(razon);
      setRazon('');
    }
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
