/**
 * useEnsayoModals - Hook para gestión de modales en la vista de ensayos
 *
 * Centraliza el estado y la lógica de apertura/cierre de modales,
 * reduciendo la complejidad del componente principal.
 *
 * @example
 * const modals = useEnsayoModals();
 *
 * // Abrir modal de detalle
 * modals.openDetalle(ensayo);
 *
 * // Verificar si está abierto
 * if (modals.isDetalleOpen) { ... }
 *
 * // Cerrar cualquier modal
 * modals.closeModal();
 */

import { useState, useCallback } from 'react';

/**
 * Tipos de modales disponibles
 * @type {Object}
 */
export const MODAL_TYPES = {
  DETALLE: 'detalle',
  CAMBIAR_ESTADO: 'cambiarEstado',
  NOVEDAD: 'novedad',
  REASIGNAR: 'reasignar',
};

/**
 * Hook para gestionar el estado de múltiples modales
 * @returns {Object} - Estado y métodos para gestión de modales
 */
export function useEnsayoModals() {
  const [selectedEnsayo, setSelectedEnsayo] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  /**
   * Abre un modal específico con el ensayo seleccionado
   * @param {string} modalType - Tipo de modal a abrir
   * @param {Object} ensayo - Ensayo seleccionado
   */
  const openModal = useCallback((modalType, ensayo) => {
    setSelectedEnsayo(ensayo);
    setActiveModal(modalType);
  }, []);

  /**
   * Cierra el modal activo y limpia la selección
   */
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedEnsayo(null);
  }, []);

  /**
   * Abre el modal de detalle
   * @param {Object} ensayo - Ensayo a mostrar
   */
  const openDetalle = useCallback(
    ensayo => {
      openModal(MODAL_TYPES.DETALLE, ensayo);
    },
    [openModal]
  );

  /**
   * Abre el modal de cambio de estado
   * @param {Object} ensayo - Ensayo a modificar
   */
  const openCambiarEstado = useCallback(
    ensayo => {
      openModal(MODAL_TYPES.CAMBIAR_ESTADO, ensayo);
    },
    [openModal]
  );

  /**
   * Abre el modal de novedad
   * @param {Object} ensayo - Ensayo a marcar como novedad
   */
  const openNovedad = useCallback(
    ensayo => {
      openModal(MODAL_TYPES.NOVEDAD, ensayo);
    },
    [openModal]
  );

  /**
   * Abre el modal de reasignación
   * @param {Object} ensayo - Ensayo a reasignar
   */
  const openReasignar = useCallback(
    ensayo => {
      openModal(MODAL_TYPES.REASIGNAR, ensayo);
    },
    [openModal]
  );

  return {
    // Estado
    selectedEnsayo,
    activeModal,

    // Flags de verificación
    isDetalleOpen: activeModal === MODAL_TYPES.DETALLE,
    isCambiarEstadoOpen: activeModal === MODAL_TYPES.CAMBIAR_ESTADO,
    isNovedadOpen: activeModal === MODAL_TYPES.NOVEDAD,
    isReasignarOpen: activeModal === MODAL_TYPES.REASIGNAR,

    // Métodos de apertura específicos
    openDetalle,
    openCambiarEstado,
    openNovedad,
    openReasignar,

    // Método genérico de apertura
    openModal,

    // Cierre
    closeModal,
  };
}

export default useEnsayoModals;
