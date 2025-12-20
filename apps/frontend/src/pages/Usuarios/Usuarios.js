import { useState } from 'react'

function Usuarios() {
  const [usuarios] = useState([
    {
      id: 1,
      nombre: 'Juan Delgado',
      email: 'juan.delgado@lab.com',
      rol: 'Responsable Técnico',
      estado: 'Activo',
      ultimoAcceso: '2025-12-17'
    },
    {
      id: 2,
      nombre: 'María López',
      email: 'maria.lopez@lab.com',
      rol: 'Analista',
      estado: 'Activo',
      ultimoAcceso: '2025-12-17'
    },
    {
      id: 3,
      nombre: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@lab.com',
      rol: 'Analista',
      estado: 'Activo',
      ultimoAcceso: '2025-12-16'
    },
    {
      id: 4,
      nombre: 'Ana Martínez',
      email: 'ana.martinez@lab.com',
      rol: 'Administrador',
      estado: 'Activo',
      ultimoAcceso: '2025-12-17'
    }
  ])
  
  return (
    <div className="usuarios">
      <div className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p>Gestión de usuarios y permisos</p>
        </div>
        <button className="btn btn-primary">➕ Nuevo Usuario</button>
      </div>
      
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Último Acceso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td><strong>{usuario.nombre}</strong></td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className="badge badge-info">{usuario.rol}</span>
                  </td>
                  <td>{new Date(usuario.ultimoAcceso).toLocaleDateString('es-ES')}</td>
                  <td>
                    <span className="badge badge-success">{usuario.estado}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" title="Editar">✏️</button>
                      <button className="btn-icon" title="Permisos">🔐</button>
                      <button className="btn-icon" title="Desactivar">🚫</button>
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

export default Usuarios
