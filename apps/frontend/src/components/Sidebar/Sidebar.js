import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

function Sidebar() {
  const location = useLocation()
  const { hasPermission } = useAuth()
  
  const allMenuItems = [
    { path: '/', icon: '🏠', label: 'Inicio', permission: null },
    { path: '/dashboard', icon: '📊', label: 'Dashboard', permission: 'canViewDashboard' },
    { path: '/entregables', icon: '📋', label: 'Entregables', permission: 'canViewEntregables' },
    { path: '/muestras', icon: '🧪', label: 'Muestras', permission: 'canViewMuestras' },
    { path: '/informes', icon: '📄', label: 'Informes', permission: 'canViewInformes' },
    { path: '/clientes', icon: '👥', label: 'Clientes', permission: 'canViewClientes' },
    { path: '/equipos', icon: '🔬', label: 'Equipos', permission: 'canViewEquipos' },
    { path: '/cronograma', icon: '📅', label: 'Cronograma', permission: 'canViewCronograma' },
    { path: '/personal', icon: '👨‍🔬', label: 'Personal', permission: 'canViewPersonal' },
    { path: '/calidad', icon: '✓', label: 'Control de Calidad', permission: 'canViewCalidad' },
    { path: '/plantillas', icon: '📁', label: 'Plantillas & Docs', permission: 'canViewPlantillas' },
    { path: '/usuarios', icon: '⚙️', label: 'Usuarios', permission: 'canManageUsuarios' },
  ]

  // Filtrar elementos del menú según permisos del usuario
  const menuItems = allMenuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  )
  
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
