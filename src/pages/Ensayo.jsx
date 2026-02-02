import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge, Modal } from '../components/ui';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { 
  TIPOS_ENSAYO, 
  WORKFLOW_STATES_INFO,
  WORKFLOW_TRANSITIONS,
  getWorkflowInfo,
} from '../config';

// ============================================
// DATOS MOCK PARA MODO BYPASS
// ============================================

const MOCK_TECNICOS = [
  { id: 'tec-001', nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos@lab.com' },
  { id: 'tec-002', nombre: 'María', apellido: 'González', email: 'maria@lab.com' },
  { id: 'tec-003', nombre: 'Juan', apellido: 'Pérez', email: 'juan@lab.com' },
];

const MOCK_ENSAYOS = [
  // Sin programar
  { id: 'ens-001', codigo: 'ENS-2025-001', tipo: 'traccion', workflow_state: 'E1', muestra: 'Acero A36 - Viga V1', proyectoId: 'pry-001', clienteId: 'cli-001', tecnicoId: null, norma: 'ASTM E8', fecha_solicitud: '2025-01-20' },
  { id: 'ens-002', codigo: 'ENS-2025-002', tipo: 'dureza', workflow_state: 'E1', muestra: 'Acero A36 - Viga V2', proyectoId: 'pry-001', clienteId: 'cli-001', tecnicoId: null, norma: 'ASTM E18', fecha_solicitud: '2025-01-21' },
  
  // Programados
  { id: 'ens-003', codigo: 'ENS-2025-003', tipo: 'traccion', workflow_state: 'E2', muestra: 'Acero 1045 - Eje', proyectoId: 'pry-002', clienteId: 'cli-002', tecnicoId: 'tec-001', norma: 'ASTM E8', fecha_solicitud: '2025-01-18', fecha_programada: '2025-01-25' },
  
  // En ejecución
  { id: 'ens-004', codigo: 'ENS-2025-004', tipo: 'impacto', workflow_state: 'E6', muestra: 'Acero A572 - Placa', proyectoId: 'pry-001', clienteId: 'cli-001', tecnicoId: 'tec-001', norma: 'ASTM E23', fecha_solicitud: '2025-01-15', fecha_programada: '2025-01-22' },
  { id: 'ens-005', codigo: 'ENS-2025-005', tipo: 'quimico_oes', workflow_state: 'E6', muestra: 'Fundición Gris', proyectoId: 'pry-002', clienteId: 'cli-002', tecnicoId: 'tec-002', norma: 'ASTM E415', fecha_solicitud: '2025-01-16' },
  
  // Procesamiento
  { id: 'ens-006', codigo: 'ENS-2025-006', tipo: 'metalografia', workflow_state: 'E8', muestra: 'Acero Inox 304', proyectoId: 'pry-001', clienteId: 'cli-001', tecnicoId: 'tec-001', norma: 'ASTM E3', fecha_solicitud: '2025-01-10' },
  
  // Revisión técnica
  { id: 'ens-007', codigo: 'ENS-2025-007', tipo: 'traccion', workflow_state: 'E9', muestra: 'Aluminio 6061', proyectoId: 'pry-002', clienteId: 'cli-002', tecnicoId: 'tec-002', norma: 'ASTM E8', fecha_solicitud: '2025-01-08' },
  
  // Revisión coordinación
  { id: 'ens-008', codigo: 'ENS-2025-008', tipo: 'dureza', workflow_state: 'E10', muestra: 'Acero 4140', proyectoId: 'pry-001', clienteId: 'cli-001', tecnicoId: 'tec-001', norma: 'ASTM E18', fecha_solicitud: '2025-01-05' },
  
  // Por enviar
  { id: 'ens-009', codigo: 'ENS-2025-009', tipo: 'compresion', workflow_state: 'E12', muestra: 'Concreto 3000psi', proyectoId: 'pry-002', clienteId: 'cli-002', tecnicoId: 'tec-003', norma: 'ASTM C39', fecha_solicitud: '2025-01-02' },
  
  // Novedad
  { id: 'ens-010', codigo: 'ENS-2025-010', tipo: 'ultrasonido', workflow_state: 'E5', muestra: 'Soldadura T1', proyectoId: 'pry-001', clienteId: 'cli-001', tecnicoId: 'tec-001', norma: 'ASTM E114', fecha_solicitud: '2025-01-12', novedad_razon: 'Muestra presenta defectos superficiales que impiden el ensayo' },
];

const MOCK_CLIENTES = [
  { id: 'cli-001', nombre: 'Constructora ABC' },
  { id: 'cli-002', nombre: 'Minera del Norte' },
];

// ============================================
// CONFIGURACIÓN DE COLUMNAS KANBAN
// ============================================

const KANBAN_COLUMNS = [
  { 
    id: 'pendientes', 
    titulo: 'Pendientes', 
    estados: ['E1', 'E2'],
    color: '#F59E0B',
    descripcion: 'Sin programar / Programados'
  },
  { 
    id: 'ejecucion', 
    titulo: 'En Ejecución', 
    estados: ['E6', 'E7', 'E8'],
    color: '#3B82F6',
    descripcion: 'Ejecutando / Procesando'
  },
  { 
    id: 'revision', 
    titulo: 'En Revisión', 
    estados: ['E9', 'E10', 'E11'],
    color: '#8B5CF6',
    descripcion: 'Rev. Técnica / Coord. / Dir.'
  },
  { 
    id: 'entrega', 
    titulo: 'Entrega', 
    estados: ['E12', 'E13', 'E14'],
    color: '#10B981',
    descripcion: 'Por enviar / Enviado / Entregado'
  },
  { 
    id: 'otros', 
    titulo: 'Otros', 
    estados: ['E3', 'E4', 'E5'],
    color: '#EF4444',
    descripcion: 'Anulado / Repetición / Novedad'
  },
];

// ============================================
// HELPERS DE PERMISOS
// ============================================

const canChangeState = (rol) => ['admin', 'coordinador', 'tecnico'].includes(rol);
const canReassign = (rol) => ['admin', 'coordinador'].includes(rol);
const canApproveReject = (rol) => ['admin', 'coordinador'].includes(rol);
const canMarkAsNovedad = (rol) => ['admin', 'coordinador', 'tecnico'].includes(rol);
const isClienteRole = (rol) => rol === 'cliente';

// ============================================
// MODAL: CAMBIAR ESTADO
// ============================================

function CambiarEstadoModal({ isOpen, onClose, ensayo, onCambiar, userRole }) {
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [comentario, setComentario] = useState('');

  const estadoActual = ensayo?.workflow_state || 'E1';
  const transicionesPermitidas = WORKFLOW_TRANSITIONS[estadoActual] || [];
  
  // Filtrar transiciones según el rol
  const transicionesDisponibles = transicionesPermitidas.filter(estado => {
    // Técnico no puede aprobar revisiones (E9→E10, E10→E11)
    if (userRole === 'tecnico' && ['E10', 'E11', 'E12'].includes(estado)) {
      return false;
    }
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCambiar(ensayo.id, nuevoEstado, comentario);
    setNuevoEstado('');
    setComentario('');
  };

  if (!ensayo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cambiar Estado - ${ensayo.codigo}`}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
            <div><strong>Estado actual:</strong></div>
            <Badge color={getWorkflowInfo(estadoActual).color}>
              {estadoActual} - {getWorkflowInfo(estadoActual).nombre}
            </Badge>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Nuevo Estado *</label>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
            >
              <option value="">Seleccionar...</option>
              {transicionesDisponibles.map((estado) => {
                const info = getWorkflowInfo(estado);
                return (
                  <option key={estado} value={estado}>
                    {estado} - {info.nombre}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Comentario</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              placeholder="Observaciones del cambio de estado..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: 'white', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={!nuevoEstado} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#3B82F6', color: 'white', cursor: nuevoEstado ? 'pointer' : 'not-allowed' }}>
              Cambiar Estado
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// MODAL: MARCAR COMO NOVEDAD
// ============================================

function NovedadModal({ isOpen, onClose, ensayo, onMarcar }) {
  const [razon, setRazon] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onMarcar(ensayo.id, razon);
    setRazon('');
  };

  if (!ensayo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Marcar como Novedad - ${ensayo.codigo}`}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px', border: '1px solid #F59E0B' }}>
            <strong>Advertencia:</strong> Al marcar como novedad, el ensayo quedará pausado hasta que se resuelva el problema.
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Razón de la Novedad *</label>
            <textarea
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              required
              rows={4}
              placeholder="Describe detalladamente la razón de la novedad..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: 'white', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={!razon.trim()} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#EAB308', color: 'white', cursor: razon.trim() ? 'pointer' : 'not-allowed' }}>
              Marcar como Novedad
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// MODAL: REASIGNAR TÉCNICO
// ============================================

function ReasignarModal({ isOpen, onClose, ensayo, tecnicos, onReasignar }) {
  const [tecnicoId, setTecnicoId] = useState(ensayo?.tecnicoId || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onReasignar(ensayo.id, tecnicoId);
  };

  if (!ensayo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reasignar Técnico - ${ensayo.codigo}`}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
            <strong>Ensayo:</strong> {ensayo.muestra}
            <div style={{ marginTop: '4px', fontSize: '0.875rem', color: '#6B7280' }}>
              Técnico actual: {tecnicos.find(t => t.id === ensayo.tecnicoId)?.nombre || 'Sin asignar'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Nuevo Técnico *</label>
            <select
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D1D5DB' }}
            >
              <option value="">Seleccionar técnico...</option>
              {tecnicos.map((tec) => (
                <option key={tec.id} value={tec.id}>
                  {tec.nombre} {tec.apellido}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: 'white', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={!tecnicoId} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#3B82F6', color: 'white', cursor: tecnicoId ? 'pointer' : 'not-allowed' }}>
              Reasignar
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ============================================
// MODAL: DETALLE DE ENSAYO
// ============================================

function DetalleEnsayoModal({ isOpen, onClose, ensayo, tecnicos, clientes }) {
  if (!ensayo) return null;

  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);
  const tecnico = tecnicos.find(t => t.id === ensayo.tecnicoId);
  const cliente = clientes.find(c => c.id === ensayo.clienteId);
  const estadoInfo = getWorkflowInfo(ensayo.workflow_state);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalle - ${ensayo.codigo}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{tipoEnsayo?.nombre || ensayo.tipo}</h3>
          <Badge color={estadoInfo.color}>{ensayo.workflow_state} - {estadoInfo.nombre}</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
          <div><strong>Muestra:</strong> {ensayo.muestra}</div>
          <div><strong>Norma:</strong> {ensayo.norma}</div>
          <div><strong>Cliente:</strong> {cliente?.nombre || 'N/A'}</div>
          <div><strong>Técnico:</strong> {tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'Sin asignar'}</div>
          <div><strong>Fecha solicitud:</strong> {ensayo.fecha_solicitud}</div>
          <div><strong>Fecha programada:</strong> {ensayo.fecha_programada || 'Sin programar'}</div>
        </div>

        {ensayo.novedad_razon && (
          <div style={{ padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px', border: '1px solid #F59E0B' }}>
            <strong>Novedad:</strong>
            <div style={{ marginTop: '4px' }}>{ensayo.novedad_razon}</div>
          </div>
        )}

        {ensayo.spreadsheet_url && (
          <a
            href={ensayo.spreadsheet_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#34A853',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Abrir hoja de datos en Google Sheets
          </a>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: 'white', cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// TARJETA DE ENSAYO (KANBAN)
// ============================================

function EnsayoCard({ ensayo, tecnicos, onClick, onCambiarEstado, onNovedad, onReasignar, userRole, isOwnEnsayo }) {
  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);
  const tecnico = tecnicos.find(t => t.id === ensayo.tecnicoId);
  const estadoInfo = getWorkflowInfo(ensayo.workflow_state);
  
  const showActions = !isClienteRole(userRole);
  const puedeAvanzar = canChangeState(userRole) && WORKFLOW_TRANSITIONS[ensayo.workflow_state]?.length > 0;
  const puedeNovedad = canMarkAsNovedad(userRole) && !['E3', 'E5', 'E15'].includes(ensayo.workflow_state);

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: isOwnEnsayo ? '2px solid #3B82F6' : '1px solid #E5E7EB',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{ensayo.codigo}</div>
        <Badge color={estadoInfo.color} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
          {ensayo.workflow_state}
        </Badge>
      </div>
      
      <div style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '4px' }}>
        {tipoEnsayo?.nombre || ensayo.tipo}
      </div>
      
      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '8px' }}>
        {ensayo.muestra}
      </div>

      {tecnico && (
        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '8px' }}>
          Técnico: {tecnico.nombre} {tecnico.apellido}
        </div>
      )}

      {ensayo.novedad_razon && (
        <div style={{ fontSize: '0.7rem', color: '#EAB308', marginBottom: '8px', fontStyle: 'italic' }}>
          Novedad: {ensayo.novedad_razon.substring(0, 50)}...
        </div>
      )}

      {showActions && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
          {puedeAvanzar && (
            <button
              onClick={() => onCambiarEstado(ensayo)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#3B82F6', color: 'white', cursor: 'pointer', fontSize: '0.7rem' }}
            >
              Cambiar
            </button>
          )}
          {puedeNovedad && (
            <button
              onClick={() => onNovedad(ensayo)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#EAB308', color: 'white', cursor: 'pointer', fontSize: '0.7rem' }}
            >
              Novedad
            </button>
          )}
          {canReassign(userRole) && (
            <button
              onClick={() => onReasignar(ensayo)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D1D5DB', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.7rem' }}
            >
              Reasignar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// COLUMNA KANBAN
// ============================================

function KanbanColumn({ column, ensayos, tecnicos, userRole, userId, onCardClick, onCambiarEstado, onNovedad, onReasignar }) {
  const ensayosColumna = ensayos.filter(e => column.estados.includes(e.workflow_state));

  return (
    <div style={{ 
      flex: '1 1 200px', 
      minWidth: '200px',
      maxWidth: '280px',
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#F3F4F6',
      borderRadius: '8px',
      padding: '12px',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: `3px solid ${column.color}`,
      }}>
        <span style={{ 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          backgroundColor: column.color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '600',
        }}>
          {ensayosColumna.length}
        </span>
        <div>
          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{column.titulo}</div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{column.descripcion}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {ensayosColumna.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 12px', fontSize: '0.875rem' }}>
            Sin ensayos
          </div>
        ) : (
          ensayosColumna.map((ensayo) => (
            <EnsayoCard
              key={ensayo.id}
              ensayo={ensayo}
              tecnicos={tecnicos}
              userRole={userRole}
              isOwnEnsayo={ensayo.tecnicoId === userId}
              onClick={() => onCardClick(ensayo)}
              onCambiarEstado={onCambiarEstado}
              onNovedad={onNovedad}
              onReasignar={onReasignar}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Ensayo() {
  const { user, isBypassMode } = useGoogleAuth();
  const userRole = user?.rol || 'tecnico';
  const userId = user?.id || 'demo-user-001';

  const [ensayos, setEnsayos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [soloMisEnsayos, setSoloMisEnsayos] = useState(userRole === 'tecnico');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Modales
  const [selectedEnsayo, setSelectedEnsayo] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showCambiarEstado, setShowCambiarEstado] = useState(false);
  const [showNovedad, setShowNovedad] = useState(false);
  const [showReasignar, setShowReasignar] = useState(false);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (isBypassMode) {
        // Pequeño delay para evitar warning de setState sincrónico
        await Promise.resolve();
        setEnsayos(MOCK_ENSAYOS);
        setTecnicos(MOCK_TECNICOS);
        setClientes(MOCK_CLIENTES);
        setLoading(false);
      } else {
        // TODO: Cargar desde API real
        setLoading(false);
      }
    };
    loadData();
  }, [isBypassMode]);

  // Filtrar ensayos
  const ensayosFiltrados = useMemo(() => {
    return ensayos.filter(e => {
      if (soloMisEnsayos && e.tecnicoId !== userId) return false;
      if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false;
      // Cliente solo ve ensayos de sus proyectos
      if (isClienteRole(userRole) && e.clienteId !== user?.clienteId) return false;
      return true;
    });
  }, [ensayos, soloMisEnsayos, filtroTipo, userId, userRole, user?.clienteId]);

  // Handlers
  const handleCardClick = (ensayo) => {
    setSelectedEnsayo(ensayo);
    setShowDetalle(true);
  };

  const handleCambiarEstado = (ensayo) => {
    setSelectedEnsayo(ensayo);
    setShowCambiarEstado(true);
  };

  const handleNovedad = (ensayo) => {
    setSelectedEnsayo(ensayo);
    setShowNovedad(true);
  };

  const handleReasignar = (ensayo) => {
    setSelectedEnsayo(ensayo);
    setShowReasignar(true);
  };

  const handleCambiarEstadoSubmit = (ensayoId, nuevoEstado, comentario) => {
    setEnsayos(ensayos.map(e => {
      if (e.id === ensayoId) {
        return {
          ...e,
          workflow_state: nuevoEstado,
          ultimo_comentario: comentario,
          novedad_razon: nuevoEstado === 'E5' ? e.novedad_razon : null, // Limpiar novedad si cambia de estado
        };
      }
      return e;
    }));
    setShowCambiarEstado(false);
    setSelectedEnsayo(null);
  };

  const handleNovedadSubmit = (ensayoId, razon) => {
    setEnsayos(ensayos.map(e => {
      if (e.id === ensayoId) {
        return {
          ...e,
          workflow_state: 'E5',
          novedad_razon: razon,
        };
      }
      return e;
    }));
    setShowNovedad(false);
    setSelectedEnsayo(null);
  };

  const handleReasignarSubmit = (ensayoId, tecnicoId) => {
    setEnsayos(ensayos.map(e => {
      if (e.id === ensayoId) {
        return { ...e, tecnicoId };
      }
      return e;
    }));
    setShowReasignar(false);
    setSelectedEnsayo(null);
  };

  // Estadísticas
  const stats = useMemo(() => ({
    total: ensayosFiltrados.length,
    misPendientes: ensayosFiltrados.filter(e => e.tecnicoId === userId && ['E1', 'E2'].includes(e.workflow_state)).length,
    misEnEjecucion: ensayosFiltrados.filter(e => e.tecnicoId === userId && ['E6', 'E7', 'E8'].includes(e.workflow_state)).length,
    enRevision: ensayosFiltrados.filter(e => ['E9', 'E10', 'E11'].includes(e.workflow_state)).length,
    novedades: ensayosFiltrados.filter(e => e.workflow_state === 'E5').length,
  }), [ensayosFiltrados, userId]);

  if (loading) {
    return (
      <PageLayout title="Ensayos">
        <div style={{ textAlign: 'center', padding: '48px' }}>Cargando ensayos...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Ensayos">
      {/* Indicador de modo y rol */}
      {isBypassMode && (
        <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: '#FEF3C7', borderRadius: '6px', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Modo Demo - Rol: <strong>{userRole}</strong></span>
          <span style={{ color: '#92400E' }}>
            {canChangeState(userRole) && '✓ Cambiar estado '}
            {canReassign(userRole) && '✓ Reasignar '}
            {canApproveReject(userRole) && '✓ Aprobar/Rechazar '}
            {isClienteRole(userRole) && '✓ Solo lectura'}
          </span>
        </div>
      )}

      {/* Barra de filtros y estadísticas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isClienteRole(userRole) && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={soloMisEnsayos}
                onChange={(e) => setSoloMisEnsayos(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '0.875rem' }}>Solo mis ensayos</span>
            </label>
          )}
          
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '0.875rem' }}
          >
            <option value="todos">Todos los tipos</option>
            {TIPOS_ENSAYO.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem' }}>
          <span><strong>{stats.total}</strong> ensayos</span>
          {!isClienteRole(userRole) && (
            <>
              <span style={{ color: '#F59E0B' }}><strong>{stats.misPendientes}</strong> pendientes</span>
              <span style={{ color: '#3B82F6' }}><strong>{stats.misEnEjecucion}</strong> en ejecución</span>
            </>
          )}
          <span style={{ color: '#8B5CF6' }}><strong>{stats.enRevision}</strong> en revisión</span>
          {stats.novedades > 0 && (
            <span style={{ color: '#EF4444' }}><strong>{stats.novedades}</strong> novedades</span>
          )}
        </div>
      </div>

      {/* Tablero Kanban */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        overflowX: 'auto', 
        paddingBottom: '16px',
        minHeight: 'calc(100vh - 300px)',
      }}>
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            ensayos={ensayosFiltrados}
            tecnicos={tecnicos}
            userRole={userRole}
            userId={userId}
            onCardClick={handleCardClick}
            onCambiarEstado={handleCambiarEstado}
            onNovedad={handleNovedad}
            onReasignar={handleReasignar}
          />
        ))}
      </div>

      {/* Leyenda de estados */}
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
        <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '0.875rem' }}>Leyenda de Estados:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.entries(WORKFLOW_STATES_INFO).map(([code, info]) => (
            <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: info.color }}></span>
              <span>{code}: {info.nombre}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Modales */}
      <DetalleEnsayoModal
        isOpen={showDetalle}
        onClose={() => { setShowDetalle(false); setSelectedEnsayo(null); }}
        ensayo={selectedEnsayo}
        tecnicos={tecnicos}
        clientes={clientes}
      />

      <CambiarEstadoModal
        isOpen={showCambiarEstado}
        onClose={() => { setShowCambiarEstado(false); setSelectedEnsayo(null); }}
        ensayo={selectedEnsayo}
        onCambiar={handleCambiarEstadoSubmit}
        userRole={userRole}
      />

      <NovedadModal
        isOpen={showNovedad}
        onClose={() => { setShowNovedad(false); setSelectedEnsayo(null); }}
        ensayo={selectedEnsayo}
        onMarcar={handleNovedadSubmit}
      />

      <ReasignarModal
        isOpen={showReasignar}
        onClose={() => { setShowReasignar(false); setSelectedEnsayo(null); }}
        ensayo={selectedEnsayo}
        tecnicos={tecnicos}
        onReasignar={handleReasignarSubmit}
      />
    </PageLayout>
  );
}
