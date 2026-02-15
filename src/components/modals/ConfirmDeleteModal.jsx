/**
 * ConfirmDeleteModal - Modal genérico para confirmar eliminaciones
 *
 * Proporciona una interfaz consistente para confirmar acciones destructivas
 * con advertencias visuales claras.
 */

import { Modal } from '../ui';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Icono de advertencia */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              fontSize: '28px',
            }}
          >
            ⚠️
          </div>
        </div>

        {/* Mensaje principal */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: '1rem', color: '#374151' }}>{displayMessage}</p>
          {itemName && !message && (
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#6B7280' }}>
              Esta acción no se puede deshacer.
            </p>
          )}
        </div>

        {/* Advertencia adicional */}
        {warning && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FEF3C7',
              borderRadius: '8px',
              border: '1px solid #F59E0B',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <div style={{ fontSize: '0.875rem', color: '#92400E' }}>{warning}</div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              backgroundColor: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#EF4444',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Eliminando...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDeleteModal;
