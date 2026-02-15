/**
 * usePersonalModals - Hook para gestion de modales en la vista de personal
 */

import { useState, useCallback } from 'react';

export const PERSONAL_MODAL_TYPES = {
  DETALLE: 'detalle',
  AGREGAR: 'agregar',
};

export function usePersonalModals() {
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedPersona(null);
  }, []);

  const openDetalle = useCallback(persona => {
    setSelectedPersona(persona);
    setActiveModal(PERSONAL_MODAL_TYPES.DETALLE);
  }, []);

  const openAgregar = useCallback(() => {
    setSelectedPersona(null);
    setActiveModal(PERSONAL_MODAL_TYPES.AGREGAR);
  }, []);

  return {
    selectedPersona,
    activeModal,
    isDetalleOpen: activeModal === PERSONAL_MODAL_TYPES.DETALLE,
    isAgregarOpen: activeModal === PERSONAL_MODAL_TYPES.AGREGAR,
    openDetalle,
    openAgregar,
    closeModal,
  };
}

export default usePersonalModals;
