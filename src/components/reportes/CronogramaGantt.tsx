/**
 * CronogramaGantt.tsx — Cronograma de proyectos (Gantt simplificado con Recharts)
 *
 * Timeline horizontal de proyectos usando BarChart de Recharts.
 * Cada proyecto es una fila con una barra desde fecha_inicio hasta fecha_fin_estimada/real.
 * Coloreada por estado del proyecto.
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { Proyecto } from './shared';
import { SectionHeader } from './shared';
import ind from './ReportesIndicadores.module.css';

// ============================================
// TYPES
// ============================================

interface CronogramaGanttProps {
  proyectos: Proyecto[];
}

interface GanttRow {
  name: string;
  start: number; // days from origin
  duration: number;
  color: string;
  estado: string;
  codigo: string;
  fechaInicio: string;
  fechaFin: string;
}

// ============================================
// ICON
// ============================================

function IconGantt({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M9 4v6" />
      <rect x="6" y="13" width="6" height="2" rx="1" fill="currentColor" stroke="none" />
      <rect x="10" y="17" width="8" height="2" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ============================================
// STATE COLORS
// ============================================

const ESTADO_COLORS: Record<string, string> = {
  activo: '#3B82F6',
  en_proceso: '#F59E0B',
  completado: '#10B981',
  cancelado: '#EF4444',
  pendiente: '#6B7280',
};

const ESTADO_LABELS: Record<string, string> = {
  activo: 'Activo',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
  pendiente: 'Pendiente',
};

// ============================================
// HELPERS
// ============================================

function toTimestamp(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.getTime();
}

function formatAxisDate(timestamp: number): string {
  const d = new Date(timestamp);
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
  return `${meses[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
}

function formatTooltipDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-CL');
}

// ============================================
// COMPONENT
// ============================================

export default function CronogramaGantt({ proyectos }: CronogramaGanttProps) {
  // Transform projects into gantt rows
  const { rows, minTs, maxTs, todayTs } = useMemo(() => {
    const today = new Date();
    const todayTs = today.getTime();

    // Filter projects that have at least fecha_inicio
    const validProyectos = proyectos.filter(p => p.fecha_inicio);

    if (validProyectos.length === 0) {
      return { rows: [] as GanttRow[], minTs: 0, maxTs: 0, todayTs };
    }

    // Find global min/max dates
    let globalMin = Infinity;
    let globalMax = -Infinity;

    const ganttRows: GanttRow[] = validProyectos.map(p => {
      const startTs = toTimestamp(p.fecha_inicio)!;
      const endDate = p.fecha_fin_real || p.fecha_fin_estimada;
      const endTs = toTimestamp(endDate) || startTs + 90 * 24 * 60 * 60 * 1000; // default 90 days

      globalMin = Math.min(globalMin, startTs);
      globalMax = Math.max(globalMax, endTs);

      const nombre = (p.nombre || p.codigo || 'N/A') as string;
      return {
        name: nombre.length > 25 ? nombre.substring(0, 22) + '...' : nombre,
        start: startTs,
        duration: endTs - startTs,
        color: ESTADO_COLORS[p.estado || 'activo'] || '#6B7280',
        estado: p.estado || 'activo',
        codigo: (p.codigo || '') as string,
        fechaInicio: p.fecha_inicio || '',
        fechaFin: endDate || '',
      };
    });

    // Add padding
    const pad = (globalMax - globalMin) * 0.05 || 7 * 24 * 60 * 60 * 1000;
    return {
      rows: ganttRows.sort((a, b) => a.start - b.start),
      minTs: globalMin - pad,
      maxTs: globalMax + pad,
      todayTs,
    };
  }, [proyectos]);

  // Chart data: stacked bar approach (invisible offset + visible duration)
  const chartData = useMemo(() => {
    return rows.map(r => ({
      name: r.name,
      offset: r.start - minTs,
      duration: r.duration,
      color: r.color,
      estado: r.estado,
      codigo: r.codigo,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
    }));
  }, [rows, minTs]);

  // Unique estados for legend
  const uniqueEstados = useMemo(() => {
    const set = new Set(rows.map(r => r.estado));
    return Array.from(set);
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className={ind.indicatorSection}>
        <SectionHeader
          icon={<IconGantt />}
          title="Cronograma de Proyectos"
          subtitle="Timeline de proyectos con fechas de inicio y fin"
        />
        <div className={ind.chartEmpty}>No hay proyectos con fechas de inicio definidas</div>
      </div>
    );
  }

  const todayOffset = todayTs - minTs;
  const totalRange = maxTs - minTs;

  // Generate tick values for the X axis (monthly)
  const ticks = useMemo(() => {
    const result: number[] = [];
    const start = new Date(minTs);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    let current = start.getTime();
    while (current <= maxTs) {
      const offset = current - minTs;
      if (offset >= 0) result.push(offset);
      const d = new Date(current);
      d.setMonth(d.getMonth() + 1);
      current = d.getTime();
    }
    return result;
  }, [minTs, maxTs]);

  return (
    <div className={ind.indicatorSection}>
      <SectionHeader
        icon={<IconGantt />}
        title="Cronograma de Proyectos"
        subtitle="Timeline de proyectos con fechas de inicio y fin"
      />

      {/* Legend */}
      <div className={ind.ganttLegend}>
        {uniqueEstados.map(est => (
          <div key={est} className={ind.ganttLegendItem}>
            <span
              className={ind.ganttLegendDot}
              style={{ backgroundColor: ESTADO_COLORS[est] || '#6B7280' }}
            />
            {ESTADO_LABELS[est] || est}
          </div>
        ))}
        <div className={ind.ganttLegendItem}>
          <span
            className={ind.ganttLegendDot}
            style={{ backgroundColor: '#EF4444', opacity: 0.5 }}
          />
          Hoy
        </div>
      </div>

      <div className={ind.ganttContainer}>
        <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 40 + 60)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 20, top: 10, bottom: 20 }}
            barSize={18}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, totalRange]}
              ticks={ticks}
              tickFormatter={v => formatAxisDate(minTs + v)}
              tick={{ fontSize: 10 }}
            />
            <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0]?.payload;
                if (!data) return null;
                return (
                  <div
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {data.codigo} — {data.name}
                    </div>
                    <div style={{ color: '#6b7280' }}>
                      Inicio: {formatTooltipDate(data.fechaInicio)}
                    </div>
                    <div style={{ color: '#6b7280' }}>Fin: {formatTooltipDate(data.fechaFin)}</div>
                    <div
                      style={{
                        marginTop: '4px',
                        color: ESTADO_COLORS[data.estado] || '#6B7280',
                        fontWeight: 500,
                      }}
                    >
                      {ESTADO_LABELS[data.estado] || data.estado}
                    </div>
                  </div>
                );
              }}
            />
            {/* Invisible offset bar */}
            <Bar dataKey="offset" stackId="gantt" fill="transparent" radius={0} />
            {/* Visible duration bar */}
            <Bar dataKey="duration" stackId="gantt" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
            {/* Today line */}
            {todayOffset > 0 && todayOffset < totalRange && (
              <ReferenceLine
                x={todayOffset}
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={0.6}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
