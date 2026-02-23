/**
 * useEquiposModals - Hook para gestion de modales en la vista de equipos
 *
 * Centraliza el estado y la logica de apertura/cierre de modales
 */

import { useState, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

export const EQUIPO_MODAL_TYPES = {
  EQUIPO_FORM: 'equipoForm',
  SENSOR_FORM: 'sensorForm',
  DELETE: 'delete',
} as const;

export type EquipoModalType = (typeof EQUIPO_MODAL_TYPES)[keyof typeof EQUIPO_MODAL_TYPES];

export interface SelectedItem {
  id: string | number;
  tipo: 'equipo' | 'sensor';
  codigo?: string;
  nombre?: string;
  [key: string]: unknown;
}

export interface UseEquiposModalsResult {
  // Estado
  selectedItem: SelectedItem | null;
  activeModal: EquipoModalType | null;

  // Flags de verificación
  isEquipoFormOpen: boolean;
  isSensorFormOpen: boolean;
  isDeleteOpen: boolean;

  // Métodos de apertura
  openEquipoForm: (equipo?: SelectedItem | null) => void;
  openSensorForm: (sensor?: SelectedItem | null) => void;
  openDeleteConfirm: (item: SelectedItem) => void;
  openEditForm: (item: SelectedItem) => void;

  // Cierre
  closeModal: () => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook para gestionar el estado de multiples modales
 */
export function useEquiposModals(): UseEquiposModalsResult {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [activeModal, setActiveModal] = useState<EquipoModalType | null>(null);

  /**
   * Cierra el modal activo y limpia la seleccion
   */
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedItem(null);
  }, []);

  /**
   * Abre modal de formulario de equipo (nuevo o edicion)
   */
  const openEquipoForm = useCallback((equipo: SelectedItem | null = null) => {
    setSelectedItem(equipo);
    setActiveModal(EQUIPO_MODAL_TYPES.EQUIPO_FORM);
  }, []);

  /**
   * Abre modal de formulario de sensor (nuevo o edicion)
   */
  const openSensorForm = useCallback((sensor: SelectedItem | null = null) => {
    setSelectedItem(sensor);
    setActiveModal(EQUIPO_MODAL_TYPES.SENSOR_FORM);
  }, []);

  /**
   * Abre modal de confirmacion de eliminacion
   */
  const openDeleteConfirm = useCallback((item: SelectedItem) => {
    setSelectedItem(item);
    setActiveModal(EQUIPO_MODAL_TYPES.DELETE);
  }, []);

  /**
   * Abre modal de edicion segun el tipo de item
   */
  const openEditForm = useCallback(
    (item: SelectedItem) => {
      if (item.tipo === 'sensor') {
        openSensorForm(item);
      } else {
        openEquipoForm(item);
      }
    },
    [openEquipoForm, openSensorForm]
  );

  return {
    // Estado
    selectedItem,
    activeModal,

    // Flags de verificacion
    isEquipoFormOpen: activeModal === EQUIPO_MODAL_TYPES.EQUIPO_FORM,
    isSensorFormOpen: activeModal === EQUIPO_MODAL_TYPES.SENSOR_FORM,
    isDeleteOpen: activeModal === EQUIPO_MODAL_TYPES.DELETE,

    // Metodos de apertura
    openEquipoForm,
    openSensorForm,
    openDeleteConfirm,
    openEditForm,

    // Cierre
    closeModal,
  };
}

export default useEquiposModals;
