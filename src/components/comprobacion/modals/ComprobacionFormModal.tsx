/**
 * ComprobacionFormModal - Modal tipificado para crear/editar comprobaciones.
 *
 * En lugar de un textarea con JSON crudo, el form pide:
 *  - Valor patrón (label/unidad según tipo de sensor)
 *  - N réplicas numéricas (mínimo 3, máximo 10) con +/-
 *  - Condiciones ambientales según template
 *
 * Calcula en vivo media, desviación estándar muestral, error y u_A = sd/√n,
 * y los envía como columnas top-level. data se guarda como
 * { replicas: number[], ambiente: { ... } }.
 */

import { useMemo, useState, FormEvent, ChangeEvent, ReactElement, useEffect } from 'react';
import { Modal } from '../../ui';
import type { SensorLite, ComprobacionDataShape } from '../../../hooks/useComprobacionesData';
import { computeDerived, formatNum } from '../../../utils/metrology';
import { getSensorTemplate, type SensorTemplate } from '../sensorTemplates';
import formStyles from '../../../styles/Form.module.css';

// ============================================
// TYPES
// ============================================

export interface ComprobacionFormData {
  sensor_id: string;
  fecha: string;
  resultado: string;
  responsable: string;
  observaciones: string;
  data: ComprobacionDataShape;
  valor_patron: number | null;
  unidad: string | null;
  n_replicas: number | null;
  media: number | null;
  desviacion_std: number | null;
  error: number | null;
  incertidumbre: number | null;
  [key: string]: unknown;
}

export interface ComprobacionForModal {
  id?: string;
  sensorId?: string;
  fecha?: string;
  resultado?: string;
  responsable?: string;
  observaciones?: string;
  data?: unknown;
  valorPatron?: number;
  unidad?: string;
  nReplicas?: number;
}

export interface ComprobacionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ComprobacionFormData) => Promise<void>;
  comprobacion?: ComprobacionForModal | null;
  sensores: SensorLite[];
  defaultResponsableId?: string;
  loading?: boolean;
}

// ============================================
// HELPERS
// ============================================

const RESULTADOS = ['Conforme', 'No Conforme'];
const MIN_REPLICAS = 3;
const MAX_REPLICAS = 10;

const todayISO = (): string => new Date().toISOString().slice(0, 10);

const buildInitialReplicas = (data: unknown, defaultLen: number): string[] => {
  if (data && typeof data === 'object') {
    const reps = (data as ComprobacionDataShape).replicas;
    if (Array.isArray(reps) && reps.length >= MIN_REPLICAS) {
      return reps.map(v => String(v));
    }
  }
  return Array.from({ length: defaultLen }, () => '');
};

const buildInitialAmbiente = (data: unknown, template: SensorTemplate): Record<string, string> => {
  const ambData =
    data && typeof data === 'object' ? (data as ComprobacionDataShape).ambiente || {} : {};
  const result: Record<string, string> = {};
  template.ambiente.forEach(f => {
    const v = (ambData as Record<string, unknown>)[f.key];
    if (typeof v === 'number') result[f.key] = String(v);
    else if (typeof v === 'string') result[f.key] = v;
    else if (f.defaultValue !== undefined) result[f.key] = String(f.defaultValue);
    else result[f.key] = '';
  });
  return result;
};

// ============================================
// COMPONENT
// ============================================

export function ComprobacionFormModal({
  isOpen,
  onClose,
  onSave,
  comprobacion,
  sensores,
  defaultResponsableId = '',
  loading = false,
}: ComprobacionFormModalProps): ReactElement {
  const isEditing = !!comprobacion?.id;

  // Sensor seleccionado
  const [sensorId, setSensorId] = useState<string>(comprobacion?.sensorId || '');
  const [fecha, setFecha] = useState<string>(comprobacion?.fecha?.slice(0, 10) || todayISO());
  const [resultado, setResultado] = useState<string>(comprobacion?.resultado || 'Conforme');
  const [responsable, setResponsable] = useState<string>(
    comprobacion?.responsable || defaultResponsableId
  );
  const [observaciones, setObservaciones] = useState<string>(comprobacion?.observaciones || '');

  // Template derivado del tipo de sensor
  const sensor = useMemo(() => sensores.find(s => String(s.id) === sensorId), [sensores, sensorId]);
  const template = useMemo(() => getSensorTemplate(sensor?.tipo), [sensor]);

  // Mediciones
  const [valorPatron, setValorPatron] = useState<string>(
    comprobacion?.valorPatron !== undefined ? String(comprobacion.valorPatron) : ''
  );
  const [replicas, setReplicas] = useState<string[]>(() =>
    buildInitialReplicas(comprobacion?.data, 5)
  );
  const [ambiente, setAmbiente] = useState<Record<string, string>>(() =>
    buildInitialAmbiente(comprobacion?.data, template)
  );

  // Resync ambiente cuando cambia template (cambio de sensor) y NO estamos editando
  useEffect(() => {
    if (isEditing) return;
    setAmbiente(buildInitialAmbiente(null, template));
    if (!valorPatron && template.patronDefault) {
      setValorPatron(String(template.patronDefault));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  // Derivados en vivo
  const replicasNum = useMemo(
    () => replicas.map(s => parseFloat(s)).filter((v): v is number => Number.isFinite(v)),
    [replicas]
  );
  const patronNum = useMemo(() => {
    const v = parseFloat(valorPatron);
    return Number.isFinite(v) ? v : undefined;
  }, [valorPatron]);
  const derived = useMemo(() => computeDerived(replicasNum, patronNum), [replicasNum, patronNum]);

  const replicasError = useMemo(() => {
    if (replicasNum.length < MIN_REPLICAS) {
      return `Se requieren al menos ${MIN_REPLICAS} réplicas numéricas válidas.`;
    }
    return null;
  }, [replicasNum]);

  const isValid =
    !!sensorId &&
    !!fecha &&
    !!resultado &&
    !!responsable.trim() &&
    !replicasError &&
    derived !== null &&
    patronNum !== undefined;

  // Mutators de réplicas
  const setReplica = (i: number, val: string) =>
    setReplicas(prev => prev.map((r, idx) => (idx === i ? val : r)));
  const addReplica = () => {
    if (replicas.length >= MAX_REPLICAS) return;
    setReplicas(prev => [...prev, '']);
  };
  const removeReplica = (i: number) => {
    if (replicas.length <= MIN_REPLICAS) return;
    setReplicas(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!isValid || !derived || patronNum === undefined) return;

    const ambienteData: Record<string, number> = {};
    Object.entries(ambiente).forEach(([k, v]) => {
      const n = parseFloat(v);
      if (Number.isFinite(n)) ambienteData[k] = n;
    });

    const payload: ComprobacionFormData = {
      sensor_id: sensorId,
      fecha,
      resultado,
      responsable: responsable.trim(),
      observaciones,
      data: { replicas: replicasNum, ambiente: ambienteData },
      valor_patron: patronNum,
      unidad: template.unidad || null,
      n_replicas: derived.n,
      media: derived.media,
      desviacion_std: derived.desviacionStd,
      error: derived.error,
      incertidumbre: derived.incertidumbre,
    };

    await onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Comprobación' : 'Nueva Comprobación'}
      width="720px"
    >
      <form onSubmit={handleSubmit}>
        {/* --- META --- */}
        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Sensor <span className={formStyles.required}>*</span>
            </label>
            <select
              value={sensorId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSensorId(e.target.value)}
              className={formStyles.select}
              required
              disabled={isEditing}
            >
              <option value="">Seleccionar sensor</option>
              {sensores.map(s => (
                <option key={s.id} value={String(s.id)}>
                  {s.codigo || s.id} — {s.tipo || ''} {s.marca || ''} {s.modelo || ''}
                </option>
              ))}
            </select>
            {sensor && (
              <div className={formStyles.hint}>
                Plantilla: <strong>{template.id}</strong> — unidad{' '}
                <strong>{template.unidad || '—'}</strong>
              </div>
            )}
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Fecha <span className={formStyles.required}>*</span>
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFecha(e.target.value)}
              className={formStyles.input}
              required
            />
          </div>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Resultado <span className={formStyles.required}>*</span>
            </label>
            <select
              value={resultado}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setResultado(e.target.value)}
              className={formStyles.select}
              required
            >
              {RESULTADOS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Responsable (ID usuario) <span className={formStyles.required}>*</span>
            </label>
            <input
              type="text"
              value={responsable}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setResponsable(e.target.value)}
              className={formStyles.input}
              placeholder="ID del usuario responsable"
              required
            />
          </div>
        </div>

        {/* --- MEDICIÓN --- */}
        <div className={formStyles.field}>
          <label className={formStyles.label}>
            {template.patronLabel} ({template.unidad || 'unidad'}){' '}
            <span className={formStyles.required}>*</span>
          </label>
          <input
            type="number"
            step={template.step}
            value={valorPatron}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setValorPatron(e.target.value)}
            className={formStyles.input}
            required
            disabled={!sensorId}
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>
            Réplicas ({template.unidad || 'unidad'}) <span className={formStyles.required}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {replicas.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#6B7280', minWidth: 18 }}>#{i + 1}</span>
                <input
                  type="number"
                  step={template.step}
                  value={r}
                  onChange={e => setReplica(i, e.target.value)}
                  className={formStyles.input}
                  style={{ width: 120 }}
                  disabled={!sensorId}
                />
                <button
                  type="button"
                  onClick={() => removeReplica(i)}
                  disabled={replicas.length <= MIN_REPLICAS}
                  title="Eliminar réplica"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: replicas.length <= MIN_REPLICAS ? 'not-allowed' : 'pointer',
                    color: '#DC2626',
                    fontSize: 16,
                    padding: '0 4px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addReplica}
              disabled={replicas.length >= MAX_REPLICAS}
              style={{
                border: '1px dashed #9CA3AF',
                background: 'white',
                borderRadius: 4,
                padding: '4px 10px',
                cursor: replicas.length >= MAX_REPLICAS ? 'not-allowed' : 'pointer',
                color: '#374151',
                fontSize: 13,
              }}
            >
              + agregar
            </button>
          </div>
          <div className={formStyles.hint}>
            Mínimo {MIN_REPLICAS}, máximo {MAX_REPLICAS} lecturas. Las vacías o no numéricas se
            ignoran.
          </div>
          {replicasError && (
            <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{replicasError}</div>
          )}
        </div>

        {/* --- DERIVADOS LIVE --- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            padding: 10,
            marginBottom: 12,
          }}
        >
          <DerivedCell
            label={`Media (x̄)`}
            value={formatNum(derived?.media, template.decimales)}
            unit={template.unidad}
          />
          <DerivedCell
            label="Desv. estándar (s)"
            value={formatNum(derived?.desviacionStd, template.decimales)}
            unit={template.unidad}
          />
          <DerivedCell
            label="Error (x̄ − patrón)"
            value={formatNum(derived?.error, template.decimales)}
            unit={template.unidad}
          />
          <DerivedCell
            label="Incertidumbre u_A"
            value={formatNum(derived?.incertidumbre, template.decimales + 1)}
            unit={template.unidad}
          />
        </div>

        {/* --- AMBIENTE --- */}
        {template.ambiente.length > 0 && (
          <div className={formStyles.row}>
            {template.ambiente.map(f => (
              <div key={f.key} className={formStyles.field}>
                <label className={formStyles.label}>
                  {f.label} {f.unidad ? `(${f.unidad})` : ''}
                </label>
                <input
                  type="number"
                  step={f.step || '0.1'}
                  value={ambiente[f.key] ?? ''}
                  onChange={e => setAmbiente(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className={formStyles.input}
                />
              </div>
            ))}
          </div>
        )}

        <div className={formStyles.field}>
          <label className={formStyles.label}>Observaciones</label>
          <textarea
            value={observaciones}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setObservaciones(e.target.value)}
            className={formStyles.textarea}
            placeholder="Notas adicionales..."
          />
        </div>

        <div className={formStyles.buttons}>
          <button
            type="button"
            onClick={onClose}
            className={formStyles.buttonSecondary}
            disabled={loading}
          >
            Cancelar
          </button>
          <button type="submit" className={formStyles.buttonPrimary} disabled={!isValid || loading}>
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface DerivedCellProps {
  label: string;
  value: string;
  unit?: string;
}

function DerivedCell({ label, value, unit }: DerivedCellProps) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#111827' }}>
        {value}
        {unit ? ` ${unit}` : ''}
      </div>
    </div>
  );
}

export default ComprobacionFormModal;
