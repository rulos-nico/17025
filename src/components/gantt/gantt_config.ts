/**
 * gantt_config.ts - Configuración para DHTMLX Gantt
 *
 * Configuración de idioma, columnas, escalas y estilos
 */

// ============================================
// TYPES
// ============================================

interface GanttTask {
  progress?: number;
  [key: string]: unknown;
}

interface GanttColumn {
  name: string;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  tree?: boolean;
  template?: (task: GanttTask) => string;
}

interface GanttScaleConfig {
  unit: 'day' | 'week' | 'month' | 'year';
  step: number;
  format: string;
}

interface GanttLocaleDate {
  month_full: string[];
  month_short: string[];
  day_full: string[];
  day_short: string[];
}

interface GanttLocaleLabels {
  new_task: string;
  icon_save: string;
  icon_cancel: string;
  icon_details: string;
  icon_edit: string;
  icon_delete: string;
  confirm_closing: string;
  confirm_deleting: string;
  section_description: string;
  section_time: string;
  section_type: string;
  column_text: string;
  column_start_date: string;
  column_duration: string;
  column_add: string;
  link: string;
  confirm_link_deleting: string;
  link_start: string;
  link_end: string;
  type_task: string;
  type_project: string;
  type_milestone: string;
  minutes: string;
  hours: string;
  days: string;
  weeks: string;
  months: string;
  years: string;
}

interface GanttLocale {
  date: GanttLocaleDate;
  labels: GanttLocaleLabels;
}

interface GanttConfigOptions {
  date_format: string;
  readonly: boolean;
  show_progress: boolean;
  drag_move: boolean;
  drag_resize: boolean;
  drag_progress: boolean;
  scale_unit: string;
  min_column_width: number;
  row_height: number;
  work_time: boolean;
  theme: string;
}

// ============================================
// EXPORTS
// ============================================

/**
 * Configuración de columnas del Gantt
 */
export const GANTT_COLUMNS: GanttColumn[] = [
  {
    name: 'text',
    label: 'Nombre',
    width: 280,
    tree: true, // Mostrar jerarquía
  },
  {
    name: 'start_date',
    label: 'Inicio',
    width: 90,
    align: 'center',
  },
  {
    name: 'duration',
    label: 'Días',
    width: 50,
    align: 'center',
  },
  {
    name: 'progress',
    label: '%',
    width: 50,
    align: 'center',
    template: (task: GanttTask) => `${Math.round((task.progress || 0) * 100)}%`,
  },
];

/**
 * Escalas de tiempo disponibles
 */
export const GANTT_SCALES: Record<string, GanttScaleConfig[]> = {
  day: [
    { unit: 'month', step: 1, format: '%F %Y' },
    { unit: 'day', step: 1, format: '%d' },
  ],
  week: [
    { unit: 'month', step: 1, format: '%F %Y' },
    { unit: 'week', step: 1, format: 'Semana %W' },
  ],
  month: [
    { unit: 'year', step: 1, format: '%Y' },
    { unit: 'month', step: 1, format: '%F' },
  ],
};

/**
 * Colores por estado
 */
export const ESTADO_COLORS: Record<string, string> = {
  activo: '#3B82F6',
  en_proceso: '#F59E0B',
  completado: '#10B981',
  cancelado: '#EF4444',
  pendiente: '#6B7280',
};

/**
 * Configuración de idioma español
 */
export const GANTT_LOCALE: GanttLocale = {
  date: {
    month_full: [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ],
    month_short: [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ],
    day_full: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    day_short: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  },
  labels: {
    new_task: 'Nueva tarea',
    icon_save: 'Guardar',
    icon_cancel: 'Cancelar',
    icon_details: 'Detalles',
    icon_edit: 'Editar',
    icon_delete: 'Eliminar',
    confirm_closing: '¿Desea cancelar los cambios?',
    confirm_deleting: '¿Está seguro de eliminar esta tarea?',
    section_description: 'Descripción',
    section_time: 'Periodo',
    section_type: 'Tipo',
    column_text: 'Nombre',
    column_start_date: 'Inicio',
    column_duration: 'Duración',
    column_add: '',
    link: 'Dependencia',
    confirm_link_deleting: '¿Eliminar dependencia?',
    link_start: ' (inicio)',
    link_end: ' (fin)',
    type_task: 'Tarea',
    type_project: 'Proyecto',
    type_milestone: 'Hito',
    minutes: 'Minutos',
    hours: 'Horas',
    days: 'Días',
    weeks: 'Semanas',
    months: 'Meses',
    years: 'Años',
  },
};

/**
 * Opciones de configuración del Gantt
 */
export const GANTT_CONFIG: GanttConfigOptions = {
  // Formato de fecha
  date_format: '%Y-%m-%d',

  // Solo lectura (no editar tareas)
  readonly: true,

  // Mostrar barra de progreso
  show_progress: true,

  // Permitir drag & drop (deshabilitado)
  drag_move: false,
  drag_resize: false,
  drag_progress: false,

  // Escala inicial
  scale_unit: 'day',

  // Ancho mínimo de columna de tiempo
  min_column_width: 40,

  // Auto ajustar altura de filas
  row_height: 35,

  // Mostrar fin de semana con otro color
  work_time: false,

  // Tema
  theme: 'terrace',
};

export default {
  columns: GANTT_COLUMNS,
  scales: GANTT_SCALES,
  colors: ESTADO_COLORS,
  locale: GANTT_LOCALE,
  config: GANTT_CONFIG,
};
