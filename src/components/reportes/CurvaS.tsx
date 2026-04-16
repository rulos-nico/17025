/**
 * CurvaS.tsx — Curva S (S-curve) acumulativa
 *
 * Muestra el avance acumulado de ensayos en el tiempo:
 * - Linea "Programados" (fecha_programacion acumulada)
 * - Linea "Ejecutados" (fecha_ejecucion acumulada)
 * - Linea "Entregados" (fecha_entrega acumulada)
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Ensayo } from './shared';
import { CustomChartTooltip, SectionHeader } from './shared';
import ind from './ReportesIndicadores.module.css';

// ============================================
// TYPES
// ============================================

interface CurvaSProps {
  ensayos: Ensayo[];
}

// ============================================
// ICON
// ============================================

function IconSCurve({ size = 18 }: { size?: number }) {
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
      <path d="M2 20c2-4 4-16 10-16s8 16 10 16" />
    </svg>
  );
}

// ============================================
// COMPONENT
// ============================================

export default function CurvaS({ ensayos }: CurvaSProps) {
  const chartData = useMemo(() => {
    // Collect all dates for each series
    const programados: string[] = [];
    const ejecutados: string[] = [];
    const entregados: string[] = [];

    ensayos.forEach(e => {
      if (e.fecha_programacion) programados.push(e.fecha_programacion as string);
      if (e.fecha_ejecucion) ejecutados.push(e.fecha_ejecucion as string);
      if (e.fecha_entrega) entregados.push(e.fecha_entrega as string);
    });

    // Group by month (YYYY-MM)
    const toMonth = (d: string) => d.substring(0, 7);

    const countByMonth = (dates: string[]): Record<string, number> => {
      const map: Record<string, number> = {};
      dates.forEach(d => {
        const m = toMonth(d);
        map[m] = (map[m] || 0) + 1;
      });
      return map;
    };

    const progMap = countByMonth(programados);
    const ejMap = countByMonth(ejecutados);
    const entMap = countByMonth(entregados);

    // Collect all months
    const allMonths = new Set<string>();
    [progMap, ejMap, entMap].forEach(m => Object.keys(m).forEach(k => allMonths.add(k)));
    const sorted = Array.from(allMonths).sort();

    if (sorted.length === 0) return [];

    // Build cumulative data
    let cumProg = 0;
    let cumEj = 0;
    let cumEnt = 0;

    return sorted.map(mes => {
      cumProg += progMap[mes] || 0;
      cumEj += ejMap[mes] || 0;
      cumEnt += entMap[mes] || 0;
      return {
        mes,
        Programados: cumProg,
        Ejecutados: cumEj,
        Entregados: cumEnt,
      };
    });
  }, [ensayos]);

  // Stats
  const stats = useMemo(() => {
    const last = chartData[chartData.length - 1];
    if (!last) return { programados: 0, ejecutados: 0, entregados: 0 };
    return {
      programados: last.Programados,
      ejecutados: last.Ejecutados,
      entregados: last.Entregados,
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className={ind.indicatorSection}>
        <SectionHeader
          icon={<IconSCurve />}
          title="Curva S"
          subtitle="Avance acumulado de ensayos: programados vs ejecutados vs entregados"
        />
        <div className={ind.chartEmpty}>
          No hay datos de fechas suficientes para generar la curva
        </div>
      </div>
    );
  }

  return (
    <div className={ind.indicatorSection}>
      <SectionHeader
        icon={<IconSCurve />}
        title="Curva S"
        subtitle="Avance acumulado de ensayos: programados vs ejecutados vs entregados"
      />

      {/* Mini stats */}
      <div className={ind.miniStatsGrid}>
        <div className={`${ind.miniStat} ${ind.miniStatWarning}`}>
          <div className={ind.miniStatValue}>{stats.programados}</div>
          <div className={ind.miniStatLabel}>Programados</div>
        </div>
        <div className={`${ind.miniStat} ${ind.miniStatPrimary}`}>
          <div className={ind.miniStatValue}>{stats.ejecutados}</div>
          <div className={ind.miniStatLabel}>Ejecutados</div>
        </div>
        <div className={`${ind.miniStat} ${ind.miniStatSuccess}`}>
          <div className={ind.miniStatValue}>{stats.entregados}</div>
          <div className={ind.miniStatLabel}>Entregados</div>
        </div>
      </div>

      {/* S-curve chart */}
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="gradProg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEjec" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEntr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomChartTooltip suffix="ensayos" />} />
          <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
          <Area
            type="monotone"
            dataKey="Programados"
            stroke="#F59E0B"
            strokeWidth={2}
            fill="url(#gradProg)"
            dot={{ r: 3, fill: '#F59E0B', stroke: '#fff', strokeWidth: 1.5 }}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="Ejecutados"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#gradEjec)"
            dot={{ r: 3, fill: '#3B82F6', stroke: '#fff', strokeWidth: 1.5 }}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="Entregados"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#gradEntr)"
            dot={{ r: 3, fill: '#10B981', stroke: '#fff', strokeWidth: 1.5 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
