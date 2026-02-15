/**
 * ConfirmDeleteModal - Modal genérico para confirmar eliminaciones
 *
 * Proporciona una interfaz consistente para confirmar acciones destructivas
 * con advertencias visuales claras.
 */

import { Modal } from '../ui';
import styles from './ConfirmDeleteModal.module.css';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está visible
 * @param {Function} props.onClose - Callback para cerrar el modal
 * @param {Function} props.onConfirm - Callback para confirmar la eliminación
 * @param {string} props.title - Título del modal (default: "Confirmar Eliminación")
 * @param {string} props.itemType - Tipo de elemento (ej: "proyecto", "equipo", "sensor")
 * @param {string} props.itemName - Nombre del elemento a eliminar
 * @param {string} [props.message] - Mensaje personalizado (sobrescribe el default)
 * @param {string} [props.warning] - Advertencia adicional (ej: "también eliminará perforaciones")
 * @param {boolean} props.loading - Estado de carga
 * @param {string} [props.confirmText] - Texto del botón confirmar (default: "Eliminar")
 * @param {string} [props.cancelText] - Texto del botón cancelar (default: "Cancelar")
 */
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
}) {
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
