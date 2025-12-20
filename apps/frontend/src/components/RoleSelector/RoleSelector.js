import { useAuth } from '../../context/AuthContext'

function RoleSelector() {
  const { user, changeRole, roles } = useAuth()

  if (!user) return null

  const handleRoleChange = (e) => {
    changeRole(e.target.value)
    window.location.reload() // Recargar para aplicar cambios
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      zIndex: 9999,
      background: 'var(--bg-primary)',
      border: '2px solid var(--primary-color)',
      borderRadius: 'var(--border-radius)',
      padding: '1rem',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <label style={{
        display: 'block',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        marginBottom: '0.5rem'
      }}>
        🔧 MODO DESARROLLO - Cambiar Rol:
      </label>
      <select
        value={user.rol}
        onChange={handleRoleChange}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius)',
          fontSize: '0.875rem'
        }}
      >
        {Object.entries(roles).map(([key, value]) => (
          <option key={key} value={value}>
            {value}
          </option>
        ))}
      </select>
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-tertiary)',
        marginTop: '0.5rem'
      }}>
        Usuario actual: <strong>{user.nombre}</strong>
      </p>
    </div>
  )
}

export default RoleSelector
