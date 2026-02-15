/**
 * useEquiposModals - Hook para gestion de modales en la vista de equipos
 *
 * Centraliza el estado y la logica de apertura/cierre de modales
 */

import { useState, useCallback } from 'react';

/**
 * Tipos de modales disponibles
 */
export const EQUIPO_MODAL_TYPES = {
  EQUIPO_FORM: 'equipoForm',
  SENSOR_FORM: 'sensorForm',
  DELETE: 'delete',
};

/**
 * Hook para gestionar el estado de multiples modales
 * @returns {Object} - Estado y metodos para gestion de modales
 */
export function useEquiposModals() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  /**
   * Cierra el modal activo y limpia la seleccion
   */
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedItem(null);
  }, []);

  /**
   * Abre modal de formulario de equipo (nuevo o edicion)
   * @param {Object|null} equipo - Equipo a editar, o null para nuevo
   */
  const openEquipoForm = useCallback((equipo = null) => {
    setSelectedItem(equipo);
    setActiveModal(EQUIPO_MODAL_TYPES.EQUIPO_FORM);
  }, []);

  /**
   * Abre modal de formulario de sensor (nuevo o edicion)
   * @param {Object|null} sensor - Sensor a editar, o null para nuevo
   */
  const openSensorForm = useCallback((sensor = null) => {
    setSelectedItem(sensor);
    setActiveModal(EQUIPO_MODAL_TYPES.SENSOR_FORM);
  }, []);

  /**
   * Abre modal de confirmacion de eliminacion
   * @param {Object} item - Equipo o sensor a eliminar
   */
  const openDeleteConfirm = useCallback(item => {
    setSelectedItem(item);
    setActiveModal(EQUIPO_MODAL_TYPES.DELETE);
  }, []);

  /**
   * Abre modal de edicion segun el tipo de item
   * @param {Object} item - Equipo o sensor a editar
   */
  const openEditForm = useCallback(
    item => {
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
