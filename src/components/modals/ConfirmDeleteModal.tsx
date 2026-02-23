/**
 * ConfirmDeleteModal - Modal genérico para confirmar eliminaciones
 *
 * Proporciona una interfaz consistente para confirmar acciones destructivas
 * con advertencias visuales claras.
 */

import { ReactElement } from 'react';
import { Modal } from '../ui';
import styles from './ConfirmDeleteModal.module.css';

// ============================================
// TYPES
// ============================================

export interface ConfirmDeleteModalProps {
  /** Si el modal está visible */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Callback para confirmar la eliminación */
  onConfirm: () => void;
  /** Título del modal (default: "Confirmar Eliminación") */
  title?: string;
  /** Tipo de elemento (ej: "proyecto", "equipo", "sensor") */
  itemType?: string;
  /** Nombre del elemento a eliminar */
  itemName?: string;
  /** Mensaje personalizado (sobrescribe el default) */
  message?: string;
  /** Advertencia adicional (ej: "también eliminará perforaciones") */
  warning?: string;
  /** Estado de carga */
  loading?: boolean;
  /** Texto del botón confirmar (default: "Eliminar") */
  confirmText?: string;
  /** Texto del botón cancelar (default: "Cancelar") */
  cancelText?: string;
}

// ============================================
// COMPONENT
// ============================================

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Eliminación',
  itemType = 'elemento',
  itemName,
  message,
  warning,
  loading = false,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
}: ConfirmDeleteModalProps): ReactElement {
  const defaultMessage = `¿Está seguro que desea eliminar ${itemType === 'el' ? '' : 'el '}${itemType} "${itemName || 'este elemento'}"?`;
  const displayMessage = message || defaultMessage;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="450px">
      <div className={styles.content}>
        {/* Icono de advertencia */}
        <div className={styles.iconContainer}>
          <div className={styles.iconCircle}>⚠️</div>
        </div>

        {/* Mensaje principal */}
        <div className={styles.messageContainer}>
          <p className={styles.message}>{displayMessage}</p>
          {itemName && !message && (
            <p className={styles.disclaimer}>Esta acción no se puede deshacer.</p>
          )}
        </div>

        {/* Advertencia adicional */}
        {warning && (
          <div className={styles.warningBox}>
            <div className={styles.warningContent}>
              <span className={styles.warningIcon}>⚠️</span>
              <div className={styles.warningText}>{warning}</div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className={styles.actions}>
          <button type="button" onClick={onClose} disabled={loading} className={styles.btnCancel}>
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={styles.btnDelete}>
            {loading ? 'Eliminando...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDeleteModal;
