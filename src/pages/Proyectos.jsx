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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '70vh',
            overflowY: 'auto',
            paddingRight: '8px',
          }}
        >
          {/* Datos básicos del proyecto */}
          <fieldset style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
            <legend style={{ fontWeight: '600', padding: '0 8px' }}>Datos del Proyecto</legend>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                  placeholder="Ej: Construcción Edificio Central"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #D1D5DB',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Cliente *
                  </label>
                  <select
                    value={form.clienteId}
                    onChange={e => setForm({ ...form, clienteId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #D1D5DB',
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.contacto_nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Fecha Fin Estimada
                  </label>
                  <input
                    type="date"
                    value={form.fecha_fin_estimada}
                    onChange={e => setForm({ ...form, fecha_fin_estimada: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #D1D5DB',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  rows={2}
                  placeholder="Descripción del proyecto..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #D1D5DB',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </fieldset>

          {/* Perforaciones */}
          <fieldset style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
            <legend style={{ fontWeight: '600', padding: '0 8px' }}>
              Perforaciones ({perforaciones.length})
            </legend>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {perforaciones.map((perf, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                    padding: '8px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ flex: '0 0 100px' }}>
                    <input
                      type="text"
                      value={perf.codigo}
                      onChange={e => handlePerforacionChange(index, 'codigo', e.target.value)}
                      placeholder="Código *"
                      style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={perf.descripcion}
                      onChange={e => handlePerforacionChange(index, 'descripcion', e.target.value)}
                      placeholder="Descripción"
                      style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                  <div style={{ flex: '0 0 120px' }}>
                    <input
                      type="text"
                      value={perf.ubicacion}
                      onChange={e => handlePerforacionChange(index, 'ubicacion', e.target.value)}
                      placeholder="Ubicación"
                      style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePerforacion(index)}
                    disabled={perforaciones.length <= 1}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: perforaciones.length <= 1 ? '#E5E7EB' : '#EF4444',
                      color: 'white',
                      cursor: perforaciones.length <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddPerforacion}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px dashed #9CA3AF',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#6B7280',
                  fontSize: '0.875rem',
                }}
              >
                + Agregar perforación
              </button>
            </div>
          </fieldset>

          {/* Ensayos Cotizados */}
          <fieldset style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
            <legend style={{ fontWeight: '600', padding: '0 8px' }}>
              Ensayos Cotizados (Total: {totalEnsayosCotizados})
            </legend>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {TIPOS_ENSAYO.map(tipo => (
                <div key={tipo.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    value={ensayosCotizados[tipo.id] || ''}
                    onChange={e => handleEnsayoCotizadoChange(tipo.id, e.target.value)}
                    placeholder="0"
                    style={{
                      width: '60px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>{tipo.nombre}</span>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Botones */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '8px',
              borderTop: '1px solid #E5E7EB',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#3B82F6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              rows={2}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Estado
              </label>
              <select
                value={form.estado}
                onChange={e => setForm({ ...form, estado: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #D1D5DB',
                }}
              >
                <option value="activo">Activo</option>
                <option value="pausado">Pausado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Fecha Fin Estimada
              </label>
              <input
                type="date"
                value={form.fecha_fin_estimada}
                onChange={e => setForm({ ...form, fecha_fin_estimada: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #D1D5DB',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Contacto
            </label>
            <input
              type="text"
              value={form.contacto}
              onChange={e => setForm({ ...form, contacto: e.target.value })}
              placeholder="Nombre o email del contacto"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
              }}
            />
          </div>

          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#3B82F6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Nombre/Código *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              rows={2}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Ubicación
            </label>
            <input
              type="text"
              value={form.ubicacion}
              onChange={e => setForm({ ...form, ubicacion: e.target.value })}
              placeholder="Ej: Sector Norte, Km 5+200"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
              }}
            />
          </div>

          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#3B82F6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#FEE2E2',
            borderRadius: '8px',
            border: '1px solid #EF4444',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: '600', color: '#991B1B', marginBottom: '4px' }}>
                Advertencia
              </div>
              <div style={{ color: '#7F1D1D', fontSize: '0.875rem' }}>{mensaje}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              backgroundColor: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#EF4444',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '70vh',
            overflowY: 'auto',
            paddingRight: '8px',
          }}
        >
          {/* Info de la perforación */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FEF3C7',
              borderRadius: '8px',
              border: '1px solid #F59E0B',
            }}
          >
            <div style={{ fontWeight: '600', color: '#92400E' }}>Perforación a relacionar:</div>
            <div style={{ marginTop: '4px' }}>
              <strong>{perforacion.codigo}</strong> - {perforacion.descripcion}
            </div>
            {perforacion.ubicacion && (
              <div style={{ fontSize: '0.875rem', color: '#78716C' }}>
                Ubicación: {perforacion.ubicacion}
              </div>
            )}
          </div>

          {/* Datos de recepción */}
          <fieldset style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
            <legend style={{ fontWeight: '600', padding: '0 8px' }}>Datos de Recepción</legend>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Código de Muestra Física *
                </label>
                <input
                  type="text"
                  value={form.codigoMuestra}
                  onChange={e => setForm({ ...form, codigoMuestra: e.target.value })}
                  required
                  placeholder="Ej: MF-2025-0001"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #D1D5DB',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                  Código de la etiqueta de la muestra física recibida
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Fecha de Recepción *
                  </label>
                  <input
                    type="date"
                    value={form.fechaRecepcion}
                    onChange={e => setForm({ ...form, fechaRecepcion: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #D1D5DB',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Condición de Muestra
                  </label>
                  <select
                    value={form.condicionMuestra}
                    onChange={e => setForm({ ...form, condicionMuestra: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #D1D5DB',
                    }}
                  >
                    <option value="buena">Buena</option>
                    <option value="regular">Regular</option>
                    <option value="deteriorada">Deteriorada</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Observaciones de Recepción
                </label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  rows={2}
                  placeholder="Observaciones de recepción..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #D1D5DB',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </fieldset>

          {/* Muestras */}
          <fieldset style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
            <legend style={{ fontWeight: '600', padding: '0 8px' }}>
              Muestras de la Perforación ({muestrasForm.length})
            </legend>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {muestrasForm.map((muestra, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    backgroundColor: '#FFFBEB',
                    borderRadius: '6px',
                    border: '1px solid #FDE68A',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontWeight: '500', fontSize: '0.875rem', color: '#92400E' }}>
                      Muestra M-{String(index + 1).padStart(3, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMuestra(index)}
                      disabled={muestrasForm.length <= 1}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: muestrasForm.length <= 1 ? '#E5E7EB' : '#EF4444',
                        color: 'white',
                        cursor: muestrasForm.length <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      Quitar
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '2px',
                          fontSize: '0.75rem',
                          color: '#6B7280',
                        }}
                      >
                        Prof. Inicio (m) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={muestra.profundidadInicio}
                        onChange={e =>
                          handleMuestraChange(index, 'profundidadInicio', e.target.value)
                        }
                        placeholder="0.0"
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #D1D5DB',
                          fontSize: '0.875rem',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '2px',
                          fontSize: '0.75rem',
                          color: '#6B7280',
                        }}
                      >
                        Prof. Fin (m) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={muestra.profundidadFin}
                        onChange={e => handleMuestraChange(index, 'profundidadFin', e.target.value)}
                        placeholder="0.5"
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #D1D5DB',
                          fontSize: '0.875rem',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '2px',
                          fontSize: '0.75rem',
                          color: '#6B7280',
                        }}
                      >
                        Tipo de Muestra
                      </label>
                      <select
                        value={muestra.tipoMuestra}
                        onChange={e => handleMuestraChange(index, 'tipoMuestra', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #D1D5DB',
                          fontSize: '0.875rem',
                        }}
                      >
                        {TIPOS_MUESTRA.map(tipo => (
                          <option key={tipo.id} value={tipo.id}>
                            {tipo.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '2px',
                        fontSize: '0.75rem',
                        color: '#6B7280',
                      }}
                    >
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={muestra.descripcion}
                      onChange={e => handleMuestraChange(index, 'descripcion', e.target.value)}
                      placeholder="Ej: Arcilla café con gravas, N=15..."
                      style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddMuestra}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px dashed #F59E0B',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#92400E',
                  fontSize: '0.875rem',
                }}
              >
                + Agregar otra muestra
              </button>
            </div>
          </fieldset>

          <div
            style={{
              padding: '12px',
              backgroundColor: '#DBEAFE',
              borderRadius: '8px',
              fontSize: '0.875rem',
            }}
          >
            <strong>Nota:</strong> Al relacionar la perforación y registrar las muestras, el cliente
            podrá solicitar ensayos para cada muestra específica.
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#10B981',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Info de la perforación */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#DBEAFE',
              borderRadius: '8px',
              border: '1px solid #3B82F6',
            }}
          >
            <div style={{ fontWeight: '600', color: '#1E40AF' }}>Perforación:</div>
            <div style={{ marginTop: '4px' }}>
              <strong>{perforacion.codigo}</strong> - {perforacion.descripcion}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#1E40AF', marginTop: '4px' }}>
              Muestra física: {perforacion.muestraFisica}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '2px' }}>
              Muestras registradas: {muestrasExistentes.length}
            </div>
          </div>

          {/* Código automático */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#F3F4F6',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            <strong>Código asignado:</strong> M-
            {String(muestrasExistentes.length + 1).padStart(3, '0')}
          </div>

          {/* Formulario */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Profundidad Inicio (m) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.profundidadInicio}
                onChange={e => setForm({ ...form, profundidadInicio: e.target.value })}
                required
                placeholder="0.0"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #D1D5DB',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Profundidad Fin (m) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.profundidadFin}
                onChange={e => setForm({ ...form, profundidadFin: e.target.value })}
                required
                placeholder="0.5"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #D1D5DB',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Tipo de Muestra *
            </label>
            <select
              value={form.tipoMuestra}
              onChange={e => setForm({ ...form, tipoMuestra: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
              }}
            >
              {TIPOS_MUESTRA.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              rows={2}
              placeholder="Ej: Arcilla café con gravas, N=15..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#F59E0B',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
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
        <div style={{ textAlign: 'center', padding: '48px' }}>Cargando proyectos...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Proyectos">
      {/* Selector de rol para desarrollo */}
      {import.meta.env.DEV && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#DBEAFE',
            borderRadius: '6px',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: '500' }}>Rol actual:</span>
            <select
              value={devRole}
              onChange={e => setDevRole(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #3B82F6',
                backgroundColor: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {ROLES_DISPONIBLES.map(rol => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>
          <div style={{ color: '#1E40AF', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {canCreateProject(userRole) && <span>✓ Crear proyectos</span>}
            {canRelatePhysicalSample(userRole) && <span>✓ Relacionar muestras</span>}
            {canAddMuestras(userRole) && <span>✓ Agregar muestras</span>}
            {canRequestTest(userRole) && <span>✓ Solicitar ensayos</span>}
          </div>
        </div>
      )}

      {/* Banner de error */}
      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#FEE2E2',
            borderRadius: '6px',
            border: '1px solid #EF4444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#EF4444',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Cerrar
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '24px',
          height: 'calc(100vh - 240px)',
        }}
      >
        {/* COLUMNA 1: PROYECTOS */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: 0 }}>Proyectos</h3>
            {canCreateProject(userRole) && (
              <button
                onClick={() => setShowNuevoProyecto(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                + Nuevo
              </button>
            )}
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="completado">Completados</option>
            </select>
            <select
              value={filtroCliente}
              onChange={e => setFiltroCliente(e.target.value)}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
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
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {proyectosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
                No hay proyectos
              </div>
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
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600' }}>{proyecto.codigo}</div>
                        <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {proyecto.nombre}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
                          {getClienteNombre(proyecto.clienteId)}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          alignItems: 'flex-end',
                        }}
                      >
                        <Badge color={estado.color}>{estado.label}</Badge>
                        {canEditProject(userRole) && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setEditingProyecto(proyecto);
                                setShowEditarProyecto(true);
                              }}
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid #3B82F6',
                                backgroundColor: 'white',
                                color: '#3B82F6',
                                cursor: 'pointer',
                                fontSize: '0.65rem',
                              }}
                            >
                              Editar
                            </button>
                            {canDeleteProject(userRole) && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteClick('proyecto', proyecto);
                                }}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #EF4444',
                                  backgroundColor: 'white',
                                  color: '#EF4444',
                                  cursor: 'pointer',
                                  fontSize: '0.65rem',
                                }}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '8px',
                        fontSize: '0.75rem',
                        color: '#6B7280',
                      }}
                    >
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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: 0 }}>
              Perforaciones
              {selectedProyecto && perfsSinRelacionar > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#F59E0B' }}>
                  ({perfsSinRelacionar} sin relacionar)
                </span>
              )}
            </h3>
          </div>

          {!selectedProyecto ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
              }}
            >
              Selecciona un proyecto
            </div>
          ) : (
            <>
              {/* Resumen de ensayos cotizados */}
              {selectedProyecto.ensayosCotizados &&
                Object.keys(selectedProyecto.ensayosCotizados).length > 0 && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '8px',
                      backgroundColor: '#F3F4F6',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <strong>Ensayos cotizados:</strong>{' '}
                    {Object.entries(selectedProyecto.ensayosCotizados)
                      .map(([tipo, cant]) => {
                        const tipoInfo = TIPOS_ENSAYO.find(t => t.id === tipo);
                        return `${tipoInfo?.nombre || tipo}: ${cant}`;
                      })
                      .join(', ')}
                  </div>
                )}

              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {perforacionesProyecto.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
                    No hay perforaciones definidas
                  </div>
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
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                              {perf.codigo}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                              {perf.descripcion}
                            </div>
                            {perf.ubicacion && (
                              <div
                                style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}
                              >
                                {perf.ubicacion}
                              </div>
                            )}
                            {perf.muestraFisica && (
                              <div
                                style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '2px' }}
                              >
                                Muestra: {perf.muestraFisica}
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              alignItems: 'flex-end',
                            }}
                          >
                            <Badge color={estado.color}>{estado.label}</Badge>
                            {puedeRelacionar && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedPerforacion(perf);
                                  setShowRelacionarMuestra(true);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  backgroundColor: '#F59E0B',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem',
                                }}
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
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  backgroundColor: '#3B82F6',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem',
                                }}
                              >
                                + Muestra
                              </button>
                            )}
                            {canEditProject(userRole) && (
                              <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditingPerforacion(perf);
                                    setShowEditarPerforacion(true);
                                  }}
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #3B82F6',
                                    backgroundColor: 'white',
                                    color: '#3B82F6',
                                    cursor: 'pointer',
                                    fontSize: '0.6rem',
                                  }}
                                >
                                  Editar
                                </button>
                                {canDeleteProject(userRole) && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteClick('perforacion', perf);
                                    }}
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid #EF4444',
                                      backgroundColor: 'white',
                                      color: '#EF4444',
                                      cursor: 'pointer',
                                      fontSize: '0.6rem',
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6B7280' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: 0 }}>
              Muestras y Ensayos
              {selectedPerforacion && muestrasPerforacion.length > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#6B7280' }}>
                  ({muestrasPerforacion.length})
                </span>
              )}
            </h3>
          </div>

          {!selectedPerforacion ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
              }}
            >
              Selecciona una perforación
            </div>
          ) : selectedPerforacion.estado === 'sin_relacionar' ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
                textAlign: 'center',
                padding: '24px',
              }}
            >
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
                <div>Esta perforación aún no tiene muestra física relacionada.</div>
                {canRelatePhysicalSample(userRole) && (
                  <button
                    onClick={() => setShowRelacionarMuestra(true)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Relacionar muestra
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {muestrasPerforacion.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📋</div>
                  <div>No hay muestras registradas</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '8px', color: '#9CA3AF' }}>
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
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'start',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1rem' }}>📍</span>
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                    {muestra.codigo}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                    {muestra.profundidadInicio}m - {muestra.profundidadFin}m
                                  </div>
                                </div>
                              </div>
                              {muestra.descripcion && (
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#374151',
                                    marginTop: '4px',
                                    marginLeft: '28px',
                                  }}
                                >
                                  {muestra.descripcion}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                alignItems: 'flex-end',
                              }}
                            >
                              <Badge color={tipoMuestra?.color || '#6B7280'}>
                                {tipoMuestra?.nombre || muestra.tipoMuestra}
                              </Badge>
                              <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                                {ensayosMuestra.length} ensayo
                                {ensayosMuestra.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Botón solicitar ensayo (solo para clientes) */}
                          {canRequestTest(userRole) && (
                            <div style={{ marginTop: '8px', textAlign: 'right' }}>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedMuestra(muestra);
                                  setShowSolicitarEnsayo(true);
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  backgroundColor: '#10B981',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                }}
                              >
                                + Solicitar Ensayo
                              </button>
                            </div>
                          )}
                        </Card>

                        {/* Ensayos de la muestra (expandible) */}
                        {isSelected && ensayosMuestra.length > 0 && (
                          <div
                            style={{
                              marginLeft: '20px',
                              marginTop: '4px',
                              borderLeft: '2px solid #E5E7EB',
                              paddingLeft: '12px',
                            }}
                          >
                            {ensayosMuestra.map(ensayo => {
                              const workflow = getWorkflowInfo(ensayo.workflow_state);
                              const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);

                              return (
                                <div
                                  key={ensayo.id}
                                  style={{
                                    padding: '8px 12px',
                                    marginBottom: '4px',
                                    backgroundColor: '#F9FAFB',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontWeight: '500' }}>{ensayo.codigo}</span>
                                      <span style={{ color: '#6B7280', marginLeft: '8px' }}>
                                        {tipoEnsayo?.nombre || ensayo.tipo}
                                      </span>
                                    </div>
                                    <Badge color={workflow.color} small>
                                      {workflow.nombre}
                                    </Badge>
                                  </div>
                                  <div
                                    style={{
                                      marginTop: '4px',
                                      display: 'flex',
                                      gap: '8px',
                                    }}
                                  >
                                    {ensayo.spreadsheet_url && (
                                      <a
                                        href={ensayo.spreadsheet_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          backgroundColor: '#34A853',
                                          color: 'white',
                                          textDecoration: 'none',
                                          fontSize: '0.7rem',
                                        }}
                                        onClick={e => e.stopPropagation()}
                                      >
                                        Sheet
                                      </a>
                                    )}
                                    <a
                                      href={`/ensayos?id=${ensayo.id}`}
                                      style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: '#3B82F6',
                                        color: 'white',
                                        textDecoration: 'none',
                                        fontSize: '0.7rem',
                                      }}
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
                <div style={{ marginTop: '16px' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#9CA3AF',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Ensayos sin muestra asignada
                  </div>
                  {ensayosPerforacion
                    .filter(e => !e.muestraId)
                    .map(ensayo => {
                      const workflow = getWorkflowInfo(ensayo.workflow_state);
                      const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);

                      return (
                        <Card key={ensayo.id}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'start',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                {ensayo.codigo}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#374151' }}>
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
      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
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
