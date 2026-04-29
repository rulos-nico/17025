/**
 * GraficosControl - Cartas de control (Shewhart) sobre datos de comprobaciones
 *
 * Permite seleccionar un sensor + una variable numérica del JSON `data`
 * y visualizar la serie temporal con línea central, UCL y LCL (±3σ).
 */

import { useEffect, useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { useComprobacionesData } from '../hooks/useComprobacionesData';
import type { Comprobacion } from '../hooks/useComprobacionesData';
import { formatDate } from '../utils';
import styles from './GraficosControl.module.css';

// ============================================
// HELPERS
// ============================================

interface Point {
  fecha: string;
  valor: number;
  resultado: string;
  comprobacionId: string;
}

interface Stats {
  mean: number;
  std: number;
  ucl: number;
  lcl: number;
  min: number;
  max: number;
}

const computeStats = (values: number[]): Stats | null => {
  if (values.length < 2) return null;
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1);
  const std = Math.sqrt(variance);
  return {
    mean,
    std,
    ucl: mean + 3 * std,
    lcl: mean - 3 * std,
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

const getNumericKeys = (objs: unknown[]): string[] => {
  const keys = new Map<string, number>();
  for (const o of objs) {
    if (!o || typeof o !== 'object') continue;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        keys.set(k, (keys.get(k) || 0) + 1);
      }
    }
  }
  return [...keys.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
};

const extractValue = (data: unknown, key: string): number | null => {
  if (!data || typeof data !== 'object') return null;
  const v = (data as Record<string, unknown>)[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

// ============================================
// CHART COMPONENT
// ============================================

interface ControlChartProps {
  points: Point[];
  stats: Stats;
  variable: string;
  width?: number;
  height?: number;
}

function ControlChart({ points, stats, variable, width = 800, height = 360 }: ControlChartProps) {
  const padLeft = 60;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 50;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const yMin = Math.min(stats.lcl, stats.min);
  const yMax = Math.max(stats.ucl, stats.max);
  const yPad = (yMax - yMin) * 0.05 || 1;
  const y0 = yMin - yPad;
  const y1 = yMax + yPad;

  const x = (i: number) =>
    padLeft + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => padTop + ((y1 - v) / (y1 - y0)) * innerH;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => y0 + ((y1 - y0) * i) / yTicks);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.valor)}`).join(' ');

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible' }}
    >
      {/* Y-axis grid + labels */}
      {yTickValues.map((v, i) => (
        <g key={i}>
          <line
            x1={padLeft}
            x2={padLeft + innerW}
            y1={y(v)}
            y2={y(v)}
            stroke="#E5E7EB"
            strokeDasharray="2,3"
          />
          <text x={padLeft - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6B7280">
            {v.toFixed(3)}
          </text>
        </g>
      ))}

      {/* Control limits + center line */}
      <line
        x1={padLeft}
        x2={padLeft + innerW}
        y1={y(stats.ucl)}
        y2={y(stats.ucl)}
        stroke="#DC2626"
        strokeWidth={1.5}
        strokeDasharray="6,4"
      />
      <line
        x1={padLeft}
        x2={padLeft + innerW}
        y1={y(stats.lcl)}
        y2={y(stats.lcl)}
        stroke="#DC2626"
        strokeWidth={1.5}
        strokeDasharray="6,4"
      />
      <line
        x1={padLeft}
        x2={padLeft + innerW}
        y1={y(stats.mean)}
        y2={y(stats.mean)}
        stroke="#10B981"
        strokeWidth={1.5}
      />

      {/* Limit labels */}
      <text x={padLeft + innerW + 4} y={y(stats.ucl) + 4} fontSize="10" fill="#DC2626">
        UCL {stats.ucl.toFixed(3)}
      </text>
      <text x={padLeft + innerW + 4} y={y(stats.mean) + 4} fontSize="10" fill="#10B981">
        x̄ {stats.mean.toFixed(3)}
      </text>
      <text x={padLeft + innerW + 4} y={y(stats.lcl) + 4} fontSize="10" fill="#DC2626">
        LCL {stats.lcl.toFixed(3)}
      </text>

      {/* Data line */}
      <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth={2} />

      {/* Points */}
      {points.map((p, i) => {
        const out = p.valor > stats.ucl || p.valor < stats.lcl;
        return (
          <g key={p.comprobacionId}>
            <circle
              cx={x(i)}
              cy={y(p.valor)}
              r={out ? 6 : 4}
              fill={out ? '#DC2626' : '#3B82F6'}
              stroke="white"
              strokeWidth={1.5}
            >
              <title>
                {`${formatDate(p.fecha)}\n${variable} = ${p.valor}\nResultado: ${p.resultado}${out ? '\n¡Fuera de control!' : ''}`}
              </title>
            </circle>
          </g>
        );
      })}

      {/* X-axis labels (sparse) */}
      {points.map((p, i) => {
        const step = Math.max(1, Math.ceil(points.length / 8));
        if (i % step !== 0 && i !== points.length - 1) return null;
        return (
          <text
            key={`x-${i}`}
            x={x(i)}
            y={padTop + innerH + 18}
            textAnchor="middle"
            fontSize="10"
            fill="#6B7280"
          >
            {formatDate(p.fecha)}
          </text>
        );
      })}

      {/* Axes */}
      <line
        x1={padLeft}
        x2={padLeft + innerW}
        y1={padTop + innerH}
        y2={padTop + innerH}
        stroke="#9CA3AF"
      />
      <line x1={padLeft} x2={padLeft} y1={padTop} y2={padTop + innerH} stroke="#9CA3AF" />

      {/* Y-axis title */}
      <text
        transform={`translate(15, ${padTop + innerH / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize="11"
        fill="#374151"
      >
        {variable}
      </text>
    </svg>
  );
}

// ============================================
// PAGE
// ============================================

export default function GraficosControl() {
  const { comprobaciones, sensores, loading } = useComprobacionesData();

  const [sensorId, setSensorId] = useState<string>('');
  const [variable, setVariable] = useState<string>('');

  // Comprobaciones del sensor seleccionado, ordenadas por fecha
  const sensorComps = useMemo<Comprobacion[]>(() => {
    if (!sensorId) return [];
    return comprobaciones
      .filter(c => String(c.sensorId) === sensorId)
      .slice()
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [comprobaciones, sensorId]);

  // Variables numéricas disponibles en data
  const variables = useMemo(() => {
    return getNumericKeys(sensorComps.map(c => c.data));
  }, [sensorComps]);

  // Auto-seleccionar primer sensor / variable disponible
  useEffect(() => {
    if (!sensorId && sensores.length > 0) setSensorId(String(sensores[0].id));
  }, [sensores, sensorId]);
  useEffect(() => {
    if (variables.length > 0 && !variables.includes(variable)) setVariable(variables[0]);
    if (variables.length === 0 && variable) setVariable('');
  }, [variables, variable]);

  // Construir puntos
  const points: Point[] = useMemo(() => {
    if (!variable) return [];
    return sensorComps
      .map(c => {
        const valor = extractValue(c.data, variable);
        if (valor === null) return null;
        return { fecha: c.fecha, valor, resultado: c.resultado, comprobacionId: c.id };
      })
      .filter((p): p is Point => p !== null);
  }, [sensorComps, variable]);

  const stats = useMemo(() => computeStats(points.map(p => p.valor)), [points]);

  const outOfControl = useMemo(() => {
    if (!stats) return [];
    return points.filter(p => p.valor > stats.ucl || p.valor < stats.lcl);
  }, [points, stats]);

  const sensor = useMemo(() => sensores.find(s => String(s.id) === sensorId), [sensores, sensorId]);

  if (loading) {
    return (
      <PageLayout title="Gráficos de control">
        <div className={styles.loading}>Cargando datos...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Gráficos de control (Shewhart)">
      <div className={styles.controls}>
        <label style={{ fontSize: 13, color: '#374151' }}>Sensor:</label>
        <select
          value={sensorId}
          onChange={e => setSensorId(e.target.value)}
          className={styles.select}
        >
          <option value="">Seleccionar sensor</option>
          {sensores.map(s => (
            <option key={s.id} value={String(s.id)}>
              {s.codigo || s.id} — {s.tipo || ''} {s.marca || ''} {s.modelo || ''}
            </option>
          ))}
        </select>

        <label style={{ fontSize: 13, color: '#374151' }}>Variable:</label>
        <select
          value={variable}
          onChange={e => setVariable(e.target.value)}
          className={styles.select}
          disabled={variables.length === 0}
        >
          {variables.length === 0 ? (
            <option value="">— sin datos numéricos —</option>
          ) : (
            variables.map(k => (
              <option key={k} value={k}>
                {k}
              </option>
            ))
          )}
        </select>
      </div>

      {!sensorId ? (
        <div className={styles.chartCard}>
          <div className={styles.empty}>
            Seleccione un sensor para visualizar su carta de control.
          </div>
        </div>
      ) : sensorComps.length === 0 ? (
        <div className={styles.chartCard}>
          <div className={styles.empty}>
            El sensor seleccionado no tiene comprobaciones registradas.
          </div>
        </div>
      ) : variables.length === 0 ? (
        <div className={styles.chartCard}>
          <div className={styles.empty}>
            Las comprobaciones de este sensor no contienen variables numéricas en su campo
            <code> data</code>. Registre mediciones numéricas para poder generar la carta.
          </div>
        </div>
      ) : !stats || points.length < 2 ? (
        <div className={styles.chartCard}>
          <div className={styles.empty}>
            Se requieren al menos 2 puntos para calcular los límites de control. Hay {points.length}
            .
          </div>
        </div>
      ) : (
        <>
          <div className={styles.metricsGrid}>
            <Metric label="Puntos (n)" value={String(points.length)} />
            <Metric label="Media (x̄)" value={stats.mean.toFixed(4)} />
            <Metric label="Desv. estándar (σ)" value={stats.std.toFixed(4)} />
            <Metric label="UCL (+3σ)" value={stats.ucl.toFixed(4)} />
            <Metric label="LCL (−3σ)" value={stats.lcl.toFixed(4)} />
            <Metric label="Fuera de control" value={String(outOfControl.length)} />
          </div>

          {outOfControl.length > 0 && (
            <div className={styles.outOfControl}>
              <strong>{outOfControl.length}</strong> punto(s) fuera de los límites de control:{' '}
              {outOfControl.map(p => `${formatDate(p.fecha)} (${p.valor.toFixed(3)})`).join(', ')}
            </div>
          )}

          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>
              {sensor?.codigo || sensorId} — {variable}
            </div>
            <ControlChart points={points} stats={stats} variable={variable} />
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.legendLine} style={{ background: '#3B82F6' }} /> serie
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendLine} style={{ background: '#10B981' }} /> media
              </span>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendLine}
                  style={{
                    background:
                      'repeating-linear-gradient(90deg, #DC2626 0 6px, transparent 6px 10px)',
                  }}
                />{' '}
                UCL / LCL (±3σ)
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#DC2626' }} /> fuera de
                control
              </span>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
    </div>
  );
}
