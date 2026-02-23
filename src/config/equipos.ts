/**
 * Configuracion de Equipos y Sensores
 *
 * Constantes y opciones para formularios de equipos/sensores
 */
import type { CSSProperties } from 'react';

// ============================================
// TYPES
// ============================================

export type EstadoEquipoValue =
  | 'operativo'
  | 'en_calibracion'
  | 'fuera_servicio'
  | 'en_mantenimiento';
export type TipoSensorValue =
  | 'celda_carga'
  | 'extensometro'
  | 'termocupla'
  | 'lvdt'
  | 'pendulo'
  | 'otro';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface FormStyles {
  field: CSSProperties;
  label: CSSProperties;
  input: CSSProperties;
  select: CSSProperties;
  textarea: CSSProperties;
  row: CSSProperties;
  buttons: CSSProperties;
  buttonPrimary: CSSProperties;
  buttonSecondary: CSSProperties;
  buttonDanger: CSSProperties;
  required: CSSProperties;
}

// ============================================
// ESTADOS DE EQUIPO
// ============================================

export const ESTADOS_EQUIPO: SelectOption<EstadoEquipoValue>[] = [
  { value: 'operativo', label: 'Operativo' },
  { value: 'en_calibracion', label: 'En Calibracion' },
  { value: 'fuera_servicio', label: 'Fuera de Servicio' },
  { value: 'en_mantenimiento', label: 'En Mantenimiento' },
];

// ============================================
// TIPOS DE SENSOR
// ============================================

export const TIPOS_SENSOR: SelectOption<TipoSensorValue>[] = [
  { value: 'celda_carga', label: 'Celda de Carga' },
  { value: 'extensometro', label: 'Extensometro' },
  { value: 'termocupla', label: 'Termocupla' },
  { value: 'lvdt', label: 'LVDT' },
  { value: 'pendulo', label: 'Pendulo' },
  { value: 'otro', label: 'Otro' },
];

// ============================================
// UBICACIONES
// ============================================

export const UBICACIONES: string[] = [
  'Laboratorio Mecanico',
  'Laboratorio Quimico',
  'Laboratorio Metalografico',
  'Almacen',
  'Taller',
];

// ============================================
// ESTILOS COMUNES PARA FORMULARIOS
// ============================================

export const formStyles: FormStyles = {
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
    fontSize: '0.875rem',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB',
  },
  buttonPrimary: {
    padding: '8px 16px',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  buttonSecondary: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  buttonDanger: {
    padding: '8px 16px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  required: {
    color: '#EF4444',
    marginLeft: '2px',
  },
};
