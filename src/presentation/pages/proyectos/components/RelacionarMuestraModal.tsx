/**
 * RelacionarMuestraModal - Modal para relacionar muestra física y agregar muestras
 */

import { useState, type FormEvent } from 'react';
import { Modal } from '../../../../components/ui';
import { TIPOS_MUESTRA } from '../../../../config';
import type { PerforacionUI, RelacionarMuestraFormData } from '../types';
import styles from '../../../../pages/Proyectos.module.css';

interface MuestraForm {
  profundidadInicio: string;
  profundidadFin: string;
  tipoMuestra: string;
  descripcion: string;
}

type CondicionMuestra = 'buena' | 'regular' | 'deteriorada';

interface FormState {
  codigoMuestra: string;
  fechaRecepcion: string;
  observaciones: string;
  condicionMuestra: CondicionMuestra;
}

interface RelacionarMuestraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRelate: (data: RelacionarMuestraFormData) => void;
  perforacion: PerforacionUI | null;
  loading: boolean;
}

export function RelacionarMuestraModal({
  isOpen,
  onClose,
  onRelate,
  perforacion,
  loading,
}: RelacionarMuestraModalProps) {
  const [form, setForm] = useState<FormState>({
    codigoMuestra: '',
    fechaRecepcion: new Date().toISOString().split('T')[0],
    observaciones: '',
    condicionMuestra: 'buena',
  });

  const [muestrasForm, setMuestrasForm] = useState<MuestraForm[]>([
    { profundidadInicio: '', profundidadFin: '', tipoMuestra: 'alterado', descripcion: '' },
  ]);

  const handleAddMuestra = () => {
    setMuestrasForm([
      ...muestrasForm,
      { profundidadInicio: '', profundidadFin: '', tipoMuestra: 'alterado', descripcion: '' },
    ]);
  };

  const handleRemoveMuestra = (index: number) => {
    if (muestrasForm.length > 1) {
      setMuestrasForm(muestrasForm.filter((_, i) => i !== index));
    }
  };

  const handleMuestraChange = (index: number, field: keyof MuestraForm, value: string) => {
    const updated = [...muestrasForm];
    updated[index][field] = value;
    setMuestrasForm(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const muestrasValidas = muestrasForm.filter(m => m.profundidadInicio !== '');

    onRelate({
      perforacionId: perforacion!.id,
      ...form,
      muestras: muestrasValidas,
    });

    // Reset form
    setForm({
      codigoMuestra: '',
      fechaRecepcion: new Date().toISOString().split('T')[0],
      observaciones: '',
      condicionMuestra: 'buena',
    });
    setMuestrasForm([
      { profundidadInicio: '', profundidadFin: '', tipoMuestra: 'alterado', descripcion: '' },
    ]);
  };

  if (!perforacion) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Relacionar Perforación y Agregar Muestras">
      <form onSubmit={handleSubmit}>
        <div className={styles.modalForm}>
          {/* Info de la perforación */}
          <div className={`${styles.infoBox} ${styles.infoBoxWarning}`}>
            <div className={`${styles.infoBoxTitle} ${styles.infoBoxWarningTitle}`}>
              Perforación a relacionar:
            </div>
            <div className={styles.infoBoxContent}>
              <strong>{perforacion.codigo}</strong> - {perforacion.descripcion}
            </div>
            {perforacion.ubicacion && (
              <div className={styles.infoBoxSubtext}>Ubicación: {perforacion.ubicacion}</div>
            )}
          </div>

          {/* Datos de recepción */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Datos de Recepción</legend>

            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.label}>Código de Muestra Física *</label>
                <input
                  type="text"
                  value={form.codigoMuestra}
                  onChange={e => setForm({ ...form, codigoMuestra: e.target.value })}
                  required
                  placeholder="Ej: MF-2025-0001"
                  className={styles.input}
                />
                <div className={styles.hint}>
                  Código de la etiqueta de la muestra física recibida
                </div>
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label className={styles.label}>Fecha de Recepción *</label>
                  <input
                    type="date"
                    value={form.fechaRecepcion}
                    onChange={e => setForm({ ...form, fechaRecepcion: e.target.value })}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Condición de Muestra</label>
                  <select
                    value={form.condicionMuestra}
                    onChange={e =>
                      setForm({
                        ...form,
                        condicionMuestra: e.target.value as 'buena' | 'regular' | 'deteriorada',
                      })
                    }
                    className={styles.select}
                  >
                    <option value="buena">Buena</option>
                    <option value="regular">Regular</option>
                    <option value="deteriorada">Deteriorada</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Observaciones de Recepción</label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  rows={2}
                  placeholder="Observaciones de recepción..."
                  className={styles.textarea}
                />
              </div>
            </div>
          </fieldset>

          {/* Muestras */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              Muestras de la Perforación ({muestrasForm.length})
            </legend>

            <div className={styles.fieldGroup}>
              {muestrasForm.map((muestra, index) => (
                <div key={index} className={styles.muestraForm}>
                  <div className={styles.muestraFormHeader}>
                    <span className={styles.muestraFormTitle}>
                      Muestra M-{String(index + 1).padStart(3, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMuestra(index)}
                      disabled={muestrasForm.length <= 1}
                      className={styles.btnRemoveSmall}
                    >
                      Quitar
                    </button>
                  </div>

                  <div className={`${styles.gridThree} ${styles.gridThreeMb}`}>
                    <div className={styles.field}>
                      <label className={styles.labelSmall}>Prof. Inicio (m) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={muestra.profundidadInicio}
                        onChange={e =>
                          handleMuestraChange(index, 'profundidadInicio', e.target.value)
                        }
                        placeholder="0.0"
                        className={`${styles.input} ${styles.inputSm}`}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.labelSmall}>Prof. Fin (m) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={muestra.profundidadFin}
                        onChange={e => handleMuestraChange(index, 'profundidadFin', e.target.value)}
                        placeholder="0.5"
                        className={`${styles.input} ${styles.inputSm}`}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.labelSmall}>Tipo de Muestra</label>
                      <select
                        value={muestra.tipoMuestra}
                        onChange={e => handleMuestraChange(index, 'tipoMuestra', e.target.value)}
                        className={`${styles.select} ${styles.inputSm}`}
                      >
                        {TIPOS_MUESTRA.map(tipo => (
                          <option key={tipo.id} value={tipo.id}>
                            {tipo.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.labelSmall}>Descripción</label>
                    <input
                      type="text"
                      value={muestra.descripcion}
                      onChange={e => handleMuestraChange(index, 'descripcion', e.target.value)}
                      placeholder="Ej: Arcilla café con gravas, N=15..."
                      className={`${styles.input} ${styles.inputSm}`}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddMuestra}
                className={`${styles.btnAddDashed} ${styles.btnAddWarning}`}
              >
                + Agregar otra muestra
              </button>
            </div>
          </fieldset>

          <div className={`${styles.infoBox} ${styles.infoBoxInfo}`}>
            <strong>Nota:</strong> Al relacionar la perforación y registrar las muestras, el cliente
            podrá solicitar ensayos para cada muestra específica.
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.btnSubmit} ${styles.btnSubmitSuccess}`}
            >
              {loading ? 'Relacionando...' : 'Relacionar y Guardar'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default RelacionarMuestraModal;
