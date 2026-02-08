import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge, Card, Modal } from '../components/ui';
import { useEnsayoCompleto } from '../hooks/useEnsayoSheet';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { ProyectosAPI, ClientesAPI, PerforacionesAPI, EnsayosAPI } from '../services/apiService';
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
// DATOS MOCK PARA MODO BYPASS
// ============================================

const MOCK_CLIENTES = [
  { id: 'cli-001', nombre: 'Constructora ABC', email: 'contacto@abc.com' },
  { id: 'cli-002', nombre: 'Minera del Norte', email: 'lab@minera.com' },
  { id: 'cli-003', nombre: 'Ingeniería Total', email: 'proyectos@ingtotal.com' },
];

const MOCK_PROYECTOS = [
  {
    id: 'pry-001',
    codigo: 'PRY-2025-001',
    nombre: 'Edificio Central',
    clienteId: 'cli-001',
    estado: 'activo',
    fecha_inicio: '2025-01-15',
    ensayosCotizados: { traccion: 10, dureza: 15, impacto: 5 },
  },
  {
    id: 'pry-002',
    codigo: 'PRY-2025-002',
    nombre: 'Puente Río Grande',
    clienteId: 'cli-002',
    estado: 'activo',
    fecha_inicio: '2025-01-20',
    ensayosCotizados: { traccion: 20, quimico_oes: 10 },
  },
];

const MOCK_PERFORACIONES = [
  {
    id: 'perf-001',
    codigo: 'PER-001-A',
    proyectoId: 'pry-001',
    descripcion: 'Perforación Sector A',
    estado: 'relacionado',
    ubicacion: 'Sector Norte',
    fecha_recepcion: '2025-01-18',
    muestraFisica: 'MF-2025-0001',
  },
  {
    id: 'perf-002',
    codigo: 'PER-001-B',
    proyectoId: 'pry-001',
    descripcion: 'Perforación Sector B',
    estado: 'sin_relacionar',
    ubicacion: 'Sector Sur',
    fecha_recepcion: null,
    muestraFisica: null,
  },
  {
    id: 'perf-003',
    codigo: 'PER-001-C',
    proyectoId: 'pry-001',
    descripcion: 'Perforación Sector C',
    estado: 'sin_relacionar',
    ubicacion: 'Sector Este',
    fecha_recepcion: null,
    muestraFisica: null,
  },
  {
    id: 'perf-004',
    codigo: 'PER-002-A',
    proyectoId: 'pry-002',
    descripcion: 'Perforación Estribo 1',
    estado: 'relacionado',
    ubicacion: 'Estribo Izquierdo',
    fecha_recepcion: '2025-01-22',
    muestraFisica: 'MF-2025-0002',
  },
];

const MOCK_MUESTRAS = [
  // Muestras de perf-001 (Perforación Sector A - Proyecto 1)
  {
    id: 'mue-001',
    codigo: 'M-001',
    perforacionId: 'perf-001',
    profundidadInicio: 0.5,
    profundidadFin: 1.0,
    tipoMuestra: 'alterado',
    descripcion: 'Arcilla café oscura con gravas',
  },
  {
    id: 'mue-002',
    codigo: 'M-002',
    perforacionId: 'perf-001',
    profundidadInicio: 3.0,
    profundidadFin: 3.5,
    tipoMuestra: 'spt',
    descripcion: 'Arena limosa, N=15',
  },
  // Muestras de perf-004 (Perforación Estribo 1 - Proyecto 2)
  {
    id: 'mue-003',
    codigo: 'M-001',
    perforacionId: 'perf-004',
    profundidadInicio: 2.0,
    profundidadFin: 2.5,
    tipoMuestra: 'shelby',
    descripcion: 'Limo arcilloso gris',
  },
  {
    id: 'mue-004',
    codigo: 'M-002',
    perforacionId: 'perf-004',
    profundidadInicio: 8.0,
    profundidadFin: 10.0,
    tipoMuestra: 'roca',
    descripcion: 'Basalto fracturado RQD=70%',
  },
];

const MOCK_ENSAYOS = [
  {
    id: 'ens-001',
    codigo: 'ENS-2025-001',
    tipo: 'traccion',
    perforacionId: 'perf-001',
    muestraId: 'mue-001',
    proyectoId: 'pry-001',
    workflow_state: 'E6',
    norma: 'ASTM E8',
  },
  {
    id: 'ens-002',
    codigo: 'ENS-2025-002',
    tipo: 'dureza',
    perforacionId: 'perf-001',
    muestraId: 'mue-001',
    proyectoId: 'pry-001',
    workflow_state: 'E1',
    norma: 'ASTM E18',
  },
  {
    id: 'ens-003',
    codigo: 'ENS-2025-003',
    tipo: 'traccion',
    perforacionId: 'perf-004',
    muestraId: 'mue-003',
    proyectoId: 'pry-002',
    workflow_state: 'E9',
    norma: 'ASTM E8',
  },
];

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
                        {c.nombre}
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

// ============================================
// MODAL: SOLICITAR ENSAYO (PARA CLIENTES)
// ============================================

function SolicitarEnsayoModal({
  isOpen,
  onClose,
  onCreate,
  perforacion,
  muestra,
  proyecto,
  loading,
}) {
  const [form, setForm] = useState({
    tipo: '',
    norma: '',
    observaciones: '',
    cantidad: 1,
  });

  const { crearEnsayoCompleto, inicializarGoogle } = useEnsayoCompleto(null);
  const [creando, setCreando] = useState(false);

  // Ensayos disponibles según lo cotizado en el proyecto
  const ensayosDisponibles = proyecto?.ensayosCotizados || {};
  const tiposDisponibles = TIPOS_ENSAYO.filter(t => ensayosDisponibles[t.id] > 0);

  const handleSubmit = async e => {
    e.preventDefault();
    setCreando(true);

    try {
      await inicializarGoogle();

      const datosEnsayo = {
        ...form,
        perforacionId: perforacion.id,
        muestraId: muestra?.id || null,
        proyectoId: proyecto.id,
        muestra: muestra
          ? `${muestra.codigo} (${muestra.profundidadInicio}m-${muestra.profundidadFin}m)`
          : perforacion.descripcion,
      };

      const ensayoCompleto = await crearEnsayoCompleto(datosEnsayo);
      onCreate(ensayoCompleto);
      setForm({ tipo: '', norma: '', observaciones: '', cantidad: 1 });

      if (ensayoCompleto.spreadsheet_url) {
        window.open(ensayoCompleto.spreadsheet_url, '_blank');
      }
    } catch (err) {
      console.error('Error creando ensayo:', err);
      onCreate({
        ...form,
        perforacionId: perforacion.id,
        muestraId: muestra?.id || null,
        proyectoId: proyecto.id,
        muestra: muestra
          ? `${muestra.codigo} (${muestra.profundidadInicio}m-${muestra.profundidadFin}m)`
          : perforacion.descripcion,
      });
      setForm({ tipo: '', norma: '', observaciones: '', cantidad: 1 });
    } finally {
      setCreando(false);
    }
  };

  const tipoSeleccionado = TIPOS_ENSAYO.find(t => t.id === form.tipo);
  const cotizadosRestantes = tipoSeleccionado ? ensayosDisponibles[form.tipo] || 0 : 0;

  // Obtener información del tipo de muestra
  const tipoMuestraInfo = muestra ? getTipoMuestra(muestra.tipoMuestra) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Solicitar Ensayo${muestra ? ` - ${muestra.codigo}` : ''}`}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Información de la muestra */}
          <div style={{ padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
            {muestra ? (
              <>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
                >
                  <div>
                    <strong>Muestra:</strong> {muestra.codigo}
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '2px' }}>
                      Profundidad: {muestra.profundidadInicio}m - {muestra.profundidadFin}m
                    </div>
                  </div>
                  {tipoMuestraInfo && (
                    <Badge color={tipoMuestraInfo.color}>{tipoMuestraInfo.nombre}</Badge>
                  )}
                </div>
                {muestra.descripcion && (
                  <div style={{ fontSize: '0.875rem', color: '#374151', marginTop: '8px' }}>
                    {muestra.descripcion}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '8px' }}>
                  Perforación: {perforacion?.codigo} • Muestra física: {perforacion?.muestraFisica}
                </div>
              </>
            ) : (
              <>
                <strong>Perforación:</strong> {perforacion?.descripcion}
                {perforacion?.muestraFisica && (
                  <div style={{ marginTop: '4px', fontSize: '0.875rem' }}>
                    <strong>Código físico:</strong> {perforacion.muestraFisica}
                  </div>
                )}
              </>
            )}
          </div>

          {tiposDisponibles.length === 0 ? (
            <div
              style={{
                padding: '16px',
                backgroundColor: '#FEE2E2',
                borderRadius: '8px',
                color: '#991B1B',
              }}
            >
              No hay ensayos cotizados disponibles para este proyecto.
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Tipo de Ensayo *
                </label>
                <select
                  value={form.tipo}
                  onChange={e => {
                    const tipo = TIPOS_ENSAYO.find(t => t.id === e.target.value);
                    setForm({ ...form, tipo: e.target.value, norma: tipo?.norma || '' });
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #D1D5DB',
                  }}
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposDisponibles.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre} (Cotizados: {ensayosDisponibles[tipo.id]})
                    </option>
                  ))}
                </select>
                {tipoSeleccionado && (
                  <div style={{ marginTop: '4px', fontSize: '0.875rem', color: '#6B7280' }}>
                    Disponibles: {cotizadosRestantes} | Norma: {tipoSeleccionado.norma}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Norma de Referencia
                </label>
                <input
                  type="text"
                  value={form.norma}
                  onChange={e => setForm({ ...form, norma: e.target.value })}
                  placeholder="Ej: ASTM E8"
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
                  Observaciones
                </label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  rows={2}
                  placeholder="Condiciones especiales, requerimientos..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #D1D5DB',
                    resize: 'vertical',
                  }}
                />
              </div>
            </>
          )}

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
              disabled={loading || creando || tiposDisponibles.length === 0}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: tiposDisponibles.length === 0 ? '#9CA3AF' : '#10B981',
                color: 'white',
                cursor:
                  loading || creando || tiposDisponibles.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {creando ? 'Creando...' : 'Solicitar Ensayo'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

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
  const { user, isBypassMode } = useGoogleAuth();

  // En modo bypass, permitir cambiar rol para pruebas
  const [devRole, setDevRole] = useState('tecnico');
  const userRole = isBypassMode ? devRole : user?.rol || 'tecnico';

  const [proyectos, setProyectos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [perforaciones, setPerforaciones] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [ensayos, setEnsayos] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showEditarProyecto, setShowEditarProyecto] = useState(false);
  const [showEditarPerforacion, setShowEditarPerforacion] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'proyecto' | 'perforacion', item: {...} }
  const [editingProyecto, setEditingProyecto] = useState(null);
  const [editingPerforacion, setEditingPerforacion] = useState(null);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      // En modo bypass, usar datos mock
      if (isBypassMode) {
        setProyectos(MOCK_PROYECTOS);
        setClientes(MOCK_CLIENTES);
        setPerforaciones(MOCK_PERFORACIONES);
        setMuestras(MOCK_MUESTRAS);
        setEnsayos(MOCK_ENSAYOS);
        setLoading(false);
        return;
      }

      try {
        // Usar el servicio de API para cargar datos del backend
        const [proyectosRes, clientesRes, perforacionesRes, ensayosRes] = await Promise.all([
          ProyectosAPI.list(),
          ClientesAPI.list(),
          PerforacionesAPI.list(),
          EnsayosAPI.list(),
        ]);

        setProyectos(proyectosRes || []);
        setClientes(clientesRes || []);
        setPerforaciones(perforacionesRes || []);
        setMuestras([]); // TODO: Cargar muestras desde API cuando esté disponible
        setEnsayos(ensayosRes || []);
      } catch (err) {
        console.error('Error cargando datos:', err);
        // En caso de error, usar datos vacíos
        setProyectos([]);
        setClientes([]);
        setPerforaciones([]);
        setMuestras([]);
        setEnsayos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isBypassMode]);

  // Función para recargar datos desde la API
  const reloadData = async () => {
    if (isBypassMode) return; // En modo bypass no recargamos

    try {
      const [proyectosRes, perforacionesRes] = await Promise.all([
        ProyectosAPI.list(),
        PerforacionesAPI.list(),
      ]);
      setProyectos(proyectosRes || []);
      setPerforaciones(perforacionesRes || []);
    } catch (err) {
      console.error('Error recargando datos:', err);
      setError('Error al recargar los datos');
    }
  };

  // Handlers
  const handleCrearProyecto = async data => {
    // En modo bypass, mantener lógica local
    if (isBypassMode) {
      const nuevoId = `pry-${Date.now()}`;
      const nuevoCodigo = `PRY-2025-${String(proyectos.length + 1).padStart(3, '0')}`;
      const nuevoProyecto = {
        id: nuevoId,
        codigo: nuevoCodigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        clienteId: data.clienteId,
        contacto: data.contacto,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin_estimada: data.fecha_fin_estimada,
        estado: 'activo',
        ensayosCotizados: data.ensayosCotizados,
      };
      const nuevasPerforaciones = data.perforaciones.map((perf, index) => ({
        id: `perf-${Date.now()}-${index}`,
        codigo: perf.codigo || `${nuevoCodigo}-P${String(index + 1).padStart(2, '0')}`,
        proyectoId: nuevoId,
        descripcion: perf.descripcion,
        ubicacion: perf.ubicacion,
        estado: 'sin_relacionar',
        fecha_recepcion: null,
        muestraFisica: null,
      }));
      setProyectos([...proyectos, nuevoProyecto]);
      setPerforaciones([...perforaciones, ...nuevasPerforaciones]);
      setShowNuevoProyecto(false);
      setSelectedProyecto(nuevoProyecto);
      return;
    }

    // Conectar con API del backend
    setSaving(true);
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
      };

      const nuevoProyecto = await ProyectosAPI.create(proyectoPayload);

      // Crear perforaciones en backend
      const perforacionesCreadas = [];
      for (const perf of data.perforaciones) {
        if (!perf.codigo?.trim()) continue; // Ignorar perforaciones sin código

        const perfPayload = {
          proyecto_id: nuevoProyecto.id,
          nombre: perf.codigo,
          descripcion: perf.descripcion || null,
          ubicacion: perf.ubicacion || null,
          profundidad: null,
          fecha_inicio: null,
        };

        const nuevaPerf = await PerforacionesAPI.create(perfPayload);
        perforacionesCreadas.push(nuevaPerf);
      }

      // Recargar datos desde la API para sincronizar
      await reloadData();

      setShowNuevoProyecto(false);
      // Seleccionar el proyecto recién creado
      setSelectedProyecto(nuevoProyecto);
    } catch (err) {
      console.error('Error creando proyecto:', err);
      setError(`Error al crear el proyecto: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRelacionarMuestra = async data => {
    // En modo bypass, mantener lógica local
    if (isBypassMode) {
      const updatedPerforaciones = perforaciones.map(perf => {
        if (perf.id === data.perforacionId) {
          return {
            ...perf,
            estado: 'relacionado',
            muestraFisica: data.codigoMuestra,
            fecha_recepcion: data.fechaRecepcion,
            condicionMuestra: data.condicionMuestra,
            observacionesRecepcion: data.observaciones,
          };
        }
        return perf;
      });

      const nuevasMuestras = (data.muestras || []).map((muestra, index) => ({
        id: `mue-${Date.now()}-${index}`,
        codigo: `M-${String(index + 1).padStart(3, '0')}`,
        perforacionId: data.perforacionId,
        profundidadInicio: parseFloat(muestra.profundidadInicio),
        profundidadFin: parseFloat(muestra.profundidadFin),
        tipoMuestra: muestra.tipoMuestra,
        descripcion: muestra.descripcion,
      }));

      setPerforaciones(updatedPerforaciones);
      setMuestras([...muestras, ...nuevasMuestras]);
      setShowRelacionarMuestra(false);
      const updatedPerf = updatedPerforaciones.find(p => p.id === data.perforacionId);
      setSelectedPerforacion(updatedPerf);
      return;
    }

    // Conectar con API del backend
    setSaving(true);
    setError(null);

    try {
      // Actualizar perforación en el backend con el nuevo estado
      const updatePayload = {
        estado: 'relacionado',
        // Nota: El backend de perforaciones puede no tener estos campos,
        // pero los guardamos localmente por ahora
      };

      await PerforacionesAPI.update(data.perforacionId, updatePayload);

      // Actualizar estado local (los campos adicionales se manejan localmente por ahora)
      const updatedPerforaciones = perforaciones.map(perf => {
        if (perf.id === data.perforacionId) {
          return {
            ...perf,
            estado: 'relacionado',
            muestraFisica: data.codigoMuestra,
            fecha_recepcion: data.fechaRecepcion,
            condicionMuestra: data.condicionMuestra,
            observacionesRecepcion: data.observaciones,
          };
        }
        return perf;
      });

      // Crear las muestras asociadas a la perforación (localmente por ahora)
      // TODO: Cuando exista MuestrasAPI, crear en el backend
      const nuevasMuestras = (data.muestras || []).map((muestra, index) => ({
        id: `mue-${Date.now()}-${index}`,
        codigo: `M-${String(index + 1).padStart(3, '0')}`,
        perforacionId: data.perforacionId,
        profundidadInicio: parseFloat(muestra.profundidadInicio),
        profundidadFin: parseFloat(muestra.profundidadFin),
        tipoMuestra: muestra.tipoMuestra,
        descripcion: muestra.descripcion,
      }));

      setPerforaciones(updatedPerforaciones);
      setMuestras([...muestras, ...nuevasMuestras]);
      setShowRelacionarMuestra(false);

      const updatedPerf = updatedPerforaciones.find(p => p.id === data.perforacionId);
      setSelectedPerforacion(updatedPerf);
    } catch (err) {
      console.error('Error relacionando muestra:', err);
      setError(`Error al relacionar la muestra: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSolicitarEnsayo = async data => {
    const nuevoEnsayo = {
      id: `ens-${Date.now()}`,
      codigo: `ENS-2025-${String(ensayos.length + 1).padStart(3, '0')}`,
      tipo: data.tipo,
      norma: data.norma,
      perforacionId: data.perforacionId,
      muestraId: data.muestraId || null,
      proyectoId: selectedProyecto.id,
      workflow_state: 'E1',
      observaciones: data.observaciones,
      spreadsheet_url: data.spreadsheet_url,
    };

    setEnsayos([...ensayos, nuevoEnsayo]);
    setShowSolicitarEnsayo(false);
    setSelectedMuestra(null);
  };

  const handleAgregarMuestra = async data => {
    const nuevaMuestra = {
      id: `mue-${Date.now()}`,
      codigo: data.codigo,
      perforacionId: data.perforacionId,
      profundidadInicio: data.profundidadInicio,
      profundidadFin: data.profundidadFin,
      tipoMuestra: data.tipoMuestra,
      descripcion: data.descripcion,
    };

    setMuestras([...muestras, nuevaMuestra]);
    setShowAgregarMuestra(false);
  };

  // Handler para editar proyecto
  const handleEditarProyecto = async data => {
    if (isBypassMode) {
      // En modo bypass, actualizar localmente
      setProyectos(proyectos.map(p => (p.id === editingProyecto.id ? { ...p, ...data } : p)));
      setShowEditarProyecto(false);
      setEditingProyecto(null);
      if (selectedProyecto?.id === editingProyecto.id) {
        setSelectedProyecto({ ...selectedProyecto, ...data });
      }
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatePayload = {
        nombre: data.nombre || null,
        descripcion: data.descripcion || null,
        fecha_fin_estimada: data.fecha_fin_estimada || null,
        contacto: data.contacto || null,
        estado: data.estado || null,
      };

      await ProyectosAPI.update(editingProyecto.id, updatePayload);
      await reloadData();

      setShowEditarProyecto(false);
      setEditingProyecto(null);

      // Actualizar selección si es el mismo proyecto
      if (selectedProyecto?.id === editingProyecto.id) {
        const updated = proyectos.find(p => p.id === editingProyecto.id);
        if (updated) setSelectedProyecto({ ...updated, ...data });
      }
    } catch (err) {
      console.error('Error actualizando proyecto:', err);
      setError(`Error al actualizar el proyecto: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  // Handler para editar perforación
  const handleEditarPerforacion = async data => {
    if (isBypassMode) {
      setPerforaciones(
        perforaciones.map(p => (p.id === editingPerforacion.id ? { ...p, ...data } : p))
      );
      setShowEditarPerforacion(false);
      setEditingPerforacion(null);
      if (selectedPerforacion?.id === editingPerforacion.id) {
        setSelectedPerforacion({ ...selectedPerforacion, ...data });
      }
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatePayload = {
        nombre: data.nombre || null,
        descripcion: data.descripcion || null,
        ubicacion: data.ubicacion || null,
        profundidad: data.profundidad || null,
        estado: data.estado || null,
      };

      await PerforacionesAPI.update(editingPerforacion.id, updatePayload);
      await reloadData();

      setShowEditarPerforacion(false);
      setEditingPerforacion(null);

      if (selectedPerforacion?.id === editingPerforacion.id) {
        const updated = perforaciones.find(p => p.id === editingPerforacion.id);
        if (updated) setSelectedPerforacion({ ...updated, ...data });
      }
    } catch (err) {
      console.error('Error actualizando perforación:', err);
      setError(`Error al actualizar la perforación: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  // Handler para iniciar eliminación (abre modal de confirmación)
  const handleDeleteClick = (type, item) => {
    setItemToDelete({ type, item });
    setShowConfirmDelete(true);
  };

  // Handler para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const { type, item } = itemToDelete;

    if (isBypassMode) {
      if (type === 'proyecto') {
        setProyectos(proyectos.filter(p => p.id !== item.id));
        // También eliminar perforaciones asociadas
        setPerforaciones(perforaciones.filter(p => p.proyectoId !== item.id));
        if (selectedProyecto?.id === item.id) {
          setSelectedProyecto(null);
          setSelectedPerforacion(null);
        }
      } else if (type === 'perforacion') {
        setPerforaciones(perforaciones.filter(p => p.id !== item.id));
        // También eliminar muestras asociadas
        setMuestras(muestras.filter(m => m.perforacionId !== item.id));
        if (selectedPerforacion?.id === item.id) {
          setSelectedPerforacion(null);
        }
      }
      setShowConfirmDelete(false);
      setItemToDelete(null);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (type === 'proyecto') {
        await ProyectosAPI.delete(item.id);
        if (selectedProyecto?.id === item.id) {
          setSelectedProyecto(null);
          setSelectedPerforacion(null);
        }
      } else if (type === 'perforacion') {
        await PerforacionesAPI.delete(item.id);
        if (selectedPerforacion?.id === item.id) {
          setSelectedPerforacion(null);
        }
      }

      await reloadData();
      setShowConfirmDelete(false);
      setItemToDelete(null);
    } catch (err) {
      console.error(`Error eliminando ${type}:`, err);
      setError(`Error al eliminar: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
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
      {/* Indicador de modo y selector de rol */}
      {isBypassMode && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#FEF3C7',
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
            <span style={{ fontWeight: '500' }}>Modo Demo</span>
            <select
              value={devRole}
              onChange={e => setDevRole(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #F59E0B',
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
          <div style={{ color: '#92400E', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
