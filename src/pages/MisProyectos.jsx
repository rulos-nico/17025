import { useState, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge, Card, Modal } from '../components/ui';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { 
  TIPOS_ENSAYO, 
  ESTADO_PROYECTO, 
  ESTADO_MUESTRA,
  getWorkflowInfo,
} from '../config';

// ============================================
// DATOS MOCK - Portal del Cliente
// ============================================

const MOCK_PROYECTOS_CLIENTE = [
  {
    id: 'pry-1',
    codigo: 'PRY-2025-001',
    nombre: 'Caracterización Acero Estructural - Edificio Torre Norte',
    descripcion: 'Ensayos mecánicos y químicos para certificación de acero estructural',
    clienteId: 'cli-1',
    estado: 'activo',
    fecha_inicio: '2025-01-10',
    fecha_fin_estimada: '2025-02-15',
    ensayos_cotizados: [
      { tipo: 'traccion', cantidad: 15 },
      { tipo: 'dureza', cantidad: 20 },
      { tipo: 'quimico_oes', cantidad: 10 },
    ],
  },
  {
    id: 'pry-2',
    codigo: 'PRY-2025-002',
    nombre: 'Control de Calidad - Lote Pernos A325',
    descripcion: 'Verificación de propiedades mecánicas según ASTM A325',
    clienteId: 'cli-1',
    estado: 'activo',
    fecha_inicio: '2025-01-15',
    fecha_fin_estimada: '2025-01-30',
    ensayos_cotizados: [
      { tipo: 'traccion', cantidad: 8 },
      { tipo: 'dureza', cantidad: 12 },
    ],
  },
  {
    id: 'pry-3',
    codigo: 'PRY-2024-089',
    nombre: 'Certificación Soldadura - Proyecto Minero',
    descripcion: 'Ensayos destructivos de probetas de soldadura',
    clienteId: 'cli-1',
    estado: 'completado',
    fecha_inicio: '2024-11-01',
    fecha_fin_estimada: '2024-12-15',
    fecha_fin_real: '2024-12-10',
    ensayos_cotizados: [
      { tipo: 'traccion', cantidad: 24 },
      { tipo: 'impacto', cantidad: 48 },
      { tipo: 'dureza', cantidad: 24 },
    ],
  },
];

const MOCK_PERFORACIONES_CLIENTE = [
  // Proyecto 1 - Acero Estructural
  { id: 'per-1', codigo: 'M-001', proyectoId: 'pry-1', descripcion: 'Viga Principal HEB-300', ubicacion: 'Nivel +12.00', estado: 'en_proceso', fecha_recepcion: '2025-01-12' },
  { id: 'per-2', codigo: 'M-002', proyectoId: 'pry-1', descripcion: 'Columna C-15 HEB-400', ubicacion: 'Eje A-5', estado: 'en_proceso', fecha_recepcion: '2025-01-12' },
  { id: 'per-3', codigo: 'M-003', proyectoId: 'pry-1', descripcion: 'Placa Base 25mm', ubicacion: 'Fundación F-3', estado: 'pendiente', fecha_recepcion: '2025-01-18' },
  { id: 'per-4', codigo: 'M-004', proyectoId: 'pry-1', descripcion: 'Viga Secundaria IPE-270', ubicacion: 'Nivel +8.00', estado: 'completado', fecha_recepcion: '2025-01-10' },
  
  // Proyecto 2 - Pernos
  { id: 'per-5', codigo: 'P-001', proyectoId: 'pry-2', descripcion: 'Pernos A325 3/4" x 3"', ubicacion: 'Lote A', estado: 'en_proceso', fecha_recepcion: '2025-01-16' },
  { id: 'per-6', codigo: 'P-002', proyectoId: 'pry-2', descripcion: 'Pernos A325 1" x 4"', ubicacion: 'Lote B', estado: 'pendiente', fecha_recepcion: '2025-01-20' },
  
  // Proyecto 3 - Soldadura (completado)
  { id: 'per-7', codigo: 'S-001', proyectoId: 'pry-3', descripcion: 'Probeta Soldadura FCAW', ubicacion: 'Junta J-01', estado: 'completado', fecha_recepcion: '2024-11-05' },
  { id: 'per-8', codigo: 'S-002', proyectoId: 'pry-3', descripcion: 'Probeta Soldadura SMAW', ubicacion: 'Junta J-02', estado: 'completado', fecha_recepcion: '2024-11-05' },
];

const MOCK_ENSAYOS_CLIENTE = [
  // Ensayos Proyecto 1
  { id: 'ens-c1', codigo: 'ENS-2025-0101', tipo: 'traccion', perforacionId: 'per-1', proyectoId: 'pry-1', muestra: 'Viga Principal HEB-300', norma: 'ASTM E8', workflow_state: 'E6', fecha_solicitud: '2025-01-13', fecha_programada: '2025-01-20', urgente: false, historial_workflow: [{ de: null, a: 'E1', fecha: '2025-01-13T10:00:00' }, { de: 'E1', a: 'E2', fecha: '2025-01-14T09:00:00' }, { de: 'E2', a: 'E6', fecha: '2025-01-20T08:30:00' }] },
  { id: 'ens-c2', codigo: 'ENS-2025-0102', tipo: 'dureza', perforacionId: 'per-1', proyectoId: 'pry-1', muestra: 'Viga Principal HEB-300', norma: 'ASTM E18', workflow_state: 'E12', fecha_solicitud: '2025-01-13', fecha_programada: '2025-01-18', urgente: false, historial_workflow: [{ de: null, a: 'E1', fecha: '2025-01-13T10:00:00' }, { de: 'E1', a: 'E2', fecha: '2025-01-14T09:00:00' }, { de: 'E2', a: 'E6', fecha: '2025-01-18T08:00:00' }, { de: 'E6', a: 'E8', fecha: '2025-01-18T14:00:00' }, { de: 'E8', a: 'E9', fecha: '2025-01-19T09:00:00' }, { de: 'E9', a: 'E10', fecha: '2025-01-20T10:00:00' }, { de: 'E10', a: 'E11', fecha: '2025-01-21T11:00:00' }, { de: 'E11', a: 'E12', fecha: '2025-01-22T09:00:00' }] },
  { id: 'ens-c3', codigo: 'ENS-2025-0103', tipo: 'quimico_oes', perforacionId: 'per-1', proyectoId: 'pry-1', muestra: 'Viga Principal HEB-300', norma: 'ASTM E415', workflow_state: 'E9', fecha_solicitud: '2025-01-13', fecha_programada: '2025-01-19', urgente: true, historial_workflow: [{ de: null, a: 'E1', fecha: '2025-01-13T10:00:00' }, { de: 'E1', a: 'E2', fecha: '2025-01-14T09:00:00' }, { de: 'E2', a: 'E6', fecha: '2025-01-19T08:00:00' }, { de: 'E6', a: 'E8', fecha: '2025-01-19T15:00:00' }, { de: 'E8', a: 'E9', fecha: '2025-01-20T10:00:00' }] },
  { id: 'ens-c4', codigo: 'ENS-2025-0104', tipo: 'traccion', perforacionId: 'per-2', proyectoId: 'pry-1', muestra: 'Columna C-15 HEB-400', norma: 'ASTM E8', workflow_state: 'E2', fecha_solicitud: '2025-01-14', fecha_programada: '2025-01-25', urgente: false, historial_workflow: [{ de: null, a: 'E1', fecha: '2025-01-14T11:00:00' }, { de: 'E1', a: 'E2', fecha: '2025-01-15T09:00:00' }] },
  { id: 'ens-c5', codigo: 'ENS-2025-0105', tipo: 'dureza', perforacionId: 'per-2', proyectoId: 'pry-1', muestra: 'Columna C-15 HEB-400', norma: 'ASTM E18', workflow_state: 'E1', fecha_solicitud: '2025-01-14', urgente: false, historial_workflow: [{ de: null, a: 'E1', fecha: '2025-01-14T11:00:00' }] },
  { id: 'ens-c6', codigo: 'ENS-2025-0106', tipo: 'traccion', perforacionId: 'per-4', proyectoId: 'pry-1', muestra: 'Viga Secundaria IPE-270', norma: 'ASTM E8', workflow_state: 'E14', fecha_solicitud: '2025-01-10', fecha_programada: '2025-01-15', urgente: false, historial_workflow: [{ de: null, a: 'E1', fecha: '2025-01-10T09:00:00' }, { de: 'E1', a: 'E2', fecha: '2025-01-10T14:00:00' }, { de: 'E2', a: 'E6', fecha: '2025-01-15T08:00:00' }, { de: 'E6', a: 'E8', fecha: '2025-01-15T16:00:00' }, { de: 'E8', a: 'E9', fecha: '2025-01-16T09:00:00' }, { de: 'E9', a: 'E10', fecha: '2025-01-17T10:00:00' }, { de: 'E10', a: 'E11', fecha: '2025-01-18T11:00:00' }, { de: 'E11', a: 'E12', fecha: '2025-01-19T09:00:00' }, { de: 'E12', a: 'E13', fecha: '2025-01-20T10:00:00' }, { de: 'E13', a: 'E14', fecha: '2025-01-21T14:00:00' }] },
  
  // Ensayos Proyecto 2
  { id: 'ens-c7', codigo: 'ENS-2025-0201', tipo: 'traccion', perforacionId: 'per-5', proyectoId: 'pry-2', muestra: 'Pernos A325 3/4" x 3"', norma: 'ASTM A325', workflow_state: 'E8', fecha_solicitud: '2025-01-17', fecha_programada: '2025-01-22', urgente: false, historial_workflow: [{ de: null, a: 'E1', fecha: '2025-01-17T10:00:00' }, { de: 'E1', a: 'E2', fecha: '2025-01-17T15:00:00' }, { de: 'E2', a: 'E6', fecha: '2025-01-22T08:00:00' }, { de: 'E6', a: 'E8', fecha: '2025-01-22T16:00:00' }] },
  { id: 'ens-c8', codigo: 'ENS-2025-0202', tipo: 'dureza', perforacionId: 'per-5', proyectoId: 'pry-2', muestra: 'Pernos A325 3/4" x 3"', norma: 'ASTM E18', workflow_state: 'E6', fecha_solicitud: '2025-01-17', fecha_programada: '2025-01-23', urgente: false, historial_workflow: [{ de: null, a: 'E1', fecha: '2025-01-17T10:00:00' }, { de: 'E1', a: 'E2', fecha: '2025-01-17T15:00:00' }, { de: 'E2', a: 'E6', fecha: '2025-01-23T08:00:00' }] },
  
  // Ensayos Proyecto 3 (completado)
  { id: 'ens-c9', codigo: 'ENS-2024-8901', tipo: 'traccion', perforacionId: 'per-7', proyectoId: 'pry-3', muestra: 'Probeta Soldadura FCAW', norma: 'AWS D1.1', workflow_state: 'E15', fecha_solicitud: '2024-11-06', fecha_programada: '2024-11-15', urgente: false, historial_workflow: [] },
  { id: 'ens-c10', codigo: 'ENS-2024-8902', tipo: 'impacto', perforacionId: 'per-7', proyectoId: 'pry-3', muestra: 'Probeta Soldadura FCAW', norma: 'ASTM E23', workflow_state: 'E15', fecha_solicitud: '2024-11-06', fecha_programada: '2024-11-16', urgente: false, historial_workflow: [] },
  { id: 'ens-c11', codigo: 'ENS-2024-8903', tipo: 'dureza', perforacionId: 'per-7', proyectoId: 'pry-3', muestra: 'Probeta Soldadura FCAW', norma: 'ASTM E18', workflow_state: 'E15', fecha_solicitud: '2024-11-06', fecha_programada: '2024-11-14', urgente: false, historial_workflow: [] },
];

// ============================================
// MODAL: SOLICITAR ENSAYO
// ============================================

function SolicitarEnsayoModal({ isOpen, onClose, onCreate, muestra, proyecto, loading }) {
  const [form, setForm] = useState({
    tipo: '',
    norma: '',
    cantidad: 1,
    urgente: false,
    observaciones: '',
  });

  // Obtener tipos de ensayo disponibles según cotización del proyecto
  const tiposDisponibles = useMemo(() => {
    if (!proyecto?.ensayos_cotizados) return TIPOS_ENSAYO;
    const tiposCotizados = proyecto.ensayos_cotizados.map(e => e.tipo);
    return TIPOS_ENSAYO.filter(t => tiposCotizados.includes(t.id));
  }, [proyecto]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...form,
      perforacionId: muestra.id,
      proyectoId: proyecto.id,
      muestra: muestra.descripcion,
    });
    setForm({ tipo: '', norma: '', cantidad: 1, urgente: false, observaciones: '' });
  };

  const tipoSeleccionado = TIPOS_ENSAYO.find(t => t.id === form.tipo);

  // Verificar disponibilidad según cotización
  const getCotizacionInfo = (tipoId) => {
    if (!proyecto?.ensayos_cotizados) return null;
    return proyecto.ensayos_cotizados.find(e => e.tipo === tipoId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitar Ensayo" width="550px">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Info de contexto */}
          <div style={{ padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Proyecto</div>
            <div style={{ fontWeight: '600' }}>{proyecto?.nombre}</div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '8px' }}>Muestra</div>
            <div style={{ fontWeight: '500' }}>{muestra?.descripcion}</div>
            {muestra?.ubicacion && (
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{muestra.ubicacion}</div>
            )}
          </div>

          {/* Tipo de ensayo */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Tipo de Ensayo *
            </label>
            <select
              value={form.tipo}
              onChange={(e) => {
                const tipo = TIPOS_ENSAYO.find(t => t.id === e.target.value);
                setForm({ ...form, tipo: e.target.value, norma: tipo?.norma || '' });
              }}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
            >
              <option value="">Seleccionar tipo de ensayo...</option>
              {tiposDisponibles.map((tipo) => {
                const cotizacion = getCotizacionInfo(tipo.id);
                return (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre} {cotizacion ? `(${cotizacion.cantidad} cotizados)` : ''}
                  </option>
                );
              })}
            </select>
            {tipoSeleccionado && (
              <div style={{ marginTop: '4px', fontSize: '0.875rem', color: '#6B7280' }}>
                Categoria: {tipoSeleccionado.categoria} | Norma sugerida: {tipoSeleccionado.norma}
              </div>
            )}
          </div>

          {/* Norma */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Norma de Referencia
            </label>
            <input
              type="text"
              value={form.norma}
              onChange={(e) => setForm({ ...form, norma: e.target.value })}
              placeholder="Ej: ASTM E8, ASTM E18, ISO 6892-1"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
            />
          </div>

          {/* Cantidad y Urgente */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Cantidad de probetas
              </label>
              <input
                type="number"
                min="1"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.urgente}
                  onChange={(e) => setForm({ ...form, urgente: e.target.checked })}
                  style={{ marginRight: '8px', width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: '500', color: form.urgente ? '#DC2626' : '#374151' }}>
                  Urgente
                </span>
              </label>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Observaciones / Requerimientos especiales
            </label>
            <textarea
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              rows={3}
              placeholder="Condiciones especiales, temperatura de ensayo, criterios de aceptacion..."
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #D1D5DB', resize: 'vertical' }}
            />
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: 'white', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !form.tipo}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: (!form.tipo || loading) ? '#9CA3AF' : '#10B981',
                color: 'white',
                cursor: (!form.tipo || loading) ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              {loading ? 'Enviando...' : 'Solicitar Ensayo'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// DETALLE DE ENSAYO (vista cliente)
// ============================================

function EnsayoDetalleCliente({ ensayo, onClose }) {
  const workflow = getWorkflowInfo(ensayo.workflow_state);
  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);

  // Determinar progreso visual
  const getProgreso = () => {
    const estados = ['E1', 'E2', 'E6', 'E8', 'E9', 'E10', 'E11', 'E12', 'E13', 'E14', 'E15'];
    const idx = estados.indexOf(ensayo.workflow_state);
    if (idx === -1) return 10; // Estados especiales (E3, E4, E5)
    return Math.round((idx / (estados.length - 1)) * 100);
  };

  // Obtener etapa amigable para el cliente
  const getEtapaCliente = () => {
    const state = ensayo.workflow_state;
    if (['E1', 'E2'].includes(state)) return { texto: 'En espera de ejecucion', icono: 'clock' };
    if (['E6', 'E7', 'E8'].includes(state)) return { texto: 'Ensayo en ejecucion', icono: 'gear' };
    if (['E9', 'E10', 'E11'].includes(state)) return { texto: 'En revision de calidad', icono: 'check' };
    if (['E12'].includes(state)) return { texto: 'Listo para envio', icono: 'send' };
    if (['E13'].includes(state)) return { texto: 'Enviado - Revise su correo', icono: 'mail' };
    if (['E14', 'E15'].includes(state)) return { texto: 'Entregado', icono: 'done' };
    if (['E3'].includes(state)) return { texto: 'Anulado', icono: 'cancel' };
    if (['E4'].includes(state)) return { texto: 'En repeticion', icono: 'refresh' };
    if (['E5'].includes(state)) return { texto: 'En revision por novedad', icono: 'alert' };
    return { texto: workflow.nombre, icono: 'info' };
  };

  const etapa = getEtapaCliente();

  return (
    <Modal isOpen={true} onClose={onClose} title={`Ensayo ${ensayo.codigo}`} width="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Estado actual - Vista simplificada para cliente */}
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: workflow.color, marginBottom: '8px' }}>
            {etapa.texto}
          </div>
          <Badge color={workflow.color}>{workflow.nombre}</Badge>
          
          {/* Barra de progreso */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
              <span>Solicitado</span>
              <span>En proceso</span>
              <span>Completado</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${getProgreso()}%`,
                  backgroundColor: workflow.color,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px', textAlign: 'right' }}>
              {getProgreso()}% completado
            </div>
          </div>
        </div>

        {/* Informacion del ensayo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Tipo de Ensayo</div>
            <div style={{ fontWeight: '500' }}>{tipoEnsayo?.nombre || ensayo.tipo}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Norma</div>
            <div style={{ fontWeight: '500' }}>{ensayo.norma || 'No especificada'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Fecha Solicitud</div>
            <div style={{ fontWeight: '500' }}>{ensayo.fecha_solicitud}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Fecha Programada</div>
            <div style={{ fontWeight: '500' }}>{ensayo.fecha_programada || 'Pendiente'}</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Muestra</div>
            <div style={{ fontWeight: '500' }}>{ensayo.muestra}</div>
          </div>
        </div>

        {/* Historial simplificado - Solo estados relevantes para cliente */}
        {ensayo.historial_workflow && ensayo.historial_workflow.length > 0 && (
          <div>
            <h4 style={{ marginBottom: '12px', fontSize: '0.875rem', color: '#374151' }}>Seguimiento</h4>
            <div style={{ maxHeight: '150px', overflow: 'auto' }}>
              {ensayo.historial_workflow.slice().reverse().map((h, index) => {
                const infoEstado = getWorkflowInfo(h.a);
                return (
                  <div
                    key={index}
                    style={{
                      padding: '8px 12px',
                      borderLeft: '3px solid ' + (infoEstado.color || '#6B7280'),
                      backgroundColor: index === 0 ? '#EFF6FF' : '#F9FAFB',
                      marginBottom: '8px',
                      borderRadius: '0 4px 4px 0',
                    }}
                  >
                    <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{infoEstado.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {new Date(h.fecha).toLocaleDateString('es-CL', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {/* Boton descargar reporte si esta disponible */}
          {['E13', 'E14', 'E15'].includes(ensayo.workflow_state) && (
            <button
              onClick={() => alert('Funcionalidad de descarga pendiente de implementar')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#3B82F6',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Descargar Reporte
            </button>
          )}
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: 'white', cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// COMPONENTE PRINCIPAL: PORTAL CLIENTE
// ============================================

export default function MisProyectos() {
  const { user } = useGoogleAuth();
  
  // Estado con datos mock
  const [proyectos] = useState(MOCK_PROYECTOS_CLIENTE);
  const [perforaciones, setPerforaciones] = useState(MOCK_PERFORACIONES_CLIENTE);
  const [ensayos, setEnsayos] = useState(MOCK_ENSAYOS_CLIENTE);
  const [loading] = useState(false);

  // Seleccion actual
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [selectedMuestra, setSelectedMuestra] = useState(null);
  const [selectedEnsayo, setSelectedEnsayo] = useState(null);

  // Modal
  const [showSolicitar, setShowSolicitar] = useState(false);

  // Filtro de proyectos
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Proyectos filtrados
  const proyectosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return proyectos;
    return proyectos.filter(p => p.estado === filtroEstado);
  }, [proyectos, filtroEstado]);

  // Solicitar ensayo (mock)
  const handleSolicitarEnsayo = (data) => {
    const nuevoEnsayo = {
      id: `ens-new-${Date.now()}`,
      codigo: `ENS-2025-${String(ensayos.length + 1).padStart(4, '0')}`,
      tipo: data.tipo,
      perforacionId: data.perforacionId,
      proyectoId: data.proyectoId,
      muestra: data.muestra,
      norma: data.norma,
      workflow_state: 'E1',
      fecha_solicitud: new Date().toISOString().split('T')[0],
      urgente: data.urgente,
      observaciones: data.observaciones,
      historial_workflow: [{ de: null, a: 'E1', fecha: new Date().toISOString() }],
    };
    
    setEnsayos([...ensayos, nuevoEnsayo]);
    setShowSolicitar(false);
    
    // Actualizar estado de la muestra si es primera solicitud
    const muestraActual = perforaciones.find(p => p.id === data.perforacionId);
    if (muestraActual && muestraActual.estado === 'pendiente') {
      setPerforaciones(perforaciones.map(p => 
        p.id === data.perforacionId ? { ...p, estado: 'en_proceso' } : p
      ));
    }
  };

  // Datos relacionados
  const muestrasProyecto = selectedProyecto
    ? perforaciones.filter(p => p.proyectoId === selectedProyecto.id)
    : [];

  const ensayosMuestra = selectedMuestra
    ? ensayos.filter(e => e.perforacionId === selectedMuestra.id)
    : [];

  // Stats generales
  const stats = useMemo(() => {
    const pendientes = ensayos.filter(e => ['E1', 'E2'].includes(e.workflow_state)).length;
    const enProceso = ensayos.filter(e => ['E6', 'E7', 'E8', 'E9', 'E10', 'E11'].includes(e.workflow_state)).length;
    const listos = ensayos.filter(e => ['E12'].includes(e.workflow_state)).length;
    const completados = ensayos.filter(e => ['E13', 'E14', 'E15'].includes(e.workflow_state)).length;
    return { pendientes, enProceso, listos, completados, total: ensayos.length };
  }, [ensayos]);

  return (
    <PageLayout title="Mis Proyectos">
      {/* Mensaje de bienvenida */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
        <div style={{ fontWeight: '600', color: '#1E40AF' }}>
          Bienvenido, {user?.name || 'Cliente'}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#3B82F6', marginTop: '4px' }}>
          Desde aqui puede ver el estado de sus proyectos, muestras y solicitar nuevos ensayos.
        </div>
      </div>

      {/* Resumen superior */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <Card>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase' }}>Proyectos</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#374151' }}>
            {proyectos.filter(p => p.estado === 'activo').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10B981' }}>activos</div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase' }}>Pendientes</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#F59E0B' }}>
            {stats.pendientes}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>por ejecutar</div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase' }}>En Proceso</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#3B82F6' }}>
            {stats.enProceso}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>ejecutando</div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase' }}>Listos</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#14B8A6' }}>
            {stats.listos}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>por enviar</div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase' }}>Entregados</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10B981' }}>
            {stats.completados}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>finalizados</div>
        </Card>
      </div>

      {/* Filtro de proyectos */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        {['todos', 'activo', 'completado'].map(estado => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid ' + (filtroEstado === estado ? '#3B82F6' : '#D1D5DB'),
              backgroundColor: filtroEstado === estado ? '#EFF6FF' : 'white',
              color: filtroEstado === estado ? '#3B82F6' : '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: filtroEstado === estado ? '500' : '400',
            }}
          >
            {estado === 'todos' ? 'Todos' : estado.charAt(0).toUpperCase() + estado.slice(1)}
          </button>
        ))}
      </div>

      {/* Vista principal en 3 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '24px', minHeight: '500px' }}>
        
        {/* COLUMNA 1: PROYECTOS */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Proyectos</span>
            <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 'normal' }}>
              ({proyectosFiltrados.length})
            </span>
          </h3>
          
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {proyectosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
                No tiene proyectos {filtroEstado !== 'todos' ? filtroEstado + 's' : ''}
              </div>
            ) : (
              proyectosFiltrados.map((proyecto) => {
                const estado = ESTADO_PROYECTO[proyecto.estado] || { label: proyecto.estado, color: '#6B7280' };
                const numMuestras = perforaciones.filter(p => p.proyectoId === proyecto.id).length;
                const numEnsayos = ensayos.filter(e => e.proyectoId === proyecto.id).length;
                
                return (
                  <Card
                    key={proyecto.id}
                    onClick={() => {
                      setSelectedProyecto(proyecto);
                      setSelectedMuestra(null);
                    }}
                    selected={selectedProyecto?.id === proyecto.id}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#6B7280' }}>
                          {proyecto.codigo}
                        </div>
                        <div style={{ fontWeight: '500', marginTop: '2px', fontSize: '0.9rem' }}>{proyecto.nombre}</div>
                      </div>
                      <Badge color={estado.color}>{estado.label}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.75rem', color: '#6B7280' }}>
                      <span>{numMuestras} muestras</span>
                      <span>{numEnsayos} ensayos</span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA 2: MUESTRAS */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>
            Muestras
            {selectedProyecto && (
              <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 'normal', marginLeft: '8px' }}>
                ({muestrasProyecto.length})
              </span>
            )}
          </h3>
          
          {!selectedProyecto ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '2rem', opacity: 0.3 }}>&#8592;</div>
              <div>Seleccione un proyecto</div>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {muestrasProyecto.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
                  No hay muestras registradas
                </div>
              ) : (
                muestrasProyecto.map((muestra) => {
                  const estado = ESTADO_MUESTRA[muestra.estado] || { label: muestra.estado, color: '#6B7280' };
                  const numEnsayos = ensayos.filter(e => e.perforacionId === muestra.id).length;
                  
                  return (
                    <Card
                      key={muestra.id}
                      onClick={() => setSelectedMuestra(muestra)}
                      selected={selectedMuestra?.id === muestra.id}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{muestra.codigo}</div>
                          <div style={{ fontSize: '0.875rem', marginTop: '2px' }}>{muestra.descripcion}</div>
                          {muestra.ubicacion && (
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                              {muestra.ubicacion}
                            </div>
                          )}
                        </div>
                        <Badge color={estado.color}>{estado.label}</Badge>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6B7280' }}>
                        {numEnsayos} ensayos solicitados
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* COLUMNA 3: ENSAYOS */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>
              Ensayos
              {selectedMuestra && (
                <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 'normal', marginLeft: '8px' }}>
                  ({ensayosMuestra.length})
                </span>
              )}
            </h3>
            {selectedMuestra && selectedProyecto?.estado === 'activo' && (
              <button
                onClick={() => setShowSolicitar(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#10B981',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                }}
              >
                + Solicitar Ensayo
              </button>
            )}
          </div>
          
          {!selectedMuestra ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '2rem', opacity: 0.3 }}>&#8592;</div>
              <div>Seleccione una muestra</div>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ensayosMuestra.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <p style={{ color: '#6B7280', marginBottom: '16px' }}>No hay ensayos solicitados</p>
                  {selectedProyecto?.estado === 'activo' && (
                    <button
                      onClick={() => setShowSolicitar(true)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#10B981',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      Solicitar primer ensayo
                    </button>
                  )}
                </div>
              ) : (
                ensayosMuestra.map((ensayo) => {
                  const workflow = getWorkflowInfo(ensayo.workflow_state);
                  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);
                  
                  return (
                    <Card
                      key={ensayo.id}
                      onClick={() => setSelectedEnsayo(ensayo)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600' }}>{ensayo.codigo}</div>
                          <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {tipoEnsayo?.nombre || ensayo.tipo}
                          </div>
                          {ensayo.norma && (
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                              Norma: {ensayo.norma}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <Badge color={workflow.color}>{workflow.nombre}</Badge>
                          {ensayo.urgente && (
                            <Badge color="#DC2626">Urgente</Badge>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          Solicitado: {ensayo.fecha_solicitud}
                        </span>
                        {ensayo.fecha_programada && (
                          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            Prog: {ensayo.fecha_programada}
                          </span>
                        )}
                      </div>
                      {/* Indicador de descarga disponible */}
                      {['E13', 'E14', 'E15'].includes(ensayo.workflow_state) && (
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '6px 10px', 
                          backgroundColor: '#D1FAE5', 
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: '#065F46',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}>
                          Reporte disponible para descarga
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Solicitar Ensayo */}
      {selectedMuestra && selectedProyecto && (
        <SolicitarEnsayoModal
          isOpen={showSolicitar}
          onClose={() => setShowSolicitar(false)}
          onCreate={handleSolicitarEnsayo}
          muestra={selectedMuestra}
          proyecto={selectedProyecto}
          loading={loading}
        />
      )}

      {/* Modal Detalle Ensayo */}
      {selectedEnsayo && (
        <EnsayoDetalleCliente
          ensayo={selectedEnsayo}
          onClose={() => setSelectedEnsayo(null)}
        />
      )}
    </PageLayout>
  );
}
