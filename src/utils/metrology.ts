/**
 * Helpers metrológicos puros para el cálculo de derivados estadísticos
 * a partir de réplicas (lecturas repetidas) en una comprobación.
 *
 * Convenciones:
 *   media          = promedio aritmético de las réplicas
 *   desviacionStd  = desviación estándar muestral (n-1) → repetibilidad
 *   error          = media − valorPatron (signed bias)
 *   incertidumbreA = sd / sqrt(n) (incertidumbre tipo A, sin factor de cobertura)
 */

export interface DerivedMetrics {
  n: number;
  media: number;
  desviacionStd: number | null; // null si n < 2
  error: number | null; // null si no hay valorPatron
  incertidumbre: number | null; // null si n < 2
}

export const mean = (xs: number[]): number =>
  xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length;

export const stdDevSample = (xs: number[]): number | null => {
  if (xs.length < 2) return null;
  const m = mean(xs);
  const sumSq = xs.reduce((acc, x) => acc + (x - m) ** 2, 0);
  return Math.sqrt(sumSq / (xs.length - 1));
};

export const uncertaintyTypeA = (sd: number | null, n: number): number | null => {
  if (sd === null || n < 2) return null;
  return sd / Math.sqrt(n);
};

export const computeDerived = (replicas: number[], valorPatron?: number): DerivedMetrics | null => {
  const valid = replicas.filter(v => Number.isFinite(v));
  if (valid.length < 1) return null;
  const m = mean(valid);
  const sd = stdDevSample(valid);
  const u = uncertaintyTypeA(sd, valid.length);
  const err = valorPatron !== undefined && Number.isFinite(valorPatron) ? m - valorPatron : null;
  return {
    n: valid.length,
    media: m,
    desviacionStd: sd,
    error: err,
    incertidumbre: u,
  };
};

/** Formatea con N decimales sin ruido de coma flotante. */
export const formatNum = (v: number | null | undefined, decimals = 4): string => {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return v.toFixed(decimals);
};
