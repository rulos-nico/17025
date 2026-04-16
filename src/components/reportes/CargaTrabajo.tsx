/**
 * CargaTrabajo.tsx — Carga de trabajo del personal
 *
 * Muestra:
 * - Ensayos activos por tecnico (horizontal bar chart)
 * - Top tecnicos con bar visual + ranking
 * - Mini stats: total tecnicos, promedio carga, max carga
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Ensayo, PersonalInterno } from './shared';
import { CustomChartTooltip, SectionHeader, COLORS } from './shared';
import ind from './ReportesIndicadores.module.css';

// ============================================
// TYPES
// ============================================

interface CargaTrabajoProps {
  ensayos: Ensayo[];
  personal: PersonalInterno[];
}

// ============================================
// ICON
// ============================================

function IconUsers({ size = 18 }: { size?: number }) {
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
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

// Active ensayo states (not terminal/completed)
const ACTIVE_STATES = ['E1', 'E2', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 'E11'];

// ============================================
// COMPONENT
// ============================================

export default function CargaTrabajo({ ensayos, personal }: CargaTrabajoProps) {
  // Build technician -> active ensayos mapping
  const techData = useMemo(() => {
    // Count active ensayos per tecnico_id
    const countMap: Record<string, number> = {};
    const totalMap: Record<string, number> = {};

    ensayos.forEach(e => {
      const tid = e.tecnico_id ? String(e.tecnico_id) : null;
      if (!tid) return;
      totalMap[tid] = (totalMap[tid] || 0) + 1;
      if (ACTIVE_STATES.includes(e.workflow_state || '')) {
        countMap[tid] = (countMap[tid] || 0) + 1;
      }
    });

    // Map to personal records
    const result = personal
      .filter(p => p.activo !== false)
      .map(p => {
        const id = String(p.id);
        return {
          id,
          nombre: `${p.nombre || ''} ${p.apellido || ''}`.trim() || p.codigo || 'N/A',
          cargo: p.cargo || '',
          activos: countMap[id] || 0,
          total: totalMap[id] || 0,
        };
      })
      .filter(t => t.total > 0)
      .sort((a, b) => b.activos - a.activos);

    return result;
  }, [ensayos, personal]);

  // Bar chart data (top 12)
  const barData = useMemo(() => {
    return techData.slice(0, 12).map(t => ({
      name: t.nombre.length > 20 ? t.nombre.substring(0, 17) + '...' : t.nombre,
      Activos: t.activos,
      Total: t.total,
    }));
  }, [techData]);

  // Mini stats
  const stats = useMemo(() => {
    const withLoad = techData.filter(t => t.activos > 0);
    const totalActivos = withLoad.reduce((s, t) => s + t.activos, 0);
    const avg = withLoad.length > 0 ? Math.round((totalActivos / withLoad.length) * 10) / 10 : 0;
    const max = withLoad.length > 0 ? Math.max(...withLoad.map(t => t.activos)) : 0;
    return {
      totalTecnicos: techData.length,
      conCarga: withLoad.length,
      avg,
      max,
    };
  }, [techData]);

  const maxActivos = Math.max(...techData.map(t => t.activos), 1);

  if (personal.length === 0) {
    return (
      <div className={ind.indicatorSection}>
        <SectionHeader
          icon={<IconUsers />}
          title="Carga de Trabajo"
          subtitle="Distribucion de ensayos activos por tecnico"
        />
        <div className={ind.chartEmpty}>No hay datos de personal disponibles</div>
      </div>
    );
  }

  return (
    <div className={ind.indicatorSection}>
      <SectionHeader
        icon={<IconUsers />}
        title="Carga de Trabajo"
        subtitle="Distribucion de ensayos activos por tecnico"
      />

      {/* Mini stats */}
      <div className={ind.miniStatsGrid}>
        <div className={ind.miniStat}>
          <div className={ind.miniStatValue}>{stats.totalTecnicos}</div>
          <div className={ind.miniStatLabel}>Tecnicos con ensayos</div>
        </div>
        <div className={`${ind.miniStat} ${ind.miniStatPrimary}`}>
          <div className={ind.miniStatValue}>{stats.avg}</div>
          <div className={ind.miniStatLabel}>Prom. activos</div>
        </div>
        <div
          className={`${ind.miniStat} ${stats.max > 10 ? ind.miniStatWarning : ind.miniStatPurple}`}
        >
          <div className={ind.miniStatValue}>{stats.max}</div>
          <div className={ind.miniStatLabel}>Max activos</div>
        </div>
      </div>

      {/* Bar chart */}
      {barData.length > 0 && (
        <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 38)}>
          <BarChart
            data={barData}
            layout="vertical"
            margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomChartTooltip suffix="ensayos" />} />
            <Bar dataKey="Activos" fill="#3B82F6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Ranked technician list */}
      {techData.length > 0 && (
        <>
          <h4
            style={{ margin: '16px 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}
          >
            Ranking de carga ({techData.length} tecnicos)
          </h4>
          <div className={ind.techList}>
            {techData.slice(0, 10).map((t, i) => {
              const pct = maxActivos > 0 ? (t.activos / maxActivos) * 100 : 0;
              const rankClass =
                i === 0 ? ind.techRank1 : i === 1 ? ind.techRank2 : i === 2 ? ind.techRank3 : '';
              return (
                <div key={t.id} className={ind.techRow}>
                  <div className={`${ind.techRank} ${rankClass}`}>{i + 1}</div>
                  <div className={ind.techInfo}>
                    <div className={ind.techName}>{t.nombre}</div>
                    {t.cargo && <div className={ind.techCargo}>{t.cargo}</div>}
                  </div>
                  <div className={ind.techBar}>
                    <div
                      className={ind.techBarFill}
                      style={{
                        width: `${Math.max(pct, 3)}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                  <div className={ind.techCount}>{t.activos}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
