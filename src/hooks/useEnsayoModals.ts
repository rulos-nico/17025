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

// ============================================
// TYPES
// ============================================

export const MODAL_TYPES = {
  DETALLE: 'detalle',
  CAMBIAR_ESTADO: 'cambiarEstado',
  NOVEDAD: 'novedad',
  REASIGNAR: 'reasignar',
} as const;

export type ModalType = (typeof MODAL_TYPES)[keyof typeof MODAL_TYPES];

export interface SelectedEnsayo {
  id: string | number;
  tipo: string;
  workflowState: string;
  workflow_state?: string;
  tecnicoId?: string | number;
  tecnico_id?: string | number;
  codigo?: string;
  norma?: string;
  muestraId?: string | number;
  muestra_id?: string | number;
  perforacionId?: string | number;
  perforacion_id?: string | number;
  proyectoId?: string | number;
  proyecto_id?: string | number;
  novedadRazon?: string | null;
  novedad_razon?: string | null;
  ultimoComentario?: string;
  ultimo_comentario?: string;
  fechaCreacion?: string;
  fechaSolicitud?: string;
  [key: string]: unknown;
}

export interface UseEnsayoModalsResult {
  // Estado
  selectedEnsayo: SelectedEnsayo | null;
  activeModal: ModalType | null;

  // Flags de verificación
  isDetalleOpen: boolean;
  isCambiarEstadoOpen: boolean;
  isNovedadOpen: boolean;
  isReasignarOpen: boolean;

  // Métodos de apertura específicos
  openDetalle: (ensayo: SelectedEnsayo) => void;
  openCambiarEstado: (ensayo: SelectedEnsayo) => void;
  openNovedad: (ensayo: SelectedEnsayo) => void;
  openReasignar: (ensayo: SelectedEnsayo) => void;

  // Método genérico de apertura
  openModal: (modalType: ModalType, ensayo: SelectedEnsayo) => void;

  // Cierre
  closeModal: () => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook para gestionar el estado de múltiples modales
 */
export function useEnsayoModals(): UseEnsayoModalsResult {
  const [selectedEnsayo, setSelectedEnsayo] = useState<SelectedEnsayo | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);

  /**
   * Abre un modal específico con el ensayo seleccionado
   */
  const openModal = useCallback((modalType: ModalType, ensayo: SelectedEnsayo) => {
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
   */
  const openDetalle = useCallback(
    (ensayo: SelectedEnsayo) => {
      openModal(MODAL_TYPES.DETALLE, ensayo);
    },
    [openModal]
  );

  /**
   * Abre el modal de cambio de estado
   */
  const openCambiarEstado = useCallback(
    (ensayo: SelectedEnsayo) => {
      openModal(MODAL_TYPES.CAMBIAR_ESTADO, ensayo);
    },
    [openModal]
  );

  /**
   * Abre el modal de novedad
   */
  const openNovedad = useCallback(
    (ensayo: SelectedEnsayo) => {
      openModal(MODAL_TYPES.NOVEDAD, ensayo);
    },
    [openModal]
  );

  /**
   * Abre el modal de reasignación
   */
  const openReasignar = useCallback(
    (ensayo: SelectedEnsayo) => {
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
