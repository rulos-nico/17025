import { useState, useEffect, useMemo, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge } from '../components/ui';
import {
  ProyectosAPI,
  ClientesAPI,
  EnsayosAPI,
  MuestrasAPI,
  PersonalInternoAPI,
  EquiposAPI,
  ComprobacionesAPI,
  CalibracionesAPI,
  TiposEnsayoAPI,
} from '../services/apiService';
import {
  TiemposCiclos,
  CurvaS,
  CargaTrabajo,
  EstadoEquipos,
  AnaliticaClientes,
  CronogramaGantt,
} from '../components/reportes';
import type {
  PersonalInterno,
  Equipo,
  Comprobacion,
  ReportTipoEnsayo,
} from '../components/reportes';
import { WORKFLOW_STATES_INFO, getWorkflowInfo } from '../config';
import { useTiposEnsayoData } from '../hooks/useTiposEnsayoData';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Treemap,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from './Reportes.module.css';

// ============================================
// TYPES
// ============================================

interface Ensayo {
  id: string | number;
  codigo?: string;
  tipo?: string;
  workflow_state?: string;
  proyectoId?: string | number;
  muestraId?: string | number;
  fecha_solicitud?: string;
  fecha_ejecucion?: string;
  [key: string]: unknown;
}

interface Proyecto {
  id: string | number;
  codigo?: string;
  nombre?: string;
  clienteId?: string | number;
  estado?: string;
  [key: string]: unknown;
}

interface Cliente {
  id: string | number;
  nombre?: string;
  [key: string]: unknown;
}

interface Muestra {
  id: string | number;
  codigo?: string;
  perforacionId?: string | number;
  profundidadInicio?: number;
  profundidadFin?: number;
  tipoMuestra?: string;
  [key: string]: unknown;
}

interface ProyectoConStats extends Proyecto {
  ensayos: Ensayo[];
  stats: {
    total: number;
    completados: number;
    pendientes: number;
    enProceso: number;
    progreso: number;
  };
}

interface ReportesProps {
  moduleParams?: Record<string, unknown> | null;
}

// ============================================
// CONSTANTS
// ============================================

const COLORS_TIPO = [
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
// HELPERS
// ============================================

const formatDate = (fecha: string | null | undefined): string => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-CL');
};

// ============================================
// SVG ICON COMPONENTS (inline, lightweight)
// ============================================

function IconChart({ size = 18 }: { size?: number }) {
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
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconClock({ size = 18 }: { size?: number }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconGear({ size = 18 }: { size?: number }) {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconEye({ size = 18 }: { size?: number }) {
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconCheck({ size = 18 }: { size?: number }) {
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
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconCalendar({ size = 14 }: { size?: number }) {
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconFolder({ size = 14 }: { size?: number }) {
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
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function IconUser({ size = 14 }: { size?: number }) {
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
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconFlag({ size = 14 }: { size?: number }) {
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
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function IconX({ size = 14 }: { size?: number }) {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconTable({ size = 16 }: { size?: number }) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

// IconPieChart available for future use

function IconTrendingUp({ size = 18 }: { size?: number }) {
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
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconGrid({ size = 18 }: { size?: number }) {
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
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconBarChart({ size = 18 }: { size?: number }) {
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
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'transform 0.2s ease',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ============================================
// CUSTOM TOOLTIP COMPONENT
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

function CustomChartTooltip({ active, payload, label, suffix = 'ensayos' }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className={styles.customTooltip}>
      {label && <div className={styles.tooltipLabel}>{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ backgroundColor: entry.color }} />
          <span>{entry.name}</span>
          <span className={styles.tooltipValue}>
            {entry.value} {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// COMPONENTE: RESUMEN DE ESTADISTICAS
// ============================================

interface EstadisticasResumenProps {
  ensayos: Ensayo[];
}

function EstadisticasResumen({ ensayos }: EstadisticasResumenProps) {
  const stats = useMemo(() => {
    const porEstado: Record<string, number> = {};

    ensayos.forEach(e => {
      const estado = e.workflow_state || '';
      porEstado[estado] = (porEstado[estado] || 0) + 1;
    });

    const pendientes = ['E1', 'E2'].reduce((sum, s) => sum + (porEstado[s] || 0), 0);
    const enProceso = ['E6', 'E7', 'E8'].reduce((sum, s) => sum + (porEstado[s] || 0), 0);
    const enRevision = ['E9', 'E10', 'E11'].reduce((sum, s) => sum + (porEstado[s] || 0), 0);
    const completados = ['E12', 'E13', 'E14', 'E15'].reduce(
      (sum, s) => sum + (porEstado[s] || 0),
      0
    );

    return { total: ensayos.length, pendientes, enProceso, enRevision, completados };
  }, [ensayos]);

  const cards = [
    {
      label: 'Total Ensayos',
      value: stats.total,
      cardClass: styles.statCardTotal,
      iconClass: styles.statIconTotal,
      valueClass: '',
      icon: <IconChart size={20} />,
    },
    {
      label: 'Pendientes',
      value: stats.pendientes,
      cardClass: styles.statCardPending,
      iconClass: styles.statIconPending,
      valueClass: styles.statPending,
      icon: <IconClock size={20} />,
    },
    {
      label: 'En Proceso',
      value: stats.enProceso,
      cardClass: styles.statCardProcess,
      iconClass: styles.statIconProcess,
      valueClass: styles.statProcess,
      icon: <IconGear size={20} />,
    },
    {
      label: 'En Revision',
      value: stats.enRevision,
      cardClass: styles.statCardReview,
      iconClass: styles.statIconReview,
      valueClass: styles.statReview,
      icon: <IconEye size={20} />,
    },
    {
      label: 'Completados',
      value: stats.completados,
      cardClass: styles.statCardComplete,
      iconClass: styles.statIconComplete,
      valueClass: styles.statComplete,
      icon: <IconCheck size={20} />,
    },
  ];

  return (
    <div className={styles.statsGrid}>
      {cards.map(card => (
        <div key={card.label} className={`${styles.statCard} ${card.cardClass}`}>
          <div className={`${styles.statIconWrap} ${card.iconClass}`}>{card.icon}</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>{card.label}</div>
            <div className={`${styles.statValue} ${card.valueClass}`}>{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// COMPONENTE: DONUT POR TIPO DE ENSAYO
// ============================================

interface ChartProps {
  ensayos: Ensayo[];
}

function DonutPorTipo({ ensayos }: ChartProps) {
  const { getTipoEnsayoNombre } = useTiposEnsayoData();

  const data = useMemo(() => {
    const conteo: Record<string, number> = {};
    ensayos.forEach(e => {
      const tipo = e.tipo || '';
      conteo[tipo] = (conteo[tipo] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([tipo, count]) => ({ name: getTipoEnsayoNombre(tipo), value: count }))
      .sort((a, b) => b.value - a.value);
  }, [ensayos, getTipoEnsayoNombre]);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  if (data.length === 0) {
    return (
      <div className={styles.chartSection}>
        <h3>Distribucion por Tipo de Ensayo</h3>
        <p className={styles.chartSectionSub}>Porcentaje de ensayos agrupados por tipo</p>
        <div className={styles.chartEmpty}>No hay ensayos registrados</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <h3>Distribucion por Tipo de Ensayo</h3>
      <p className={styles.chartSectionSub}>Porcentaje de ensayos agrupados por tipo</p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={105}
            dataKey="value"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`tipo-${index}`} fill={COLORS_TIPO[index % COLORS_TIPO.length]} />
            ))}
          </Pie>
          {/* Center label */}
          <text
            x="50%"
            y="46%"
            textAnchor="middle"
            dominantBaseline="central"
            className={styles.donutCenter}
            style={{ fontSize: '1.5rem', fontWeight: 700, fill: '#1f2937' }}
          >
            {total}
          </text>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="central"
            className={styles.donutCenterLabel}
            style={{ fontSize: '0.7rem', fill: '#9ca3af' }}
          >
            total
          </text>
          <Tooltip content={<CustomChartTooltip />} />
          <Legend
            formatter={(value: string, entry) => {
              const pct =
                total > 0
                  ? (
                      ((((entry.payload as Record<string, unknown>)?.value as number) || 0) /
                        total) *
                      100
                    ).toFixed(0)
                  : '0';
              return `${value} (${pct}%)`;
            }}
            wrapperStyle={{ fontSize: '0.75rem' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// COMPONENTE: DONUT POR ESTADO
// ============================================

function DonutPorEstado({ ensayos }: ChartProps) {
  const data = useMemo(() => {
    const conteo: Record<string, number> = {};
    ensayos.forEach(e => {
      const estado = e.workflow_state || '';
      conteo[estado] = (conteo[estado] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([estado, count]) => ({
        name: (WORKFLOW_STATES_INFO[estado] as { nombre?: string })?.nombre || estado,
        value: count,
        fill: (WORKFLOW_STATES_INFO[estado] as { color?: string })?.color || '#6B7280',
      }))
      .sort((a, b) => {
        const numA = parseInt(a.name.slice(1)) || 0;
        const numB = parseInt(b.name.slice(1)) || 0;
        return numA - numB;
      });
  }, [ensayos]);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  if (data.length === 0) {
    return (
      <div className={styles.chartSection}>
        <h3>Distribucion por Estado</h3>
        <p className={styles.chartSectionSub}>Estado del flujo de trabajo de cada ensayo</p>
        <div className={styles.chartEmpty}>No hay ensayos registrados</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <h3>Distribucion por Estado</h3>
      <p className={styles.chartSectionSub}>Estado del flujo de trabajo de cada ensayo</p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={105}
            dataKey="value"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`estado-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          {/* Center label */}
          <text
            x="50%"
            y="46%"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: '1.5rem', fontWeight: 700, fill: '#1f2937' }}
          >
            {total}
          </text>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: '0.7rem', fill: '#9ca3af' }}
          >
            total
          </text>
          <Tooltip content={<CustomChartTooltip />} />
          <Legend
            formatter={(value: string, entry) => {
              const pct =
                total > 0
                  ? (
                      ((((entry.payload as Record<string, unknown>)?.value as number) || 0) /
                        total) *
                      100
                    ).toFixed(0)
                  : '0';
              return `${value} (${pct}%)`;
            }}
            wrapperStyle={{ fontSize: '0.75rem' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// COMPONENTE: BARCHART APILADO POR PROYECTO
// ============================================

interface BarChartProyectosProps {
  ensayos: Ensayo[];
  proyectos: Proyecto[];
}

function EnsayosPorProyectoChart({ ensayos, proyectos }: BarChartProyectosProps) {
  const data = useMemo(() => {
    return proyectos
      .map(p => {
        const ensayosDelProyecto = ensayos.filter(e => e.proyectoId === p.id);
        if (ensayosDelProyecto.length === 0) return null;

        const pendientes = ensayosDelProyecto.filter(e =>
          ['E1', 'E2'].includes(e.workflow_state || '')
        ).length;
        const enProceso = ensayosDelProyecto.filter(e =>
          ['E6', 'E7', 'E8', 'E9', 'E10', 'E11'].includes(e.workflow_state || '')
        ).length;
        const completados = ensayosDelProyecto.filter(e =>
          ['E12', 'E13', 'E14', 'E15'].includes(e.workflow_state || '')
        ).length;
        const otros = ensayosDelProyecto.filter(e =>
          ['E3', 'E4', 'E5'].includes(e.workflow_state || '')
        ).length;

        const nombre = (p.nombre || p.codigo || 'N/A') as string;
        return {
          name: nombre.length > 25 ? nombre.substring(0, 22) + '...' : nombre,
          Pendientes: pendientes,
          'En proceso': enProceso,
          Completados: completados,
          Otros: otros,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const totalA =
          (a!.Pendientes || 0) + (a!['En proceso'] || 0) + (a!.Completados || 0) + (a!.Otros || 0);
        const totalB =
          (b!.Pendientes || 0) + (b!['En proceso'] || 0) + (b!.Completados || 0) + (b!.Otros || 0);
        return totalB - totalA;
      })
      .slice(0, 15);
  }, [ensayos, proyectos]);

  if (data.length === 0) {
    return (
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <IconBarChart />
          </div>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Ensayos por Proyecto</h3>
            <p className={styles.sectionSubtitle}>
              Distribucion de ensayos por estado en cada proyecto
            </p>
          </div>
        </div>
        <div className={styles.chartEmpty}>No hay datos para mostrar</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          <IconBarChart />
        </div>
        <div className={styles.sectionTitleGroup}>
          <h3 className={styles.sectionTitle}>Ensayos por Proyecto (top {data.length})</h3>
          <p className={styles.sectionSubtitle}>
            Distribucion de ensayos por estado en cada proyecto
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
          <Bar dataKey="Pendientes" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
          <Bar dataKey="En proceso" stackId="a" fill="#3B82F6" />
          <Bar dataKey="Completados" stackId="a" fill="#10B981" radius={[0, 4, 4, 0]} />
          <Bar dataKey="Otros" stackId="a" fill="#D1D5DB" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// COMPONENTE: TREEMAP PROYECTOS -> MUESTRAS
// ============================================

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  color?: string;
}

function TreemapCustomContent({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name = '',
  value = 0,
  color = '#8884d8',
}: TreemapContentProps) {
  if (width < 30 || height < 20) return null;
  const showValue = width > 50 && height > 35;
  const fontSize = Math.min(14, Math.max(9, width / 10));

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
        style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
        opacity={0.9}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - (showValue ? 6 : 0)}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={fontSize}
        fontWeight="600"
        style={{ pointerEvents: 'none' }}
      >
        {name.length > Math.floor(width / (fontSize * 0.6))
          ? name.substring(0, Math.floor(width / (fontSize * 0.6)) - 1) + '...'
          : name}
      </text>
      {showValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.85)"
          fontSize={Math.max(9, fontSize - 2)}
          style={{ pointerEvents: 'none' }}
        >
          {value} ensayo{value !== 1 ? 's' : ''}
        </text>
      )}
    </g>
  );
}

interface TreemapProyectosMuestrasProps {
  ensayos: Ensayo[];
  proyectos: Proyecto[];
  muestras: Muestra[];
}

function TreemapProyectosMuestras({ ensayos, proyectos, muestras }: TreemapProyectosMuestrasProps) {
  const [drillProject, setDrillProject] = useState<string | number | null>(null);

  // Nivel 1: datos por proyecto
  const projectData = useMemo(() => {
    return proyectos
      .map((p, i) => {
        const count = ensayos.filter(e => e.proyectoId === p.id).length;
        if (count === 0) return null;
        const nombre = (p.nombre || p.codigo || 'N/A') as string;
        return {
          name: nombre.length > 30 ? nombre.substring(0, 27) + '...' : nombre,
          value: count,
          color: COLORS_TIPO[i % COLORS_TIPO.length],
          projectId: p.id,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0)) as {
      name: string;
      value: number;
      color: string;
      projectId: string | number;
    }[];
  }, [ensayos, proyectos]);

  // Nivel 2: datos por muestra dentro del proyecto seleccionado
  const muestraData = useMemo(() => {
    if (!drillProject) return [];
    const ensayosProyecto = ensayos.filter(e => String(e.proyectoId) === String(drillProject));
    const porMuestra: Record<string, number> = {};
    let sinMuestra = 0;

    ensayosProyecto.forEach(e => {
      if (e.muestraId) {
        const key = String(e.muestraId);
        porMuestra[key] = (porMuestra[key] || 0) + 1;
      } else {
        sinMuestra++;
      }
    });

    const items = Object.entries(porMuestra).map(([muestraId, count], i) => {
      const muestra = muestras.find(m => String(m.id) === muestraId);
      const label = muestra
        ? `${muestra.codigo || 'M-?'}${muestra.tipoMuestra ? ` (${muestra.tipoMuestra})` : ''}`
        : `Muestra ${muestraId}`;
      return {
        name: label,
        value: count,
        color: COLORS_TIPO[i % COLORS_TIPO.length],
      };
    });

    if (sinMuestra > 0) {
      items.push({ name: 'Sin muestra', value: sinMuestra, color: '#9CA3AF' });
    }

    return items.sort((a, b) => b.value - a.value);
  }, [drillProject, ensayos, muestras]);

  const drillProjectName = useMemo(() => {
    if (!drillProject) return '';
    const p = proyectos.find(p => String(p.id) === String(drillProject));
    return p ? `${p.codigo || ''} — ${p.nombre || ''}` : '';
  }, [drillProject, proyectos]);

  const currentData = drillProject ? muestraData : projectData;

  if (projectData.length === 0) {
    return (
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <IconGrid />
          </div>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Mapa de Ensayos: Proyectos y Muestras</h3>
            <p className={styles.sectionSubtitle}>
              Visualizacion proporcional de ensayos por proyecto
            </p>
          </div>
        </div>
        <div className={styles.chartEmpty}>No hay datos para mostrar</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <div className={styles.treemapHeader}>
        <div className={styles.sectionHeader} style={{ marginBottom: 0 }}>
          <div className={styles.sectionIcon}>
            <IconGrid />
          </div>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>
              {drillProject ? `Muestras de: ${drillProjectName}` : 'Mapa de Ensayos por Proyecto'}
            </h3>
            <p className={styles.sectionSubtitle}>
              {drillProject
                ? 'Distribucion de ensayos por muestra'
                : 'Click en un proyecto para ver sus muestras'}
            </p>
          </div>
        </div>
        {drillProject && (
          <button className={styles.treemapBack} onClick={() => setDrillProject(null)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" />
            </svg>
            Volver a proyectos
          </button>
        )}
      </div>
      {currentData.length === 0 ? (
        <div className={styles.chartEmpty}>
          Este proyecto no tiene ensayos con muestras asignadas
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <Treemap
            data={currentData}
            dataKey="value"
            nameKey="name"
            content={<TreemapCustomContent />}
            onClick={(node: Record<string, unknown>) => {
              if (!drillProject && node && node.projectId) {
                setDrillProject(node.projectId as string | number);
              }
            }}
          >
            <Tooltip content={<CustomChartTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: AREA CHART TENDENCIA TEMPORAL
// ============================================

function TendenciaTemporalChart({ ensayos }: ChartProps) {
  const data = useMemo(() => {
    const porMes: Record<string, number> = {};
    ensayos.forEach(e => {
      if (e.fecha_solicitud) {
        const mes = (e.fecha_solicitud as string).substring(0, 7); // "2025-01"
        porMes[mes] = (porMes[mes] || 0) + 1;
      }
    });
    return Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, count]) => ({ mes, Ensayos: count }));
  }, [ensayos]);

  if (data.length === 0) {
    return (
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <IconTrendingUp />
          </div>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Tendencia Temporal</h3>
            <p className={styles.sectionSubtitle}>Ensayos solicitados por mes</p>
          </div>
        </div>
        <div className={styles.chartEmpty}>No hay datos temporales disponibles</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          <IconTrendingUp />
        </div>
        <div className={styles.sectionTitleGroup}>
          <h3 className={styles.sectionTitle}>Tendencia Temporal</h3>
          <p className={styles.sectionSubtitle}>Ensayos solicitados por mes</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="colorEnsayos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomChartTooltip />} />
          <Area
            type="monotone"
            dataKey="Ensayos"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#colorEnsayos)"
            dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// COMPONENTE: TABLA DE PROYECTOS CON ENSAYOS
// ============================================

interface TablaProyectosProps {
  proyectos: Proyecto[];
  ensayos: Ensayo[];
  clientes: Cliente[];
}

function TablaProyectos({ proyectos, ensayos, clientes }: TablaProyectosProps) {
  const [expandedProyecto, setExpandedProyecto] = useState<string | number | null>(null);
  const { getTipoEnsayoNombre } = useTiposEnsayoData();

  const proyectosConStats = useMemo((): ProyectoConStats[] => {
    return proyectos.map(proyecto => {
      const ensayosProyecto = ensayos.filter(e => e.proyectoId === proyecto.id);
      const completados = ensayosProyecto.filter(e =>
        ['E15', 'E14', 'E13', 'E12'].includes(e.workflow_state || '')
      ).length;
      const pendientes = ensayosProyecto.filter(e =>
        ['E1', 'E2'].includes(e.workflow_state || '')
      ).length;
      const enProceso = ensayosProyecto.filter(e =>
        ['E6', 'E7', 'E8', 'E9', 'E10', 'E11'].includes(e.workflow_state || '')
      ).length;

      return {
        ...proyecto,
        ensayos: ensayosProyecto,
        stats: {
          total: ensayosProyecto.length,
          completados,
          pendientes,
          enProceso,
          progreso:
            ensayosProyecto.length > 0
              ? Math.round((completados / ensayosProyecto.length) * 100)
              : 0,
        },
      };
    });
  }, [proyectos, ensayos]);

  const getClienteNombre = (clienteId: string | number | undefined): string => {
    return clientes.find(c => c.id === clienteId)?.nombre || 'N/A';
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.tableHeaderIcon}>
          <IconTable />
        </div>
        <div className={styles.tableHeaderText}>
          <h3 className={styles.tableTitle}>Seguimiento por Proyecto</h3>
          <p className={styles.tableSubtitle}>
            Estado detallado de ensayos por proyecto con barra de progreso
          </p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th className="center">Ensayos</th>
              <th className="center">Progreso</th>
              <th className="right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectosConStats.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  No hay proyectos registrados
                </td>
              </tr>
            ) : (
              proyectosConStats.map(proyecto => {
                const isExpanded = expandedProyecto === proyecto.id;
                const total = proyecto.stats.total;
                const pctComplete = total > 0 ? (proyecto.stats.completados / total) * 100 : 0;
                const pctProcess = total > 0 ? (proyecto.stats.enProceso / total) * 100 : 0;
                const pctPending = total > 0 ? (proyecto.stats.pendientes / total) * 100 : 0;

                return (
                  <>
                    <tr key={proyecto.id}>
                      <td>
                        <div className={styles.projectCode}>{proyecto.codigo}</div>
                        <div className={styles.projectName}>{proyecto.nombre}</div>
                      </td>
                      <td>{getClienteNombre(proyecto.clienteId)}</td>
                      <td>
                        <Badge
                          color={
                            proyecto.estado === 'activo'
                              ? '#10B981'
                              : proyecto.estado === 'completado'
                                ? '#6B7280'
                                : '#F59E0B'
                          }
                        >
                          {proyecto.estado}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.statsInline}>
                          <span className={styles.statP}>{proyecto.stats.pendientes}P</span>
                          <span className={styles.statE}>{proyecto.stats.enProceso}E</span>
                          <span className={styles.statC}>{proyecto.stats.completados}C</span>
                        </div>
                        <div className={styles.totalText}>{proyecto.stats.total} total</div>
                      </td>
                      <td>
                        <div className={styles.progressContainer}>
                          <div className={styles.progressBar}>
                            <div
                              className={`${styles.progressSegment} ${styles.progressSegmentComplete}`}
                              style={{ width: `${pctComplete}%` }}
                            />
                            <div
                              className={`${styles.progressSegment} ${styles.progressSegmentProcess}`}
                              style={{ width: `${pctProcess}%` }}
                            />
                            <div
                              className={`${styles.progressSegment} ${styles.progressSegmentPending}`}
                              style={{ width: `${pctPending}%` }}
                            />
                          </div>
                          <span className={styles.progressText}>{proyecto.stats.progreso}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setExpandedProyecto(isExpanded ? null : proyecto.id)}
                          className={styles.btnSmall}
                        >
                          <IconChevron open={isExpanded} />
                          {isExpanded ? 'Ocultar' : 'Ver ensayos'}
                        </button>
                      </td>
                    </tr>

                    {/* Fila expandida con ensayos */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className={styles.expandedRow}>
                          <div className={styles.expandedContent}>
                            <h4 className={styles.expandedTitle}>
                              Ensayos del proyecto ({proyecto.ensayos.length})
                            </h4>
                            {proyecto.ensayos.length === 0 ? (
                              <div className={styles.expandedEmpty}>
                                No hay ensayos registrados para este proyecto
                              </div>
                            ) : (
                              <div className={styles.ensayosGrid}>
                                {proyecto.ensayos.map(ensayo => {
                                  const workflow = getWorkflowInfo(ensayo.workflow_state || '');
                                  return (
                                    <div key={ensayo.id} className={styles.ensayoCard}>
                                      <div className={styles.ensayoHeader}>
                                        <div>
                                          <div className={styles.ensayoCodigo}>{ensayo.codigo}</div>
                                          <div className={styles.ensayoTipo}>
                                            {getTipoEnsayoNombre(ensayo.tipo || '')}
                                          </div>
                                        </div>
                                        <Badge color={workflow.color}>{workflow.nombre}</Badge>
                                      </div>
                                      <div className={styles.ensayoFechas}>
                                        <span>Solicitud: {formatDate(ensayo.fecha_solicitud)}</span>
                                        {ensayo.fecha_ejecucion && (
                                          <span>
                                            Ejecucion: {formatDate(ensayo.fecha_ejecucion)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Reportes({ moduleParams }: ReportesProps) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [ensayos, setEnsayos] = useState<Ensayo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [muestras, setMuestras] = useState<Muestra[]>([]);
  const [personal, setPersonal] = useState<PersonalInterno[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [comprobaciones, setComprobaciones] = useState<Comprobacion[]>([]);
  const [tiposEnsayo, setTiposEnsayo] = useState<ReportTipoEnsayo[]>([]);
  const [loading, setLoading] = useState(true);
  const { getTipoEnsayoNombre } = useTiposEnsayoData();

  // Filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroCliente, setFiltroCliente] = useState<string | number>('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroProyecto, setFiltroProyecto] = useState<string | number>('todos');

  // Aplicar filtro de proyecto desde moduleParams
  useEffect(() => {
    if (moduleParams?.proyectoId) {
      setFiltroProyecto(moduleParams.proyectoId as string);
    }
  }, [moduleParams]);

  // Cargar datos desde API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          proyectosRes,
          ensayosRes,
          clientesRes,
          muestrasRes,
          personalRes,
          equiposRes,
          comprobacionesRes, // calibracionesRes — not used directly
          ,
          tiposEnsayoRes,
        ] = await Promise.all([
          ProyectosAPI.list(),
          EnsayosAPI.list(),
          ClientesAPI.list(),
          MuestrasAPI.list(),
          PersonalInternoAPI.list().catch(() => []),
          EquiposAPI.list().catch(() => []),
          ComprobacionesAPI.list().catch(() => []),
          CalibracionesAPI.list().catch(() => []),
          TiposEnsayoAPI.list().catch(() => []),
        ]);

        // Map snake_case API fields to camelCase used by this component
        const rawProyectos = (proyectosRes as Record<string, unknown>[]) || [];
        setProyectos(
          rawProyectos.map(
            p =>
              ({
                ...p,
                id: p.id ?? p.proyecto_id,
                clienteId: p.cliente_id ?? p.clienteId,
              }) as Proyecto
          )
        );

        const rawEnsayos = (ensayosRes as Record<string, unknown>[]) || [];
        setEnsayos(
          rawEnsayos.map(
            e =>
              ({
                ...e,
                proyectoId: e.proyecto_id ?? e.proyectoId,
                muestraId: e.muestra_id ?? e.muestraId,
              }) as Ensayo
          )
        );

        setClientes((clientesRes as Cliente[]) || []);

        const rawMuestras = (muestrasRes as Record<string, unknown>[]) || [];
        setMuestras(
          rawMuestras.map(
            m =>
              ({
                ...m,
                perforacionId: m.perforacion_id ?? m.perforacionId,
                profundidadInicio: m.profundidad_inicio ?? m.profundidadInicio,
                profundidadFin: m.profundidad_fin ?? m.profundidadFin,
                tipoMuestra: m.tipo_muestra ?? m.tipoMuestra,
              }) as Muestra
          )
        );

        // New indicator data
        setPersonal((personalRes as PersonalInterno[]) || []);
        setEquipos((equiposRes as Equipo[]) || []);
        setComprobaciones((comprobacionesRes as Comprobacion[]) || []);
        setTiposEnsayo((tiposEnsayoRes as ReportTipoEnsayo[]) || []);
      } catch (err) {
        console.error('Error cargando datos para reportes:', err);
        setProyectos([]);
        setEnsayos([]);
        setClientes([]);
        setMuestras([]);
        setPersonal([]);
        setEquipos([]);
        setComprobaciones([]);
        setTiposEnsayo([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Datos filtrados
  const ensayosFiltrados = useMemo(() => {
    return ensayos.filter(e => {
      // Filtro por fecha
      if (filtroFechaDesde && (e.fecha_solicitud || '') < filtroFechaDesde) return false;
      if (filtroFechaHasta && (e.fecha_solicitud || '') > filtroFechaHasta) return false;

      // Filtro por proyecto (normalizar a string por discrepancia de tipos API vs UI)
      if (filtroProyecto !== 'todos' && String(e.proyectoId) !== String(filtroProyecto))
        return false;

      // Filtro por cliente (a traves del proyecto)
      if (filtroCliente !== 'todos') {
        const proyecto = proyectos.find(p => p.id === e.proyectoId);
        if (!proyecto || proyecto.clienteId !== filtroCliente) return false;
      }

      // Filtro por estado
      if (filtroEstado !== 'todos') {
        const workflowState = e.workflow_state || '';
        if (filtroEstado === 'pendientes' && !['E1', 'E2'].includes(workflowState)) return false;
        if (filtroEstado === 'en_proceso' && !['E6', 'E7', 'E8'].includes(workflowState))
          return false;
        if (filtroEstado === 'en_revision' && !['E9', 'E10', 'E11'].includes(workflowState))
          return false;
        if (filtroEstado === 'completados' && !['E12', 'E13', 'E14', 'E15'].includes(workflowState))
          return false;
      }

      return true;
    });
  }, [
    ensayos,
    proyectos,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroCliente,
    filtroEstado,
    filtroProyecto,
  ]);

  const proyectosFiltrados = useMemo(() => {
    let filtered = proyectos;
    if (filtroCliente !== 'todos') {
      filtered = filtered.filter(p => p.clienteId === filtroCliente);
    }
    if (filtroProyecto !== 'todos') {
      filtered = filtered.filter(p => String(p.id) === String(filtroProyecto));
    }
    return filtered;
  }, [proyectos, filtroCliente, filtroProyecto]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filtroFechaDesde) count++;
    if (filtroFechaHasta) count++;
    if (filtroCliente !== 'todos') count++;
    if (filtroEstado !== 'todos') count++;
    if (filtroProyecto !== 'todos') count++;
    return count;
  }, [filtroFechaDesde, filtroFechaHasta, filtroCliente, filtroEstado, filtroProyecto]);

  const clearFilters = useCallback(() => {
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroCliente('todos');
    setFiltroEstado('todos');
    setFiltroProyecto('todos');
  }, []);

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Codigo', 'Tipo', 'Proyecto', 'Estado', 'Fecha Solicitud', 'Fecha Ejecucion'];
    const rows = ensayosFiltrados.map(e => {
      const proyecto = proyectos.find(p => p.id === e.proyectoId);
      const workflow = getWorkflowInfo(e.workflow_state || '');
      return [
        e.codigo,
        getTipoEnsayoNombre(e.tipo || ''),
        proyecto?.codigo || 'N/A',
        workflow.nombre,
        e.fecha_solicitud || '',
        e.fecha_ejecucion || '',
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_ensayos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <PageLayout title="Reportes">
        <div className={styles.loading}>Cargando reportes...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Reportes y Estadisticas">
      {/* Estadisticas generales */}
      <EstadisticasResumen ensayos={ensayosFiltrados} />

      {/* Filtros */}
      <div className={styles.filterSection}>
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.filterLabelIcon}>
                <IconCalendar />
              </span>
              Desde
            </label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={e => setFiltroFechaDesde(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.filterLabelIcon}>
                <IconCalendar />
              </span>
              Hasta
            </label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={e => setFiltroFechaHasta(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.filterLabelIcon}>
                <IconFolder />
              </span>
              Proyecto
            </label>
            <select
              value={filtroProyecto}
              onChange={e => setFiltroProyecto(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos los proyectos</option>
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.codigo} - {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.filterLabelIcon}>
                <IconUser />
              </span>
              Cliente
            </label>
            <select
              value={filtroCliente}
              onChange={e => setFiltroCliente(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos los clientes</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <span className={styles.filterLabelIcon}>
                <IconFlag />
              </span>
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos</option>
              <option value="pendientes">Pendientes</option>
              <option value="en_proceso">En Proceso</option>
              <option value="en_revision">En Revision</option>
              <option value="completados">Completados</option>
            </select>
          </div>
          <div className={styles.filterActions}>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className={styles.clearBtn}>
                <IconX />
                Limpiar
                <span className={styles.activeFiltersCount}>{activeFilterCount}</span>
              </button>
            )}
            <button onClick={exportarCSV} className={styles.exportBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Graficos de distribucion: donuts lado a lado */}
      <div className={styles.chartGrid}>
        <DonutPorTipo ensayos={ensayosFiltrados} />
        <DonutPorEstado ensayos={ensayosFiltrados} />
      </div>

      {/* Barchart apilado por proyecto */}
      <EnsayosPorProyectoChart ensayos={ensayosFiltrados} proyectos={proyectosFiltrados} />

      {/* Treemap interactivo: proyectos -> muestras */}
      <TreemapProyectosMuestras
        ensayos={ensayosFiltrados}
        proyectos={proyectosFiltrados}
        muestras={muestras}
      />

      {/* Area chart tendencia temporal */}
      <TendenciaTemporalChart ensayos={ensayosFiltrados} />

      {/* =============================================
          NUEVOS INDICADORES
          ============================================= */}

      {/* Tiempos y ciclos */}
      <TiemposCiclos ensayos={ensayosFiltrados} />

      {/* Curva S */}
      <CurvaS ensayos={ensayosFiltrados} />

      {/* Carga de trabajo del personal */}
      <CargaTrabajo ensayos={ensayosFiltrados} personal={personal} />

      {/* Estado de equipos */}
      <EstadoEquipos equipos={equipos} comprobaciones={comprobaciones} />

      {/* Analitica de clientes */}
      <AnaliticaClientes
        ensayos={ensayosFiltrados}
        proyectos={proyectosFiltrados}
        clientes={clientes}
        tiposEnsayo={tiposEnsayo}
      />

      {/* Cronograma de proyectos (Gantt simplificado) */}
      <CronogramaGantt proyectos={proyectosFiltrados} />

      {/* Tabla de proyectos */}
      <TablaProyectos
        proyectos={proyectosFiltrados}
        ensayos={ensayosFiltrados}
        clientes={clientes}
      />
    </PageLayout>
  );
}
