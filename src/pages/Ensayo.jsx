import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge, Modal } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import {
  EnsayosAPI,
  PersonalInternoAPI,
  ClientesAPI,
  ProyectosAPI,
  PerforacionesAPI,
  MuestrasAPI,
} from '../services/apiService';
import {
  TIPOS_ENSAYO,
  TIPOS_MUESTRA,
  getTipoMuestra,
  WORKFLOW_STATES_INFO,
  WORKFLOW_TRANSITIONS,
  getWorkflowInfo,
} from '../config';

// ============================================
// CONFIGURACIÓN DE COLUMNAS KANBAN
// ============================================

const KANBAN_COLUMNS = [
  {
    id: 'pendientes',
    titulo: 'Pendientes',
    estados: ['E1', 'E2'],
    color: '#F59E0B',
    descripcion: 'Sin programar / Programados',
  },
  {
    id: 'ejecucion',
    titulo: 'En Ejecución',
    estados: ['E6', 'E7', 'E8'],
    color: '#3B82F6',
    descripcion: 'Ejecutando / Procesando',
  },
  {
    id: 'revision',
    titulo: 'En Revisión',
    estados: ['E9', 'E10', 'E11'],
    color: '#8B5CF6',
    descripcion: 'Rev. Técnica / Coord. / Dir.',
  },
  {
    id: 'entrega',
    titulo: 'Entrega',
    estados: ['E12', 'E13', 'E14'],
    color: '#10B981',
    descripcion: 'Por enviar / Enviado / Entregado',
  },
  {
    id: 'otros',
    titulo: 'Otros',
    estados: ['E3', 'E4', 'E5'],
    color: '#EF4444',
    descripcion: 'Anulado / Repetición / Novedad',
  },
];

// ============================================
// HELPERS DE PERMISOS
// ============================================

const canChangeState = rol => ['admin', 'coordinador', 'tecnico'].includes(rol);
const canReassign = rol => ['admin', 'coordinador'].includes(rol);
const canApproveReject = rol => ['admin', 'coordinador'].includes(rol);
const canMarkAsNovedad = rol => ['admin', 'coordinador', 'tecnico'].includes(rol);
const isClienteRole = rol => rol === 'cliente';

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

  const handleSubmit = e => {
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
            <div>
              <strong>Estado actual:</strong>
            </div>
            <Badge color={getWorkflowInfo(estadoActual).color}>
              {estadoActual} - {getWorkflowInfo(estadoActual).nombre}
            </Badge>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Nuevo Estado *
            </label>
            <select
              value={nuevoEstado}
              onChange={e => setNuevoEstado(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
              }}
            >
              <option value="">Seleccionar...</option>
              {transicionesDisponibles.map(estado => {
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
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Comentario
            </label>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              rows={3}
              placeholder="Observaciones del cambio de estado..."
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
              disabled={!nuevoEstado}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#3B82F6',
                color: 'white',
                cursor: nuevoEstado ? 'pointer' : 'not-allowed',
              }}
            >
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

  const handleSubmit = e => {
    e.preventDefault();
    onMarcar(ensayo.id, razon);
    setRazon('');
  };

  if (!ensayo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Marcar como Novedad - ${ensayo.codigo}`}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FEF3C7',
              borderRadius: '8px',
              border: '1px solid #F59E0B',
            }}
          >
            <strong>Advertencia:</strong> Al marcar como novedad, el ensayo quedará pausado hasta
            que se resuelva el problema.
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Razón de la Novedad *
            </label>
            <textarea
              value={razon}
              onChange={e => setRazon(e.target.value)}
              required
              rows={4}
              placeholder="Describe detalladamente la razón de la novedad..."
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
              disabled={!razon.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#EAB308',
                color: 'white',
                cursor: razon.trim() ? 'pointer' : 'not-allowed',
              }}
            >
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

  const handleSubmit = e => {
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
              Técnico actual:{' '}
              {tecnicos.find(t => t.id === ensayo.tecnicoId)?.nombre || 'Sin asignar'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Nuevo Técnico *
            </label>
            <select
              value={tecnicoId}
              onChange={e => setTecnicoId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
              }}
            >
              <option value="">Seleccionar técnico...</option>
              {tecnicos.map(tec => (
                <option key={tec.id} value={tec.id}>
                  {tec.nombre} {tec.apellido}
                </option>
              ))}
            </select>
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
              disabled={!tecnicoId}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#3B82F6',
                color: 'white',
                cursor: tecnicoId ? 'pointer' : 'not-allowed',
              }}
            >
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
          <Badge color={estadoInfo.color}>
            {ensayo.workflow_state} - {estadoInfo.nombre}
          </Badge>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            padding: '16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
          }}
        >
          <div>
            <strong>Muestra:</strong> {ensayo.muestra}
          </div>
          <div>
            <strong>Norma:</strong> {ensayo.norma}
          </div>
          <div>
            <strong>Cliente:</strong> {cliente?.nombre || 'N/A'}
          </div>
          <div>
            <strong>Técnico:</strong>{' '}
            {tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'Sin asignar'}
          </div>
          <div>
            <strong>Fecha solicitud:</strong> {ensayo.fecha_solicitud}
          </div>
          <div>
            <strong>Fecha programada:</strong> {ensayo.fecha_programada || 'Sin programar'}
          </div>
        </div>

        {ensayo.novedad_razon && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FEF3C7',
              borderRadius: '8px',
              border: '1px solid #F59E0B',
            }}
          >
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
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
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

function EnsayoCard({
  ensayo,
  tecnicos,
  onClick,
  onCambiarEstado,
  onNovedad,
  onReasignar,
  userRole,
  isOwnEnsayo,
}) {
  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);
  const tecnico = tecnicos.find(t => t.id === ensayo.tecnicoId);
  const estadoInfo = getWorkflowInfo(ensayo.workflow_state);

  const showActions = !isClienteRole(userRole);
  const puedeAvanzar =
    canChangeState(userRole) && WORKFLOW_TRANSITIONS[ensayo.workflow_state]?.length > 0;
  const puedeNovedad =
    canMarkAsNovedad(userRole) && !['E3', 'E5', 'E15'].includes(ensayo.workflow_state);

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '8px',
        }}
      >
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
        <div
          style={{ fontSize: '0.7rem', color: '#EAB308', marginBottom: '8px', fontStyle: 'italic' }}
        >
          Novedad: {ensayo.novedad_razon.substring(0, 50)}...
        </div>
      )}

      {showActions && (
        <div
          style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}
          onClick={e => e.stopPropagation()}
        >
          {puedeAvanzar && (
            <button
              onClick={() => onCambiarEstado(ensayo)}
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
              Cambiar
            </button>
          )}
          {puedeNovedad && (
            <button
              onClick={() => onNovedad(ensayo)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#EAB308',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.7rem',
              }}
            >
              Novedad
            </button>
          )}
          {canReassign(userRole) && (
            <button
              onClick={() => onReasignar(ensayo)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '0.7rem',
              }}
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

function KanbanColumn({
  column,
  ensayos,
  tecnicos,
  userRole,
  userId,
  onCardClick,
  onCambiarEstado,
  onNovedad,
  onReasignar,
}) {
  const ensayosColumna = ensayos.filter(e => column.estados.includes(e.workflow_state));

  return (
    <div
      style={{
        flex: '1 1 200px',
        minWidth: '200px',
        maxWidth: '280px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: `3px solid ${column.color}`,
        }}
      >
        <span
          style={{
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
          }}
        >
          {ensayosColumna.length}
        </span>
        <div>
          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{column.titulo}</div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{column.descripcion}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {ensayosColumna.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#9CA3AF',
              padding: '24px 12px',
              fontSize: '0.875rem',
            }}
          >
            Sin ensayos
          </div>
        ) : (
          ensayosColumna.map(ensayo => (
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
// TABS DE VISTA
// ============================================

function ViewTabs({ activeView, onChangeView }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        backgroundColor: '#F3F4F6',
        padding: '4px',
        borderRadius: '8px',
        width: 'fit-content',
      }}
    >
      <button
        onClick={() => onChangeView('kanban')}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '0.875rem',
          backgroundColor: activeView === 'kanban' ? 'white' : 'transparent',
          color: activeView === 'kanban' ? '#1F2937' : '#6B7280',
          boxShadow: activeView === 'kanban' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        Tablero Kanban
      </button>
      <button
        onClick={() => onChangeView('hierarchy')}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '0.875rem',
          backgroundColor: activeView === 'hierarchy' ? 'white' : 'transparent',
          color: activeView === 'hierarchy' ? '#1F2937' : '#6B7280',
          boxShadow: activeView === 'hierarchy' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        Por Proyecto
      </button>
    </div>
  );
}

// ============================================
// FILA DE ENSAYO (PARA VISTA JERÁRQUICA)
// ============================================

function EnsayoRow({ ensayo, onClick, indentLevel = 2 }) {
  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);
  const estadoInfo = getWorkflowInfo(ensayo.workflow_state);
  const marginLeft = indentLevel === 3 ? '72px' : '48px';

  return (
    <div
      onClick={() => onClick(ensayo)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        marginLeft,
        backgroundColor: 'white',
        borderRadius: '6px',
        marginBottom: '4px',
        cursor: 'pointer',
        border: '1px solid #E5E7EB',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
    >
      {/* Estado Badge */}
      <Badge
        color={estadoInfo.color}
        style={{ minWidth: '40px', textAlign: 'center', fontSize: '0.7rem' }}
      >
        {ensayo.workflow_state}
      </Badge>

      {/* Código */}
      <span style={{ fontWeight: '600', fontSize: '0.85rem', minWidth: '120px', color: '#1F2937' }}>
        {ensayo.codigo}
      </span>

      {/* Tipo */}
      <span style={{ fontSize: '0.85rem', minWidth: '140px', color: '#374151' }}>
        {tipoEnsayo?.nombre || ensayo.tipo}
      </span>

      {/* Muestra */}
      <span
        style={{
          fontSize: '0.85rem',
          flex: 1,
          color: '#6B7280',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {ensayo.muestra}
      </span>

      {/* Norma */}
      <span style={{ fontSize: '0.75rem', minWidth: '80px', color: '#9CA3AF' }}>
        {ensayo.norma}
      </span>

      {/* Fecha */}
      <span style={{ fontSize: '0.75rem', minWidth: '90px', color: '#9CA3AF' }}>
        {ensayo.fecha_programada || ensayo.fecha_solicitud}
      </span>

      {/* Link al Sheet */}
      {ensayo.sheet_url ? (
        <a
          href={ensayo.sheet_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            backgroundColor: '#34A853',
            borderRadius: '4px',
            color: 'white',
            textDecoration: 'none',
            fontSize: '0.75rem',
          }}
          title="Abrir en Google Sheets"
        >
          &#128196;
        </a>
      ) : (
        <span
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D1D5DB',
          }}
        >
          -
        </span>
      )}
    </div>
  );
}

// ============================================
// NODO DE MUESTRA (PARA VISTA JERÁRQUICA)
// ============================================

function MuestraNode({ muestra, ensayos, isExpanded, onToggle, onEnsayoClick }) {
  const ensayosMuestra = ensayos.filter(e => e.muestraId === muestra.id);
  const tipoMuestra = getTipoMuestra(muestra.tipoMuestra);
  const profundidadDisplay = `${muestra.profundidadInicio.toFixed(1)}-${muestra.profundidadFin.toFixed(1)}m`;

  const countByState = ensayosMuestra.reduce((acc, e) => {
    acc[e.workflow_state] = (acc[e.workflow_state] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ marginBottom: '2px' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          marginLeft: '48px',
          backgroundColor: isExpanded ? '#FEF3C7' : '#FFFBEB',
          borderRadius: '5px',
          cursor: 'pointer',
          border: '1px solid',
          borderColor: isExpanded ? '#FCD34D' : '#FDE68A',
          transition: 'all 0.15s',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
            color: '#92400E',
          }}
        >
          &#9658;
        </span>
        <span style={{ fontSize: '0.9rem' }}>&#128205;</span>
        <span style={{ fontWeight: '500', fontSize: '0.85rem', color: '#92400E' }}>
          {muestra.codigo}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#B45309', fontFamily: 'monospace' }}>
          ({profundidadDisplay})
        </span>
        <span style={{ fontSize: '0.75rem', color: '#78350F', fontStyle: 'italic' }}>
          {tipoMuestra.nombre}
        </span>
        {muestra.descripcion && (
          <span
            style={{
              fontSize: '0.7rem',
              color: '#A16207',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            - {muestra.descripcion}
          </span>
        )}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.7rem',
            color: '#92400E',
            backgroundColor: '#FDE68A',
            padding: '2px 6px',
            borderRadius: '8px',
          }}
        >
          {ensayosMuestra.length} ensayos
        </span>
        {/* Mini badges de estados */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {Object.entries(countByState)
            .slice(0, 3)
            .map(([state, count]) => (
              <span
                key={state}
                style={{
                  fontSize: '0.6rem',
                  padding: '1px 5px',
                  borderRadius: '6px',
                  backgroundColor: getWorkflowInfo(state).color,
                  color: 'white',
                }}
              >
                {state}:{count}
              </span>
            ))}
        </div>
      </div>

      {/* Ensayos de la muestra */}
      {isExpanded && (
        <div style={{ marginTop: '2px' }}>
          {ensayosMuestra.length === 0 ? (
            <div
              style={{
                marginLeft: '72px',
                padding: '8px',
                color: '#9CA3AF',
                fontSize: '0.8rem',
                fontStyle: 'italic',
              }}
            >
              Sin ensayos en esta muestra
            </div>
          ) : (
            ensayosMuestra.map(ensayo => (
              <EnsayoRow key={ensayo.id} ensayo={ensayo} onClick={onEnsayoClick} indentLevel={3} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// NODO DE PERFORACIÓN (PARA VISTA JERÁRQUICA)
// ============================================

function PerforacionNode({
  perforacion,
  muestras,
  ensayos,
  isExpanded,
  onToggle,
  expandedMuestras,
  onToggleMuestra,
  onEnsayoClick,
}) {
  const muestrasPerforacion = muestras.filter(m => m.perforacionId === perforacion.id);
  const ensayosPerforacion = ensayos.filter(e => e.perforacionId === perforacion.id);
  const countByState = ensayosPerforacion.reduce((acc, e) => {
    acc[e.workflow_state] = (acc[e.workflow_state] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ marginBottom: '4px' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          marginLeft: '24px',
          backgroundColor: isExpanded ? '#EEF2FF' : '#F9FAFB',
          borderRadius: '6px',
          cursor: 'pointer',
          border: '1px solid',
          borderColor: isExpanded ? '#C7D2FE' : '#E5E7EB',
          transition: 'all 0.15s',
        }}
      >
        <span
          style={{
            fontSize: '0.85rem',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
          }}
        >
          &#9658;
        </span>
        <span style={{ fontSize: '1rem' }}>&#128193;</span>
        <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#374151' }}>
          {perforacion.codigo} - {perforacion.nombre}
        </span>
        {perforacion.profundidad && (
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
            ({perforacion.profundidad}m)
          </span>
        )}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.75rem',
            color: '#6B7280',
            backgroundColor: '#E5E7EB',
            padding: '2px 8px',
            borderRadius: '10px',
          }}
        >
          {muestrasPerforacion.length} muestras • {ensayosPerforacion.length} ensayos
        </span>
        {/* Mini badges de estados */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {Object.entries(countByState)
            .slice(0, 4)
            .map(([state, count]) => (
              <span
                key={state}
                style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  backgroundColor: getWorkflowInfo(state).color,
                  color: 'white',
                }}
              >
                {state}:{count}
              </span>
            ))}
        </div>
      </div>

      {/* Muestras de la perforación */}
      {isExpanded && (
        <div style={{ marginTop: '4px' }}>
          {muestrasPerforacion.length === 0 ? (
            <div
              style={{
                marginLeft: '48px',
                padding: '12px',
                color: '#9CA3AF',
                fontSize: '0.85rem',
                fontStyle: 'italic',
              }}
            >
              Sin muestras en esta perforación
            </div>
          ) : (
            muestrasPerforacion.map(muestra => (
              <MuestraNode
                key={muestra.id}
                muestra={muestra}
                ensayos={ensayos}
                isExpanded={expandedMuestras.includes(muestra.id)}
                onToggle={() => onToggleMuestra(muestra.id)}
                onEnsayoClick={onEnsayoClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// NODO DE PROYECTO (PARA VISTA JERÁRQUICA)
// ============================================

function ProyectoNode({
  proyecto,
  perforaciones,
  muestras,
  ensayos,
  expandedPerforaciones,
  expandedMuestras,
  onTogglePerforacion,
  onToggleMuestra,
  onEnsayoClick,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const perforacionesProyecto = perforaciones.filter(p => p.proyectoId === proyecto.id);
  const ensayosProyecto = ensayos.filter(e => e.proyectoId === proyecto.id);
  const muestrasProyecto = muestras.filter(m =>
    perforacionesProyecto.some(p => p.id === m.perforacionId)
  );

  const countByState = ensayosProyecto.reduce((acc, e) => {
    acc[e.workflow_state] = (acc[e.workflow_state] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: isExpanded ? '#DBEAFE' : '#F3F4F6',
          borderRadius: '8px',
          cursor: 'pointer',
          border: '1px solid',
          borderColor: isExpanded ? '#93C5FD' : '#E5E7EB',
          transition: 'all 0.15s',
        }}
      >
        <span
          style={{
            fontSize: '1rem',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
          }}
        >
          &#9658;
        </span>
        <span style={{ fontSize: '1.2rem' }}>&#128194;</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', fontSize: '1rem', color: '#1F2937' }}>
            {proyecto.codigo} - {proyecto.nombre}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{proyecto.clienteNombre}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.8rem',
              color: '#6B7280',
              backgroundColor: '#E5E7EB',
              padding: '4px 10px',
              borderRadius: '12px',
            }}
          >
            {perforacionesProyecto.length} perf. | {ensayosProyecto.length} ensayos
          </span>
          {/* Mini badges de estados */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {Object.entries(countByState)
              .slice(0, 5)
              .map(([state, count]) => (
                <span
                  key={state}
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    backgroundColor: getWorkflowInfo(state).color,
                    color: 'white',
                    fontWeight: '500',
                  }}
                >
                  {state}:{count}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Perforaciones del proyecto */}
      {isExpanded && (
        <div style={{ marginTop: '8px' }}>
          {perforacionesProyecto.length === 0 ? (
            <div
              style={{
                marginLeft: '24px',
                padding: '12px',
                color: '#9CA3AF',
                fontSize: '0.85rem',
                fontStyle: 'italic',
              }}
            >
              Sin perforaciones en este proyecto
            </div>
          ) : (
            perforacionesProyecto.map(perf => (
              <PerforacionNode
                key={perf.id}
                perforacion={perf}
                muestras={muestras}
                ensayos={ensayos}
                isExpanded={expandedPerforaciones.includes(perf.id)}
                onToggle={() => onTogglePerforacion(perf.id)}
                expandedMuestras={expandedMuestras}
                onToggleMuestra={onToggleMuestra}
                onEnsayoClick={onEnsayoClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// VISTA JERÁRQUICA COMPLETA
// ============================================

function HierarchyView({ proyectos, perforaciones, muestras, ensayos, onEnsayoClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPerforaciones, setExpandedPerforaciones] = useState([]);
  const [expandedMuestras, setExpandedMuestras] = useState([]);

  const handleTogglePerforacion = perfId => {
    setExpandedPerforaciones(prev =>
      prev.includes(perfId) ? prev.filter(id => id !== perfId) : [...prev, perfId]
    );
  };

  const handleToggleMuestra = muestraId => {
    setExpandedMuestras(prev =>
      prev.includes(muestraId) ? prev.filter(id => id !== muestraId) : [...prev, muestraId]
    );
  };

  // Filtrar ensayos por búsqueda
  const filteredEnsayos = useMemo(() => {
    if (!searchTerm.trim()) return ensayos;
    const term = searchTerm.toLowerCase();
    return ensayos.filter(
      e =>
        e.codigo.toLowerCase().includes(term) ||
        e.muestra.toLowerCase().includes(term) ||
        e.tipo.toLowerCase().includes(term) ||
        e.norma.toLowerCase().includes(term)
    );
  }, [ensayos, searchTerm]);

  // Obtener proyectos que tienen ensayos filtrados
  const proyectosConEnsayos = useMemo(() => {
    const proyectoIds = [...new Set(filteredEnsayos.map(e => e.proyectoId))];
    return proyectos.filter(p => proyectoIds.includes(p.id));
  }, [proyectos, filteredEnsayos]);

  // Expandir todas las perforaciones y muestras si hay búsqueda
  useEffect(() => {
    if (searchTerm.trim()) {
      const perforacionIds = [...new Set(filteredEnsayos.map(e => e.perforacionId))];
      const muestraIds = [...new Set(filteredEnsayos.map(e => e.muestraId).filter(Boolean))];
      setExpandedPerforaciones(perforacionIds);
      setExpandedMuestras(muestraIds);
    }
  }, [searchTerm, filteredEnsayos]);

  return (
    <div>
      {/* Barra de búsqueda */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Buscar por código, muestra, tipo o norma..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        {searchTerm && (
          <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: '#6B7280' }}>
            {filteredEnsayos.length} resultado(s)
          </span>
        )}
      </div>

      {/* Encabezado de columnas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px',
          marginLeft: '48px',
          marginBottom: '8px',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <span style={{ minWidth: '40px' }}>Estado</span>
        <span style={{ minWidth: '120px' }}>Código</span>
        <span style={{ minWidth: '140px' }}>Tipo</span>
        <span style={{ flex: 1 }}>Muestra</span>
        <span style={{ minWidth: '80px' }}>Norma</span>
        <span style={{ minWidth: '90px' }}>Fecha</span>
        <span style={{ width: '28px' }}>Sheet</span>
      </div>

      {/* Árbol de proyectos */}
      {proyectosConEnsayos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
          {searchTerm ? 'No se encontraron ensayos con ese criterio' : 'No hay ensayos disponibles'}
        </div>
      ) : (
        proyectosConEnsayos.map(proyecto => (
          <ProyectoNode
            key={proyecto.id}
            proyecto={proyecto}
            perforaciones={perforaciones}
            muestras={muestras}
            ensayos={filteredEnsayos}
            expandedPerforaciones={expandedPerforaciones}
            expandedMuestras={expandedMuestras}
            onTogglePerforacion={handleTogglePerforacion}
            onToggleMuestra={handleToggleMuestra}
            onEnsayoClick={onEnsayoClick}
          />
        ))
      )}
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Ensayo() {
  const { user } = useAuth();
  const userRole = user?.rol || 'tecnico';
  const userId = user?.id || null;

  const [ensayos, setEnsayos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [perforaciones, setPerforaciones] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vista activa
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'hierarchy'

  // Filtros
  const [soloMisEnsayos, setSoloMisEnsayos] = useState(userRole === 'tecnico');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Modales
  const [selectedEnsayo, setSelectedEnsayo] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showCambiarEstado, setShowCambiarEstado] = useState(false);
  const [showNovedad, setShowNovedad] = useState(false);
  const [showReasignar, setShowReasignar] = useState(false);

  // Cargar datos desde APIs
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ensayosRes, tecnicosRes, clientesRes, proyectosRes, perforacionesRes, muestrasRes] =
          await Promise.all([
            EnsayosAPI.list(),
            PersonalInternoAPI.list(),
            ClientesAPI.list(),
            ProyectosAPI.list(),
            PerforacionesAPI.list(),
            MuestrasAPI.list(),
          ]);

        setEnsayos(
          (ensayosRes || []).map(e => ({
            ...e,
            perforacionId: e.perforacion_id || e.perforacionId,
            proyectoId: e.proyecto_id || e.proyectoId,
            muestraId: e.muestra_id || e.muestraId,
            tecnicoId: e.tecnico_id || e.tecnicoId,
            tecnicoNombre: e.tecnico_nombre || e.tecnicoNombre,
          }))
        );
        // Map personal interno to tecnicos format (filter by cargo if needed)
        setTecnicos(
          (tecnicosRes || []).map(p => ({
            id: p.id,
            nombre: p.nombre,
            apellido: p.apellido,
            email: p.email,
            cargo: p.cargo,
          }))
        );
        setClientes(clientesRes || []);
        setProyectos(
          (proyectosRes || []).map(p => ({
            ...p,
            clienteId: p.cliente_id || p.clienteId,
            ensayosCotizados: p.ensayos_cotizados || p.ensayosCotizados || {},
          }))
        );
        setPerforaciones(
          (perforacionesRes || []).map(p => ({
            ...p,
            proyectoId: p.proyecto_id || p.proyectoId,
          }))
        );
        setMuestras(
          (muestrasRes || []).map(m => ({
            ...m,
            perforacionId: m.perforacion_id || m.perforacionId,
            profundidadInicio: m.profundidad_inicio ?? m.profundidadInicio ?? 0,
            profundidadFin: m.profundidad_fin ?? m.profundidadFin ?? 0,
            tipoMuestra: m.tipo_muestra || m.tipoMuestra || '',
          }))
        );
      } catch (err) {
        console.error('Error cargando datos de ensayos:', err);
        setEnsayos([]);
        setTecnicos([]);
        setClientes([]);
        setProyectos([]);
        setPerforaciones([]);
        setMuestras([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
  const handleCardClick = ensayo => {
    setSelectedEnsayo(ensayo);
    setShowDetalle(true);
  };

  const handleCambiarEstado = ensayo => {
    setSelectedEnsayo(ensayo);
    setShowCambiarEstado(true);
  };

  const handleNovedad = ensayo => {
    setSelectedEnsayo(ensayo);
    setShowNovedad(true);
  };

  const handleReasignar = ensayo => {
    setSelectedEnsayo(ensayo);
    setShowReasignar(true);
  };

  const handleCambiarEstadoSubmit = async (ensayoId, nuevoEstado, comentario) => {
    try {
      // Call API to update status
      await EnsayosAPI.updateStatus(ensayoId, nuevoEstado);

      // Update local state optimistically
      setEnsayos(
        ensayos.map(e => {
          if (e.id === ensayoId) {
            return {
              ...e,
              workflow_state: nuevoEstado,
              ultimo_comentario: comentario,
              novedad_razon: nuevoEstado === 'E5' ? e.novedad_razon : null,
            };
          }
          return e;
        })
      );
    } catch (err) {
      console.error('Error actualizando estado del ensayo:', err);
      alert('Error al cambiar el estado del ensayo');
    }
    setShowCambiarEstado(false);
    setSelectedEnsayo(null);
  };

  const handleNovedadSubmit = async (ensayoId, razon) => {
    try {
      // Update to novedad state (E5) with reason
      await EnsayosAPI.update(ensayoId, {
        workflow_state: 'E5',
        novedad_razon: razon,
      });

      setEnsayos(
        ensayos.map(e => {
          if (e.id === ensayoId) {
            return {
              ...e,
              workflow_state: 'E5',
              novedad_razon: razon,
            };
          }
          return e;
        })
      );
    } catch (err) {
      console.error('Error registrando novedad:', err);
      alert('Error al registrar la novedad');
    }
    setShowNovedad(false);
    setSelectedEnsayo(null);
  };

  const handleReasignarSubmit = async (ensayoId, tecnicoId) => {
    try {
      await EnsayosAPI.update(ensayoId, { tecnico_id: tecnicoId });

      setEnsayos(
        ensayos.map(e => {
          if (e.id === ensayoId) {
            return { ...e, tecnicoId };
          }
          return e;
        })
      );
    } catch (err) {
      console.error('Error reasignando ensayo:', err);
      alert('Error al reasignar el ensayo');
    }
    setShowReasignar(false);
    setSelectedEnsayo(null);
  };

  // Estadísticas
  const stats = useMemo(
    () => ({
      total: ensayosFiltrados.length,
      misPendientes: ensayosFiltrados.filter(
        e => e.tecnicoId === userId && ['E1', 'E2'].includes(e.workflow_state)
      ).length,
      misEnEjecucion: ensayosFiltrados.filter(
        e => e.tecnicoId === userId && ['E6', 'E7', 'E8'].includes(e.workflow_state)
      ).length,
      enRevision: ensayosFiltrados.filter(e => ['E9', 'E10', 'E11'].includes(e.workflow_state))
        .length,
      novedades: ensayosFiltrados.filter(e => e.workflow_state === 'E5').length,
    }),
    [ensayosFiltrados, userId]
  );

  if (loading) {
    return (
      <PageLayout title="Ensayos">
        <div style={{ textAlign: 'center', padding: '48px' }}>Cargando ensayos...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Ensayos">
      {/* Tabs de vista */}
      <ViewTabs activeView={viewMode} onChangeView={setViewMode} />

      {/* Barra de filtros y estadísticas */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isClienteRole(userRole) && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={soloMisEnsayos}
                onChange={e => setSoloMisEnsayos(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '0.875rem' }}>Solo mis ensayos</span>
            </label>
          )}

          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
            }}
          >
            <option value="todos">Todos los tipos</option>
            {TIPOS_ENSAYO.map(tipo => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem' }}>
          <span>
            <strong>{stats.total}</strong> ensayos
          </span>
          {!isClienteRole(userRole) && (
            <>
              <span style={{ color: '#F59E0B' }}>
                <strong>{stats.misPendientes}</strong> pendientes
              </span>
              <span style={{ color: '#3B82F6' }}>
                <strong>{stats.misEnEjecucion}</strong> en ejecución
              </span>
            </>
          )}
          <span style={{ color: '#8B5CF6' }}>
            <strong>{stats.enRevision}</strong> en revisión
          </span>
          {stats.novedades > 0 && (
            <span style={{ color: '#EF4444' }}>
              <strong>{stats.novedades}</strong> novedades
            </span>
          )}
        </div>
      </div>

      {/* Vista según tab seleccionado */}
      {viewMode === 'kanban' ? (
        <>
          {/* Tablero Kanban */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '16px',
              minHeight: 'calc(100vh - 350px)',
            }}
          >
            {KANBAN_COLUMNS.map(column => (
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
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '0.875rem' }}>
              Leyenda de Estados:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(WORKFLOW_STATES_INFO).map(([code, info]) => (
                <span
                  key={code}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: info.color,
                    }}
                  ></span>
                  <span>
                    {code}: {info.nombre}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Vista Jerárquica */
        <HierarchyView
          proyectos={proyectos}
          perforaciones={perforaciones}
          muestras={muestras}
          ensayos={ensayosFiltrados}
          onEnsayoClick={handleCardClick}
        />
      )}

      {/* Modales */}
      <DetalleEnsayoModal
        isOpen={showDetalle}
        onClose={() => {
          setShowDetalle(false);
          setSelectedEnsayo(null);
        }}
        ensayo={selectedEnsayo}
        tecnicos={tecnicos}
        clientes={clientes}
      />

      <CambiarEstadoModal
        isOpen={showCambiarEstado}
        onClose={() => {
          setShowCambiarEstado(false);
          setSelectedEnsayo(null);
        }}
        ensayo={selectedEnsayo}
        onCambiar={handleCambiarEstadoSubmit}
        userRole={userRole}
      />

      <NovedadModal
        isOpen={showNovedad}
        onClose={() => {
          setShowNovedad(false);
          setSelectedEnsayo(null);
        }}
        ensayo={selectedEnsayo}
        onMarcar={handleNovedadSubmit}
      />

      <ReasignarModal
        isOpen={showReasignar}
        onClose={() => {
          setShowReasignar(false);
          setSelectedEnsayo(null);
        }}
        ensayo={selectedEnsayo}
        tecnicos={tecnicos}
        onReasignar={handleReasignarSubmit}
      />
    </PageLayout>
  );
}
