/**
 * CalibracionFormModal - Modal para crear/editar calibraciones de sensores
 */

import { useState, FormEvent, ChangeEvent, ReactElement } from 'react';
import { Modal } from '../../ui';
import type { SensorLite } from '../../../hooks/useComprobacionesData';
import formStyles from '../../../styles/Form.module.css';

export interface CalibracionFormData {
  sensor_id: string;
  fecha_calibracion: string;
  proxima_calibracion: string;
  estado: string;
  factor: string;
  rango_medicion: string;
  precision: string;
  error_maximo: string;
  incertidumbre: string;
  certificado_id: string;
  [key: string]: unknown;
}

export interface CalibracionForModal {
  id?: string;
  sensorId?: string;
  fechaCalibracion?: string;
  proximaCalibracion?: string;
  estado?: string;
  factor?: number | string;
  rangoMedicion?: string;
  precision?: string;
  errorMaximo?: string;
  incertidumbre?: string;
  certificadoId?: string;
}

export interface CalibracionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CalibracionFormData) => Promise<void>;
  calibracion?: CalibracionForModal | null;
  sensores: SensorLite[];
  loading?: boolean;
}

const ESTADOS = ['vigente', 'vencida', 'en_proceso', 'rechazada'];

const todayISO = () => new Date().toISOString().slice(0, 10);
const oneYearFromNow = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export function CalibracionFormModal({
  isOpen,
  onClose,
  onSave,
  calibracion,
  sensores,
  loading = false,
}: CalibracionFormModalProps): ReactElement {
  const isEditing = !!calibracion?.id;

  const [form, setForm] = useState<CalibracionFormData>(() => ({
    sensor_id: calibracion?.sensorId || '',
    fecha_calibracion: calibracion?.fechaCalibracion?.slice(0, 10) || todayISO(),
    proxima_calibracion: calibracion?.proximaCalibracion?.slice(0, 10) || oneYearFromNow(),
    estado: calibracion?.estado || 'vigente',
    factor: calibracion?.factor != null ? String(calibracion.factor) : '1.00000',
    rango_medicion: calibracion?.rangoMedicion || '',
    precision: calibracion?.precision || '',
    error_maximo: calibracion?.errorMaximo || '',
    incertidumbre: calibracion?.incertidumbre || '',
    certificado_id: calibracion?.certificadoId || '',
  }));

  const handleChange = (field: keyof CalibracionFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave(form);
  };

  const isValid =
    !!form.sensor_id &&
    !!form.fecha_calibracion &&
    !!form.proxima_calibracion &&
    !!form.estado &&
    !!form.factor.trim() &&
    !Number.isNaN(parseFloat(form.factor));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Calibración' : 'Nueva Calibración'}
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
              Estado <span className={formStyles.required}>*</span>
            </label>
            <select
              value={form.estado}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange('estado', e.target.value)
              }
              className={formStyles.select}
              required
            >
              {ESTADOS.map(e => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Fecha calibración <span className={formStyles.required}>*</span>
            </label>
            <input
              type="date"
              value={form.fecha_calibracion}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('fecha_calibracion', e.target.value)
              }
              className={formStyles.input}
              required
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Próxima calibración <span className={formStyles.required}>*</span>
            </label>
            <input
              type="date"
              value={form.proxima_calibracion}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('proxima_calibracion', e.target.value)
              }
              className={formStyles.input}
              required
            />
          </div>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Factor de calibración <span className={formStyles.required}>*</span>
            </label>
            <input
              type="number"
              step="0.00001"
              value={form.factor}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('factor', e.target.value)
              }
              className={formStyles.input}
              placeholder="1.00000"
              required
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>ID Certificado</label>
            <input
              type="text"
              value={form.certificado_id}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('certificado_id', e.target.value)
              }
              className={formStyles.input}
              placeholder="Ej: CERT-2024-0123"
            />
          </div>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Rango de medición</label>
            <input
              type="text"
              value={form.rango_medicion}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('rango_medicion', e.target.value)
              }
              className={formStyles.input}
              placeholder="Ej: 0-100 °C"
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Precisión</label>
            <input
              type="text"
              value={form.precision}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('precision', e.target.value)
              }
              className={formStyles.input}
              placeholder="Ej: ±0.1 °C"
            />
          </div>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Error máximo</label>
            <input
              type="text"
              value={form.error_maximo}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('error_maximo', e.target.value)
              }
              className={formStyles.input}
              placeholder="Ej: ± 0.5"
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Incertidumbre (U)</label>
            <input
              type="text"
              value={form.incertidumbre}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('incertidumbre', e.target.value)
              }
              className={formStyles.input}
              placeholder="Ej: ± 0.0001 g (k=2)"
            />
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

export default CalibracionFormModal;
