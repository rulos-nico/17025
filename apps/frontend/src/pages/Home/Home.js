import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Home.css'

function Home() {
  const { user } = useAuth()

  if (!user) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div className="home">
      <div className="welcome-section">
        <div className="welcome-avatar">
          {user.iniciales}
        </div>
        <div className="welcome-text">
          <h1>Bienvenido, {user.nombre}</h1>
          <p className="welcome-rol">{user.rol}</p>
        </div>
      </div>

      <div className="quick-access-section">
        <h2 className="section-title-main">Acceso Rápido</h2>
        <div className="quick-access-grid">
          <Link to="/equipos" className="quick-access-card">
            <div className="quick-access-icon">🔬</div>
            <h3>Equipos</h3>
            <p>Gestión de equipos de laboratorio, calibraciones y mantenimientos programados</p>
            <div className="quick-access-stats">
              <span className="stat-badge success">3 Operativos</span>
              <span className="stat-badge warning">1 En Mantenimiento</span>
            </div>
            <span className="quick-access-arrow">→</span>
          </Link>
          
          <Link to="/cronograma" className="quick-access-card">
            <div className="quick-access-icon">📅</div>
            <h3>Cronograma</h3>
            <p>Planificación de ensayos, auditorías y actividades del laboratorio</p>
            <div className="quick-access-stats">
              <span className="stat-badge info">1 Actividad Hoy</span>
              <span className="stat-badge warning">2 Próximas</span>
            </div>
            <span className="quick-access-arrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
