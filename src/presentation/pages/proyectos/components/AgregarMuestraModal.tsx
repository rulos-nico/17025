/**
 * AgregarMuestraModal - Modal para agregar muestra a perforación relacionada
 */

import { useState, type FormEvent } from 'react';
import { Modal } from '../../../../components/ui';
import { TIPOS_MUESTRA } from '../../../../config';
import type { PerforacionUI, MuestraUI, AgregarMuestraFormData } from '../types';
import styles from '../../../../pages/Proyectos.module.css';

interface AgregarMuestraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AgregarMuestraFormData) => void;
  perforacion: PerforacionUI | null;
  muestrasExistentes: MuestraUI[];
  loading: boolean;
}

export function AgregarMuestraModal({
  isOpen,
  onClose,
  onAdd,
  perforacion,
  muestrasExistentes,
  loading,
}: AgregarMuestraModalProps) {
  const [form, setForm] = useState({
    profundidadInicio: '',
    profundidadFin: '',
    tipoMuestra: 'alterado',
    descripcion: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Calcular el siguiente código de muestra
    const siguienteNumero = muestrasExistentes.length + 1;
    const codigo = `M-${String(siguienteNumero).padStart(3, '0')}`;

    onAdd({
      perforacionId: perforacion!.id,
      codigo,
      profundidadInicio: parseFloat(form.profundidadInicio),
      profundidadFin: parseFloat(form.profundidadFin),
      tipoMuestra: form.tipoMuestra,
      descripcion: form.descripcion,
    });

    // Reset form
    setForm({
      profundidadInicio: '',
      profundidadFin: '',
      tipoMuestra: 'alterado',
      descripcion: '',
    });
  };

  if (!perforacion) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Nueva Muestra">
      <form onSubmit={handleSubmit}>
        <div className={styles.modalForm}>
          {/* Info de la perforación */}
          <div className={`${styles.infoBox} ${styles.infoBoxPrimary}`}>
            <div className={`${styles.infoBoxTitle} ${styles.infoBoxPrimaryTitle}`}>
              Perforación:
            </div>
            <div className={styles.infoBoxContent}>
              <strong>{perforacion.codigo}</strong> - {perforacion.descripcion}
            </div>
            <div className={styles.infoBoxPrimaryText}>
              Muestra física: {perforacion.muestraFisica}
            </div>
            <div className={styles.infoBoxSubtext}>
              Muestras registradas: {muestrasExistentes.length}
            </div>
          </div>

          {/* Código automático */}
          <div className={styles.codigoAsignadoBox}>
            <strong>Código asignado:</strong> M-
            {String(muestrasExistentes.length + 1).padStart(3, '0')}
          </div>

          {/* Formulario */}
          <div className={styles.gridTwo}>
            <div className={styles.field}>
              <label className={styles.label}>Profundidad Inicio (m) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.profundidadInicio}
                onChange={e => setForm({ ...form, profundidadInicio: e.target.value })}
                required
                placeholder="0.0"
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Profundidad Fin (m) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.profundidadFin}
                onChange={e => setForm({ ...form, profundidadFin: e.target.value })}
                required
                placeholder="0.5"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tipo de Muestra *</label>
            <select
              value={form.tipoMuestra}
              onChange={e => setForm({ ...form, tipoMuestra: e.target.value })}
              className={styles.select}
            >
              {TIPOS_MUESTRA.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              rows={2}
              placeholder="Ej: Arcilla café con gravas, N=15..."
              className={styles.textarea}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.btnSubmit} ${styles.btnSubmitWarning}`}
            >
              {loading ? 'Agregando...' : 'Agregar Muestra'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default AgregarMuestraModal;
