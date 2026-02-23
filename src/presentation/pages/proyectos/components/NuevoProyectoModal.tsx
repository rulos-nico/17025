/**
 * NuevoProyectoModal - Modal para crear un nuevo proyecto
 */

import { useState, type FormEvent } from 'react';
import { Modal } from '../../../../components/ui';
import { useTiposEnsayoData } from '../../../../hooks/useTiposEnsayoData';
import type { ClienteUI, NuevoProyectoFormData } from '../types';
import styles from '../../../../pages/Proyectos.module.css';

interface PerforacionForm {
  codigo: string;
  descripcion: string;
  ubicacion: string;
}

interface NuevoProyectoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: NuevoProyectoFormData) => void;
  clientes: ClienteUI[];
  loading: boolean;
}

export function NuevoProyectoModal({
  isOpen,
  onClose,
  onCreate,
  clientes,
  loading,
}: NuevoProyectoModalProps) {
  // Cargar tipos de ensayo desde la API
  const { tiposEnsayo, loading: loadingTipos } = useTiposEnsayoData();

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    clienteId: '',
    contacto: '',
    fecha_fin_estimada: '',
  });

  const [perforaciones, setPerforaciones] = useState<PerforacionForm[]>([
    { codigo: '', descripcion: '', ubicacion: '' },
  ]);

  const [ensayosCotizados, setEnsayosCotizados] = useState<Record<string, number>>({});

  const handleAddPerforacion = () => {
    setPerforaciones([...perforaciones, { codigo: '', descripcion: '', ubicacion: '' }]);
  };

  const handleRemovePerforacion = (index: number) => {
    if (perforaciones.length > 1) {
      setPerforaciones(perforaciones.filter((_, i) => i !== index));
    }
  };

  const handlePerforacionChange = (index: number, field: keyof PerforacionForm, value: string) => {
    const updated = [...perforaciones];
    updated[index][field] = value;
    setPerforaciones(updated);
  };

  const handleEnsayoCotizadoChange = (tipoId: string, cantidad: string) => {
    const num = parseInt(cantidad) || 0;
    if (num > 0) {
      setEnsayosCotizados({ ...ensayosCotizados, [tipoId]: num });
    } else {
      const updated = { ...ensayosCotizados };
      delete updated[tipoId];
      setEnsayosCotizados(updated);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const perfsValidas = perforaciones.filter(p => p.codigo.trim() !== '');

    onCreate({
      ...form,
      perforaciones: perfsValidas,
      ensayosCotizados,
    });

    // Reset form
    setForm({ nombre: '', descripcion: '', clienteId: '', contacto: '', fecha_fin_estimada: '' });
    setPerforaciones([{ codigo: '', descripcion: '', ubicacion: '' }]);
    setEnsayosCotizados({});
  };

  const totalEnsayosCotizados = Object.values(ensayosCotizados).reduce((a, b) => a + b, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Proyecto">
      <form onSubmit={handleSubmit}>
        <div className={styles.modalForm}>
          {/* Datos básicos del proyecto */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Datos del Proyecto</legend>

            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre del Proyecto *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                  placeholder="Ej: Construcción Edificio Central"
                  className={styles.input}
                />
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label className={styles.label}>Cliente *</label>
                  <select
                    value={form.clienteId}
                    onChange={e => setForm({ ...form, clienteId: e.target.value })}
                    required
                    className={styles.select}
                  >
                    <option value="">Seleccionar...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.contacto_nombre || c.nombre}
                      </option>
                    ))}
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
                <label className={styles.label}>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  rows={2}
                  placeholder="Descripción del proyecto..."
                  className={styles.textarea}
                />
              </div>
            </div>
          </fieldset>

          {/* Perforaciones */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Perforaciones ({perforaciones.length})</legend>

            <div className={styles.fieldGroup}>
              {perforaciones.map((perf, index) => (
                <div key={index} className={styles.perforacionRow}>
                  <div className={styles.perforacionRowCode}>
                    <input
                      type="text"
                      value={perf.codigo}
                      onChange={e => handlePerforacionChange(index, 'codigo', e.target.value)}
                      placeholder="Código *"
                      className={`${styles.input} ${styles.inputSm}`}
                    />
                  </div>
                  <div className={styles.perforacionRowDesc}>
                    <input
                      type="text"
                      value={perf.descripcion}
                      onChange={e => handlePerforacionChange(index, 'descripcion', e.target.value)}
                      placeholder="Descripción"
                      className={`${styles.input} ${styles.inputSm}`}
                    />
                  </div>
                  <div className={styles.perforacionRowLoc}>
                    <input
                      type="text"
                      value={perf.ubicacion}
                      onChange={e => handlePerforacionChange(index, 'ubicacion', e.target.value)}
                      placeholder="Ubicación"
                      className={`${styles.input} ${styles.inputSm}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePerforacion(index)}
                    disabled={perforaciones.length <= 1}
                    className={styles.btnRemove}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button type="button" onClick={handleAddPerforacion} className={styles.btnAddDashed}>
                + Agregar perforación
              </button>
            </div>
          </fieldset>

          {/* Ensayos Cotizados */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              Ensayos Cotizados (Total: {totalEnsayosCotizados})
            </legend>

            {loadingTipos ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Cargando tipos de ensayo...</p>
            ) : tiposEnsayo.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                No hay tipos de ensayo disponibles
              </p>
            ) : (
              <div className={styles.cotizadosGrid}>
                {tiposEnsayo.map(tipo => (
                  <div key={tipo.id} className={styles.cotizadoItem}>
                    <input
                      type="number"
                      min="0"
                      value={ensayosCotizados[tipo.id] || ''}
                      onChange={e => handleEnsayoCotizadoChange(tipo.id, e.target.value)}
                      placeholder="0"
                      className={styles.cotizadoInput}
                    />
                    <span className={styles.cotizadoLabel}>{tipo.nombre}</span>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {/* Botones */}
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={styles.btnSubmit}>
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default NuevoProyectoModal;
