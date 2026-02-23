/**
 * EquipoFormModal - Modal para crear/editar equipos
 */

import { useState, FormEvent, ChangeEvent, ReactElement } from 'react';
import { Modal } from '../../ui';
import { ESTADOS_EQUIPO, UBICACIONES, EstadoEquipoValue } from '../../../config/equipos';
import formStyles from '../../../styles/Form.module.css';

// ============================================
// TYPES
// ============================================

export interface EquipoFormData {
  nombre: string;
  serie: string;
  placa: string;
  descripcion: string;
  marca: string;
  modelo: string;
  ubicacion: string;
  estado: EstadoEquipoValue;
  [key: string]: unknown;
}

export interface EquipoForModal {
  id?: string | number;
  nombre?: string;
  serie?: string;
  placa?: string;
  descripcion?: string;
  marca?: string;
  modelo?: string;
  ubicacion?: string;
  estado?: EstadoEquipoValue;
  [key: string]: unknown;
}

export interface EquipoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EquipoFormData) => Promise<void>;
  equipo?: EquipoForModal | null;
  loading?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function EquipoFormModal({
  isOpen,
  onClose,
  onSave,
  equipo,
  loading = false,
}: EquipoFormModalProps): ReactElement {
  const isEditing = !!equipo;

  const [form, setForm] = useState<EquipoFormData>(() => ({
    nombre: equipo?.nombre || '',
    serie: equipo?.serie || '',
    placa: equipo?.placa || '',
    descripcion: equipo?.descripcion || '',
    marca: equipo?.marca || '',
    modelo: equipo?.modelo || '',
    ubicacion: equipo?.ubicacion || '',
    estado: equipo?.estado || 'operativo',
  }));

  const handleChange = (field: keyof EquipoFormData, value: string): void => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    await onSave(form);
  };

  const isValid = form.nombre.trim() && form.serie.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
      width="600px"
    >
      <form onSubmit={handleSubmit}>
        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              Nombre <span className={formStyles.required}>*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('nombre', e.target.value)
              }
              className={formStyles.input}
              placeholder="Ej: Maquina Universal de Traccion"
              required
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>
              N Serie <span className={formStyles.required}>*</span>
            </label>
            <input
              type="text"
              value={form.serie}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('serie', e.target.value)}
              className={formStyles.input}
              placeholder="Ej: SN-2024-12345"
              required
            />
          </div>
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Placa / Inventario</label>
            <input
              type="text"
              value={form.placa}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('placa', e.target.value)}
              className={formStyles.input}
              placeholder="Ej: INV-2024-001"
            />
          </div>
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
        </div>

        <div className={formStyles.row}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Marca</label>
            <input
              type="text"
              value={form.marca}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('marca', e.target.value)}
              className={formStyles.input}
              placeholder="Ej: Instron"
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
              placeholder="Ej: 5985"
            />
          </div>
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
          <label className={formStyles.label}>Descripcion</label>
          <textarea
            value={form.descripcion}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              handleChange('descripcion', e.target.value)
            }
            className={formStyles.textarea}
            placeholder="Descripcion del equipo..."
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
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Equipo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EquipoFormModal;
