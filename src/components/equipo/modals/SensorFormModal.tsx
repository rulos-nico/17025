/**
 * SensorFormModal - Modal para crear/editar sensores
 */

import { useState, FormEvent, ChangeEvent, ReactElement } from 'react';
import { Modal } from '../../ui';
import {
  ESTADOS_EQUIPO,
  TIPOS_SENSOR,
  UBICACIONES,
  EstadoEquipoValue,
  TipoSensorValue,
} from '../../../config/equipos';
import formStyles from '../../../styles/Form.module.css';

// ============================================
// TYPES
// ============================================

export interface SensorFormData {
  tipo: TipoSensorValue | '';
  numero_serie: string;
  marca: string;
  modelo: string;
  rango_medicion: string;
  precision: string;
  ubicacion: string;
  estado: EstadoEquipoValue;
  responsable: string;
  observaciones: string;
  equipo_id: string | number;
  [key: string]: unknown;
}

export interface SensorForModal {
  id?: string | number;
  tipo?: TipoSensorValue | string;
  numero_serie?: string;
  serie?: string;
  marca?: string;
  modelo?: string;
  rango_medicion?: string;
  rango?: string;
  precision?: string;
  resolucion?: string;
  ubicacion?: string;
  estado?: EstadoEquipoValue;
  responsable?: string;
  observaciones?: string;
  equipoPadre?: string | number;
  equipo_id?: string | number;
  [key: string]: unknown;
}

export interface EquipoOption {
  id: string | number;
  codigo?: string;
  nombre?: string;
}

export interface SensorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SensorFormData) => Promise<void>;
  sensor?: SensorForModal | null;
  loading?: boolean;
  equiposDisponibles?: EquipoOption[];
}

// ============================================
// COMPONENT
// ============================================

export function SensorFormModal({
  isOpen,
  onClose,
  onSave,
  sensor,
  loading = false,
  equiposDisponibles = [],
}: SensorFormModalProps): ReactElement {
  const isEditing = !!sensor;

  const [form, setForm] = useState<SensorFormData>(() => ({
    tipo: (sensor?.tipo as TipoSensorValue) || '',
    numero_serie: sensor?.numero_serie || sensor?.serie || '',
    marca: sensor?.marca || '',
    modelo: sensor?.modelo || '',
    rango_medicion: sensor?.rango_medicion || sensor?.rango || '',
    precision: sensor?.precision || sensor?.resolucion || '',
    ubicacion: sensor?.ubicacion || '',
    estado: sensor?.estado || 'operativo',
    responsable: sensor?.responsable || '',
    observaciones: sensor?.observaciones || '',
    equipo_id: sensor?.equipoPadre || sensor?.equipo_id || '',
  }));

  const handleChange = (field: keyof SensorFormData, value: string): void => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    await onSave(form);
  };

  const isValid = form.tipo.trim() && form.numero_serie.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Sensor' : 'Nuevo Sensor'}
      width="600px"
    >
      <form onSubmit={handleSubmit}>
        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Tipo <span className={formStyles.required}>*</span>
            </label>
            <select
              value={form.tipo}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange('tipo', e.target.value)}
              className={formStyles.select}
              required
            >
              <option value="">Seleccionar tipo</option>
              {TIPOS_SENSOR.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              N Serie <span className={formStyles.required}>*</span>
            </label>
            <input
              type="text"
              value={form.numero_serie}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('numero_serie', e.target.value)
              }
              className={formStyles.input}
              placeholder="Ej: SN-2024-12345"
              required
            />
          </div>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Marca</label>
            <input
              type="text"
              value={form.marca}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('marca', e.target.value)}
              className={formStyles.input}
              placeholder="Ej: HBM"
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Modelo</label>
            <input
              type="text"
              value={form.modelo}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('modelo', e.target.value)
              }
              className={formStyles.input}
              placeholder="Ej: U10M"
            />
          </div>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Rango de Medicion</label>
            <input
              type="text"
              value={form.rango_medicion}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('rango_medicion', e.target.value)
              }
              className={formStyles.input}
              placeholder="Ej: 0 - 50 kN"
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Precision / Resolucion</label>
            <input
              type="text"
              value={form.precision}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('precision', e.target.value)
              }
              className={formStyles.input}
              placeholder="Ej: 0.01 kN"
            />
          </div>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Ubicacion</label>
            <select
              value={form.ubicacion}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange('ubicacion', e.target.value)
              }
              className={formStyles.select}
            >
              <option value="">Seleccionar ubicacion</option>
              {UBICACIONES.map(ub => (
                <option key={ub} value={ub}>
                  {ub}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Responsable</label>
            <input
              type="text"
              value={form.responsable}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('responsable', e.target.value)
              }
              className={formStyles.input}
              placeholder="Nombre del responsable"
            />
          </div>
        </div>

        {/* Equipo Asociado */}
        <div className={formStyles.field}>
          <label className={formStyles.label}>Equipo Asociado</label>
          <select
            value={form.equipo_id}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleChange('equipo_id', e.target.value)
            }
            className={formStyles.select}
          >
            <option value="">Sin equipo asociado</option>
            {equiposDisponibles.map(eq => (
              <option key={eq.id} value={eq.id}>
                {eq.codigo} - {eq.nombre}
              </option>
            ))}
          </select>
          <div className={formStyles.hint}>Selecciona el equipo al que pertenece este sensor</div>
        </div>

        {isEditing && (
          <div className={formStyles.field}>
            <label className={formStyles.label}>Estado</label>
            <select
              value={form.estado}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange('estado', e.target.value)
              }
              className={formStyles.select}
            >
              {ESTADOS_EQUIPO.map(est => (
                <option key={est.value} value={est.value}>
                  {est.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={formStyles.field}>
          <label className={formStyles.label}>Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              handleChange('observaciones', e.target.value)
            }
            className={formStyles.textarea}
            placeholder="Observaciones adicionales..."
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
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Sensor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SensorFormModal;
