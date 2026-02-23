/**
 * ReasignarModal - Modal para reasignar el tecnico de un ensayo
 */

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '../../ui';
import type { Tecnico } from '../../../hooks/useEnsayosData';
import type { SelectedEnsayo } from '../../../hooks/useEnsayoModals';
import styles from './ReasignarModal.module.css';

interface ReasignarModalProps {
  isOpen: boolean;
  onClose: () => void;
  ensayo: SelectedEnsayo | null;
  tecnicos: Tecnico[];
  onReasignar: (tecnicoId: string | number) => void;
}

/**
 * Modal para reasignar un tecnico a un ensayo
 */
export function ReasignarModal({
  isOpen,
  onClose,
  ensayo,
  tecnicos,
  onReasignar,
}: ReasignarModalProps) {
  const [tecnicoId, setTecnicoId] = useState<string | number>('');

  // Inicializar con el tecnico actual cuando cambia el ensayo
  useEffect(() => {
    if (ensayo) {
      setTecnicoId(ensayo.tecnicoId || ensayo.tecnico_id || '');
    }
  }, [ensayo]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (ensayo) {
      onReasignar(tecnicoId);
      setTecnicoId('');
    }
  };

  const handleClose = () => {
    setTecnicoId('');
    onClose();
  };

  if (!ensayo) return null;

  const tecnicoActualId = ensayo.tecnicoId || ensayo.tecnico_id;
  const tecnicoActual = tecnicos.find(t => t.id === tecnicoActualId);
  const muestra = (ensayo.muestra || ensayo.codigo || '') as string;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Reasignar Tecnico - ${ensayo.codigo}`}>
      <form onSubmit={handleSubmit}>
        <div className={styles.content}>
          <div className={styles.infoBox}>
            <strong>Ensayo:</strong> {muestra}
            <div className={styles.tecnicoActual}>
              Tecnico actual:{' '}
              {tecnicoActual ? `${tecnicoActual.nombre} ${tecnicoActual.apellido}` : 'Sin asignar'}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Nuevo Tecnico *</label>
            <select
              value={tecnicoId as string}
              onChange={e => setTecnicoId(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Seleccionar tecnico...</option>
              {tecnicos.map(tec => (
                <option key={tec.id as string} value={tec.id as string}>
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
