import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Entregables.css'

function Entregables() {
  const [entregables] = useState([
    {
      id: 'ENT-2025-001',
      tipo: 'Análisis Fisicoquímico',
      cliente: 'Empresa ABC',
      muestra: 'M-2025-045',
      fechaIngreso: '2025-12-10',
      fechaEstimada: '2025-12-20',
      estado: 'En Proceso',
      prioridad: 'Alta'
    },
    {
      id: 'ENT-2025-002',
      tipo: 'Microbiológico',
      cliente: 'Industrias XYZ',
      muestra: 'M-2025-046',
      fechaIngreso: '2025-12-12',
      fechaEstimada: '2025-12-22',
      estado: 'Pendiente',
      prioridad: 'Media'
    },
    {
      id: 'ENT-2025-003',
      tipo: 'Metales Pesados',
      cliente: 'Laboratorios DEF',
      muestra: 'M-2025-047',
      fechaIngreso: '2025-12-08',
      fechaEstimada: '2025-12-18',
      estado: 'Completado',
      prioridad: 'Normal'
    }
  ])
  
  const getEstadoBadge = (estado) => {
    const badges = {
      'Pendiente': 'badge-warning',
      'En Proceso': 'badge-info',
      'Completado': 'badge-success'
    }
    return `badge ${badges[estado] || ''}`
  }
  
  const getPrioridadBadge = (prioridad) => {
    const badges = {
      'Alta': 'badge-danger',
      'Media': 'badge-warning',
      'Normal': 'badge-info'
    }
    return `badge ${badges[prioridad] || ''}`
  }
  
  return (
    <div className="entregables">
      <div className="page-header">
        <div>
          <h1>Entregables</h1>
          <p>Gestión de entregables del laboratorio</p>
        </div>
        <Link to="/entregables/crear" className="btn btn-primary">
          ➕ Nuevo Entregable
        </Link>
      </div>
      
      <div className="card">
        <div className="filters">
          <input
            type="search"
            placeholder="Buscar por ID, cliente o muestra..."
            className="form-input"
          />
          <select className="form-select">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="proceso">En Proceso</option>
            <option value="completado">Completado</option>
          </select>
          <select className="form-select">
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="normal">Normal</option>
          </select>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo de Ensayo</th>
                <th>Cliente</th>
                <th>Muestra</th>
                <th>Fecha Ingreso</th>
                <th>Fecha Estimada</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entregables.map((entregable) => (
                <tr key={entregable.id}>
                  <td>
                    <Link to={`/entregables/${entregable.id}`} className="table-link">
                      {entregable.id}
                    </Link>
                  </td>
                  <td>{entregable.tipo}</td>
                  <td>{entregable.cliente}</td>
                  <td>{entregable.muestra}</td>
                  <td>{new Date(entregable.fechaIngreso).toLocaleDateString('es-ES')}</td>
                  <td>{new Date(entregable.fechaEstimada).toLocaleDateString('es-ES')}</td>
                  <td>
                    <span className={getEstadoBadge(entregable.estado)}>
                      {entregable.estado}
                    </span>
                  </td>
                  <td>
                    <span className={getPrioridadBadge(entregable.prioridad)}>
                      {entregable.prioridad}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" title="Ver">👁️</button>
                      <button className="btn-icon" title="Editar">✏️</button>
                      <button className="btn-icon" title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Entregables
