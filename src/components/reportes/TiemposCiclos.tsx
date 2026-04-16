/**
 * TiemposCiclos.tsx — Tiempos y ciclos de ensayos
 *
 * Muestra:
 * - Tiempo promedio por fase (solicitud→programacion→ejecucion→reporte→entrega)
 * - Turnaround total promedio (AreaChart mensual)
 * - Mini-stats: promedio total, ensayos atrasados, mas rapido, mas lento
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
  AreaChart,
  Area,
} from 'recharts';
import type { Ensayo } from './shared';
import { CustomChartTooltip, SectionHeader, diffDays, toYearMonth } from './shared';
import ind from './ReportesIndicadores.module.css';

// ============================================
// TYPES
// ============================================

interface TiemposCiclosProps {
  ensayos: Ensayo[];
}

interface PhaseAvg {
  label: string;
  avg: number;
  color: string;
  count: number;
}

// ============================================
// ICON
// ============================================

function IconTimer({ size = 18 }: { size?: number }) {
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
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3L2 6" />
      <path d="M22 6l-3-3" />
      <line x1="12" y1="1" x2="12" y2="3" />
    </svg>
  );
}

// ============================================
// COMPONENT
// ============================================

export default function TiemposCiclos({ ensayos }: TiemposCiclosProps) {
  // Calculate phase durations
  const phases = useMemo((): PhaseAvg[] => {
    const defs: { label: string; from: keyof Ensayo; to: keyof Ensayo; color: string }[] = [
      {
        label: 'Solicitud → Programacion',
        from: 'fecha_solicitud',
        to: 'fecha_programacion',
        color: '#F59E0B',
      },
      {
        label: 'Programacion → Ejecucion',
        from: 'fecha_programacion',
        to: 'fecha_ejecucion',
        color: '#3B82F6',
      },
      {
        label: 'Ejecucion → Reporte',
        from: 'fecha_ejecucion',
        to: 'fecha_reporte',
        color: '#8B5CF6',
      },
      { label: 'Reporte → Entrega', from: 'fecha_reporte', to: 'fecha_entrega', color: '#10B981' },
    ];

    return defs.map(d => {
      const diffs: number[] = [];
      ensayos.forEach(e => {
        const val = diffDays(e[d.from] as string, e[d.to] as string);
        if (val !== null && val >= 0) diffs.push(val);
      });
      const avg =
        diffs.length > 0
          ? Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 10) / 10
          : 0;
      return { label: d.label, avg, color: d.color, count: diffs.length };
    });
  }, [ensayos]);

  // Total turnaround (solicitud → entrega) per month
  const turnaroundTrend = useMemo(() => {
    const byMonth: Record<string, number[]> = {};
    ensayos.forEach(e => {
      const total = diffDays(e.fecha_solicitud as string, e.fecha_entrega as string);
      const month = toYearMonth(e.fecha_solicitud as string);
      if (total !== null && total >= 0 && month) {
        if (!byMonth[month]) byMonth[month] = [];
        byMonth[month].push(total);
      }
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, vals]) => ({
        mes,
        'Promedio dias': Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      }));
  }, [ensayos]);

  // Mini stats
  const miniStats = useMemo(() => {
    const allTurnaround: number[] = [];
    let atrasados = 0;

    ensayos.forEach(e => {
      const total = diffDays(e.fecha_solicitud as string, e.fecha_entrega as string);
      if (total !== null && total >= 0) allTurnaround.push(total);

      // Check if overdue: has duracion_estimada but still not delivered
      if (e.duracion_estimada && !e.fecha_entrega) {
        const est = parseInt(e.duracion_estimada, 10);
        if (!isNaN(est) && e.fecha_solicitud) {
          const elapsed = diffDays(
            e.fecha_solicitud as string,
            new Date().toISOString().split('T')[0]
          );
          if (elapsed !== null && elapsed > est) atrasados++;
        }
      }
    });

    const avgTotal =
      allTurnaround.length > 0
        ? Math.round((allTurnaround.reduce((a, b) => a + b, 0) / allTurnaround.length) * 10) / 10
        : 0;
    const fastest = allTurnaround.length > 0 ? Math.min(...allTurnaround) : 0;
    const slowest = allTurnaround.length > 0 ? Math.max(...allTurnaround) : 0;

    return { avgTotal, fastest, slowest, atrasados, count: allTurnaround.length };
  }, [ensayos]);

  const maxPhaseAvg = Math.max(...phases.map(p => p.avg), 1);

  if (ensayos.length === 0) {
    return (
      <div className={ind.indicatorSection}>
        <SectionHeader
          icon={<IconTimer />}
          title="Tiempos y Ciclos"
          subtitle="Analisis de duracion por fase del proceso"
        />
        <div className={ind.chartEmpty}>No hay ensayos registrados</div>
      </div>
    );
  }

  return (
    <div className={ind.indicatorSection}>
      <SectionHeader
        icon={<IconTimer />}
        title="Tiempos y Ciclos"
        subtitle="Analisis de duracion por fase del proceso"
      />

      {/* Mini stats */}
      <div className={ind.miniStatsGrid}>
        <div className={ind.miniStat}>
          <div className={ind.miniStatValue}>{miniStats.avgTotal}</div>
          <div className={ind.miniStatLabel}>Dias prom. total</div>
        </div>
        <div className={`${ind.miniStat} ${ind.miniStatSuccess}`}>
          <div className={ind.miniStatValue}>{miniStats.fastest}</div>
          <div className={ind.miniStatLabel}>Mas rapido (dias)</div>
        </div>
        <div className={`${ind.miniStat} ${ind.miniStatPurple}`}>
          <div className={ind.miniStatValue}>{miniStats.slowest}</div>
          <div className={ind.miniStatLabel}>Mas lento (dias)</div>
        </div>
        <div className={`${ind.miniStat} ${miniStats.atrasados > 0 ? ind.miniStatError : ''}`}>
          <div className={ind.miniStatValue}>{miniStats.atrasados}</div>
          <div className={ind.miniStatLabel}>Atrasados</div>
        </div>
      </div>

      {/* Phase bars */}
      <div className={ind.phaseBarContainer}>
        {phases.map(phase => {
          const pct = maxPhaseAvg > 0 ? (phase.avg / maxPhaseAvg) * 100 : 0;
          return (
            <div key={phase.label} className={ind.phaseBarRow}>
              <div className={ind.phaseBarLabel}>{phase.label}</div>
              <div className={ind.phaseBarTrack}>
                <div
                  className={ind.phaseBarFill}
                  style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: phase.color }}
                >
                  {pct > 20 && <span className={ind.phaseBarValue}>{phase.avg}d</span>}
                </div>
              </div>
              {pct <= 20 && (
                <span className={ind.phaseBarValueOutside}>
                  {phase.avg}d ({phase.count})
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Turnaround trend */}
      {turnaroundTrend.length > 1 && (
        <>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
            Tendencia del turnaround mensual
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={turnaroundTrend} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorTurnaround" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomChartTooltip suffix="dias" />} />
              <Area
                type="monotone"
                dataKey="Promedio dias"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#colorTurnaround)"
                dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Fallback: simple bar chart if only 1 month */}
      {turnaroundTrend.length === 1 && (
        <>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
            Turnaround promedio
          </h4>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={turnaroundTrend} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomChartTooltip suffix="dias" />} />
              <Bar dataKey="Promedio dias" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
