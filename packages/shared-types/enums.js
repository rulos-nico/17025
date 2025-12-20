/**
 * Enumeraciones del sistema
 */

export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  RESPONSABLE_TECNICO: 'Responsable Técnico',
  ANALISTA: 'Analista',
  CLIENTE: 'Cliente'
}

export const ESTADOS_ENTREGABLE = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En Proceso',
  EN_REVISION: 'En Revisión',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado'
}

export const ESTADOS_MUESTRA = {
  RECIBIDA: 'Recibida',
  EN_ANALISIS: 'En Análisis',
  ANALIZADA: 'Analizada',
  DESCARTADA: 'Descartada'
}

export const TIPOS_ENSAYO = {
  FISICO: 'Físico',
  QUIMICO: 'Químico',
  MICROBIOLOGICO: 'Microbiológico',
  MECANICO: 'Mecánico'
}

export const PRIORIDADES = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente'
}

export const ESTADOS_EQUIPO = {
  OPERATIVO: 'Operativo',
  MANTENIMIENTO: 'En Mantenimiento',
  CALIBRACION: 'En Calibración',
  FUERA_SERVICIO: 'Fuera de Servicio'
}
