/**
 * EditarPerforacionModal - Modal para editar una perforación
 */

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '../../../../components/ui';
import type { PerforacionUI, EditarPerforacionFormData } from '../types';
import styles from '../../../../pages/Proyectos.module.css';

interface EditarPerforacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (data: EditarPerforacionFormData) => void;
  perforacion: PerforacionUI | null;
  loading: boolean;
}

export function EditarPerforacionModal({
  isOpen,
  onClose,
  onEdit,
  perforacion,
  loading,
}: EditarPerforacionModalProps) {
  const [form, setForm] = useState<EditarPerforacionFormData>({
    nombre: '',
    descripcion: '',
    ubicacion: '',
  });

  useEffect(() => {
    if (perforacion) {
      setForm({
        nombre: perforacion.nombre || perforacion.codigo || '',
        descripcion: perforacion.descripcion || '',
        ubicacion: perforacion.ubicacion || '',
      });
    }
  }, [perforacion]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onEdit(form);
  };

  if (!perforacion) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perforación">
      <form onSubmit={handleSubmit}>
        <div className={styles.modalForm}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre/Código *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              rows={2}
              className={styles.textarea}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Ubicación</label>
            <input
              type="text"
              value={form.ubicacion}
              onChange={e => setForm({ ...form, ubicacion: e.target.value })}
              placeholder="Ej: Sector Norte, Km 5+200"
              className={styles.input}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={styles.btnSubmit}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default EditarPerforacionModal;
