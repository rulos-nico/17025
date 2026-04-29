/**
 * ComprobacionFormModal - Modal para crear/editar comprobaciones de sensores
 */

import { useState, FormEvent, ChangeEvent, ReactElement } from 'react';
import { Modal } from '../../ui';
import type { SensorLite } from '../../../hooks/useComprobacionesData';
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
  data: unknown;
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
// COMPONENT
// ============================================

const RESULTADOS = ['Conforme', 'No Conforme'];

const todayISO = () => new Date().toISOString().slice(0, 10);

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

  const [form, setForm] = useState<ComprobacionFormData>(() => ({
    sensor_id: comprobacion?.sensorId || '',
    fecha: comprobacion?.fecha?.slice(0, 10) || todayISO(),
    resultado: comprobacion?.resultado || 'Conforme',
    responsable: comprobacion?.responsable || defaultResponsableId,
    observaciones: comprobacion?.observaciones || '',
    data: comprobacion?.data ?? {},
  }));

  const [dataText, setDataText] = useState<string>(() =>
    JSON.stringify(comprobacion?.data ?? {}, null, 2)
  );
  const [dataError, setDataError] = useState<string | null>(null);

  const handleChange = (field: keyof ComprobacionFormData, value: string): void => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDataChange = (value: string) => {
    setDataText(value);
    try {
      const parsed = value.trim() ? JSON.parse(value) : {};
      setForm(prev => ({ ...prev, data: parsed }));
      setDataError(null);
    } catch {
      setDataError('JSON inválido');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (dataError) return;
    await onSave(form);
  };

  const isValid =
    !!form.sensor_id && !!form.fecha && !!form.resultado && !!form.responsable.trim() && !dataError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Comprobación' : 'Nueva Comprobación'}
      width="640px"
    >
      <form onSubmit={handleSubmit}>
        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Sensor <span className={formStyles.required}>*</span>
            </label>
            <select
              value={form.sensor_id}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange('sensor_id', e.target.value)
              }
              className={formStyles.select}
              required
              disabled={isEditing}
            >
              <option value="">Seleccionar sensor</option>
              {sensores.map(s => (
                <option key={s.id} value={s.id}>
                  {s.codigo || s.id} — {s.tipo || ''} {s.marca || ''} {s.modelo || ''}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Fecha <span className={formStyles.required}>*</span>
            </label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('fecha', e.target.value)}
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
              value={form.resultado}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange('resultado', e.target.value)
              }
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
              value={form.responsable}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('responsable', e.target.value)
              }
              className={formStyles.input}
              placeholder="ID del usuario responsable"
              required
            />
          </div>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              handleChange('observaciones', e.target.value)
            }
            className={formStyles.textarea}
            placeholder="Notas adicionales..."
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Datos del muestreo (JSON)</label>
          <textarea
            value={dataText}
            onChange={e => handleDataChange(e.target.value)}
            className={formStyles.textarea}
            style={{ fontFamily: 'monospace', minHeight: 140 }}
            placeholder='{"medicion_1": 10.2, "medicion_2": 10.3}'
          />
          {dataError && (
            <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{dataError}</div>
          )}
          <div className={formStyles.hint}>
            Carga libre — útil para registrar mediciones, condiciones del entorno, etc.
          </div>
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

export default ComprobacionFormModal;
