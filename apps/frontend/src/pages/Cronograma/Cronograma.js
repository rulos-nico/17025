import { useState } from 'react'
import './Cronograma.css'

function Cronograma() {
  const [eventos] = useState([
    {
      id: 1,
      titulo: 'Auditoría Interna',
      tipo: 'Auditoría',
      fecha: '2026-01-15',
      horaInicio: '09:00',
      horaFin: '17:00',
      responsable: 'Dra. Ana Martínez',
      ubicacion: 'Instalaciones del Laboratorio',
      estado: 'Planificado',
      descripcion: 'Auditoría interna de cumplimiento ISO 17025'
    },
    {
      id: 2,
      titulo: 'Calibración de Equipos - Balanzas',
      tipo: 'Calibración',
      fecha: '2025-12-20',
      horaInicio: '10:00',
      horaFin: '14:00',
      responsable: 'Ing. Carlos Rodríguez',
      ubicacion: 'Sala de Pesaje',
      estado: 'Próximo',
      descripcion: 'Calibración externa de balanzas analíticas'
    },
    {
      id: 3,
      titulo: 'Capacitación: Nuevas Técnicas Analíticas',
      tipo: 'Capacitación',
      fecha: '2026-01-08',
      horaInicio: '14:00',
      horaFin: '18:00',
      responsable: 'Dr. Juan Pérez',
      ubicacion: 'Sala de Conferencias',
      estado: 'Planificado',
      descripcion: 'Capacitación sobre técnicas de espectrometría'
    },
    {
      id: 4,
      titulo: 'Mantenimiento Preventivo - Autoclave',
      tipo: 'Mantenimiento',
      fecha: '2025-12-22',
      horaInicio: '08:00',
      horaFin: '12:00',
      responsable: 'Técnico Externo',
      ubicacion: 'Sala de Esterilización',
      estado: 'Próximo',
      descripcion: 'Mantenimiento preventivo programado'
    },
    {
      id: 5,
      titulo: 'Revisión de Procedimientos',
      tipo: 'Reunión',
      fecha: '2025-12-18',
      horaInicio: '15:00',
      horaFin: '17:00',
      responsable: 'Todo el equipo',
      ubicacion: 'Sala de Reuniones',
      estado: 'Hoy',
      descripcion: 'Revisión trimestral de POEs'
    }
  ])

  const [vistaActual, setVistaActual] = useState('lista') // 'lista' o 'calendario'

  const getEstadoBadge = (estado) => {
    const badges = {
      'Hoy': 'badge-info',
      'Próximo': 'badge-warning',
      'Planificado': 'badge-success',
      'Completado': 'badge-success',
      'Cancelado': 'badge-danger'
    }
    return `badge ${badges[estado] || 'badge-info'}`
  }

  const getTipoIcon = (tipo) => {
    const icons = {
      'Auditoría': '🔍',
      'Calibración': '📊',
      'Capacitación': '📚',
      'Mantenimiento': '🔧',
      'Reunión': '👥',
      'Ensayo': '🧪'
    }
    return icons[tipo] || '📅'
  }

  return (
    <div className="cronograma">
      <div className="page-header">
        <div>
          <h1>Cronograma de Actividades</h1>
          <p>Planificación y seguimiento de actividades del laboratorio</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`btn btn-outline ${vistaActual === 'lista' ? 'active' : ''}`}
              onClick={() => setVistaActual('lista')}
            >
              📋 Lista
            </button>
            <button
              className={`btn btn-outline ${vistaActual === 'calendario' ? 'active' : ''}`}
              onClick={() => setVistaActual('calendario')}
            >
              📅 Calendario
            </button>
          </div>
          <button className="btn btn-primary">➕ Nueva Actividad</button>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="card stat-card">
          <div className="stat-icon info">📅</div>
          <div className="stat-content">
            <h3 className="stat-value">{eventos.filter(e => e.estado === 'Hoy').length}</h3>
            <p className="stat-label">Actividades Hoy</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon warning">⏰</div>
          <div className="stat-content">
            <h3 className="stat-value">{eventos.filter(e => e.estado === 'Próximo').length}</h3>
            <p className="stat-label">Próximas</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon success">📊</div>
          <div className="stat-content">
            <h3 className="stat-value">{eventos.filter(e => e.estado === 'Planificado').length}</h3>
            <p className="stat-label">Planificadas</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon pending">📋</div>
          <div className="stat-content">
            <h3 className="stat-value">{eventos.length}</h3>
            <p className="stat-label">Total Actividades</p>
          </div>
        </div>
      </div>

      {vistaActual === 'lista' && (
        <div className="card">
          <h3 className="card-title">Próximas Actividades</h3>
          <div className="eventos-lista">
            {eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).map((evento) => (
              <div key={evento.id} className="evento-card">
                <div className="evento-icono">
                  {getTipoIcon(evento.tipo)}
                </div>
                <div className="evento-info">
                  <div className="evento-header">
                    <h4>{evento.titulo}</h4>
                    <span className={getEstadoBadge(evento.estado)}>{evento.estado}</span>
                  </div>
                  <p className="evento-descripcion">{evento.descripcion}</p>
                  <div className="evento-detalles">
                    <span>📅 {new Date(evento.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}</span>
                    <span>🕐 {evento.horaInicio} - {evento.horaFin}</span>
                    <span>📍 {evento.ubicacion}</span>
                    <span>👤 {evento.responsable}</span>
                  </div>
                </div>
                <div className="evento-acciones">
                  <button className="btn-icon" title="Ver detalles">👁️</button>
                  <button className="btn-icon" title="Editar">✏️</button>
                  <button className="btn-icon" title="Notificar">🔔</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vistaActual === 'calendario' && (
        <div className="card">
          <div className="calendario-placeholder">
            <h3>📅 Vista de Calendario</h3>
            <p>Próximamente: Vista de calendario interactivo</p>
            <p style={{fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '1rem'}}>
              Se integrará una librería de calendario para visualización mensual/semanal
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cronograma
