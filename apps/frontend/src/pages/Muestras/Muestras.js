import { useState } from 'react'
import { Link } from 'react-router-dom'

function Muestras() {
  const [muestras] = useState([
    {
      id: 'M-2025-045',
      descripcion: 'Agua potable',
      tipo: 'Agua',
      cliente: 'Empresa ABC',
      fechaIngreso: '2025-12-10',
      estado: 'En Análisis',
      ubicacion: 'Refrigerador A-01'
    },
    {
      id: 'M-2025-046',
      descripcion: 'Muestra de alimentos',
      tipo: 'Alimentos',
      cliente: 'Industrias XYZ',
      fechaIngreso: '2025-12-12',
      estado: 'Recibida',
      ubicacion: 'Refrigerador B-02'
    }
  ])
  
  return (
    <div className="muestras">
      <div className="page-header">
        <div>
          <h1>Muestras</h1>
          <p>Gestión y trazabilidad de muestras</p>
        </div>
        <button className="btn btn-primary">➕ Nueva Muestra</button>
      </div>
      
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID Muestra</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Fecha Ingreso</th>
                <th>Estado</th>
                <th>Ubicación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {muestras.map((muestra) => (
                <tr key={muestra.id}>
                  <td>
                    <Link to={`/muestras/${muestra.id}`} className="table-link">
                      {muestra.id}
                    </Link>
                  </td>
                  <td>{muestra.descripcion}</td>
                  <td>{muestra.tipo}</td>
                  <td>{muestra.cliente}</td>
                  <td>{new Date(muestra.fechaIngreso).toLocaleDateString('es-ES')}</td>
                  <td>
                    <span className="badge badge-info">{muestra.estado}</span>
                  </td>
                  <td>{muestra.ubicacion}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" title="Ver">👁️</button>
                      <button className="btn-icon" title="Editar">✏️</button>
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

export default Muestras
