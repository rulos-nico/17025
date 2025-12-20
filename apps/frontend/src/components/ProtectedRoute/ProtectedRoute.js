import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ children, permission }) {
  const { user, isLoading, canAccess } = useAuth()

  if (isLoading) {
    return (
      <div className="loading">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (permission && !canAccess(permission)) {
    return (
      <div className="card" style={{ margin: '2rem', textAlign: 'center', padding: '3rem' }}>
        <h2 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>🚫 Acceso Denegado</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          No tienes permisos para acceder a esta sección.
        </p>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
