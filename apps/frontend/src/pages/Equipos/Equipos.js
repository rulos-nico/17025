import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Equipos.css'

function Equipos() {
  const [equipos] = useState([
    {
      id: 'EQ-001',
      nombre: 'Espectrofotómetro UV-VIS',
      marca: 'Thermo Scientific',
      modelo: 'Evolution 220',
      serie: 'EVL220-2024-001',
      ubicacion: 'Sala de Instrumentos A',
      estado: 'Operativo',
      ultimaCalibracion: '2025-10-15',
      proximaCalibracion: '2026-04-15',
      responsable: 'Dr. Juan Pérez'
    },
    {
      id: 'EQ-002',
      nombre: 'Balanza Analítica',
      marca: 'Mettler Toledo',
      modelo: 'XPE205',
      serie: 'XPE-2024-045',
      ubicacion: 'Sala de Pesaje',
      estado: 'Operativo',
      ultimaCalibracion: '2025-11-20',
      proximaCalibracion: '2026-02-20',
      responsable: 'Dra. María López'
    },
    {
      id: 'EQ-003',
      nombre: 'pH-metro de Mesa',
      marca: 'Hach',
      modelo: 'HQ440d',
      serie: 'HQ440-2023-120',
      ubicacion: 'Laboratorio Fisicoquímico',
      estado: 'En Mantenimiento',
      ultimaCalibracion: '2025-09-10',
      proximaCalibracion: '2025-12-10',
      responsable: 'Ing. Carlos Rodríguez'
    },
    {
      id: 'EQ-004',
      nombre: 'Autoclave',
      marca: 'Tuttnauer',
      modelo: 'EL-D',
      serie: 'ELD-2022-089',
      ubicacion: 'Sala de Esterilización',
      estado: 'Operativo',
      ultimaCalibracion: '2025-08-05',
      proximaCalibracion: '2026-08-05',
      responsable: 'Dra. María López'
    }
  ])

  const getEstadoBadge = (estado) => {
    const badges = {
      'Operativo': 'badge-success',
      'En Mantenimiento': 'badge-warning',
      'Fuera de Servicio': 'badge-danger',
      'En Calibración': 'badge-info'
    }
    return `badge ${badges[estado] || 'badge-info'}`
  }

  const getDiasHastaCalibración = (fecha) => {
    const hoy = new Date()
    const proximaFecha = new Date(fecha)
    const diferencia = Math.ceil((proximaFecha - hoy) / (1000 * 60 * 60 * 24))
    return diferencia
  }

  return (
    <div className="equipos">
      <div className="page-header">
        <div>
          <h1>Gestión de Equipos</h1>
          <p>Control de equipos, calibraciones y mantenimientos</p>
        </div>
        <button className="btn btn-primary">➕ Nuevo Equipo</button>
      </div>

      <div className="grid grid-cols-4">
        <div className="card stat-card">
          <div className="stat-icon success">🔬</div>
          <div className="stat-content">
            <h3 className="stat-value">{equipos.filter(e => e.estado === 'Operativo').length}</h3>
            <p className="stat-label">Equipos Operativos</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon warning">⚠️</div>
          <div className="stat-content">
            <h3 className="stat-value">{equipos.filter(e => e.estado === 'En Mantenimiento').length}</h3>
            <p className="stat-label">En Mantenimiento</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon info">📅</div>
          <div className="stat-content">
            <h3 className="stat-value">
              {equipos.filter(e => getDiasHastaCalibración(e.proximaCalibracion) < 30).length}
            </h3>
            <p className="stat-label">Calibraciones Próximas</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon pending">📋</div>
          <div className="stat-content">
            <h3 className="stat-value">{equipos.length}</h3>
            <p className="stat-label">Total de Equipos</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del Equipo</th>
                <th>Marca/Modelo</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Última Calibración</th>
                <th>Próxima Calibración</th>
                <th>Días Restantes</th>
                <th>Responsable</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((equipo) => {
                const diasRestantes = getDiasHastaCalibración(equipo.proximaCalibracion)
                return (
                  <tr key={equipo.id}>
                    <td>
                      <Link to={`/equipos/${equipo.id}`} className="table-link">
                        {equipo.id}
                      </Link>
                    </td>
                    <td><strong>{equipo.nombre}</strong></td>
                    <td>{equipo.marca} {equipo.modelo}</td>
                    <td>{equipo.ubicacion}</td>
                    <td>
                      <span className={getEstadoBadge(equipo.estado)}>
                        {equipo.estado}
                      </span>
                    </td>
                    <td>{new Date(equipo.ultimaCalibracion).toLocaleDateString('es-ES')}</td>
                    <td>{new Date(equipo.proximaCalibracion).toLocaleDateString('es-ES')}</td>
                    <td>
                      <span className={diasRestantes < 30 ? 'text-warning' : ''}>
                        {diasRestantes} días
                      </span>
                    </td>
                    <td>{equipo.responsable}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" title="Ver">👁️</button>
                        <button className="btn-icon" title="Calibrar">📊</button>
                        <button className="btn-icon" title="Mantenimiento">🔧</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Equipos
