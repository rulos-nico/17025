/**
 * usePersonalModals - Hook para gestion de modales en la vista de personal
 */

import { useState, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

export const PERSONAL_MODAL_TYPES = {
  DETALLE: 'detalle',
  AGREGAR: 'agregar',
} as const;

export type PersonalModalType = (typeof PERSONAL_MODAL_TYPES)[keyof typeof PERSONAL_MODAL_TYPES];

export interface SelectedPersona {
  id: string | number;
  nombre: string;
  apellido?: string;
  cargo?: string;
  email?: string;
  activo?: boolean;
  proyectos?: (string | number)[];
  autorizaciones?: string[];
  estudios?: string[];
  capacitaciones?: string[];
  [key: string]: unknown;
}

export interface UsePersonalModalsResult {
  // Estado
  selectedPersona: SelectedPersona | null;
  activeModal: PersonalModalType | null;

  // Flags de verificación
  isDetalleOpen: boolean;
  isAgregarOpen: boolean;

  // Métodos de apertura
  openDetalle: (persona: SelectedPersona) => void;
  openAgregar: () => void;

  // Cierre
  closeModal: () => void;
}

// ============================================
// HOOK
// ============================================

export function usePersonalModals(): UsePersonalModalsResult {
  const [selectedPersona, setSelectedPersona] = useState<SelectedPersona | null>(null);
  const [activeModal, setActiveModal] = useState<PersonalModalType | null>(null);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedPersona(null);
  }, []);

  const openDetalle = useCallback((persona: SelectedPersona) => {
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
