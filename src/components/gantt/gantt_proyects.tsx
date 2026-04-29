/**
 * GanttProyectos — Diagrama Gantt inline-SVG (sin dependencias externas)
 *
 * Renderiza una lista plana de tareas (proyectos + perforaciones hijas) con:
 *  - eje temporal con ticks mensuales
 *  - barra coloreada por estado, con relleno de progreso
 *  - línea vertical "hoy"
 *  - tooltip nativo (<title>) y click handler por tarea
 */

import { ReactElement, CSSProperties, useMemo, useState } from 'react';
import type { GanttTask, GanttData } from '../../hooks/useGanttData';

// Re-export types for consumers
export type { GanttTask, GanttLink, GanttData } from '../../hooks/useGanttData';

export interface GanttProyectosProps {
  data?: GanttData;
  onTaskClick?: (task: GanttTask) => void;
  height?: number;
  loading?: boolean;
}

// ============================================
// CONSTANTS / HELPERS
// ============================================

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DAY_MS = 24 * 60 * 60 * 1000;
const ROW_H = 30;
const LABEL_W = 260;
const PAD_TOP = 28;
const PAD_BOTTOM = 16;
const PAD_RIGHT = 16;

const parseDate = (s: string | undefined): number | null => {
  if (!s) return null;
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? null : t;
};

const formatDateShort = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear().toString().slice(2)}`;
};

const lighten = (hex: string, alpha: number): string => {
  // Construye rgba desde un hex #RRGGBB con alpha
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// ============================================
// STYLES
// ============================================

const containerStyle = (height: number): CSSProperties => ({
  height: `${height}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
});

const loadingTextStyle: CSSProperties = { textAlign: 'center', color: '#6b7280' };

const spinnerStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid #e5e7eb',
  borderTopColor: '#3b82f6',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 12px',
};

// ============================================
// COMPONENT
// ============================================

export default function GanttProyectos({
  data = { tasks: [], links: [] },
  onTaskClick,
  height = 500,
  loading = false,
}: GanttProyectosProps): ReactElement {
  const [collapsed, setCollapsed] = useState<Set<string | number>>(new Set());

  // Construir filas en orden: proyecto → sus tareas hijas; respetando colapso
  const rows = useMemo(() => {
    const tasks = data.tasks || [];
    const projects = tasks.filter(t => t.type === 'project');
    const childrenByParent = new Map<string | number, GanttTask[]>();
    for (const t of tasks) {
      if (t.type === 'task' && t.parent !== undefined) {
        const arr = childrenByParent.get(t.parent) || [];
        arr.push(t);
        childrenByParent.set(t.parent, arr);
      }
    }
    const out: Array<{ task: GanttTask; depth: number; hasChildren: boolean }> = [];
    for (const p of projects) {
      const kids = childrenByParent.get(p.id) || [];
      out.push({ task: p, depth: 0, hasChildren: kids.length > 0 });
      if (!collapsed.has(p.id)) {
        for (const k of kids) out.push({ task: k, depth: 1, hasChildren: false });
      }
    }
    return out;
  }, [data.tasks, collapsed]);

  // Rango temporal global
  const { tMin, tMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const { task } of rows) {
      const start = parseDate(task.start_date);
      if (start === null) continue;
      const end = start + task.duration * DAY_MS;
      if (start < min) min = start;
      if (end > max) max = end;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      const now = Date.now();
      return { tMin: now - 30 * DAY_MS, tMax: now + 30 * DAY_MS };
    }
    const pad = Math.max((max - min) * 0.05, 3 * DAY_MS);
    return { tMin: min - pad, tMax: max + pad };
  }, [rows]);

  // Estado de carga
  if (loading) {
    return (
      <div style={containerStyle(height)}>
        <div style={loadingTextStyle}>
          <div style={spinnerStyle} />
          <p>Cargando cronograma...</p>
        </div>
      </div>
    );
  }

  if (!data.tasks || data.tasks.length === 0) {
    return (
      <div style={containerStyle(height)}>
        <div style={loadingTextStyle}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            style={{ margin: '0 auto 12px' }}
          >
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
            <path d="M9 4v6" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p>No hay proyectos activos para mostrar</p>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            Los proyectos activos aparecerán aquí
          </p>
        </div>
      </div>
    );
  }

  // Dimensiones SVG
  const svgWidth = 1100; // viewBox; el contenedor escala con CSS
  const innerW = svgWidth - LABEL_W - PAD_RIGHT;
  const totalH = PAD_TOP + rows.length * ROW_H + PAD_BOTTOM;
  const xOf = (ts: number) => LABEL_W + ((ts - tMin) / (tMax - tMin)) * innerW;

  // Ticks mensuales en eje X
  const monthTicks: number[] = [];
  {
    const start = new Date(tMin);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    let cur = start.getTime();
    while (cur <= tMax) {
      if (cur >= tMin) monthTicks.push(cur);
      const d = new Date(cur);
      d.setMonth(d.getMonth() + 1);
      cur = d.getTime();
    }
  }

  const todayTs = Date.now();
  const todayInRange = todayTs >= tMin && todayTs <= tMax;

  const toggle = (id: string | number) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      style={{
        height: `${height}px`,
        overflow: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        background: 'white',
      }}
    >
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${totalH}`}
        preserveAspectRatio="xMinYMin meet"
        style={{ display: 'block', minHeight: rows.length * ROW_H + PAD_TOP + PAD_BOTTOM }}
      >
        {/* Bandas de filas alternas */}
        {rows.map((_, i) =>
          i % 2 === 1 ? (
            <rect
              key={`band-${i}`}
              x={0}
              y={PAD_TOP + i * ROW_H}
              width={svgWidth}
              height={ROW_H}
              fill="#F9FAFB"
            />
          ) : null
        )}

        {/* Líneas verticales de meses */}
        {monthTicks.map((ts, i) => (
          <g key={`tick-${i}`}>
            <line
              x1={xOf(ts)}
              x2={xOf(ts)}
              y1={PAD_TOP - 6}
              y2={PAD_TOP + rows.length * ROW_H}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
            <text
              x={xOf(ts) + 4}
              y={PAD_TOP - 10}
              fontSize="11"
              fill="#6B7280"
              fontFamily="system-ui, sans-serif"
            >
              {`${MESES[new Date(ts).getMonth()]} ${new Date(ts).getFullYear().toString().slice(2)}`}
            </text>
          </g>
        ))}

        {/* Línea vertical "Hoy" */}
        {todayInRange && (
          <g>
            <line
              x1={xOf(todayTs)}
              x2={xOf(todayTs)}
              y1={PAD_TOP - 6}
              y2={PAD_TOP + rows.length * ROW_H}
              stroke="#EF4444"
              strokeWidth={1.5}
              strokeDasharray="4,4"
              opacity={0.7}
            />
            <text
              x={xOf(todayTs) + 4}
              y={PAD_TOP + rows.length * ROW_H - 4}
              fontSize="10"
              fill="#EF4444"
              fontFamily="system-ui, sans-serif"
            >
              hoy
            </text>
          </g>
        )}

        {/* Separador label/timeline */}
        <line
          x1={LABEL_W}
          x2={LABEL_W}
          y1={PAD_TOP - 6}
          y2={PAD_TOP + rows.length * ROW_H}
          stroke="#D1D5DB"
        />

        {/* Filas */}
        {rows.map(({ task, depth, hasChildren }, i) => {
          const y = PAD_TOP + i * ROW_H;
          const start = parseDate(task.start_date);
          const color = (task.color as string) || '#6B7280';
          const isCollapsed = collapsed.has(task.id);
          const indent = 8 + depth * 14;
          return (
            <g key={`row-${task.id}`}>
              {/* Etiqueta */}
              {hasChildren && (
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={e => {
                    e.stopPropagation();
                    toggle(task.id);
                  }}
                >
                  <rect
                    x={indent - 4}
                    y={y + ROW_H / 2 - 7}
                    width={14}
                    height={14}
                    fill="transparent"
                  />
                  <text
                    x={indent + 3}
                    y={y + ROW_H / 2 + 4}
                    fontSize="10"
                    fill="#6B7280"
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                  >
                    {isCollapsed ? '▶' : '▼'}
                  </text>
                </g>
              )}
              <text
                x={indent + (hasChildren ? 16 : 0)}
                y={y + ROW_H / 2 + 4}
                fontSize="12"
                fill={depth === 0 ? '#111827' : '#374151'}
                fontWeight={depth === 0 ? 600 : 400}
                fontFamily="system-ui, sans-serif"
              >
                {(task.text as string).length > 32
                  ? `${(task.text as string).slice(0, 30)}…`
                  : (task.text as string)}
              </text>

              {/* Barra */}
              {start !== null && task.duration > 0 && (
                <g
                  style={{ cursor: onTaskClick ? 'pointer' : 'default' }}
                  onClick={() => onTaskClick && onTaskClick(task)}
                >
                  {(() => {
                    const x1 = xOf(start);
                    const x2 = xOf(start + task.duration * DAY_MS);
                    const w = Math.max(2, x2 - x1);
                    const barH = depth === 0 ? 16 : 12;
                    const barY = y + (ROW_H - barH) / 2;
                    const progress = Math.max(0, Math.min(1, (task.progress as number) || 0));
                    return (
                      <>
                        <rect
                          x={x1}
                          y={barY}
                          width={w}
                          height={barH}
                          rx={3}
                          fill={lighten(color, 0.25)}
                          stroke={color}
                          strokeWidth={1}
                        />
                        {progress > 0 && (
                          <rect
                            x={x1}
                            y={barY}
                            width={w * progress}
                            height={barH}
                            rx={3}
                            fill={color}
                          />
                        )}
                        <title>
                          {`${task.text}\nInicio: ${formatDateShort(start)}\nFin: ${formatDateShort(
                            start + task.duration * DAY_MS
                          )}\nDuración: ${task.duration} días\nProgreso: ${Math.round(progress * 100)}%${
                            task.estado ? `\nEstado: ${task.estado}` : ''
                          }`}
                        </title>
                      </>
                    );
                  })()}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
