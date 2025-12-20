import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Personal.css'

function Personal() {
  const [personal] = useState([
    {
      id: 1,
      nombre: 'Dra. Ana Martínez',
      cargo: 'Responsable Técnico',
      especialidad: 'Química Analítica',
      email: 'ana.martinez@lab.com',
      telefono: '+34 912 345 678',
      certificaciones: ['ISO 17025 Lead Auditor', 'Gestión de Calidad'],
      fechaIngreso: '2018-03-15',
      proximaCapacitacion: '2026-02-10',
      estado: 'Activo',
      competencias: ['Auditorías Internas', 'Validación de Métodos', 'Gestión de Calidad']
    },
    {
      id: 2,
      nombre: 'Dr. Juan Pérez',
      cargo: 'Analista Senior',
      especialidad: 'Fisicoquímica',
      email: 'juan.perez@lab.com',
      telefono: '+34 913 456 789',
      certificaciones: ['Espectrofotometría', 'Cromatografía'],
      fechaIngreso: '2019-06-20',
      proximaCapacitacion: '2026-01-15',
      estado: 'Activo',
      competencias: ['Análisis Fisicoquímico', 'Calibración de Equipos', 'Espectrofotometría']
    },
    {
      id: 3,
      nombre: 'Dra. María López',
      cargo: 'Analista',
      especialidad: 'Microbiología',
      email: 'maria.lopez@lab.com',
      telefono: '+34 914 567 890',
      certificaciones: ['Microbiología de Alimentos', 'Control Microbiológico'],
      fechaIngreso: '2020-09-10',
      proximaCapacitacion: '2025-12-20',
      estado: 'Activo',
      competencias: ['Análisis Microbiológico', 'Cultivos', 'Identificación Bacteriana']
    },
    {
      id: 4,
      nombre: 'Ing. Carlos Rodríguez',
      cargo: 'Técnico de Calibración',
      especialidad: 'Metrología',
      email: 'carlos.rodriguez@lab.com',
      telefono: '+34 915 678 901',
      certificaciones: ['Calibración de Equipos', 'Metrología Básica'],
      fechaIngreso: '2021-01-12',
      proximaCapacitacion: '2026-03-05',
      estado: 'Activo',
      competencias: ['Calibración', 'Mantenimiento Preventivo', 'Metrología']
    }
  ])

  const getDiasHastaCapacitacion = (fecha) => {
    const hoy = new Date()
    const proximaFecha = new Date(fecha)
    const diferencia = Math.ceil((proximaFecha - hoy) / (1000 * 60 * 60 * 24))
    return diferencia
  }

  const getAntiguedad = (fechaIngreso) => {
    const hoy = new Date()
    const ingreso = new Date(fechaIngreso)
    const años = Math.floor((hoy - ingreso) / (1000 * 60 * 60 * 24 * 365))
    return años
  }

  return (
    <div className="personal">
      <div className="page-header">
        <div>
          <h1>Gestión de Personal</h1>
          <p>Personal técnico, capacitaciones y competencias</p>
        </div>
        <button className="btn btn-primary">➕ Nuevo Personal</button>
      </div>

      <div className="grid grid-cols-4">
        <div className="card stat-card">
          <div className="stat-icon success">👨‍🔬</div>
          <div className="stat-content">
            <h3 className="stat-value">{personal.filter(p => p.estado === 'Activo').length}</h3>
            <p className="stat-label">Personal Activo</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon warning">📚</div>
          <div className="stat-content">
            <h3 className="stat-value">
              {personal.filter(p => getDiasHastaCapacitacion(p.proximaCapacitacion) < 30).length}
            </h3>
            <p className="stat-label">Capacitaciones Próximas</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon info">🎓</div>
          <div className="stat-content">
            <h3 className="stat-value">
              {personal.reduce((sum, p) => sum + p.certificaciones.length, 0)}
            </h3>
            <p className="stat-label">Total Certificaciones</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon pending">⭐</div>
          <div className="stat-content">
            <h3 className="stat-value">
              {personal.reduce((sum, p) => sum + p.competencias.length, 0)}
            </h3>
            <p className="stat-label">Competencias Registradas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        {personal.map((persona) => {
          const diasCapacitacion = getDiasHastaCapacitacion(persona.proximaCapacitacion)
          return (
            <div key={persona.id} className="card personal-card">
              <div className="personal-header">
                <div className="personal-avatar">
                  {persona.nombre.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="personal-info-header">
                  <h3>{persona.nombre}</h3>
                  <p className="personal-cargo">{persona.cargo}</p>
                  <p className="personal-especialidad">Especialidad: {persona.especialidad}</p>
                </div>
                <span className="badge badge-success">{persona.estado}</span>
              </div>

              <div className="personal-detalles">
                <div className="detalle-item">
                  <span className="detalle-label">📧 Email:</span>
                  <span>{persona.email}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">📱 Teléfono:</span>
                  <span>{persona.telefono}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">📅 Antigüedad:</span>
                  <span>{getAntiguedad(persona.fechaIngreso)} años</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">📚 Próxima Capacitación:</span>
                  <span className={diasCapacitacion < 30 ? 'text-warning' : ''}>
                    {new Date(persona.proximaCapacitacion).toLocaleDateString('es-ES')}
                    {diasCapacitacion < 30 && ` (${diasCapacitacion} días)`}
                  </span>
                </div>
              </div>

              <div className="personal-section">
                <h4>🎓 Certificaciones</h4>
                <div className="badges-list">
                  {persona.certificaciones.map((cert, idx) => (
                    <span key={idx} className="badge badge-info">{cert}</span>
                  ))}
                </div>
              </div>

              <div className="personal-section">
                <h4>⭐ Competencias</h4>
                <div className="badges-list">
                  {persona.competencias.map((comp, idx) => (
                    <span key={idx} className="badge badge-success">{comp}</span>
                  ))}
                </div>
              </div>

              <div className="personal-actions">
                <button className="btn btn-outline btn-sm">👁️ Ver Perfil</button>
                <button className="btn btn-outline btn-sm">✏️ Editar</button>
                <button className="btn btn-outline btn-sm">📋 Historial</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Personal
