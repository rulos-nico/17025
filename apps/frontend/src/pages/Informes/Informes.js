import { useState } from 'react'
import { Link } from 'react-router-dom'

function Informes() {
  const [informes] = useState([
    {
      id: 'INF-2025-045',
      entregable: 'ENT-2025-001',
      cliente: 'Empresa ABC',
      tipo: 'Análisis Fisicoquímico',
      fechaEmision: '2025-12-15',
      estado: 'Firmado',
      responsable: 'Dra. Ana Martínez'
    },
    {
      id: 'INF-2025-046',
      entregable: 'ENT-2025-002',
      cliente: 'Industrias XYZ',
      tipo: 'Microbiológico',
      fechaEmision: '2025-12-16',
      estado: 'En Revisión',
      responsable: 'Dra. Ana Martínez'
    }
  ])
  
  return (
    <div className="informes">
      <div className="page-header">
        <div>
          <h1>Informes de Ensayo</h1>
          <p>Gestión de informes técnicos</p>
        </div>
        <button className="btn btn-primary">📄 Generar Informe</button>
      </div>
      
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID Informe</th>
                <th>Entregable</th>
                <th>Cliente</th>
                <th>Tipo de Ensayo</th>
                <th>Fecha Emisión</th>
                <th>Responsable Técnico</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {informes.map((informe) => (
                <tr key={informe.id}>
                  <td>
                    <Link to={`/informes/${informe.id}`} className="table-link">
                      {informe.id}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/entregables/${informe.entregable}`} className="table-link">
                      {informe.entregable}
                    </Link>
                  </td>
                  <td>{informe.cliente}</td>
                  <td>{informe.tipo}</td>
                  <td>{new Date(informe.fechaEmision).toLocaleDateString('es-ES')}</td>
                  <td>{informe.responsable}</td>
                  <td>
                    <span className={`badge ${informe.estado === 'Firmado' ? 'badge-success' : 'badge-warning'}`}>
                      {informe.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" title="Ver">👁️</button>
                      <button className="btn-icon" title="Descargar PDF">📥</button>
                      <button className="btn-icon" title="Enviar">📧</button>
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

export default Informes
