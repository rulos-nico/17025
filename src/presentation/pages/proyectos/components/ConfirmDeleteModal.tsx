/**
 * ConfirmDeleteModal - Modal de confirmación para eliminar
 */

import { Modal } from '../../../../components/ui';
import type { ItemToDelete } from '../types';
import styles from '../../../../pages/Proyectos.module.css';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemToDelete: ItemToDelete | null;
  loading: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemToDelete,
  loading,
}: ConfirmDeleteModalProps) {
  if (!itemToDelete) return null;

  const { type, item } = itemToDelete;
  const titulo = type === 'proyecto' ? 'Eliminar Proyecto' : 'Eliminar Perforación';

  const itemName = 'nombre' in item ? item.nombre : 'codigo' in item ? item.codigo : 'elemento';

  const mensaje =
    type === 'proyecto'
      ? `¿Está seguro que desea eliminar el proyecto "${itemName}"? Esta acción no se puede deshacer y también eliminará todas las perforaciones asociadas.`
      : `¿Está seguro que desea eliminar la perforación "${itemName}"? Esta acción no se puede deshacer.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo}>
      <div className={styles.modalForm}>
        <div className={styles.deleteWarning}>
          <div className={styles.deleteWarningContent}>
            <span className={styles.deleteWarningIcon}>⚠️</span>
            <div>
              <div className={styles.deleteWarningTitle}>Advertencia</div>
              <div className={styles.deleteWarningText}>{mensaje}</div>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={onClose} disabled={loading} className={styles.btnCancel}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`${styles.btnSubmit} ${styles.btnDelete}`}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDeleteModal;
