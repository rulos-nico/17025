/**
 * EstadoEquipos.tsx — Estado de equipos e instrumentos
 *
 * Muestra:
 * - Donut de distribucion por estado de equipo
 * - Alertas de calibracion proxima (30/60/90 dias)
 * - Tasa de conformidad de comprobaciones
 * - Mini stats: total equipos, activos, por calibrar
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Equipo, Comprobacion } from './shared';
import { CustomChartTooltip, SectionHeader, diffDays } from './shared';
import ind from './ReportesIndicadores.module.css';

// ============================================
// TYPES
// ============================================

interface EstadoEquiposProps {
  equipos: Equipo[];
  comprobaciones: Comprobacion[];
}

interface CalibAlert {
  equipo: Equipo;
  daysLeft: number;
  urgency: 'urgent' | 'warning' | 'info';
}

// ============================================
// ICON
// ============================================

function IconTool({ size = 18 }: { size?: number }) {
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
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

// ============================================
// ESTADO COLORS
// ============================================

const ESTADO_COLORS: Record<string, string> = {
  disponible: '#10B981',
  en_uso: '#3B82F6',
  en_calibracion: '#F59E0B',
  en_mantenimiento: '#8B5CF6',
  fuera_de_servicio: '#EF4444',
  dado_de_baja: '#6B7280',
};

const ESTADO_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  en_uso: 'En uso',
  en_calibracion: 'En calibracion',
  en_mantenimiento: 'En mantenimiento',
  fuera_de_servicio: 'Fuera de servicio',
  dado_de_baja: 'Dado de baja',
};

// ============================================
// COMPONENT
// ============================================

export default function EstadoEquipos({ equipos, comprobaciones }: EstadoEquiposProps) {
  // Status distribution donut
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    equipos.forEach(eq => {
      const estado = eq.estado || 'disponible';
      counts[estado] = (counts[estado] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([estado, value]) => ({
        name: ESTADO_LABELS[estado] || estado,
        value,
        fill: ESTADO_COLORS[estado] || '#6B7280',
      }))
      .sort((a, b) => b.value - a.value);
  }, [equipos]);

  const totalEquipos = useMemo(() => statusData.reduce((s, d) => s + d.value, 0), [statusData]);

  // Calibration alerts
  const calibAlerts = useMemo((): CalibAlert[] => {
    const today = new Date().toISOString().split('T')[0];
    const alerts: CalibAlert[] = [];

    equipos.forEach(eq => {
      if (!eq.proxima_calibracion || eq.activo === false) return;
      const days = diffDays(today, eq.proxima_calibracion);
      if (days === null) return;
      if (days <= 90) {
        alerts.push({
          equipo: eq,
          daysLeft: days,
          urgency: days <= 30 ? 'urgent' : days <= 60 ? 'warning' : 'info',
        });
      }
    });

    return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [equipos]);

  // Comprobaciones conformity rate
  const conformity = useMemo(() => {
    if (comprobaciones.length === 0) return { total: 0, conforme: 0, noConforme: 0, rate: 0 };
    let conforme = 0;
    let noConforme = 0;
    comprobaciones.forEach(c => {
      const res = (c.resultado || '').toLowerCase();
      if (
        res.includes('conforme') &&
        !res.includes('no conforme') &&
        !res.includes('no_conforme')
      ) {
        conforme++;
      } else if (res.includes('no')) {
        noConforme++;
      } else {
        conforme++; // default to conforme if resultado is ambiguous
      }
    });
    const total = conforme + noConforme;
    return {
      total,
      conforme,
      noConforme,
      rate: total > 0 ? Math.round((conforme / total) * 1000) / 10 : 0,
    };
  }, [comprobaciones]);

  if (equipos.length === 0) {
    return (
      <div className={ind.indicatorSection}>
        <SectionHeader
          icon={<IconTool />}
          title="Estado de Equipos"
          subtitle="Distribucion de estado, calibraciones y comprobaciones"
        />
        <div className={ind.chartEmpty}>No hay equipos registrados</div>
      </div>
    );
  }

  return (
    <div className={ind.indicatorSection}>
      <SectionHeader
        icon={<IconTool />}
        title="Estado de Equipos"
        subtitle="Distribucion de estado, calibraciones y comprobaciones"
      />

      {/* Mini stats */}
      <div className={ind.miniStatsGrid}>
        <div className={ind.miniStat}>
          <div className={ind.miniStatValue}>{totalEquipos}</div>
          <div className={ind.miniStatLabel}>Total equipos</div>
        </div>
        <div
          className={`${ind.miniStat} ${calibAlerts.filter(a => a.urgency === 'urgent').length > 0 ? ind.miniStatError : ind.miniStatSuccess}`}
        >
          <div className={ind.miniStatValue}>
            {calibAlerts.filter(a => a.urgency === 'urgent').length}
          </div>
          <div className={ind.miniStatLabel}>Calibrar &lt;30d</div>
        </div>
        <div className={`${ind.miniStat} ${ind.miniStatWarning}`}>
          <div className={ind.miniStatValue}>{calibAlerts.length}</div>
          <div className={ind.miniStatLabel}>Calibrar &lt;90d</div>
        </div>
        <div
          className={`${ind.miniStat} ${conformity.rate >= 90 ? ind.miniStatSuccess : ind.miniStatError}`}
        >
          <div className={ind.miniStatValue}>{conformity.rate}%</div>
          <div className={ind.miniStatLabel}>Conformidad</div>
        </div>
      </div>

      {/* Two columns: donut + alerts */}
      <div className={ind.indicatorGrid}>
        {/* Donut */}
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
            Distribucion por estado
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                dataKey="value"
                paddingAngle={2}
                stroke="none"
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <text
                x="50%"
                y="46%"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontSize: '1.3rem', fontWeight: 700, fill: '#1f2937' }}
              >
                {totalEquipos}
              </text>
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontSize: '0.65rem', fill: '#9ca3af' }}
              >
                equipos
              </text>
              <Tooltip content={<CustomChartTooltip suffix="equipos" />} />
              <Legend
                formatter={(value: string, entry) => {
                  const pct =
                    totalEquipos > 0
                      ? (
                          ((((entry.payload as Record<string, unknown>)?.value as number) || 0) /
                            totalEquipos) *
                          100
                        ).toFixed(0)
                      : '0';
                  return `${value} (${pct}%)`;
                }}
                wrapperStyle={{ fontSize: '0.7rem' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Calibration alerts */}
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
            Alertas de calibracion ({calibAlerts.length})
          </h4>
          {calibAlerts.length === 0 ? (
            <div className={ind.chartEmpty} style={{ padding: '32px 16px' }}>
              No hay calibraciones proximas en los siguientes 90 dias
            </div>
          ) : (
            <div className={ind.alertList}>
              {calibAlerts.slice(0, 15).map(a => {
                const urgClass =
                  a.urgency === 'urgent'
                    ? ind.alertUrgent
                    : a.urgency === 'warning'
                      ? ind.alertWarning
                      : ind.alertInfo;
                const dotColor =
                  a.urgency === 'urgent'
                    ? '#EF4444'
                    : a.urgency === 'warning'
                      ? '#F59E0B'
                      : '#3B82F6';
                const daysClass =
                  a.urgency === 'urgent'
                    ? ind.alertDaysRed
                    : a.urgency === 'warning'
                      ? ind.alertDaysYellow
                      : ind.alertDaysBlue;
                return (
                  <div key={String(a.equipo.id)} className={`${ind.alertItem} ${urgClass}`}>
                    <span className={ind.alertDot} style={{ backgroundColor: dotColor }} />
                    <span
                      className={ind.alertName}
                      title={`${a.equipo.codigo} - ${a.equipo.nombre}`}
                    >
                      {a.equipo.codigo} — {a.equipo.nombre}
                    </span>
                    <span className={`${ind.alertDaysLeft} ${daysClass}`}>
                      {a.daysLeft <= 0 ? 'Vencido' : `${a.daysLeft}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Comprobaciones detail */}
      {conformity.total > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
            Comprobaciones ({conformity.total})
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                flex: 1,
                height: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${conformity.rate}%`,
                  backgroundColor: '#10B981',
                  height: '100%',
                  transition: 'width 0.5s',
                }}
              />
              <div
                style={{
                  width: `${100 - conformity.rate}%`,
                  backgroundColor: '#EF4444',
                  height: '100%',
                  transition: 'width 0.5s',
                }}
              />
            </div>
            <span
              style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', minWidth: '80px' }}
            >
              {conformity.conforme} / {conformity.total}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '6px',
              fontSize: '0.7rem',
              color: '#6b7280',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  display: 'inline-block',
                }}
              />
              Conforme ({conformity.conforme})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#EF4444',
                  display: 'inline-block',
                }}
              />
              No conforme ({conformity.noConforme})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
