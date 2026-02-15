/**
 * ReasignarModal - Modal para reasignar el tecnico de un ensayo
 */

import { useState, useEffect } from 'react';
import { Modal } from '../../ui';
import styles from './ReasignarModal.module.css';

/**
 * Modal para reasignar un tecnico a un ensayo
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal esta abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.ensayo - Ensayo a reasignar
 * @param {Array} props.tecnicos - Lista de tecnicos disponibles
 * @param {Function} props.onReasignar - Callback al reasignar (ensayoId, tecnicoId)
 */
export function ReasignarModal({ isOpen, onClose, ensayo, tecnicos, onReasignar }) {
  const [tecnicoId, setTecnicoId] = useState('');

  // Inicializar con el tecnico actual cuando cambia el ensayo
  useEffect(() => {
    if (ensayo) {
      setTecnicoId(ensayo.tecnicoId || ensayo.tecnico_id || '');
    }
  }, [ensayo]);

  const handleSubmit = e => {
    e.preventDefault();
    onReasignar(ensayo.id, tecnicoId);
    setTecnicoId('');
  };

  const handleClose = () => {
    setTecnicoId('');
    onClose();
  };

  if (!ensayo) return null;

  const tecnicoActualId = ensayo.tecnicoId || ensayo.tecnico_id;
  const tecnicoActual = tecnicos.find(t => t.id === tecnicoActualId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Reasignar Tecnico - ${ensayo.codigo}`}>
      <form onSubmit={handleSubmit}>
        <div className={styles.content}>
          <div className={styles.infoBox}>
            <strong>Ensayo:</strong> {ensayo.muestra}
            <div className={styles.tecnicoActual}>
              Tecnico actual:{' '}
              {tecnicoActual ? `${tecnicoActual.nombre} ${tecnicoActual.apellido}` : 'Sin asignar'}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Nuevo Tecnico *</label>
            <select
              value={tecnicoId}
              onChange={e => setTecnicoId(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Seleccionar tecnico...</option>
              {tecnicos.map(tec => (
                <option key={tec.id} value={tec.id}>
                  {tec.nombre} {tec.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={handleClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button type="submit" disabled={!tecnicoId} className={styles.btnSubmit}>
              Reasignar
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default ReasignarModal;
