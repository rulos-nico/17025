/**
 * shared.tsx — Tipos compartidos, tooltip y utilidades para los indicadores de reportes
 */

import styles from '../../pages/Reportes.module.css';

// ============================================
// SHARED TYPES
// ============================================

export interface Ensayo {
  id: string | number;
  codigo?: string;
  tipo?: string;
  workflow_state?: string;
  proyectoId?: string | number;
  muestraId?: string | number;
  fecha_solicitud?: string;
  fecha_programacion?: string;
  fecha_ejecucion?: string;
  fecha_reporte?: string;
  fecha_entrega?: string;
  duracion_estimada?: string;
  tecnico_id?: string | number;
  tecnico_nombre?: string;
  urgente?: boolean;
  [key: string]: unknown;
}

export interface Proyecto {
  id: string | number;
  codigo?: string;
  nombre?: string;
  clienteId?: string | number;
  estado?: string;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  fecha_fin_real?: string;
  [key: string]: unknown;
}

export interface Cliente {
  id: string | number;
  nombre?: string;
  [key: string]: unknown;
}

export interface PersonalInterno {
  id: string | number;
  codigo?: string;
  nombre?: string;
  apellido?: string;
  cargo?: string;
  email?: string;
  activo?: boolean;
  [key: string]: unknown;
}

export interface Equipo {
  id: string | number;
  codigo?: string;
  nombre?: string;
  estado?: string;
  fecha_calibracion?: string;
  proxima_calibracion?: string;
  incertidumbre?: number;
  error_maximo?: number;
  marca?: string;
  modelo?: string;
  ubicacion?: string;
  activo?: boolean;
  [key: string]: unknown;
}

export interface Comprobacion {
  id: string | number;
  equipo_id?: string | number;
  fecha?: string;
  tipo?: string;
  resultado?: string; // 'Conforme' | 'No Conforme'
  responsable?: string;
  [key: string]: unknown;
}

export interface Calibracion {
  id: string | number;
  equipo_id?: string | number;
  fecha?: string;
  [key: string]: unknown;
}

export interface TipoEnsayo {
  id: string | number;
  nombre?: string;
  precio_base?: number;
  tiempo_estimado_dias?: number;
  norma?: string;
  categoria?: string;
  [key: string]: unknown;
}

// ============================================
// COLOR PALETTE
// ============================================

export const COLORS = [
  '#6366f1', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#06b6d4', // Cyan
];

// ============================================
// CUSTOM CHART TOOLTIP (shared)
// ============================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  suffix?: string;
}

export function CustomChartTooltip({ active, payload, label, suffix }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className={styles.customTooltip}>
      {label && <div className={styles.tooltipLabel}>{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ backgroundColor: entry.color }} />
          <span>{entry.name}</span>
          <span className={styles.tooltipValue}>
            {typeof entry.value === 'number' ? entry.value.toLocaleString('es-CL') : entry.value}
            {suffix ? ` ${suffix}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

/** Diferencia en dias entre dos fechas (strings ISO) */
export function diffDays(
  from: string | undefined | null,
  to: string | undefined | null
): number | null {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** Formato corto de fecha: "12 Ene" */
export function shortDate(fecha: string | null | undefined): string {
  if (!fecha) return '-';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '-';
  const meses = [
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
  ];
  return `${d.getDate()} ${meses[d.getMonth()]}`;
}

/** Formato YYYY-MM */
export function toYearMonth(fecha: string | null | undefined): string | null {
  if (!fecha) return null;
  return fecha.substring(0, 7);
}

// ============================================
// SECTION WRAPPER (consistent styling for indicator sections)
// ============================================

export function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionIcon}>{icon}</div>
      <div className={styles.sectionTitleGroup}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <p className={styles.sectionSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
}
