/**
 * GraficosControl - Cartas de control sobre comprobaciones + calibraciones de un sensor
 *
 * Tres modos (todos sobre columnas tipadas de `comprobacion`: media, error,
 * incertidumbre, valor_patron):
 *   1. Estadístico (Shewhart): Y = media. UCL/LCL = x̄ ± 3σ de la propia
 *      serie de medias. Barras de error ±u_A en cada punto.
 *   2. Tolerancia – Error: Y = error (signo). Umbral horizontal ±th
 *      configurable (% del patrón o absoluto). Barras de error ±u_A.
 *      Marcadores rombo con error_máximo de calibraciones.
 *   3. Tolerancia – Incertidumbre: Y = incertidumbre por comprobación.
 *      Marcadores rombo con incertidumbre reportada en calibraciones.
 *
 * En los 3 modos las fechas de calibración se muestran como líneas verticales
 * tenues con tooltip.
 */

import { useEffect, useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { useComprobacionesData } from '../hooks/useComprobacionesData';
import type { Comprobacion } from '../hooks/useComprobacionesData';
import { useCalibracionesData } from '../hooks/useCalibracionesData';
import type { Calibracion } from '../hooks/useCalibracionesData';
import { formatDate } from '../utils';
import styles from './GraficosControl.module.css';

// ============================================
// HELPERS
// ============================================

type Mode = 'estadistico' | 'tolerancia-error' | 'tolerancia-incertidumbre';
type ThresholdType = 'percent' | 'absolute';

interface ChartPoint {
  fecha: string;
  valor: number;
  errorU?: number; // ±u para barras de error
  label: string;
  kind: 'comprobacion' | 'calibracion';
  refId: string;
  resultado?: string;
  isViolation?: boolean;
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

/** Extrae el primer número (con signo y decimales) de un texto tipo "± 0.0002 g". */
const parseMetrologicValue = (text: string | undefined | null): number | null => {
  if (!text) return null;
  const m = text.match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(',', '.'));
  return Number.isFinite(n) ? Math.abs(n) : null;
};

// ============================================
// CHART COMPONENT
// ============================================

interface ChartLine {
  yValue: number;
  color: string;
  label: string;
  dashed?: boolean;
}

interface ControlChartProps {
  points: ChartPoint[];
  calibrationPoints: ChartPoint[]; // marcadores rombo en la serie + líneas verticales
  lines: ChartLine[]; // líneas horizontales (mean, UCL, LCL, threshold...)
  yAxisLabel: string;
  showErrorBars?: boolean;
  width?: number;
  height?: number;
}

function ControlChart({
  points,
  calibrationPoints,
  lines,
  yAxisLabel,
  showErrorBars = false,
  width = 900,
  height = 380,
}: ControlChartProps) {
  const padLeft = 70;
  const padRight = 80;
  const padTop = 20;
  const padBottom = 50;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const allPts = [...points, ...calibrationPoints];
  if (allPts.length === 0) return null;

  // Eje X = índice temporal continuo basado en la fecha
  const times = allPts.map(p => new Date(p.fecha).getTime()).filter(t => !Number.isNaN(t));
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const xOf = (fecha: string) => {
    const t = new Date(fecha).getTime();
    if (tMax === tMin) return padLeft + innerW / 2;
    return padLeft + ((t - tMin) / (tMax - tMin)) * innerW;
  };

  // Eje Y = valores de puntos + barras de error + líneas de referencia
  const yValues: number[] = [];
  for (const p of points) {
    yValues.push(p.valor);
    if (showErrorBars && p.errorU !== undefined) {
      yValues.push(p.valor + p.errorU, p.valor - p.errorU);
    }
  }
  for (const p of calibrationPoints) yValues.push(p.valor);
  for (const l of lines) yValues.push(l.yValue);

  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const yPad = (yMax - yMin) * 0.1 || Math.abs(yMin) * 0.1 || 1;
  const y0 = yMin - yPad;
  const y1 = yMax + yPad;
  const yOf = (v: number) => padTop + ((y1 - v) / (y1 - y0)) * innerH;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => y0 + ((y1 - y0) * i) / yTicks);

  // Path para serie de comprobaciones (orden por fecha)
  const sortedComps = [...points].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  const linePath = sortedComps
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.fecha)} ${yOf(p.valor)}`)
    .join(' ');

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible' }}
    >
      {/* Y-grid */}
      {yTickValues.map((v, i) => (
        <g key={i}>
          <line
            x1={padLeft}
            x2={padLeft + innerW}
            y1={yOf(v)}
            y2={yOf(v)}
            stroke="#E5E7EB"
            strokeDasharray="2,3"
          />
          <text x={padLeft - 8} y={yOf(v) + 4} textAnchor="end" fontSize="11" fill="#6B7280">
            {v.toFixed(4)}
          </text>
        </g>
      ))}

      {/* Líneas verticales en fechas de calibración */}
      {calibrationPoints.map(c => (
        <g key={`cal-vline-${c.refId}`}>
          <line
            x1={xOf(c.fecha)}
            x2={xOf(c.fecha)}
            y1={padTop}
            y2={padTop + innerH}
            stroke="#A78BFA"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        </g>
      ))}

      {/* Líneas horizontales de referencia */}
      {lines.map((l, i) => (
        <g key={`ref-${i}`}>
          <line
            x1={padLeft}
            x2={padLeft + innerW}
            y1={yOf(l.yValue)}
            y2={yOf(l.yValue)}
            stroke={l.color}
            strokeWidth={1.5}
            strokeDasharray={l.dashed ? '6,4' : undefined}
          />
          <text x={padLeft + innerW + 4} y={yOf(l.yValue) + 4} fontSize="10" fill={l.color}>
            {l.label}
          </text>
        </g>
      ))}

      {/* Serie de comprobaciones */}
      {linePath && <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth={2} />}

      {/* Barras de error ±u sobre los puntos */}
      {showErrorBars &&
        points.map(p => {
          if (p.errorU === undefined || p.errorU <= 0) return null;
          const cx = xOf(p.fecha);
          const yTop = yOf(p.valor + p.errorU);
          const yBot = yOf(p.valor - p.errorU);
          const cap = 4;
          return (
            <g key={`err-${p.refId}`} stroke="#3B82F6" strokeWidth={1.2} opacity={0.7}>
              <line x1={cx} x2={cx} y1={yTop} y2={yBot} />
              <line x1={cx - cap} x2={cx + cap} y1={yTop} y2={yTop} />
              <line x1={cx - cap} x2={cx + cap} y1={yBot} y2={yBot} />
            </g>
          );
        })}

      {/* Puntos de comprobaciones */}
      {points.map(p => {
        const out = !!p.isViolation;
        return (
          <circle
            key={`pt-${p.refId}`}
            cx={xOf(p.fecha)}
            cy={yOf(p.valor)}
            r={out ? 6 : 4}
            fill={out ? '#DC2626' : '#3B82F6'}
            stroke="white"
            strokeWidth={1.5}
          >
            <title>
              {`${formatDate(p.fecha)}\n${p.label} = ${p.valor.toFixed(4)}${p.errorU !== undefined ? `\n±u = ${p.errorU.toFixed(4)}` : ''}${p.resultado ? `\nResultado: ${p.resultado}` : ''}${out ? '\n¡Fuera del límite!' : ''}`}
            </title>
          </circle>
        );
      })}

      {/* Puntos de calibraciones (rombo) */}
      {calibrationPoints.map(c => {
        const cx = xOf(c.fecha);
        const cy = yOf(c.valor);
        const r = 6;
        return (
          <polygon
            key={`cal-${c.refId}`}
            points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
            fill="#9333EA"
            stroke="white"
            strokeWidth={1.5}
          >
            <title>{`${formatDate(c.fecha)}\nCalibración: ${c.label} = ${c.valor.toFixed(4)}`}</title>
          </polygon>
        );
      })}

      {/* Eje X: etiquetas escasas */}
      {(() => {
        const sorted = [...allPts].sort(
          (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        );
        const step = Math.max(1, Math.ceil(sorted.length / 8));
        return sorted.map((p, i) => {
          if (i % step !== 0 && i !== sorted.length - 1) return null;
          return (
            <text
              key={`x-${i}`}
              x={xOf(p.fecha)}
              y={padTop + innerH + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#6B7280"
            >
              {formatDate(p.fecha)}
            </text>
          );
        });
      })()}

      {/* Ejes */}
      <line
        x1={padLeft}
        x2={padLeft + innerW}
        y1={padTop + innerH}
        y2={padTop + innerH}
        stroke="#9CA3AF"
      />
      <line x1={padLeft} x2={padLeft} y1={padTop} y2={padTop + innerH} stroke="#9CA3AF" />

      <text
        transform={`translate(15, ${padTop + innerH / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize="11"
        fill="#374151"
      >
        {yAxisLabel}
      </text>
    </svg>
  );
}

// ============================================
// PAGE
// ============================================

export default function GraficosControl() {
  const { comprobaciones, sensores, loading: lc } = useComprobacionesData();
  const { calibraciones, loading: lk } = useCalibracionesData();
  const loading = lc || lk;

  const [sensorId, setSensorId] = useState<string>('');
  const [mode, setMode] = useState<Mode>('estadistico');
  const [thresholdValue, setThresholdValue] = useState<string>('1.0');
  const [thresholdType, setThresholdType] = useState<ThresholdType>('percent');

  // ---- comprobaciones / calibraciones del sensor ----
  const sensorComps = useMemo<Comprobacion[]>(() => {
    if (!sensorId) return [];
    return comprobaciones
      .filter(c => String(c.sensorId) === sensorId)
      .slice()
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [comprobaciones, sensorId]);

  const sensorCals = useMemo<Calibracion[]>(() => {
    if (!sensorId) return [];
    return calibraciones
      .filter(c => String(c.sensorId) === sensorId)
      .slice()
      .sort((a, b) => a.fechaCalibracion.localeCompare(b.fechaCalibracion));
  }, [calibraciones, sensorId]);

  // Auto-selección
  useEffect(() => {
    if (!sensorId && sensores.length > 0) setSensorId(String(sensores[0].id));
  }, [sensores, sensorId]);

  // Unidad detectada (de la primera comprobación)
  const unidad = useMemo(() => sensorComps.find(c => c.unidad)?.unidad || '', [sensorComps]);

  // ---- valor patrón promedio (para % de tolerancia) ----
  const patronMean = useMemo<number | null>(() => {
    const vals = sensorComps
      .map(c => c.valorPatron)
      .filter((v): v is number => v !== undefined && Number.isFinite(v));
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [sensorComps]);

  // ---- threshold absoluto efectivo ----
  const effectiveThreshold = useMemo<number | null>(() => {
    const num = parseFloat(thresholdValue);
    if (!Number.isFinite(num) || num <= 0) return null;
    if (thresholdType === 'absolute') return num;
    if (patronMean === null) return null;
    return (num / 100) * Math.abs(patronMean);
  }, [thresholdValue, thresholdType, patronMean]);

  // ---- error_maximo / incertidumbre parseados de calibraciones ----
  const calErrors = useMemo(
    () =>
      sensorCals
        .map(c => {
          const v = parseMetrologicValue(c.errorMaximo);
          return v !== null ? { fecha: c.fechaCalibracion, valor: v, id: c.id } : null;
        })
        .filter((p): p is { fecha: string; valor: number; id: string } => p !== null),
    [sensorCals]
  );

  const calUncertainties = useMemo(
    () =>
      sensorCals
        .map(c => {
          const v = parseMetrologicValue(c.incertidumbre);
          return v !== null ? { fecha: c.fechaCalibracion, valor: v, id: c.id } : null;
        })
        .filter((p): p is { fecha: string; valor: number; id: string } => p !== null),
    [sensorCals]
  );

  // ============================================
  // BUILD CHART DATA per mode
  // ============================================
  const chartData = useMemo(() => {
    if (mode === 'estadistico') {
      const pts: ChartPoint[] = sensorComps
        .filter(c => c.media !== undefined && Number.isFinite(c.media))
        .map(c => ({
          fecha: c.fecha,
          valor: c.media as number,
          errorU: c.incertidumbre,
          label: 'media',
          kind: 'comprobacion',
          refId: c.id,
          resultado: c.resultado,
        }));
      const stats = computeStats(pts.map(p => p.valor));
      if (!stats) return { points: pts, calibrationPoints: [], lines: [], stats: null };
      pts.forEach(p => {
        p.isViolation = p.valor > stats.ucl || p.valor < stats.lcl;
      });
      const calMarkers: ChartPoint[] = sensorCals.map(c => ({
        fecha: c.fechaCalibracion,
        valor: stats.mean,
        label: 'Calibración',
        kind: 'calibracion',
        refId: c.id,
      }));
      const lines: ChartLine[] = [
        { yValue: stats.mean, color: '#10B981', label: `x̄ ${stats.mean.toFixed(4)}` },
        {
          yValue: stats.ucl,
          color: '#DC2626',
          label: `UCL ${stats.ucl.toFixed(4)}`,
          dashed: true,
        },
        {
          yValue: stats.lcl,
          color: '#DC2626',
          label: `LCL ${stats.lcl.toFixed(4)}`,
          dashed: true,
        },
      ];
      if (patronMean !== null) {
        lines.push({
          yValue: patronMean,
          color: '#6366F1',
          label: `Patrón ${patronMean.toFixed(4)}`,
          dashed: true,
        });
      }
      return { points: pts, calibrationPoints: calMarkers, lines, stats };
    }

    if (mode === 'tolerancia-error') {
      const pts: ChartPoint[] = sensorComps
        .filter(c => c.error !== undefined && Number.isFinite(c.error))
        .map(c => ({
          fecha: c.fecha,
          valor: c.error as number,
          errorU: c.incertidumbre,
          label: 'error',
          kind: 'comprobacion',
          refId: c.id,
          resultado: c.resultado,
          isViolation:
            effectiveThreshold !== null && Math.abs(c.error as number) > effectiveThreshold,
        }));
      const calMarkers: ChartPoint[] = calErrors.map(c => ({
        fecha: c.fecha,
        valor: c.valor,
        label: 'Error máx (calibración)',
        kind: 'calibracion',
        refId: c.id,
        isViolation: effectiveThreshold !== null && c.valor > effectiveThreshold,
      }));
      const lines: ChartLine[] = [{ yValue: 0, color: '#10B981', label: '0' }];
      if (effectiveThreshold !== null) {
        lines.push({
          yValue: effectiveThreshold,
          color: '#DC2626',
          label: `+${effectiveThreshold.toFixed(4)}`,
          dashed: true,
        });
        lines.push({
          yValue: -effectiveThreshold,
          color: '#DC2626',
          label: `−${effectiveThreshold.toFixed(4)}`,
          dashed: true,
        });
      }
      return { points: pts, calibrationPoints: calMarkers, lines, stats: null };
    }

    // tolerancia-incertidumbre: serie de incertidumbres por comprobación + rombos calibraciones
    const pts: ChartPoint[] = sensorComps
      .filter(c => c.incertidumbre !== undefined && Number.isFinite(c.incertidumbre))
      .map(c => ({
        fecha: c.fecha,
        valor: c.incertidumbre as number,
        label: 'u (A)',
        kind: 'comprobacion',
        refId: c.id,
        resultado: c.resultado,
      }));
    const calMarkers: ChartPoint[] = calUncertainties.map(c => ({
      fecha: c.fecha,
      valor: c.valor,
      label: 'U (calibración)',
      kind: 'calibracion',
      refId: c.id,
    }));
    return { points: pts, calibrationPoints: calMarkers, lines: [], stats: null };
  }, [mode, sensorComps, sensorCals, calErrors, calUncertainties, patronMean, effectiveThreshold]);

  // ---- Eventos para tabla complementaria ----
  const events = useMemo(() => {
    if (!chartData) return [];
    const all = [
      ...chartData.points.map(p => ({
        fecha: p.fecha,
        kind: 'comprobacion' as const,
        label: p.label,
        valor: p.valor,
        violation: !!p.isViolation,
        ref: p.refId,
        resultado: p.resultado,
      })),
      ...chartData.calibrationPoints.map(c => ({
        fecha: c.fecha,
        kind: 'calibracion' as const,
        label: c.label,
        valor: c.valor,
        violation: !!c.isViolation,
        ref: c.refId,
        resultado: undefined as string | undefined,
      })),
    ];
    return all.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [chartData]);

  const sensor = useMemo(() => sensores.find(s => String(s.id) === sensorId), [sensores, sensorId]);

  if (loading) {
    return (
      <PageLayout title="Gráficos de control">
        <div className={styles.loading}>Cargando datos...</div>
      </PageLayout>
    );
  }

  // Renderizado de mode toggle
  const renderModeToggle = () => (
    <div className={styles.modeToggle}>
      {(
        [
          ['estadistico', 'Estadístico (±3σ)'],
          ['tolerancia-error', 'Tolerancia · Error'],
          ['tolerancia-incertidumbre', 'Tolerancia · Incertidumbre'],
        ] as Array<[Mode, string]>
      ).map(([m, label]) => (
        <button
          key={m}
          type="button"
          className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ''}`}
          onClick={() => setMode(m)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  const titleByMode: Record<Mode, string> = {
    estadistico: 'Carta Shewhart (±3σ) sobre medias',
    'tolerancia-error': 'Tolerancia · Error vs umbral',
    'tolerancia-incertidumbre': 'Evolución de la incertidumbre (u_A)',
  };

  const yLabelByMode: Record<Mode, string> = {
    estadistico: `media${unidad ? ` (${unidad})` : ''}`,
    'tolerancia-error': `error${unidad ? ` (${unidad})` : ''}`,
    'tolerancia-incertidumbre': `u${unidad ? ` (${unidad})` : ''}`,
  };

  return (
    <PageLayout title="Gráficos de control">
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
      </div>

      <div className={styles.controls}>
        {renderModeToggle()}

        {mode === 'tolerancia-error' && (
          <span className={styles.thresholdGroup}>
            <span>Umbral:</span>
            <input
              type="number"
              step="0.001"
              min="0"
              value={thresholdValue}
              onChange={e => setThresholdValue(e.target.value)}
              className={styles.thresholdInput}
            />
            <select
              value={thresholdType}
              onChange={e => setThresholdType(e.target.value as ThresholdType)}
              className={styles.select}
              style={{ minWidth: 'auto' }}
            >
              <option value="percent">% del patrón</option>
              <option value="absolute">absoluto</option>
            </select>
            {thresholdType === 'percent' && patronMean !== null && (
              <span style={{ color: '#6B7280', fontSize: 12 }}>
                ≈ {effectiveThreshold?.toFixed(4) ?? '—'} ({patronMean.toFixed(2)} promedio)
              </span>
            )}
          </span>
        )}
      </div>

      {!sensorId ? (
        <div className={styles.chartCard}>
          <div className={styles.empty}>Seleccione un sensor para visualizar la carta.</div>
        </div>
      ) : !chartData || chartData.points.length === 0 ? (
        <div className={styles.chartCard}>
          <div className={styles.empty}>
            {mode === 'estadistico'
              ? 'El sensor seleccionado no tiene comprobaciones con media derivada.'
              : mode === 'tolerancia-error'
                ? 'No hay comprobaciones con error derivado para este sensor.'
                : 'No hay comprobaciones con incertidumbre derivada para este sensor.'}
          </div>
        </div>
      ) : (
        <>
          {mode === 'estadistico' && chartData.stats && (
            <div className={styles.metricsGrid}>
              <Metric label="Puntos (n)" value={String(chartData.points.length)} />
              <Metric label="Media (x̄)" value={chartData.stats.mean.toFixed(4)} />
              <Metric label="Desv. (σ)" value={chartData.stats.std.toFixed(4)} />
              <Metric label="UCL (+3σ)" value={chartData.stats.ucl.toFixed(4)} />
              <Metric label="LCL (−3σ)" value={chartData.stats.lcl.toFixed(4)} />
              <Metric
                label="Patrón medio"
                value={patronMean !== null ? patronMean.toFixed(4) : '—'}
              />
              <Metric
                label="Fuera de control"
                value={String(chartData.points.filter(p => p.isViolation).length)}
              />
            </div>
          )}

          {mode === 'tolerancia-error' && (
            <div className={styles.metricsGrid}>
              <Metric label="Comprobaciones" value={String(chartData.points.length)} />
              <Metric label="Calibraciones" value={String(chartData.calibrationPoints.length)} />
              <Metric
                label="Umbral"
                value={effectiveThreshold !== null ? `±${effectiveThreshold.toFixed(4)}` : '—'}
              />
              <Metric
                label="Patrón medio"
                value={patronMean !== null ? patronMean.toFixed(4) : '—'}
              />
              <Metric
                label="Violaciones"
                value={String(
                  [...chartData.points, ...chartData.calibrationPoints].filter(p => p.isViolation)
                    .length
                )}
              />
            </div>
          )}

          {mode === 'tolerancia-incertidumbre' && (
            <div className={styles.metricsGrid}>
              <Metric label="Comprobaciones (u)" value={String(chartData.points.length)} />
              <Metric
                label="Calibraciones (U)"
                value={String(chartData.calibrationPoints.length)}
              />
              <Metric
                label="u mín"
                value={
                  chartData.points.length > 0
                    ? Math.min(...chartData.points.map(p => p.valor)).toFixed(4)
                    : '—'
                }
              />
              <Metric
                label="u máx"
                value={
                  chartData.points.length > 0
                    ? Math.max(...chartData.points.map(p => p.valor)).toFixed(4)
                    : '—'
                }
              />
              <Metric
                label="u promedio"
                value={
                  chartData.points.length > 0
                    ? (
                        chartData.points.reduce((a, b) => a + b.valor, 0) / chartData.points.length
                      ).toFixed(4)
                    : '—'
                }
              />
            </div>
          )}

          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>
              {sensor?.codigo || sensorId} — {titleByMode[mode]}
            </div>
            <ControlChart
              points={chartData.points}
              calibrationPoints={chartData.calibrationPoints}
              lines={chartData.lines}
              yAxisLabel={yLabelByMode[mode]}
              showErrorBars={mode !== 'tolerancia-incertidumbre'}
            />
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.legendLine} style={{ background: '#3B82F6' }} /> serie
              </span>
              {mode !== 'tolerancia-incertidumbre' && (
                <span className={styles.legendItem}>
                  <span
                    className={styles.legendLine}
                    style={{ background: '#3B82F6', opacity: 0.5 }}
                  />{' '}
                  ± u (barras de error)
                </span>
              )}
              {mode === 'estadistico' && (
                <>
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
                    UCL/LCL (±3σ)
                  </span>
                </>
              )}
              {mode === 'tolerancia-error' && effectiveThreshold !== null && (
                <span className={styles.legendItem}>
                  <span
                    className={styles.legendLine}
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, #DC2626 0 6px, transparent 6px 10px)',
                    }}
                  />{' '}
                  ±umbral
                </span>
              )}
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#9333EA' }} /> calibración
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#DC2626' }} /> violación
              </span>
            </div>
          </div>

          {/* Tabla cronológica de eventos */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Eventos cronológicos</div>
            <table className={styles.eventsTable}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Etiqueta</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 30).map((e, i) => (
                  <tr key={`ev-${i}-${e.ref}`} className={e.violation ? styles.violationRow : ''}>
                    <td>{formatDate(e.fecha)}</td>
                    <td>
                      <span
                        className={e.kind === 'calibracion' ? styles.badgeCal : styles.badgeCmp}
                      >
                        {e.kind === 'calibracion' ? 'CAL' : 'CMP'}
                      </span>
                    </td>
                    <td>{e.label}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {e.valor.toFixed(4)}
                    </td>
                    <td>
                      {e.violation ? (
                        <span style={{ color: '#DC2626', fontWeight: 600 }}>✗ Fuera</span>
                      ) : (
                        <span style={{ color: '#059669' }}>✓ OK</span>
                      )}
                      {e.resultado && (
                        <span style={{ marginLeft: 8, color: '#6B7280', fontSize: 12 }}>
                          ({e.resultado})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length > 30 && (
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                Mostrando 30 de {events.length} eventos
              </div>
            )}
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
