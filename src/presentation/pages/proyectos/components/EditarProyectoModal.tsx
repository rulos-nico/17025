/**
 * EditarProyectoModal - Modal para editar un proyecto existente
 */

import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '../../../../components/ui';
import type { ProyectoUI, EditarProyectoFormData } from '../types';
import styles from '../../../../pages/Proyectos.module.css';

interface EditarProyectoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (data: EditarProyectoFormData) => void;
  proyecto: ProyectoUI | null;
  loading: boolean;
}

export function EditarProyectoModal({
  isOpen,
  onClose,
  onEdit,
  proyecto,
  loading,
}: EditarProyectoModalProps) {
  const [form, setForm] = useState<EditarProyectoFormData>({
    nombre: '',
    descripcion: '',
    contacto: '',
    fecha_fin_estimada: '',
    estado: 'activo',
  });

  // Sincronizar form cuando cambia el proyecto
  useEffect(() => {
    if (proyecto) {
      setForm({
        nombre: proyecto.nombre || '',
        descripcion: proyecto.descripcion || '',
        contacto: proyecto.contacto || '',
        fecha_fin_estimada: proyecto.fechaFinEstimada || '',
        estado: proyecto.estado || 'activo',
      });
    }
  }, [proyecto]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onEdit(form);
  };

  if (!proyecto) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Proyecto">
      <form onSubmit={handleSubmit}>
        <div className={styles.modalForm}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre del Proyecto *</label>
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

          <div className={styles.gridTwo}>
            <div className={styles.field}>
              <label className={styles.label}>Estado</label>
              <select
                value={form.estado}
                onChange={e => setForm({ ...form, estado: e.target.value })}
                className={styles.select}
              >
                <option value="activo">Activo</option>
                <option value="pausado">Pausado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Fecha Fin Estimada</label>
              <input
                type="date"
                value={form.fecha_fin_estimada}
                onChange={e => setForm({ ...form, fecha_fin_estimada: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contacto</label>
            <input
              type="text"
              value={form.contacto}
              onChange={e => setForm({ ...form, contacto: e.target.value })}
              placeholder="Nombre o email del contacto"
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

export default EditarProyectoModal;
