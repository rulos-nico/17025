import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge } from '../components/ui';
import { ProyectosAPI, ClientesAPI, EnsayosAPI, MuestrasAPI } from '../services/apiService';
import { getWorkflowInfo } from '../config';
import { useTiposEnsayoData } from '../hooks/useTiposEnsayoData';
import {
  PieChart,
  Pie,
  Cell,
  Treemap,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from './ReporteProyecto.module.css';

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
  descripcion?: string;
  [key: string]: unknown;
}

interface ReporteProyectoProps {
  moduleParams?: Record<string, unknown> | null;
  navigateToModule: (module: string, params?: Record<string, unknown>) => void;
}

// ============================================
// CONSTANTS
// ============================================

const COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#3b82f6',
  '#84cc16',
  '#06b6d4',
];

const ESTADO_COLORS: Record<string, string> = {
  pendientes: '#F59E0B',
  en_proceso: '#3B82F6',
  en_revision: '#8B5CF6',
  completados: '#10B981',
  otros: '#9CA3AF',
};

// ============================================
// HELPERS
// ============================================

const formatDate = (fecha: string | null | undefined): string => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-CL');
};

function classifyWorkflowState(ws: string): string {
  if (['E1', 'E2'].includes(ws)) return 'pendientes';
  if (['E6', 'E7', 'E8'].includes(ws)) return 'en_proceso';
  if (['E9', 'E10', 'E11'].includes(ws)) return 'en_revision';
  if (['E12', 'E13', 'E14', 'E15'].includes(ws)) return 'completados';
  return 'otros';
}

// ============================================
// SVG ICON COMPONENTS
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

function IconPercent({ size = 18 }: { size?: number }) {
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
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
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
// TREEMAP CUSTOM CONTENT
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

// ============================================
// COMPONENTE: DONUT POR TIPO
// ============================================

function DonutPorTipo({ ensayos }: { ensayos: Ensayo[] }) {
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
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={100}
            dataKey="value"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_entry, index) => (
              <Cell key={`tipo-${index}`} fill={COLORS[index % COLORS.length]} />
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
// COMPONENTE: DONUT POR ESTADO
// ============================================

function DonutPorEstado({ ensayos }: { ensayos: Ensayo[] }) {
  const data = useMemo(() => {
    const conteo: Record<string, number> = {
      Pendientes: 0,
      'En proceso': 0,
      'En revision': 0,
      Completados: 0,
      Otros: 0,
    };
    const fills: Record<string, string> = {
      Pendientes: ESTADO_COLORS.pendientes,
      'En proceso': ESTADO_COLORS.en_proceso,
      'En revision': ESTADO_COLORS.en_revision,
      Completados: ESTADO_COLORS.completados,
      Otros: ESTADO_COLORS.otros,
    };

    ensayos.forEach(e => {
      const cat = classifyWorkflowState(e.workflow_state || '');
      const label =
        cat === 'pendientes'
          ? 'Pendientes'
          : cat === 'en_proceso'
            ? 'En proceso'
            : cat === 'en_revision'
              ? 'En revision'
              : cat === 'completados'
                ? 'Completados'
                : 'Otros';
      conteo[label]++;
    });

    return Object.entries(conteo)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value, fill: fills[name] }));
  }, [ensayos]);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  if (data.length === 0) {
    return (
      <div className={styles.chartSection}>
        <h3>Distribucion por Estado</h3>
        <p className={styles.chartSectionSub}>Estado del flujo de trabajo</p>
        <div className={styles.chartEmpty}>No hay ensayos registrados</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <h3>Distribucion por Estado</h3>
      <p className={styles.chartSectionSub}>Estado del flujo de trabajo</p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={100}
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
// COMPONENTE: TREEMAP MUESTRAS
// ============================================

function TreemapMuestras({ ensayos, muestras }: { ensayos: Ensayo[]; muestras: Muestra[] }) {
  const data = useMemo(() => {
    const porMuestra: Record<string, number> = {};
    let sinMuestra = 0;

    ensayos.forEach(e => {
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
        color: COLORS[i % COLORS.length],
      };
    });

    if (sinMuestra > 0) {
      items.push({
        name: 'Sin muestra',
        value: sinMuestra,
        color: '#9CA3AF',
      });
    }

    return items.sort((a, b) => b.value - a.value);
  }, [ensayos, muestras]);

  if (data.length === 0) {
    return (
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <IconGrid />
          </div>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Ensayos por Muestra</h3>
            <p className={styles.sectionSubtitle}>
              Distribucion proporcional de ensayos por muestra
            </p>
          </div>
        </div>
        <div className={styles.chartEmpty}>No hay ensayos registrados</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          <IconGrid />
        </div>
        <div className={styles.sectionTitleGroup}>
          <h3 className={styles.sectionTitle}>Ensayos por Muestra ({data.length} muestras)</h3>
          <p className={styles.sectionSubtitle}>Distribucion proporcional de ensayos por muestra</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <Treemap data={data} dataKey="value" nameKey="name" content={<TreemapCustomContent />}>
          <Tooltip content={<CustomChartTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// COMPONENTE: TENDENCIA TEMPORAL (AREA CHART)
// ============================================

function TendenciaTemporalChart({ ensayos }: { ensayos: Ensayo[] }) {
  const data = useMemo(() => {
    const porMes: Record<string, number> = {};
    ensayos.forEach(e => {
      if (e.fecha_solicitud) {
        const mes = (e.fecha_solicitud as string).substring(0, 7);
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
        <div className={styles.chartEmpty}>No hay datos temporales</div>
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
          <h3 className={styles.sectionTitle}>Tendencia Temporal de Ensayos</h3>
          <p className={styles.sectionSubtitle}>Ensayos solicitados por mes</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="colorEnsayosProy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomChartTooltip />} />
          <Area
            type="monotone"
            dataKey="Ensayos"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#colorEnsayosProy)"
            dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// COMPONENTE: TABLA DE ENSAYOS AGRUPADOS POR MUESTRA
// ============================================

function TablaEnsayos({ ensayos, muestras }: { ensayos: Ensayo[]; muestras: Muestra[] }) {
  const { getTipoEnsayoNombre } = useTiposEnsayoData();
  const [expandedMuestra, setExpandedMuestra] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const groups: { muestra: Muestra | null; label: string; ensayos: Ensayo[] }[] = [];
    const byMuestra: Record<string, Ensayo[]> = {};
    const sinMuestra: Ensayo[] = [];

    ensayos.forEach(e => {
      if (e.muestraId) {
        const key = String(e.muestraId);
        if (!byMuestra[key]) byMuestra[key] = [];
        byMuestra[key].push(e);
      } else {
        sinMuestra.push(e);
      }
    });

    Object.entries(byMuestra).forEach(([muestraId, ens]) => {
      const muestra = muestras.find(m => String(m.id) === muestraId) || null;
      const label = muestra
        ? `${muestra.codigo} — ${muestra.tipoMuestra || ''} (${muestra.profundidadInicio ?? '?'}m - ${muestra.profundidadFin ?? '?'}m)`
        : `Muestra ${muestraId}`;
      groups.push({ muestra, label, ensayos: ens });
    });

    groups.sort((a, b) => b.ensayos.length - a.ensayos.length);

    if (sinMuestra.length > 0) {
      groups.push({ muestra: null, label: 'Sin muestra asignada', ensayos: sinMuestra });
    }

    return groups;
  }, [ensayos, muestras]);

  if (ensayos.length === 0) {
    return (
      <div className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <IconTable />
          </div>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Detalle de Ensayos</h3>
            <p className={styles.sectionSubtitle}>Ensayos agrupados por muestra</p>
          </div>
        </div>
        <div className={styles.chartEmpty}>No hay ensayos para este proyecto</div>
      </div>
    );
  }

  return (
    <div className={styles.tableSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          <IconTable />
        </div>
        <div className={styles.sectionTitleGroup}>
          <h3 className={styles.sectionTitle}>Detalle de Ensayos ({ensayos.length} total)</h3>
          <p className={styles.sectionSubtitle}>
            Ensayos agrupados por muestra con detalle expandible
          </p>
        </div>
      </div>
      <div className={styles.muestraList}>
        {grouped.map((group, gi) => {
          const key = group.muestra ? String(group.muestra.id) : '__sin_muestra__';
          const isExpanded = expandedMuestra === key;

          return (
            <div key={gi} className={styles.muestraGroup}>
              <button
                className={`${styles.muestraHeader} ${isExpanded ? styles.muestraHeaderExpanded : ''}`}
                onClick={() => setExpandedMuestra(isExpanded ? null : key)}
              >
                <div className={styles.muestraInfo}>
                  <span className={styles.muestraLabel}>{group.label}</span>
                  <Badge color={group.muestra ? '#6366f1' : '#9CA3AF'}>
                    {group.ensayos.length} ensayo{group.ensayos.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>

              {isExpanded && (
                <div className={styles.ensayosTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Codigo</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Solicitud</th>
                        <th>Ejecucion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.ensayos.map(ensayo => {
                        const wf = getWorkflowInfo(ensayo.workflow_state || '');
                        return (
                          <tr key={String(ensayo.id)}>
                            <td className={styles.codCell}>{ensayo.codigo}</td>
                            <td>{getTipoEnsayoNombre(ensayo.tipo || '')}</td>
                            <td>
                              <Badge color={wf.color}>{wf.nombre}</Badge>
                            </td>
                            <td>{formatDate(ensayo.fecha_solicitud)}</td>
                            <td>{formatDate(ensayo.fecha_ejecucion)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: RESUMEN STATS
// ============================================

function StatsResumen({ ensayos }: { ensayos: Ensayo[] }) {
  const stats = useMemo(() => {
    let pendientes = 0,
      enProceso = 0,
      enRevision = 0,
      completados = 0;
    ensayos.forEach(e => {
      const cat = classifyWorkflowState(e.workflow_state || '');
      if (cat === 'pendientes') pendientes++;
      else if (cat === 'en_proceso') enProceso++;
      else if (cat === 'en_revision') enRevision++;
      else if (cat === 'completados') completados++;
    });
    const progreso = ensayos.length > 0 ? Math.round((completados / ensayos.length) * 100) : 0;
    return { total: ensayos.length, pendientes, enProceso, enRevision, completados, progreso };
  }, [ensayos]);

  const cards = [
    {
      label: 'Total',
      value: stats.total,
      cardClass: styles.statCardTotal,
      iconClass: styles.statIconTotal,
      valueClass: '',
      icon: <IconChart size={18} />,
    },
    {
      label: 'Pendientes',
      value: stats.pendientes,
      cardClass: styles.statCardPending,
      iconClass: styles.statIconPending,
      valueClass: styles.statPending,
      icon: <IconClock size={18} />,
    },
    {
      label: 'En Proceso',
      value: stats.enProceso,
      cardClass: styles.statCardProcess,
      iconClass: styles.statIconProcess,
      valueClass: styles.statProcess,
      icon: <IconGear size={18} />,
    },
    {
      label: 'En Revision',
      value: stats.enRevision,
      cardClass: styles.statCardReview,
      iconClass: styles.statIconReview,
      valueClass: styles.statReview,
      icon: <IconEye size={18} />,
    },
    {
      label: 'Completados',
      value: stats.completados,
      cardClass: styles.statCardComplete,
      iconClass: styles.statIconComplete,
      valueClass: styles.statComplete,
      icon: <IconCheck size={18} />,
    },
    {
      label: 'Progreso',
      value: `${stats.progreso}%`,
      cardClass: styles.statCardProgress,
      iconClass: styles.statIconProgress,
      valueClass: '',
      icon: <IconPercent size={18} />,
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
// COMPONENTE PRINCIPAL
// ============================================

export default function ReporteProyecto({ moduleParams, navigateToModule }: ReporteProyectoProps) {
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [ensayos, setEnsayos] = useState<Ensayo[]>([]);
  const [muestras, setMuestras] = useState<Muestra[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  const proyectoId = moduleParams?.proyectoId as string | undefined;

  useEffect(() => {
    if (!proyectoId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [proyectosRes, ensayosRes, muestrasRes, clientesRes] = await Promise.all([
          ProyectosAPI.list(),
          EnsayosAPI.list(),
          MuestrasAPI.list(),
          ClientesAPI.list(),
        ]);

        // Map and find proyecto
        const rawProyectos = (proyectosRes as Record<string, unknown>[]) || [];
        const allProyectos = rawProyectos.map(
          p =>
            ({
              ...p,
              id: p.id ?? p.proyecto_id,
              clienteId: p.cliente_id ?? p.clienteId,
            }) as Proyecto
        );
        const found = allProyectos.find(p => String(p.id) === String(proyectoId));
        setProyecto(found || null);

        // Map ensayos and filter to this project
        const rawEnsayos = (ensayosRes as Record<string, unknown>[]) || [];
        const allEnsayos = rawEnsayos.map(
          e =>
            ({
              ...e,
              proyectoId: e.proyecto_id ?? e.proyectoId,
              muestraId: e.muestra_id ?? e.muestraId,
            }) as Ensayo
        );
        setEnsayos(allEnsayos.filter(e => String(e.proyectoId) === String(proyectoId)));

        // Map muestras
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

        // Find client
        if (found?.clienteId) {
          const allClientes = (clientesRes as Cliente[]) || [];
          setCliente(allClientes.find(c => String(c.id) === String(found.clienteId)) || null);
        }
      } catch (err) {
        console.error('Error cargando reporte de proyecto:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [proyectoId]);

  if (loading) {
    return (
      <PageLayout title="Reporte de Proyecto">
        <div className={styles.loading}>Cargando reporte...</div>
      </PageLayout>
    );
  }

  if (!proyectoId || !proyecto) {
    return (
      <PageLayout title="Reporte de Proyecto">
        <div className={styles.noProject}>
          <p>No se encontro el proyecto solicitado.</p>
          <button onClick={() => navigateToModule('proyectos')} className={styles.btnBack}>
            Volver a Proyectos
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Reporte: ${proyecto.codigo || ''}`}>
      {/* Header con info del proyecto y boton volver */}
      <div className={styles.projectHeader}>
        <div className={styles.projectHeaderLeft}>
          <button onClick={() => navigateToModule('proyectos')} className={styles.btnBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" />
            </svg>
            Volver a Proyectos
          </button>
          <div className={styles.projectInfo}>
            <h2 className={styles.projectTitle}>
              {proyecto.codigo} — {proyecto.nombre || 'Sin nombre'}
            </h2>
            <div className={styles.projectMeta}>
              {cliente && (
                <span>
                  Cliente: <strong>{cliente.nombre}</strong>
                </span>
              )}
              {proyecto.estado && (
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
              )}
              <span>
                {ensayos.length} ensayo{ensayos.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsResumen ensayos={ensayos} />

      {/* Donuts lado a lado */}
      <div className={styles.chartGrid}>
        <DonutPorTipo ensayos={ensayos} />
        <DonutPorEstado ensayos={ensayos} />
      </div>

      {/* Treemap de muestras */}
      <TreemapMuestras ensayos={ensayos} muestras={muestras} />

      {/* Tendencia temporal */}
      <TendenciaTemporalChart ensayos={ensayos} />

      {/* Tabla de ensayos agrupados por muestra */}
      <TablaEnsayos ensayos={ensayos} muestras={muestras} />
    </PageLayout>
  );
}
