import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge, Modal } from '../components/ui';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { EquiposAPI, SensoresAPI } from '../services/apiService';
import { ESTADO_EQUIPO } from '../config';

// ============================================
// OPCIONES PARA FORMULARIOS
// ============================================

const ESTADOS_EQUIPO = [
  { value: 'operativo', label: 'Operativo' },
  { value: 'en_calibracion', label: 'En Calibraci\u00f3n' },
  { value: 'fuera_servicio', label: 'Fuera de Servicio' },
  { value: 'en_mantenimiento', label: 'En Mantenimiento' },
];

const TIPOS_SENSOR = [
  { value: 'celda_carga', label: 'Celda de Carga' },
  { value: 'extensometro', label: 'Extens\u00f3metro' },
  { value: 'termocupla', label: 'Termocupla' },
  { value: 'lvdt', label: 'LVDT' },
  { value: 'pendulo', label: 'P\u00e9ndulo' },
  { value: 'otro', label: 'Otro' },
];

const UBICACIONES = [
  'Laboratorio Mec\u00e1nico',
  'Laboratorio Qu\u00edmico',
  'Laboratorio Metalogr\u00e1fico',
  'Almac\u00e9n',
  'Taller',
];

// ============================================
// ESTILOS COMUNES PARA FORMULARIOS
// ============================================

const formStyles = {
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
    fontSize: '0.875rem',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB',
  },
  buttonPrimary: {
    padding: '8px 16px',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  buttonSecondary: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  buttonDanger: {
    padding: '8px 16px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  required: {
    color: '#EF4444',
    marginLeft: '2px',
  },
};

// ============================================
// COMPONENTE: MODAL FORMULARIO EQUIPO
// ============================================

function EquipoFormModal({ isOpen, onClose, onSave, equipo, loading }) {
  const isEditing = !!equipo;

  const [form, setForm] = useState(() => ({
    nombre: equipo?.nombre || '',
    serie: equipo?.serie || '',
    placa: equipo?.placa || '',
    descripcion: equipo?.descripcion || '',
    marca: equipo?.marca || '',
    modelo: equipo?.modelo || '',
    ubicacion: equipo?.ubicacion || '',
    estado: equipo?.estado || 'operativo',
  }));

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async e => {
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
        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>
              Nombre <span style={formStyles.required}>*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => handleChange('nombre', e.target.value)}
              style={formStyles.input}
              placeholder="Ej: M\u00e1quina Universal de Tracci\u00f3n"
              required
            />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>
              N\u00b0 Serie <span style={formStyles.required}>*</span>
            </label>
            <input
              type="text"
              value={form.serie}
              onChange={e => handleChange('serie', e.target.value)}
              style={formStyles.input}
              placeholder="Ej: SN-2024-12345"
              required
            />
          </div>
        </div>

        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Placa / Inventario</label>
            <input
              type="text"
              value={form.placa}
              onChange={e => handleChange('placa', e.target.value)}
              style={formStyles.input}
              placeholder="Ej: INV-2024-001"
            />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Ubicaci\u00f3n</label>
            <select
              value={form.ubicacion}
              onChange={e => handleChange('ubicacion', e.target.value)}
              style={formStyles.select}
            >
              <option value="">Seleccionar ubicaci\u00f3n</option>
              {UBICACIONES.map(ub => (
                <option key={ub} value={ub}>
                  {ub}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Marca</label>
            <input
              type="text"
              value={form.marca}
              onChange={e => handleChange('marca', e.target.value)}
              style={formStyles.input}
              placeholder="Ej: Instron"
            />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Modelo</label>
            <input
              type="text"
              value={form.modelo}
              onChange={e => handleChange('modelo', e.target.value)}
              style={formStyles.input}
              placeholder="Ej: 5985"
            />
          </div>
        </div>

        {isEditing && (
          <div style={formStyles.field}>
            <label style={formStyles.label}>Estado</label>
            <select
              value={form.estado}
              onChange={e => handleChange('estado', e.target.value)}
              style={formStyles.select}
            >
              {ESTADOS_EQUIPO.map(est => (
                <option key={est.value} value={est.value}>
                  {est.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={formStyles.field}>
          <label style={formStyles.label}>Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={e => handleChange('descripcion', e.target.value)}
            style={formStyles.textarea}
            placeholder="Descripción del equipo..."
          />
        </div>

        <div style={formStyles.buttons}>
          <button
            type="button"
            onClick={onClose}
            style={formStyles.buttonSecondary}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              ...formStyles.buttonPrimary,
              opacity: !isValid || loading ? 0.6 : 1,
              cursor: !isValid || loading ? 'not-allowed' : 'pointer',
            }}
            disabled={!isValid || loading}
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Equipo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// COMPONENTE: MODAL FORMULARIO SENSOR
// ============================================

function SensorFormModal({ isOpen, onClose, onSave, sensor, loading, equiposDisponibles = [] }) {
  const isEditing = !!sensor;

  const [form, setForm] = useState(() => ({
    tipo: sensor?.tipo || '',
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

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async e => {
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
        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>
              Tipo <span style={formStyles.required}>*</span>
            </label>
            <select
              value={form.tipo}
              onChange={e => handleChange('tipo', e.target.value)}
              style={formStyles.select}
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
          <div style={formStyles.field}>
            <label style={formStyles.label}>
              N\u00b0 Serie <span style={formStyles.required}>*</span>
            </label>
            <input
              type="text"
              value={form.numero_serie}
              onChange={e => handleChange('numero_serie', e.target.value)}
              style={formStyles.input}
              placeholder="Ej: SN-2024-12345"
              required
            />
          </div>
        </div>

        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Marca</label>
            <input
              type="text"
              value={form.marca}
              onChange={e => handleChange('marca', e.target.value)}
              style={formStyles.input}
              placeholder="Ej: HBM"
            />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Modelo</label>
            <input
              type="text"
              value={form.modelo}
              onChange={e => handleChange('modelo', e.target.value)}
              style={formStyles.input}
              placeholder="Ej: U10M"
            />
          </div>
        </div>

        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Rango de Medici\u00f3n</label>
            <input
              type="text"
              value={form.rango_medicion}
              onChange={e => handleChange('rango_medicion', e.target.value)}
              style={formStyles.input}
              placeholder="Ej: 0 - 50 kN"
            />
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Precisi\u00f3n / Resoluci\u00f3n</label>
            <input
              type="text"
              value={form.precision}
              onChange={e => handleChange('precision', e.target.value)}
              style={formStyles.input}
              placeholder="Ej: 0.01 kN"
            />
          </div>
        </div>

        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Ubicaci\u00f3n</label>
            <select
              value={form.ubicacion}
              onChange={e => handleChange('ubicacion', e.target.value)}
              style={formStyles.select}
            >
              <option value="">Seleccionar ubicaci\u00f3n</option>
              {UBICACIONES.map(ub => (
                <option key={ub} value={ub}>
                  {ub}
                </option>
              ))}
            </select>
          </div>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Responsable</label>
            <input
              type="text"
              value={form.responsable}
              onChange={e => handleChange('responsable', e.target.value)}
              style={formStyles.input}
              placeholder="Nombre del responsable"
            />
          </div>
        </div>

        {/* Equipo Asociado */}
        <div style={formStyles.field}>
          <label style={formStyles.label}>Equipo Asociado</label>
          <select
            value={form.equipo_id}
            onChange={e => handleChange('equipo_id', e.target.value)}
            style={formStyles.select}
          >
            <option value="">Sin equipo asociado</option>
            {equiposDisponibles.map(eq => (
              <option key={eq.id} value={eq.id}>
                {eq.codigo} - {eq.nombre}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
            Selecciona el equipo al que pertenece este sensor
          </div>
        </div>

        {isEditing && (
          <div style={formStyles.field}>
            <label style={formStyles.label}>Estado</label>
            <select
              value={form.estado}
              onChange={e => handleChange('estado', e.target.value)}
              style={formStyles.select}
            >
              {ESTADOS_EQUIPO.map(est => (
                <option key={est.value} value={est.value}>
                  {est.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={formStyles.field}>
          <label style={formStyles.label}>Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={e => handleChange('observaciones', e.target.value)}
            style={formStyles.textarea}
            placeholder="Observaciones adicionales..."
          />
        </div>

        <div style={formStyles.buttons}>
          <button
            type="button"
            onClick={onClose}
            style={formStyles.buttonSecondary}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              ...formStyles.buttonPrimary,
              opacity: !isValid || loading ? 0.6 : 1,
              cursor: !isValid || loading ? 'not-allowed' : 'pointer',
            }}
            disabled={!isValid || loading}
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Sensor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// COMPONENTE: MODAL CONFIRMACION ELIMINAR
// ============================================

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, item, loading }) {
  if (!item) return null;

  const itemType = item.tipo === 'sensor' ? 'sensor' : 'equipo';
  const itemName = item.nombre || item.codigo || 'este elemento';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Eliminaci\u00f3n" width="450px">
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '28px',
          }}
        >
          &#9888;
        </div>
        <p style={{ margin: '0 0 8px', fontSize: '1rem', color: '#374151' }}>
          \u00bfEst\u00e1s seguro de que deseas eliminar{' '}
          {itemType === 'sensor' ? 'el sensor' : 'el equipo'}:
        </p>
        <p style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>
          {itemName}
        </p>
        <p style={{ margin: '0', fontSize: '0.875rem', color: '#6B7280' }}>
          Esta acci\u00f3n no se puede deshacer.
        </p>
      </div>

      <div style={formStyles.buttons}>
        <button
          type="button"
          onClick={onClose}
          style={formStyles.buttonSecondary}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            ...formStyles.buttonDanger,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          disabled={loading}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </Modal>
  );
}

// ============================================
// COMPONENTE: DROPDOWN NUEVO ITEM
// ============================================

function NuevoDropdown({ onNewEquipo, onNewSensor }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        + Nuevo
        <span style={{ fontSize: '0.7rem' }}>{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10,
            }}
            onClick={() => setIsOpen(false)}
          />
          {/* Menu dropdown */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #E5E7EB',
              minWidth: '160px',
              zIndex: 20,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => {
                onNewEquipo();
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={e => (e.target.style.backgroundColor = '#F3F4F6')}
              onMouseLeave={e => (e.target.style.backgroundColor = 'white')}
            >
              <span style={{ color: '#3B82F6' }}>Equipos</span>
              Nuevo Equipo
            </button>
            <button
              onClick={() => {
                onNewSensor();
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderTop: '1px solid #E5E7EB',
              }}
              onMouseEnter={e => (e.target.style.backgroundColor = '#F3F4F6')}
              onMouseLeave={e => (e.target.style.backgroundColor = 'white')}
            >
              <span style={{ color: '#8B5CF6' }}>Sensores</span>
              Nuevo Sensor
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// DATOS MOCK PARA MODO BYPASS
// ============================================

const MOCK_EQUIPOS = [
  {
    id: 'eq-001',
    codigo: 'MUT-001',
    placa: 'INV-2019-0045', // Código único de la organización
    nombre: 'Máquina Universal de Tracción',
    tipo: 'equipo',
    marca: 'Instron',
    modelo: '5985',
    serie: 'SN-2019-45678',
    rango: '0 - 250 kN',
    resolucion: '0.001 kN',
    ubicacion: 'Laboratorio Mecánico',
    estado: 'operativo',
    responsable: 'Carlos Rodríguez',
    fecha_adquisicion: '2019-03-15',
    proxima_calibracion: '2025-03-15',
    proxima_comprobacion: '2025-02-01',
    observaciones: 'Equipo principal para ensayos de tracción',
    sensoresAsociados: ['eq-005', 'eq-006', 'eq-007'], // IDs de sensores asociados
  },
  {
    id: 'eq-002',
    codigo: 'DUR-001',
    placa: 'INV-2020-0078',
    nombre: 'Durómetro Rockwell',
    tipo: 'equipo',
    marca: 'Wilson',
    modelo: 'RH2150',
    serie: 'WH-2020-12345',
    rango: 'HRA, HRB, HRC',
    resolucion: '0.5 HR',
    ubicacion: 'Laboratorio Mecánico',
    estado: 'operativo',
    responsable: 'María González',
    fecha_adquisicion: '2020-06-20',
    proxima_calibracion: '2025-06-20',
    proxima_comprobacion: '2025-02-10',
    observaciones: '',
    sensoresAsociados: [],
  },
  {
    id: 'eq-003',
    codigo: 'IMP-001',
    placa: 'INV-2018-0032',
    nombre: 'Máquina de Impacto Charpy',
    tipo: 'equipo',
    marca: 'Tinius Olsen',
    modelo: 'IT503',
    serie: 'TO-2018-98765',
    rango: '0 - 300 J',
    resolucion: '0.1 J',
    ubicacion: 'Laboratorio Mecánico',
    estado: 'en_calibracion',
    responsable: 'Carlos Rodríguez',
    fecha_adquisicion: '2018-11-10',
    proxima_calibracion: '2025-01-30',
    proxima_comprobacion: '2025-01-28',
    observaciones: 'En proceso de calibración anual',
    sensoresAsociados: ['eq-008'],
  },
  {
    id: 'eq-004',
    codigo: 'OES-001',
    placa: 'INV-2021-0112',
    nombre: 'Espectrómetro de Emisión Óptica',
    tipo: 'equipo',
    marca: 'Bruker',
    modelo: 'Q4 Tasman',
    serie: 'BR-2021-55555',
    rango: 'Multi-elemento',
    resolucion: '0.001%',
    ubicacion: 'Laboratorio Químico',
    estado: 'operativo',
    responsable: 'Juan Pérez',
    fecha_adquisicion: '2021-02-28',
    proxima_calibracion: '2025-02-28',
    proxima_comprobacion: '2025-02-05',
    observaciones: '',
    sensoresAsociados: [],
  },
  {
    id: 'eq-005',
    codigo: 'CEL-001',
    placa: 'INV-2022-0156',
    nombre: 'Celda de Carga 50kN',
    tipo: 'sensor',
    marca: 'HBM',
    modelo: 'U10M',
    serie: 'HBM-2022-11111',
    rango: '0 - 50 kN',
    resolucion: '0.01 kN',
    ubicacion: 'Laboratorio Mecánico',
    estado: 'operativo',
    responsable: 'Carlos Rodríguez',
    fecha_adquisicion: '2022-01-15',
    proxima_calibracion: '2025-01-15',
    proxima_comprobacion: '2025-01-20',
    factor_calibracion: '1.0023',
    observaciones: 'Sensor asociado a máquina de tracción',
    equipoPadre: 'eq-001', // Equipo al que pertenece
  },
  {
    id: 'eq-006',
    codigo: 'CEL-002',
    placa: 'INV-2022-0157',
    nombre: 'Celda de Carga 250kN',
    tipo: 'sensor',
    marca: 'HBM',
    modelo: 'U10M',
    serie: 'HBM-2022-22222',
    rango: '0 - 250 kN',
    resolucion: '0.1 kN',
    ubicacion: 'Laboratorio Mecánico',
    estado: 'operativo',
    responsable: 'Carlos Rodríguez',
    fecha_adquisicion: '2022-01-15',
    proxima_calibracion: '2025-01-15',
    proxima_comprobacion: '2025-01-20',
    factor_calibracion: '0.9987',
    observaciones: 'Sensor asociado a máquina de tracción',
    equipoPadre: 'eq-001',
  },
  {
    id: 'eq-007',
    codigo: 'EXT-001',
    placa: 'INV-2020-0089',
    nombre: 'Extensómetro Axial',
    tipo: 'sensor',
    marca: 'Epsilon',
    modelo: '3542',
    serie: 'EPS-2020-33333',
    rango: '0 - 50 mm',
    resolucion: '0.001 mm',
    ubicacion: 'Laboratorio Mecánico',
    estado: 'fuera_servicio',
    responsable: 'Carlos Rodríguez',
    fecha_adquisicion: '2020-05-10',
    proxima_calibracion: '2025-05-10',
    proxima_comprobacion: null,
    factor_calibracion: '1.0000',
    observaciones: 'Fuera de servicio por daño en cuchillas',
    equipoPadre: 'eq-001',
  },
  {
    id: 'eq-008',
    codigo: 'PEN-001',
    placa: 'INV-2018-0033',
    nombre: 'Péndulo de Impacto',
    tipo: 'sensor',
    marca: 'Tinius Olsen',
    modelo: 'PND-300',
    serie: 'TO-2018-98766',
    rango: '0 - 300 J',
    resolucion: '0.5 J',
    ubicacion: 'Laboratorio Mecánico',
    estado: 'en_calibracion',
    responsable: 'Carlos Rodríguez',
    fecha_adquisicion: '2018-11-10',
    proxima_calibracion: '2025-01-30',
    proxima_comprobacion: '2025-01-28',
    factor_calibracion: '1.0012',
    observaciones: '',
    equipoPadre: 'eq-003',
  },
];

const MOCK_COMPROBACIONES = [
  // MUT-001
  {
    id: 'comp-001',
    equipoId: 'eq-001',
    fecha: '2025-01-15',
    tipo: 'Verificación diaria',
    resultado: 'Conforme',
    responsable: 'Carlos Rodríguez',
    observaciones: 'Sin novedad',
  },
  {
    id: 'comp-002',
    equipoId: 'eq-001',
    fecha: '2025-01-08',
    tipo: 'Verificación diaria',
    resultado: 'Conforme',
    responsable: 'Carlos Rodríguez',
    observaciones: '',
  },
  {
    id: 'comp-003',
    equipoId: 'eq-001',
    fecha: '2025-01-02',
    tipo: 'Verificación diaria',
    resultado: 'Conforme',
    responsable: 'María González',
    observaciones: '',
  },
  {
    id: 'comp-004',
    equipoId: 'eq-001',
    fecha: '2024-12-20',
    tipo: 'Verificación mensual',
    resultado: 'Conforme',
    responsable: 'Carlos Rodríguez',
    observaciones: 'Verificación con patrón de 100kN',
  },
  // DUR-001
  {
    id: 'comp-005',
    equipoId: 'eq-002',
    fecha: '2025-01-20',
    tipo: 'Verificación con patrón',
    resultado: 'Conforme',
    responsable: 'María González',
    observaciones: 'Bloque patrón HRC 62.5',
  },
  {
    id: 'comp-006',
    equipoId: 'eq-002',
    fecha: '2025-01-10',
    tipo: 'Verificación con patrón',
    resultado: 'Conforme',
    responsable: 'María González',
    observaciones: '',
  },
  // CEL-001
  {
    id: 'comp-007',
    equipoId: 'eq-005',
    fecha: '2025-01-15',
    tipo: 'Verificación con patrón',
    resultado: 'Conforme',
    responsable: 'Carlos Rodríguez',
    observaciones: 'Verificación 10kN, 25kN, 50kN',
  },
  {
    id: 'comp-008',
    equipoId: 'eq-005',
    fecha: '2024-12-15',
    tipo: 'Verificación con patrón',
    resultado: 'Conforme',
    responsable: 'Carlos Rodríguez',
    observaciones: '',
  },
  // CEL-002
  {
    id: 'comp-009',
    equipoId: 'eq-006',
    fecha: '2025-01-15',
    tipo: 'Verificación con patrón',
    resultado: 'Conforme',
    responsable: 'Carlos Rodríguez',
    observaciones: '',
  },
];

const MOCK_CALIBRACIONES = [
  // MUT-001
  {
    id: 'cal-001',
    equipoId: 'eq-001',
    fecha: '2024-03-15',
    laboratorio: 'LSQA Metrología',
    certificado: 'CERT-2024-1234',
    vigencia: '2025-03-15',
    factor: null,
    incertidumbre: '±0.5%',
    resultado: 'Apto',
    observaciones: 'Calibración anual',
  },
  {
    id: 'cal-002',
    equipoId: 'eq-001',
    fecha: '2023-03-15',
    laboratorio: 'LSQA Metrología',
    certificado: 'CERT-2023-0987',
    vigencia: '2024-03-15',
    factor: null,
    incertidumbre: '±0.5%',
    resultado: 'Apto',
    observaciones: '',
  },
  {
    id: 'cal-003',
    equipoId: 'eq-001',
    fecha: '2022-03-15',
    laboratorio: 'LSQA Metrología',
    certificado: 'CERT-2022-0456',
    vigencia: '2023-03-15',
    factor: null,
    incertidumbre: '±0.5%',
    resultado: 'Apto',
    observaciones: '',
  },
  // DUR-001
  {
    id: 'cal-004',
    equipoId: 'eq-002',
    fecha: '2024-06-20',
    laboratorio: 'MetroCal S.A.',
    certificado: 'MC-2024-5678',
    vigencia: '2025-06-20',
    factor: null,
    incertidumbre: '±0.3 HRC',
    resultado: 'Apto',
    observaciones: '',
  },
  // CEL-001
  {
    id: 'cal-005',
    equipoId: 'eq-005',
    fecha: '2024-01-15',
    laboratorio: 'LSQA Metrología',
    certificado: 'CERT-2024-2222',
    vigencia: '2025-01-15',
    factor: '1.0023',
    incertidumbre: '±0.1%',
    resultado: 'Apto',
    observaciones: 'Factor aplicado en software',
  },
  {
    id: 'cal-006',
    equipoId: 'eq-005',
    fecha: '2023-01-15',
    laboratorio: 'LSQA Metrología',
    certificado: 'CERT-2023-1111',
    vigencia: '2024-01-15',
    factor: '1.0019',
    incertidumbre: '±0.1%',
    resultado: 'Apto',
    observaciones: '',
  },
  // CEL-002
  {
    id: 'cal-007',
    equipoId: 'eq-006',
    fecha: '2024-01-15',
    laboratorio: 'LSQA Metrología',
    certificado: 'CERT-2024-3333',
    vigencia: '2025-01-15',
    factor: '0.9987',
    incertidumbre: '±0.1%',
    resultado: 'Apto',
    observaciones: '',
  },
  // EXT-001
  {
    id: 'cal-008',
    equipoId: 'eq-007',
    fecha: '2024-05-10',
    laboratorio: 'MetroCal S.A.',
    certificado: 'MC-2024-7777',
    vigencia: '2025-05-10',
    factor: '1.0000',
    incertidumbre: '±0.5%',
    resultado: 'Apto',
    observaciones: '',
  },
  // PEN-001
  {
    id: 'cal-009',
    equipoId: 'eq-008',
    fecha: '2024-01-30',
    laboratorio: 'LSQA Metrología',
    certificado: 'CERT-2024-4444',
    vigencia: '2025-01-30',
    factor: '1.0012',
    incertidumbre: '±0.2%',
    resultado: 'Apto',
    observaciones: '',
  },
];

// ============================================
// HELPERS
// ============================================

const getEstadoInfo = estado => ESTADO_EQUIPO[estado] || { label: estado, color: '#6B7280' };

const getDiasParaVencimiento = fecha => {
  if (!fecha) return null;
  const hoy = new Date();
  const vencimiento = new Date(fecha);
  const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
  return diff;
};

const getAlertaVencimiento = dias => {
  if (dias === null) return null;
  if (dias < 0) return { color: '#EF4444', texto: 'Vencido', bg: '#FEE2E2' };
  if (dias <= 30) return { color: '#F59E0B', texto: `${dias}d`, bg: '#FEF3C7' };
  if (dias <= 90) return { color: '#3B82F6', texto: `${dias}d`, bg: '#DBEAFE' };
  return { color: '#10B981', texto: `${dias}d`, bg: '#D1FAE5' };
};

const formatDate = fecha => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-CL');
};

// ============================================
// COMPONENTE: LISTA DE SENSORES ASOCIADOS
// ============================================

function SensoresAsociados({ sensoresIds, todosEquipos, onSensorClick }) {
  const sensores = todosEquipos.filter(e => sensoresIds.includes(e.id));

  if (sensores.length === 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <h4
        style={{
          margin: '0 0 12px 0',
          fontSize: '0.875rem',
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }}
        ></span>
        Sensores Asociados ({sensores.length})
      </h4>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {sensores.map(sensor => {
          const estadoInfo = getEstadoInfo(sensor.estado);
          const diasCal = getDiasParaVencimiento(sensor.proxima_calibracion);
          const alertaCal = getAlertaVencimiento(diasCal);

          return (
            <div
              key={sensor.id}
              onClick={() => onSensorClick(sensor.id)}
              style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{sensor.codigo}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{sensor.placa}</div>
                </div>
                <Badge color={estadoInfo.color}>{estadoInfo.label}</Badge>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '4px' }}>
                {sensor.nombre}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  <span style={{ marginRight: '8px' }}>{sensor.marca}</span>
                  <span>Rango: {sensor.rango}</span>
                </div>
                {sensor.factor_calibracion && (
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3B82F6' }}>
                    FC: {sensor.factor_calibracion}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #E5E7EB',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                  Próx. Cal: {formatDate(sensor.proxima_calibracion)}
                </div>
                {alertaCal && (
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      backgroundColor: alertaCal.bg,
                      color: alertaCal.color,
                      fontWeight: '500',
                    }}
                  >
                    {alertaCal.texto}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: FILA EXPANDIBLE DE EQUIPO
// ============================================

function EquipoRow({
  equipo,
  todosEquipos,
  comprobaciones,
  calibraciones,
  isExpanded,
  onToggle,
  onSensorClick,
  onEdit,
  onDelete,
}) {
  const estadoInfo = getEstadoInfo(equipo.estado);
  const diasCalib = getDiasParaVencimiento(equipo.proxima_calibracion);
  const alertaCalib = getAlertaVencimiento(diasCalib);
  const diasComprob = getDiasParaVencimiento(equipo.proxima_comprobacion);
  const alertaComprob = getAlertaVencimiento(diasComprob);

  const comprobacionesEquipo = comprobaciones.filter(c => c.equipoId === equipo.id);
  const calibracionesEquipo = calibraciones.filter(c => c.equipoId === equipo.id);

  const numSensores = equipo.sensoresAsociados?.length || 0;

  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          cursor: 'pointer',
          backgroundColor: isExpanded ? '#F9FAFB' : 'white',
          borderBottom: isExpanded ? 'none' : '1px solid #E5E7EB',
        }}
      >
        <td style={{ padding: '12px', width: '40px' }}>
          <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>{isExpanded ? '▼' : '▶'}</span>
        </td>
        <td style={{ padding: '12px' }}>
          <div style={{ fontWeight: '600' }}>{equipo.codigo}</div>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{equipo.placa}</div>
        </td>
        <td style={{ padding: '12px', fontSize: '0.875rem' }}>{equipo.nombre}</td>
        <td style={{ padding: '12px' }}>
          <Badge color={equipo.tipo === 'sensor' ? '#8B5CF6' : '#3B82F6'}>
            {equipo.tipo === 'sensor' ? 'Sensor' : 'Equipo'}
          </Badge>
          {numSensores > 0 && (
            <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#8B5CF6' }}>
              +{numSensores}
            </span>
          )}
        </td>
        <td style={{ padding: '12px', fontSize: '0.875rem' }}>{equipo.marca}</td>
        <td style={{ padding: '12px', fontSize: '0.875rem' }}>{equipo.modelo}</td>
        <td style={{ padding: '12px', fontSize: '0.8rem' }}>{equipo.rango}</td>
        <td style={{ padding: '12px', fontSize: '0.875rem' }}>{equipo.ubicacion}</td>
        <td style={{ padding: '12px' }}>
          <Badge color={estadoInfo.color}>{estadoInfo.label}</Badge>
        </td>
        <td style={{ padding: '12px' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            {formatDate(equipo.proxima_calibracion)}
          </div>
          {alertaCalib && (
            <span
              style={{
                display: 'inline-block',
                marginTop: '2px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                backgroundColor: alertaCalib.bg,
                color: alertaCalib.color,
                fontWeight: '500',
              }}
            >
              {alertaCalib.texto}
            </span>
          )}
        </td>
        <td style={{ padding: '12px' }}>
          {equipo.proxima_comprobacion ? (
            <>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                {formatDate(equipo.proxima_comprobacion)}
              </div>
              {alertaComprob && (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '2px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    backgroundColor: alertaComprob.bg,
                    color: alertaComprob.color,
                    fontWeight: '500',
                  }}
                >
                  {alertaComprob.texto}
                </span>
              )}
            </>
          ) : (
            <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>-</span>
          )}
        </td>
        <td style={{ padding: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit(equipo);
              }}
              style={{
                padding: '6px 10px',
                backgroundColor: '#EFF6FF',
                color: '#3B82F6',
                border: '1px solid #BFDBFE',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
              }}
              title="Editar"
            >
              Editar
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(equipo);
              }}
              style={{
                padding: '6px 10px',
                backgroundColor: '#FEF2F2',
                color: '#EF4444',
                border: '1px solid #FECACA',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
              }}
              title="Eliminar"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={12} style={{ padding: 0, backgroundColor: '#F9FAFB' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
              {/* Info general */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
                    N° Serie
                  </div>
                  <div style={{ fontWeight: '500' }}>{equipo.serie}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
                    Placa / Inventario
                  </div>
                  <div style={{ fontWeight: '500' }}>{equipo.placa}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
                    Resolución
                  </div>
                  <div style={{ fontWeight: '500' }}>{equipo.resolucion || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
                    Responsable
                  </div>
                  <div style={{ fontWeight: '500' }}>{equipo.responsable}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
                    Fecha Adquisición
                  </div>
                  <div style={{ fontWeight: '500' }}>{formatDate(equipo.fecha_adquisicion)}</div>
                </div>
                {equipo.factor_calibracion && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
                      Factor de Calibración
                    </div>
                    <div style={{ fontWeight: '600', color: '#3B82F6', fontSize: '1.1rem' }}>
                      {equipo.factor_calibracion}
                    </div>
                  </div>
                )}
                {equipo.observaciones && (
                  <div style={{ gridColumn: 'span 4' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
                      Observaciones
                    </div>
                    <div style={{ fontStyle: 'italic' }}>{equipo.observaciones}</div>
                  </div>
                )}
              </div>

              {/* Sensores asociados (solo para equipos) */}
              {equipo.tipo === 'equipo' && equipo.sensoresAsociados?.length > 0 && (
                <SensoresAsociados
                  sensoresIds={equipo.sensoresAsociados}
                  todosEquipos={todosEquipos}
                  onSensorClick={onSensorClick}
                />
              )}

              {/* Tabs de histórico */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginTop: '20px',
                }}
              >
                {/* Histórico de Comprobaciones */}
                <div>
                  <h4
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '0.875rem',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                      }}
                    ></span>
                    Histórico de Comprobaciones ({comprobacionesEquipo.length})
                  </h4>

                  {comprobacionesEquipo.length === 0 ? (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        color: '#9CA3AF',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                      }}
                    >
                      Sin comprobaciones registradas
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <table
                        style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: '#F9FAFB' }}>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600' }}>
                              Fecha
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600' }}>
                              Tipo
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600' }}>
                              Resultado
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600' }}>
                              Responsable
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {comprobacionesEquipo.slice(0, 5).map(comp => (
                            <tr key={comp.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                              <td style={{ padding: '8px' }}>{formatDate(comp.fecha)}</td>
                              <td style={{ padding: '8px' }}>{comp.tipo}</td>
                              <td style={{ padding: '8px' }}>
                                <span
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor:
                                      comp.resultado === 'Conforme' ? '#D1FAE5' : '#FEE2E2',
                                    color: comp.resultado === 'Conforme' ? '#065F46' : '#991B1B',
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  {comp.resultado}
                                </span>
                              </td>
                              <td style={{ padding: '8px', color: '#6B7280' }}>
                                {comp.responsable}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {comprobacionesEquipo.length > 5 && (
                        <div
                          style={{
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: '#6B7280',
                            borderTop: '1px solid #E5E7EB',
                          }}
                        >
                          + {comprobacionesEquipo.length - 5} comprobaciones más
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Histórico de Calibraciones */}
                <div>
                  <h4
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '0.875rem',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#3B82F6',
                      }}
                    ></span>
                    Histórico de Calibraciones ({calibracionesEquipo.length})
                  </h4>

                  {calibracionesEquipo.length === 0 ? (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        color: '#9CA3AF',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                      }}
                    >
                      Sin calibraciones registradas
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <table
                        style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: '#F9FAFB' }}>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600' }}>
                              Fecha
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600' }}>
                              Laboratorio
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600' }}>
                              Certificado
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600' }}>
                              Factor
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600' }}>
                              Incert.
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {calibracionesEquipo.map(cal => (
                            <tr key={cal.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                              <td style={{ padding: '8px' }}>{formatDate(cal.fecha)}</td>
                              <td style={{ padding: '8px' }}>{cal.laboratorio}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{ color: '#3B82F6', cursor: 'pointer' }}>
                                  {cal.certificado}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: '8px',
                                  fontWeight: cal.factor ? '600' : '400',
                                  color: cal.factor ? '#3B82F6' : '#9CA3AF',
                                }}
                              >
                                {cal.factor || 'N/A'}
                              </td>
                              <td style={{ padding: '8px', fontSize: '0.75rem', color: '#6B7280' }}>
                                {cal.incertidumbre}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Equipos() {
  const { isBypassMode } = useGoogleAuth();

  const [equipos, setEquipos] = useState([]);
  const [comprobaciones, setComprobaciones] = useState([]);
  const [calibraciones, setCalibraciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedRows, setExpandedRows] = useState({});
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroUbicacion, setFiltroUbicacion] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Estados para modales CRUD
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState(null);
  const [editingSensor, setEditingSensor] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Función para recargar datos
  const reloadData = async () => {
    try {
      const [equiposRes, sensoresRes] = await Promise.all([EquiposAPI.list(), SensoresAPI.list()]);

      const todosEquipos = [
        ...(equiposRes || []).map(e => ({ ...e, tipo: 'equipo' })),
        ...(sensoresRes || []).map(s => ({ ...s, tipo: 'sensor' })),
      ];

      setEquipos(todosEquipos);
    } catch (err) {
      console.error('Error recargando equipos:', err);
      setError('Error al recargar los datos');
    }
  };

  // Handlers para Equipos
  const handleNewEquipo = () => {
    setEditingEquipo(null);
    setShowEquipoModal(true);
  };

  const handleEditEquipo = equipo => {
    setEditingEquipo(equipo);
    setShowEquipoModal(true);
  };

  const handleSaveEquipo = async formData => {
    setSaving(true);
    setError(null);
    try {
      if (editingEquipo) {
        // Actualizar equipo existente
        await EquiposAPI.update(editingEquipo.id, formData);
      } else {
        // Crear nuevo equipo
        await EquiposAPI.create(formData);
      }
      setShowEquipoModal(false);
      setEditingEquipo(null);
      await reloadData();
    } catch (err) {
      console.error('Error guardando equipo:', err);
      setError(err.message || 'Error al guardar el equipo');
    } finally {
      setSaving(false);
    }
  };

  // Handlers para Sensores
  const handleNewSensor = () => {
    setEditingSensor(null);
    setShowSensorModal(true);
  };

  const handleEditSensor = sensor => {
    setEditingSensor(sensor);
    setShowSensorModal(true);
  };

  const handleSaveSensor = async formData => {
    setSaving(true);
    setError(null);
    try {
      if (editingSensor) {
        // Actualizar sensor existente
        await SensoresAPI.update(editingSensor.id, formData);
      } else {
        // Crear nuevo sensor
        await SensoresAPI.create(formData);
      }
      setShowSensorModal(false);
      setEditingSensor(null);
      await reloadData();
    } catch (err) {
      console.error('Error guardando sensor:', err);
      setError(err.message || 'Error al guardar el sensor');
    } finally {
      setSaving(false);
    }
  };

  // Handler para editar (determina si es equipo o sensor)
  const handleEdit = item => {
    if (item.tipo === 'sensor') {
      handleEditSensor(item);
    } else {
      handleEditEquipo(item);
    }
  };

  // Handler para eliminar
  const handleDeleteClick = item => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setSaving(true);
    setError(null);
    try {
      if (itemToDelete.tipo === 'sensor') {
        await SensoresAPI.delete(itemToDelete.id);
      } else {
        await EquiposAPI.delete(itemToDelete.id);
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
      await reloadData();
    } catch (err) {
      console.error('Error eliminando:', err);
      setError(err.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  };
  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (isBypassMode) {
        await Promise.resolve();
        setEquipos(MOCK_EQUIPOS);
        setComprobaciones(MOCK_COMPROBACIONES);
        setCalibraciones(MOCK_CALIBRACIONES);
        setLoading(false);
      } else {
        try {
          // Cargar equipos desde API
          const [equiposRes, sensoresRes] = await Promise.all([
            EquiposAPI.list(),
            SensoresAPI.list(),
          ]);

          // Combinar equipos y sensores
          const todosEquipos = [
            ...(equiposRes || []).map(e => ({ ...e, tipo: 'equipo' })),
            ...(sensoresRes || []).map(s => ({ ...s, tipo: 'sensor' })),
          ];

          setEquipos(todosEquipos);
          // TODO: Cargar comprobaciones y calibraciones cuando se implementen en el backend
          setComprobaciones([]);
          setCalibraciones([]);
        } catch (err) {
          console.error('Error cargando equipos:', err);
          setEquipos([]);
          setComprobaciones([]);
          setCalibraciones([]);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [isBypassMode]);

  // Toggle fila expandida
  const toggleRow = id => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Expandir y scrollear a un sensor
  const handleSensorClick = sensorId => {
    setExpandedRows(prev => ({ ...prev, [sensorId]: true }));
    // Scroll al elemento
    setTimeout(() => {
      const element = document.getElementById(`equipo-${sensorId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Obtener ubicaciones únicas
  const ubicaciones = useMemo(() => {
    const unique = [...new Set(equipos.map(e => e.ubicacion))];
    return unique.sort();
  }, [equipos]);

  // Filtrar equipos
  const equiposFiltrados = useMemo(() => {
    return equipos.filter(e => {
      if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false;
      if (filtroEstado !== 'todos' && e.estado !== filtroEstado) return false;
      if (filtroUbicacion !== 'todos' && e.ubicacion !== filtroUbicacion) return false;
      if (busqueda) {
        const search = busqueda.toLowerCase();
        return (
          e.codigo.toLowerCase().includes(search) ||
          e.placa.toLowerCase().includes(search) ||
          e.nombre.toLowerCase().includes(search) ||
          e.marca.toLowerCase().includes(search) ||
          e.modelo.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [equipos, filtroTipo, filtroEstado, filtroUbicacion, busqueda]);

  // Estadísticas
  const stats = useMemo(() => {
    const porVencerCal = equipos.filter(e => {
      const dias = getDiasParaVencimiento(e.proxima_calibracion);
      return dias !== null && dias <= 30 && dias >= 0;
    }).length;

    const vencidosCal = equipos.filter(e => {
      const dias = getDiasParaVencimiento(e.proxima_calibracion);
      return dias !== null && dias < 0;
    }).length;

    return {
      total: equipos.length,
      equipos: equipos.filter(e => e.tipo === 'equipo').length,
      sensores: equipos.filter(e => e.tipo === 'sensor').length,
      operativos: equipos.filter(e => e.estado === 'operativo').length,
      enCalibracion: equipos.filter(e => e.estado === 'en_calibracion').length,
      fueraServicio: equipos.filter(e => e.estado === 'fuera_servicio').length,
      porVencerCal,
      vencidosCal,
    };
  }, [equipos]);

  if (loading) {
    return (
      <PageLayout title="Equipos">
        <div style={{ textAlign: 'center', padding: '48px' }}>Cargando equipos...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Equipos y Sensores">
      {/* Indicador modo bypass */}
      {isBypassMode && (
        <div
          style={{
            marginBottom: '16px',
            padding: '8px 12px',
            backgroundColor: '#FEF3C7',
            borderRadius: '6px',
            fontSize: '0.875rem',
          }}
        >
          Modo Demo - Datos de ejemplo
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>Total</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.total}</div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
            {stats.equipos} equipos, {stats.sensores} sensores
          </div>
        </div>
        <div
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
            Operativos
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981' }}>
            {stats.operativos}
          </div>
        </div>
        <div
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
            En Calibración
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>
            {stats.enCalibracion}
          </div>
        </div>
        <div
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
            Fuera de Servicio
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#EF4444' }}>
            {stats.fueraServicio}
          </div>
        </div>
        <div
          style={{
            padding: '16px',
            backgroundColor: stats.porVencerCal > 0 ? '#FEF3C7' : 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
            Cal. por Vencer
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>
            {stats.porVencerCal}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>próx. 30 días</div>
        </div>
        <div
          style={{
            padding: '16px',
            backgroundColor: stats.vencidosCal > 0 ? '#FEE2E2' : 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
            Cal. Vencidas
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#EF4444' }}>
            {stats.vencidosCal}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por código, placa, nombre, marca..."
          style={{
            flex: '1 1 200px',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #D1D5DB',
            fontSize: '0.875rem',
          }}
        />
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #D1D5DB',
            fontSize: '0.875rem',
          }}
        >
          <option value="todos">Todos los tipos</option>
          <option value="equipo">Equipos</option>
          <option value="sensor">Sensores</option>
        </select>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #D1D5DB',
            fontSize: '0.875rem',
          }}
        >
          <option value="todos">Todos los estados</option>
          <option value="operativo">Operativo</option>
          <option value="en_calibracion">En Calibración</option>
          <option value="fuera_servicio">Fuera de Servicio</option>
        </select>
        <select
          value={filtroUbicacion}
          onChange={e => setFiltroUbicacion(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #D1D5DB',
            fontSize: '0.875rem',
          }}
        >
          <option value="todos">Todas las ubicaciones</option>
          {ubicaciones.map(ub => (
            <option key={ub} value={ub}>
              {ub}
            </option>
          ))}
        </select>

        {/* Dropdown para nuevo equipo/sensor */}
        <NuevoDropdown onNewEquipo={handleNewEquipo} onNewSensor={handleNewSensor} />
      </div>

      {/* Mensaje de error */}
      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '6px',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991B1B',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Tabla de equipos */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th style={{ padding: '12px', width: '40px' }}></th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                  Código / Placa
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Nombre</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Tipo</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Marca</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Modelo</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Rango</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Ubicación</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Estado</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                  Próx. Calibración
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                  Próx. Comprob.
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equiposFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}
                  >
                    No se encontraron equipos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                equiposFiltrados.map(equipo => (
                  <EquipoRow
                    key={equipo.id}
                    equipo={equipo}
                    todosEquipos={equipos}
                    comprobaciones={comprobaciones}
                    calibraciones={calibraciones}
                    isExpanded={expandedRows[equipo.id]}
                    onToggle={() => toggleRow(equipo.id)}
                    onSensorClick={handleSensorClick}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#6B7280',
        }}
      >
        <strong>Nota:</strong> Haga clic en una fila para ver el histórico de comprobaciones,
        calibraciones y sensores asociados. Los indicadores de tiempo muestran:
        <span
          style={{
            marginLeft: '8px',
            padding: '2px 6px',
            backgroundColor: '#D1FAE5',
            color: '#065F46',
            borderRadius: '4px',
          }}
        >
          &gt;90d
        </span>
        <span
          style={{
            marginLeft: '4px',
            padding: '2px 6px',
            backgroundColor: '#DBEAFE',
            color: '#1D4ED8',
            borderRadius: '4px',
          }}
        >
          ≤90d
        </span>
        <span
          style={{
            marginLeft: '4px',
            padding: '2px 6px',
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            borderRadius: '4px',
          }}
        >
          &le;30d
        </span>
        <span
          style={{
            marginLeft: '4px',
            padding: '2px 6px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '4px',
          }}
        >
          Vencido
        </span>
      </div>

      {/* Modales CRUD */}
      <EquipoFormModal
        key={editingEquipo?.id || 'new-equipo'}
        isOpen={showEquipoModal}
        onClose={() => {
          setShowEquipoModal(false);
          setEditingEquipo(null);
        }}
        onSave={handleSaveEquipo}
        equipo={editingEquipo}
        loading={saving}
      />

      <SensorFormModal
        key={editingSensor?.id || 'new-sensor'}
        isOpen={showSensorModal}
        onClose={() => {
          setShowSensorModal(false);
          setEditingSensor(null);
        }}
        onSave={handleSaveSensor}
        sensor={editingSensor}
        loading={saving}
        equiposDisponibles={equipos.filter(e => e.tipo === 'equipo')}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        item={itemToDelete}
        loading={saving}
      />
    </PageLayout>
  );
}
