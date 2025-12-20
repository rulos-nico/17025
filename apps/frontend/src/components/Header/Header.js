import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-search">
          <input
            type="search"
            placeholder="Buscar entregables, muestras, informes..."
            className="header-search-input"
          />
        </div>
        
        <div className="header-actions">
          <button className="header-notification-btn">
            🔔
            <span className="notification-badge">3</span>
          </button>
          
          <div className="header-user">
            <div className="header-user-avatar">
              <span>JD</span>
            </div>
            <div className="header-user-info">
              <p className="header-user-name">Juan Delgado</p>
              <p className="header-user-role">Responsable Técnico</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
