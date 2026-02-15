import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge, Card, Modal } from '../components/ui';
import { SolicitarEnsayoModal } from '../components/modals';
import { useAuth } from '../hooks/useAuth';
import { useMultipleApiData, useMutation } from '../hooks';
import {
  ProyectosAPI,
  ClientesAPI,
  PerforacionesAPI,
  EnsayosAPI,
  MuestrasAPI,
} from '../services/apiService';
import {
  TIPOS_ENSAYO,
  TIPOS_MUESTRA,
  getTipoMuestra,
  ESTADO_PROYECTO,
  ESTADO_MUESTRA,
  getWorkflowInfo,
} from '../config';
import styles from './Proyectos.module.css';

// Alias para perforaciones (mismo estado que muestras)
const ESTADO_PERFORACION = {
  ...ESTADO_MUESTRA,
  sin_relacionar: { label: 'Sin relacionar', color: '#9CA3AF' },
  relacionado: { label: 'Relacionado', color: '#10B981' },
};

// ============================================
// HELPERS DE PERMISOS
// ============================================

const canCreateProject = rol => ['admin', 'coordinador'].includes(rol);
const canRelatePhysicalSample = rol => ['admin', 'coordinador', 'tecnico'].includes(rol);
const canAddMuestras = rol => ['admin', 'coordinador', 'tecnico'].includes(rol);
const canRequestTest = rol => ['cliente'].includes(rol);
const canEditProject = rol => ['admin', 'coordinador'].includes(rol);
const canDeleteProject = rol => ['admin', 'coordinador'].includes(rol);
// Nota: canCreatePerforations se usará cuando se implemente la función de agregar perforaciones a proyectos existentes
const _canCreatePerforations = rol => ['admin', 'coordinador'].includes(rol);

// ============================================
// MODAL: NUEVO PROYECTO (MEJORADO)
// ============================================

function NuevoProyectoModal({ isOpen, onClose, onCreate, clientes, loading }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    clienteId: '',
    contacto: '',
    fecha_fin_estimada: '',
  });

  // Lista de perforaciones a crear
  const [perforaciones, setPerforaciones] = useState([
    { codigo: '', descripcion: '', ubicacion: '' },
  ]);

  // Ensayos cotizados por tipo
  const [ensayosCotizados, setEnsayosCotizados] = useState({});

  const handleAddPerforacion = () => {
    setPerforaciones([...perforaciones, { codigo: '', descripcion: '', ubicacion: '' }]);
  };

  const handleRemovePerforacion = index => {
    if (perforaciones.length > 1) {
      setPerforaciones(perforaciones.filter((_, i) => i !== index));
    }
  };

  const handlePerforacionChange = (index, field, value) => {
    const updated = [...perforaciones];
    updated[index][field] = value;
    setPerforaciones(updated);
  };

  const handleEnsayoCotizadoChange = (tipoId, cantidad) => {
    const num = parseInt(cantidad) || 0;
    if (num > 0) {
      setEnsayosCotizados({ ...ensayosCotizados, [tipoId]: num });
    } else {
      const updated = { ...ensayosCotizados };
      delete updated[tipoId];
      setEnsayosCotizados(updated);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();

    // Filtrar perforaciones vacías
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
                        {c.contacto_nombre}
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

            <div className={styles.cotizadosGrid}>
              {TIPOS_ENSAYO.map(tipo => (
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

// ============================================
// MODAL: EDITAR PROYECTO
// ============================================

function EditarProyectoModal({ isOpen, onClose, onEdit, proyecto, loading }) {
  const [form, setForm] = useState({
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
        fecha_fin_estimada: proyecto.fecha_fin_estimada || '',
        estado: proyecto.estado || 'activo',
      });
    }
  }, [proyecto]);

  const handleSubmit = e => {
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

// ============================================
// MODAL: EDITAR PERFORACIÓN
// ============================================

function EditarPerforacionModal({ isOpen, onClose, onEdit, perforacion, loading }) {
  const [form, setForm] = useState({
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

  const handleSubmit = e => {
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

// ============================================
// MODAL: CONFIRMAR ELIMINACIÓN
// ============================================

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, itemToDelete, loading }) {
  if (!itemToDelete) return null;

  const { type, item } = itemToDelete;
  const titulo = type === 'proyecto' ? 'Eliminar Proyecto' : 'Eliminar Perforación';
  const mensaje =
    type === 'proyecto'
      ? `¿Está seguro que desea eliminar el proyecto "${item.nombre || item.codigo}"? Esta acción no se puede deshacer y también eliminará todas las perforaciones asociadas.`
      : `¿Está seguro que desea eliminar la perforación "${item.codigo || item.nombre}"? Esta acción no se puede deshacer.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo}>
      <div className={styles.modalForm}>
        <div className={styles.deleteWarning}>
          <div className={styles.deleteWarningContent}>
            <span className={styles.deleteWarningIcon}>⚠️</span>
            <div>
              <div className={styles.deleteWarningTitle}>Advertencia</div>
              <div className={styles.deleteWarningText}>{mensaje}</div>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={onClose} disabled={loading} className={styles.btnCancel}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`${styles.btnSubmit} ${styles.btnDelete}`}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// MODAL: RELACIONAR MUESTRA FÍSICA + AGREGAR MUESTRAS
// ============================================

function RelacionarMuestraModal({ isOpen, onClose, onRelate, perforacion, loading }) {
  const [form, setForm] = useState({
    codigoMuestra: '',
    fechaRecepcion: new Date().toISOString().split('T')[0],
    observaciones: '',
    condicionMuestra: 'buena',
  });

  // Lista de muestras a crear
  const [muestrasForm, setMuestrasForm] = useState([
    { profundidadInicio: '', profundidadFin: '', tipoMuestra: 'alterado', descripcion: '' },
  ]);

  const handleAddMuestra = () => {
    setMuestrasForm([
      ...muestrasForm,
      { profundidadInicio: '', profundidadFin: '', tipoMuestra: 'alterado', descripcion: '' },
    ]);
  };

  const handleRemoveMuestra = index => {
    if (muestrasForm.length > 1) {
      setMuestrasForm(muestrasForm.filter((_, i) => i !== index));
    }
  };

  const handleMuestraChange = (index, field, value) => {
    const updated = [...muestrasForm];
    updated[index][field] = value;
    setMuestrasForm(updated);
  };

  const handleSubmit = e => {
    e.preventDefault();

    // Filtrar muestras válidas (que tengan al menos profundidad inicio)
    const muestrasValidas = muestrasForm.filter(m => m.profundidadInicio !== '');

    onRelate({
      perforacionId: perforacion.id,
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
                    onChange={e => setForm({ ...form, condicionMuestra: e.target.value })}
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

// ============================================
// MODAL: AGREGAR MUESTRA A PERFORACIÓN RELACIONADA
// ============================================

function AgregarMuestraModal({ isOpen, onClose, onAdd, perforacion, muestrasExistentes, loading }) {
  const [form, setForm] = useState({
    profundidadInicio: '',
    profundidadFin: '',
    tipoMuestra: 'alterado',
    descripcion: '',
  });

  const handleSubmit = e => {
    e.preventDefault();

    // Calcular el siguiente código de muestra
    const siguienteNumero = muestrasExistentes.length + 1;
    const codigo = `M-${String(siguienteNumero).padStart(3, '0')}`;

    onAdd({
      perforacionId: perforacion.id,
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

// SolicitarEnsayoModal moved to ../components/modals/SolicitarEnsayoModal.jsx

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ROLES_DISPONIBLES = [
  { id: 'admin', nombre: 'Administrador' },
  { id: 'coordinador', nombre: 'Coordinador' },
  { id: 'tecnico', nombre: 'Técnico' },
  { id: 'cliente', nombre: 'Cliente' },
];

export default function Proyectos() {
  const { user } = useAuth();

  // Permitir cambiar rol para pruebas en modo demo
  const [devRole, setDevRole] = useState('tecnico');
  const userRole = devRole; // Siempre usar devRole en modo demo

  // Usar hook centralizado para fetching de datos
  const {
    data: { proyectosRaw, clientesRaw, perforacionesRaw, muestrasRaw, ensayosRaw },
    loading,
    reload: reloadAllData,
  } = useMultipleApiData(
    {
      proyectosRaw: { api: ProyectosAPI.list },
      clientesRaw: { api: ClientesAPI.list },
      perforacionesRaw: { api: PerforacionesAPI.list },
      muestrasRaw: { api: MuestrasAPI.list },
      ensayosRaw: { api: EnsayosAPI.list },
    },
    { fetchOnMount: true }
  );

  // Transformar datos con useMemo
  const clientes = clientesRaw || [];

  const proyectos = useMemo(() => {
    return (proyectosRaw || []).map(p => ({
      ...p,
      clienteId: p.cliente_id || p.clienteId,
      ensayosCotizados: p.ensayos_cotizados || p.ensayosCotizados || {},
    }));
  }, [proyectosRaw]);

  const perforaciones = useMemo(() => {
    return (perforacionesRaw || []).map(p => ({
      ...p,
      proyectoId: p.proyecto_id || p.proyectoId,
      codigo: p.codigo || p.nombre,
    }));
  }, [perforacionesRaw]);

  const muestras = useMemo(() => {
    return (muestrasRaw || []).map(m => ({
      ...m,
      perforacionId: m.perforacion_id || m.perforacionId,
      profundidadInicio: m.profundidad_inicio ?? m.profundidadInicio,
      profundidadFin: m.profundidad_fin ?? m.profundidadFin,
      tipoMuestra: m.tipo_muestra || m.tipoMuestra,
    }));
  }, [muestrasRaw]);

  const ensayos = useMemo(() => {
    return (ensayosRaw || []).map(e => ({
      ...e,
      perforacionId: e.perforacion_id || e.perforacionId,
      muestraId: e.muestra_id || e.muestraId,
      proyectoId: e.proyecto_id || e.proyectoId,
    }));
  }, [ensayosRaw]);

  // Selección actual
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [selectedPerforacion, setSelectedPerforacion] = useState(null);
  const [selectedMuestra, setSelectedMuestra] = useState(null);

  // Modales
  const [showNuevoProyecto, setShowNuevoProyecto] = useState(false);
  const [showRelacionarMuestra, setShowRelacionarMuestra] = useState(false);
  const [showAgregarMuestra, setShowAgregarMuestra] = useState(false);
  const [showSolicitarEnsayo, setShowSolicitarEnsayo] = useState(false);

  // Perforación seleccionada para agregar muestra (desde columna 2)
  const [perforacionParaMuestra, setPerforacionParaMuestra] = useState(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('todos');

  // Estados para operaciones CRUD
  const [error, setError] = useState(null);
  const [showEditarProyecto, setShowEditarProyecto] = useState(false);
  const [showEditarPerforacion, setShowEditarPerforacion] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingProyecto, setEditingProyecto] = useState(null);
  const [editingPerforacion, setEditingPerforacion] = useState(null);

  // Mutation genérica para todas las operaciones
  const crudMutation = useMutation(
    async ({ api, method, id, data }) => {
      if (method === 'create') return api.create(data);
      if (method === 'update') return api.update(id, data);
      if (method === 'delete') return api.delete(id);
    },
    {
      onSuccess: () => reloadAllData(),
      onError: err => setError(err.message || 'Error en la operación'),
    }
  );

  const saving = crudMutation.loading;

  // Handlers
  const handleCrearProyecto = async data => {
    setError(null);
    try {
      // Obtener nombre del cliente
      const clienteSeleccionado = clientes.find(c => c.id === data.clienteId);
      const clienteNombre = clienteSeleccionado?.nombre || 'Cliente Desconocido';

      // Crear proyecto en backend
      const proyectoPayload = {
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin_estimada: data.fecha_fin_estimada || null,
        cliente_id: data.clienteId,
        cliente_nombre: clienteNombre,
        contacto: data.contacto || null,
        ensayos_cotizados: data.ensayosCotizados || {},
      };

      const nuevoProyecto = await crudMutation.mutateAsync({
        api: ProyectosAPI,
        method: 'create',
        data: proyectoPayload,
      });

      // Crear perforaciones en backend
      for (const perf of data.perforaciones) {
        if (!perf.codigo?.trim()) continue;

        const perfPayload = {
          proyecto_id: nuevoProyecto.id,
          nombre: perf.codigo,
          descripcion: perf.descripcion || null,
          ubicacion: perf.ubicacion || null,
          profundidad: null,
          fecha_inicio: null,
        };

        await PerforacionesAPI.create(perfPayload);
      }

      // Recargar datos
      await reloadAllData();

      setShowNuevoProyecto(false);
      setSelectedProyecto({
        ...nuevoProyecto,
        clienteId: nuevoProyecto.cliente_id || nuevoProyecto.clienteId,
      });
    } catch (err) {
      // Error ya manejado por onError del mutation
    }
  };

  const handleRelacionarMuestra = async data => {
    setError(null);
    try {
      // Actualizar perforación en el backend
      await crudMutation.mutateAsync({
        api: PerforacionesAPI,
        method: 'update',
        id: data.perforacionId,
        data: { estado: 'relacionado' },
      });

      // Crear las muestras asociadas
      for (const muestra of data.muestras || []) {
        const muestraPayload = {
          perforacion_id: data.perforacionId,
          profundidad_inicio: parseFloat(muestra.profundidadInicio),
          profundidad_fin: parseFloat(muestra.profundidadFin),
          tipo_muestra: muestra.tipoMuestra,
          descripcion: muestra.descripcion || null,
        };
        await MuestrasAPI.create(muestraPayload);
      }

      await reloadAllData();
      setShowRelacionarMuestra(false);
      const updatedPerf = perforaciones.find(p => p.id === data.perforacionId);
      setSelectedPerforacion(updatedPerf);
    } catch (err) {
      // Error ya manejado
    }
  };

  const handleSolicitarEnsayo = async data => {
    setError(null);
    try {
      const ensayoPayload = {
        tipo: data.tipo,
        perforacion_id: data.perforacionId,
        proyecto_id: data.proyectoId,
        muestra: data.muestra || data.muestraDescripcion || '',
        norma: data.norma || '',
        fecha_solicitud: new Date().toISOString().split('T')[0],
        muestra_id: data.muestraId || null,
        urgente: data.urgente || false,
        observaciones: data.observaciones || null,
      };

      await crudMutation.mutateAsync({ api: EnsayosAPI, method: 'create', data: ensayoPayload });
      setShowSolicitarEnsayo(false);
      setSelectedMuestra(null);
    } catch (err) {
      // Error ya manejado
    }
  };

  const handleAgregarMuestra = async data => {
    setError(null);
    try {
      const muestraPayload = {
        perforacion_id: data.perforacionId,
        profundidad_inicio: parseFloat(data.profundidadInicio),
        profundidad_fin: parseFloat(data.profundidadFin),
        tipo_muestra: data.tipoMuestra,
        descripcion: data.descripcion || null,
      };

      await crudMutation.mutateAsync({ api: MuestrasAPI, method: 'create', data: muestraPayload });
      setShowAgregarMuestra(false);
    } catch (err) {
      // Error ya manejado
    }
  };

  // Handler para editar proyecto
  const handleEditarProyecto = async data => {
    setError(null);
    try {
      const updatePayload = {
        nombre: data.nombre || null,
        descripcion: data.descripcion || null,
        fecha_fin_estimada: data.fecha_fin_estimada || null,
        contacto: data.contacto || null,
        estado: data.estado || null,
        ensayos_cotizados: data.ensayosCotizados || null,
      };

      await crudMutation.mutateAsync({
        api: ProyectosAPI,
        method: 'update',
        id: editingProyecto.id,
        data: updatePayload,
      });

      setShowEditarProyecto(false);
      setEditingProyecto(null);

      if (selectedProyecto?.id === editingProyecto.id) {
        const updated = proyectos.find(p => p.id === editingProyecto.id);
        if (updated) setSelectedProyecto({ ...updated, ...data });
      }
    } catch (err) {
      // Error ya manejado
    }
  };

  // Handler para editar perforación
  const handleEditarPerforacion = async data => {
    setError(null);
    try {
      const updatePayload = {
        nombre: data.nombre || null,
        descripcion: data.descripcion || null,
        ubicacion: data.ubicacion || null,
        profundidad: data.profundidad || null,
        estado: data.estado || null,
      };

      await crudMutation.mutateAsync({
        api: PerforacionesAPI,
        method: 'update',
        id: editingPerforacion.id,
        data: updatePayload,
      });

      setShowEditarPerforacion(false);
      setEditingPerforacion(null);

      if (selectedPerforacion?.id === editingPerforacion.id) {
        const updated = perforaciones.find(p => p.id === editingPerforacion.id);
        if (updated) setSelectedPerforacion({ ...updated, ...data });
      }
    } catch (err) {
      // Error ya manejado
    }
  };

  // Handler para iniciar eliminación
  const handleDeleteClick = (type, item) => {
    setItemToDelete({ type, item });
    setShowConfirmDelete(true);
  };

  // Handler para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const { type, item } = itemToDelete;
    setError(null);

    try {
      if (type === 'proyecto') {
        await crudMutation.mutateAsync({ api: ProyectosAPI, method: 'delete', id: item.id });
        if (selectedProyecto?.id === item.id) {
          setSelectedProyecto(null);
          setSelectedPerforacion(null);
        }
      } else if (type === 'perforacion') {
        await crudMutation.mutateAsync({ api: PerforacionesAPI, method: 'delete', id: item.id });
        if (selectedPerforacion?.id === item.id) {
          setSelectedPerforacion(null);
        }
      }

      setShowConfirmDelete(false);
      setItemToDelete(null);
    } catch (err) {
      // Error ya manejado
    }
  };

  // Datos filtrados y relacionados
  const proyectosFiltrados = proyectos.filter(p => {
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false;
    if (filtroCliente !== 'todos' && p.clienteId !== filtroCliente) return false;
    return true;
  });

  const perforacionesProyecto = selectedProyecto
    ? perforaciones.filter(p => p.proyectoId === selectedProyecto.id)
    : [];

  const ensayosPerforacion = selectedPerforacion
    ? ensayos.filter(e => e.perforacionId === selectedPerforacion.id)
    : [];

  const muestrasPerforacion = selectedPerforacion
    ? muestras.filter(m => m.perforacionId === selectedPerforacion.id)
    : [];

  // Obtener ensayos por muestra para la vista jerárquica
  const getEnsayosMuestra = muestraId => ensayos.filter(e => e.muestraId === muestraId);

  const getClienteNombre = clienteId => {
    return clientes.find(c => c.id === clienteId)?.nombre || 'Desconocido';
  };

  const getEstadoProyecto = estado =>
    ESTADO_PROYECTO[estado] || { label: estado, color: '#6B7280' };
  const getEstadoPerforacion = estado =>
    ESTADO_PERFORACION[estado] || { label: estado, color: '#6B7280' };

  // Contar perforaciones sin relacionar
  const perfsSinRelacionar = perforacionesProyecto.filter(
    p => p.estado === 'sin_relacionar'
  ).length;

  if (loading) {
    return (
      <PageLayout title="Proyectos">
        <div className={styles.loading}>Cargando proyectos...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Proyectos">
      {/* Selector de rol para desarrollo */}
      {import.meta.env.DEV && (
        <div className={styles.devRoleSwitcher}>
          <div className={styles.devRoleSwitcherLeft}>
            <span className={styles.devRoleLabel}>Rol actual:</span>
            <select
              value={devRole}
              onChange={e => setDevRole(e.target.value)}
              className={styles.devRoleSelect}
            >
              {ROLES_DISPONIBLES.map(rol => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.devRolePermisos}>
            {canCreateProject(userRole) && <span>✓ Crear proyectos</span>}
            {canRelatePhysicalSample(userRole) && <span>✓ Relacionar muestras</span>}
            {canAddMuestras(userRole) && <span>✓ Agregar muestras</span>}
            {canRequestTest(userRole) && <span>✓ Solicitar ensayos</span>}
          </div>
        </div>
      )}

      {/* Banner de error */}
      {error && (
        <div className={styles.errorBanner}>
          <div className={styles.errorBannerContent}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className={styles.errorBannerClose}>
            Cerrar
          </button>
        </div>
      )}

      <div className={styles.columnsLayout}>
        {/* COLUMNA 1: PROYECTOS */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>Proyectos</h3>
            {canCreateProject(userRole) && (
              <button onClick={() => setShowNuevoProyecto(true)} className={styles.btnPrimary}>
                + Nuevo
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className={styles.filters}>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="completado">Completados</option>
            </select>
            <select
              value={filtroCliente}
              onChange={e => setFiltroCliente(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos clientes</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de proyectos */}
          <div className={styles.cardList}>
            {proyectosFiltrados.length === 0 ? (
              <div className={styles.emptyState}>No hay proyectos</div>
            ) : (
              proyectosFiltrados.map(proyecto => {
                const estado = getEstadoProyecto(proyecto.estado);
                const numPerfs = perforaciones.filter(p => p.proyectoId === proyecto.id).length;
                const numEnsayos = ensayos.filter(e => e.proyectoId === proyecto.id).length;
                const totalCotizados = Object.values(proyecto.ensayosCotizados || {}).reduce(
                  (a, b) => a + b,
                  0
                );

                return (
                  <Card
                    key={proyecto.id}
                    onClick={() => {
                      setSelectedProyecto(proyecto);
                      setSelectedPerforacion(null);
                    }}
                    selected={selectedProyecto?.id === proyecto.id}
                  >
                    <div className={styles.projectCard}>
                      <div>
                        <div className={styles.projectCode}>{proyecto.codigo}</div>
                        <div className={styles.projectName}>{proyecto.nombre}</div>
                        <div className={styles.projectClient}>
                          {getClienteNombre(proyecto.clienteId)}
                        </div>
                      </div>
                      <div className={styles.projectBadgeActions}>
                        <Badge color={estado.color}>{estado.label}</Badge>
                        {canEditProject(userRole) && (
                          <div className={styles.projectActions}>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setEditingProyecto(proyecto);
                                setShowEditarProyecto(true);
                              }}
                              className={`${styles.btnSmall} ${styles.btnEdit}`}
                            >
                              Editar
                            </button>
                            {canDeleteProject(userRole) && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteClick('proyecto', proyecto);
                                }}
                                className={`${styles.btnSmall} ${styles.btnDanger}`}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.projectStats}>
                      <span>{numPerfs} perforaciones</span>
                      <span>
                        {numEnsayos}/{totalCotizados} ensayos
                      </span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA 2: PERFORACIONES */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>
              Perforaciones
              {selectedProyecto && perfsSinRelacionar > 0 && (
                <span className={styles.warningCount}>({perfsSinRelacionar} sin relacionar)</span>
              )}
            </h3>
          </div>

          {!selectedProyecto ? (
            <div className={styles.emptyState}>Selecciona un proyecto</div>
          ) : (
            <>
              {/* Resumen de ensayos cotizados */}
              {selectedProyecto.ensayosCotizados &&
                Object.keys(selectedProyecto.ensayosCotizados).length > 0 && (
                  <div className={styles.ensayosCotizadosBox}>
                    <strong>Ensayos cotizados:</strong>{' '}
                    {Object.entries(selectedProyecto.ensayosCotizados)
                      .map(([tipo, cant]) => {
                        const tipoInfo = TIPOS_ENSAYO.find(t => t.id === tipo);
                        return `${tipoInfo?.nombre || tipo}: ${cant}`;
                      })
                      .join(', ')}
                  </div>
                )}

              <div className={styles.cardList}>
                {perforacionesProyecto.length === 0 ? (
                  <div className={styles.emptyState}>No hay perforaciones definidas</div>
                ) : (
                  perforacionesProyecto.map(perf => {
                    const estado = getEstadoPerforacion(perf.estado);
                    const numEnsayos = ensayos.filter(e => e.perforacionId === perf.id).length;
                    const numMuestras = muestras.filter(m => m.perforacionId === perf.id).length;
                    const puedeRelacionar =
                      perf.estado === 'sin_relacionar' && canRelatePhysicalSample(userRole);
                    const puedeAgregarMuestra =
                      perf.estado === 'relacionado' && canAddMuestras(userRole);

                    return (
                      <Card
                        key={perf.id}
                        onClick={() => setSelectedPerforacion(perf)}
                        selected={selectedPerforacion?.id === perf.id}
                      >
                        <div className={styles.perforacionCard}>
                          <div className={styles.perforacionInfo}>
                            <div className={styles.perforacionCode}>{perf.codigo}</div>
                            <div className={styles.perforacionDesc}>{perf.descripcion}</div>
                            {perf.ubicacion && (
                              <div className={styles.perforacionLocation}>{perf.ubicacion}</div>
                            )}
                            {perf.muestraFisica && (
                              <div className={styles.perforacionMuestraFisica}>
                                Muestra: {perf.muestraFisica}
                              </div>
                            )}
                          </div>
                          <div className={styles.perforacionBadgeActions}>
                            <Badge color={estado.color}>{estado.label}</Badge>
                            {puedeRelacionar && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedPerforacion(perf);
                                  setShowRelacionarMuestra(true);
                                }}
                                className={styles.btnRelacionar}
                              >
                                Relacionar
                              </button>
                            )}
                            {puedeAgregarMuestra && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setPerforacionParaMuestra(perf);
                                  setShowAgregarMuestra(true);
                                }}
                                className={styles.btnAddMuestra}
                              >
                                + Muestra
                              </button>
                            )}
                            {canEditProject(userRole) && (
                              <div className={styles.perforacionActions}>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditingPerforacion(perf);
                                    setShowEditarPerforacion(true);
                                  }}
                                  className={`${styles.btnSmall} ${styles.btnEdit}`}
                                >
                                  Editar
                                </button>
                                {canDeleteProject(userRole) && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteClick('perforacion', perf);
                                    }}
                                    className={`${styles.btnSmall} ${styles.btnDanger}`}
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.perforacionStats}>
                          {numMuestras} muestra{numMuestras !== 1 ? 's' : ''} • {numEnsayos} ensayo
                          {numEnsayos !== 1 ? 's' : ''}
                          {perf.fecha_recepcion && ` • Recibido: ${perf.fecha_recepcion}`}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* COLUMNA 3: MUESTRAS Y ENSAYOS */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>
              Muestras y Ensayos
              {selectedPerforacion && muestrasPerforacion.length > 0 && (
                <span className={styles.columnCount}>({muestrasPerforacion.length})</span>
              )}
            </h3>
          </div>

          {!selectedPerforacion ? (
            <div className={styles.emptyState}>Selecciona una perforación</div>
          ) : selectedPerforacion.estado === 'sin_relacionar' ? (
            <div className={styles.emptyStateWarning}>
              <div>
                <div className={styles.emptyIcon}>⏳</div>
                <div>Esta perforación aún no tiene muestra física relacionada.</div>
                {canRelatePhysicalSample(userRole) && (
                  <button
                    onClick={() => setShowRelacionarMuestra(true)}
                    className={styles.btnWarningLarge}
                  >
                    Relacionar muestra
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.cardList}>
              {muestrasPerforacion.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <div>No hay muestras registradas</div>
                  <div className={styles.emptySubtext}>
                    El personal del laboratorio debe agregar muestras desde la columna de
                    perforaciones
                  </div>
                </div>
              ) : (
                muestrasPerforacion
                  .sort((a, b) => a.profundidadInicio - b.profundidadInicio)
                  .map(muestra => {
                    const tipoMuestra = getTipoMuestra(muestra.tipoMuestra);
                    const ensayosMuestra = getEnsayosMuestra(muestra.id);
                    const isSelected = selectedMuestra?.id === muestra.id;

                    return (
                      <div key={muestra.id}>
                        {/* Card de la muestra */}
                        <Card
                          onClick={() => setSelectedMuestra(isSelected ? null : muestra)}
                          selected={isSelected}
                        >
                          <div className={styles.muestraCard}>
                            <div className={styles.muestraInfo}>
                              <div className={styles.muestraHeader}>
                                <span className={styles.muestraIcon}>📍</span>
                                <div>
                                  <div className={styles.muestraCodigo}>{muestra.codigo}</div>
                                  <div className={styles.muestraProf}>
                                    {muestra.profundidadInicio}m - {muestra.profundidadFin}m
                                  </div>
                                </div>
                              </div>
                              {muestra.descripcion && (
                                <div className={styles.muestraDesc}>{muestra.descripcion}</div>
                              )}
                            </div>
                            <div className={styles.muestraBadgeActions}>
                              <Badge color={tipoMuestra?.color || '#6B7280'}>
                                {tipoMuestra?.nombre || muestra.tipoMuestra}
                              </Badge>
                              <span className={styles.muestraEnsayosCount}>
                                {ensayosMuestra.length} ensayo
                                {ensayosMuestra.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Botón solicitar ensayo (solo para clientes) */}
                          {canRequestTest(userRole) && (
                            <div className={styles.muestraActions}>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedMuestra(muestra);
                                  setShowSolicitarEnsayo(true);
                                }}
                                className={styles.btnSolicitarEnsayo}
                              >
                                + Solicitar Ensayo
                              </button>
                            </div>
                          )}
                        </Card>

                        {/* Ensayos de la muestra (expandible) */}
                        {isSelected && ensayosMuestra.length > 0 && (
                          <div className={styles.ensayosExpandible}>
                            {ensayosMuestra.map(ensayo => {
                              const workflow = getWorkflowInfo(ensayo.workflow_state);
                              const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);

                              return (
                                <div key={ensayo.id} className={styles.ensayoItemExpanded}>
                                  <div className={styles.ensayoItemHeader}>
                                    <div>
                                      <span className={styles.ensayoItemCodigo}>
                                        {ensayo.codigo}
                                      </span>
                                      <span className={styles.ensayoItemTipo}>
                                        {tipoEnsayo?.nombre || ensayo.tipo}
                                      </span>
                                    </div>
                                    <Badge color={workflow.color} small>
                                      {workflow.nombre}
                                    </Badge>
                                  </div>
                                  <div className={styles.ensayoItemLinks}>
                                    {ensayo.spreadsheet_url && (
                                      <a
                                        href={ensayo.spreadsheet_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.btnSheetLink}
                                        onClick={e => e.stopPropagation()}
                                      >
                                        Sheet
                                      </a>
                                    )}
                                    <a
                                      href={`/ensayos?id=${ensayo.id}`}
                                      className={styles.btnVerLink}
                                    >
                                      Ver
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}

              {/* Mostrar ensayos sin muestra asignada (legacy) */}
              {ensayosPerforacion.filter(e => !e.muestraId).length > 0 && (
                <div className={styles.ensayosSinMuestra}>
                  <div className={styles.ensayosSinMuestraTitle}>Ensayos sin muestra asignada</div>
                  {ensayosPerforacion
                    .filter(e => !e.muestraId)
                    .map(ensayo => {
                      const workflow = getWorkflowInfo(ensayo.workflow_state);
                      const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);

                      return (
                        <Card key={ensayo.id}>
                          <div className={styles.ensayoLegacyCard}>
                            <div>
                              <div className={styles.ensayoLegacyCodigo}>{ensayo.codigo}</div>
                              <div className={styles.ensayoLegacyTipo}>
                                {tipoEnsayo?.nombre || ensayo.tipo}
                              </div>
                            </div>
                            <Badge color={workflow.color}>{workflow.nombre}</Badge>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resumen inferior */}
      <div className={styles.resumenBar}>
        <div>
          <strong>Total Proyectos:</strong> {proyectos.length}
        </div>
        <div>
          <strong>Activos:</strong> {proyectos.filter(p => p.estado === 'activo').length}
        </div>
        <div>
          <strong>Perforaciones:</strong> {perforaciones.length} (
          {perforaciones.filter(p => p.estado === 'sin_relacionar').length} sin relacionar)
        </div>
        <div>
          <strong>Total Ensayos:</strong> {ensayos.length}
        </div>
        <div>
          <strong>Pendientes:</strong> {ensayos.filter(e => e.workflow_state === 'E1').length}
        </div>
        <div>
          <strong>En proceso:</strong>{' '}
          {ensayos.filter(e => ['E2', 'E6', 'E7', 'E8'].includes(e.workflow_state)).length}
        </div>
      </div>

      {/* Modales */}
      <NuevoProyectoModal
        isOpen={showNuevoProyecto}
        onClose={() => setShowNuevoProyecto(false)}
        onCreate={handleCrearProyecto}
        clientes={clientes}
        loading={saving}
      />

      <RelacionarMuestraModal
        isOpen={showRelacionarMuestra}
        onClose={() => setShowRelacionarMuestra(false)}
        onRelate={handleRelacionarMuestra}
        perforacion={selectedPerforacion}
        loading={saving}
      />

      {perforacionParaMuestra && (
        <AgregarMuestraModal
          isOpen={showAgregarMuestra}
          onClose={() => {
            setShowAgregarMuestra(false);
            setPerforacionParaMuestra(null);
          }}
          onAdd={handleAgregarMuestra}
          perforacion={perforacionParaMuestra}
          muestrasExistentes={muestras.filter(m => m.perforacionId === perforacionParaMuestra.id)}
          loading={saving}
        />
      )}

      {selectedPerforacion && selectedProyecto && (
        <SolicitarEnsayoModal
          isOpen={showSolicitarEnsayo}
          onClose={() => {
            setShowSolicitarEnsayo(false);
            setSelectedMuestra(null);
          }}
          onCreate={handleSolicitarEnsayo}
          perforacion={selectedPerforacion}
          muestra={selectedMuestra}
          proyecto={selectedProyecto}
          loading={saving}
        />
      )}

      {/* Modales de edición y eliminación */}
      <EditarProyectoModal
        isOpen={showEditarProyecto}
        onClose={() => {
          setShowEditarProyecto(false);
          setEditingProyecto(null);
        }}
        onEdit={handleEditarProyecto}
        proyecto={editingProyecto}
        loading={saving}
      />

      <EditarPerforacionModal
        isOpen={showEditarPerforacion}
        onClose={() => {
          setShowEditarPerforacion(false);
          setEditingPerforacion(null);
        }}
        onEdit={handleEditarPerforacion}
        perforacion={editingPerforacion}
        loading={saving}
      />

      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        itemToDelete={itemToDelete}
        loading={saving}
      />
    </PageLayout>
  );
}
