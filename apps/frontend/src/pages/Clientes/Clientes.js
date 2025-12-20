import { useState } from 'react'
import { Link } from 'react-router-dom'

function Clientes() {
  const [clientes] = useState([
    {
      id: 1,
      nombre: 'Empresa ABC S.A.',
      contacto: 'María González',
      email: 'maria@empresaabc.com',
      telefono: '+34 912 345 678',
      entregablesActivos: 3,
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Industrias XYZ',
      contacto: 'Carlos Ruiz',
      email: 'carlos@industriasxyz.com',
      telefono: '+34 913 456 789',
      entregablesActivos: 2,
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'Laboratorios DEF',
      contacto: 'Ana Martín',
      email: 'ana@labdef.com',
      telefono: '+34 914 567 890',
      entregablesActivos: 0,
      estado: 'Inactivo'
    }
  ])
  
  return (
    <div className="clientes">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Gestión de base de datos de clientes</p>
        </div>
        <button className="btn btn-primary">➕ Nuevo Cliente</button>
      </div>
      
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Entregables Activos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>
                    <Link to={`/clientes/${cliente.id}`} className="table-link">
                      {cliente.nombre}
                    </Link>
                  </td>
                  <td>{cliente.contacto}</td>
                  <td>{cliente.email}</td>
                  <td>{cliente.telefono}</td>
                  <td>{cliente.entregablesActivos}</td>
                  <td>
                    <span className={`badge ${cliente.estado === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                      {cliente.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" title="Ver">👁️</button>
                      <button className="btn-icon" title="Editar">✏️</button>
                      <button className="btn-icon" title="Historial">📋</button>
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

export default Clientes
