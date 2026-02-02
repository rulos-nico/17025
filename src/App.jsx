import { useState } from 'react';
import { NAV_ITEMS } from './config';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import GoogleAuthButton from './components/GoogleAuthButton';
// Pages - used dynamically in renderModule switch statement
import Home from './pages/Home';
import Equipos from './pages/Equipos';
import Reports from './pages/Reportes';
import Personal from './pages/Personal';
import Ensayo from './pages/Ensayo';
import Proyectos from './pages/Proyectos';
import MisProyectos from './pages/MisProyectos';
import './App.css';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Use real Google authentication
  const { 
    isAuthenticated, 
    isLoading, 
    user: googleUser, 
    logout,
    error: authError
  } = useGoogleAuth();

  // Map Google user to app user format
  const user = googleUser ? {
    nombre: googleUser.name || googleUser.email,
    rol: googleUser.rol || 'admin', // Use rol from demo user or default to admin
    avatar: googleUser.picture,
    email: googleUser.email,
  } : null;

  const handleLogout = () => {
    logout();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <img src="/logos/LOGO_INGETEC_P_ROJAS.svg" alt="Ingetec" className="loading-logo" />
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app-login">
        <div className="login-container">
          <div className="login-header">
            <img src="/logos/LOGO_INGETEC_P_ROJAS.svg" alt="Ingetec" className="login-logo" />
            <h1>Laboratorio Ingetec</h1>
            <p className="login-subtitle">Sistema de Gestión ISO/IEC 17025:2017</p>
          </div>
          
          <div className="login-card">
            <h2>Iniciar Sesión</h2>
            <p>Accede con tu cuenta de Google autorizada para continuar.</p>
            
            {authError && (
              <div className="login-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>{authError}</span>
              </div>
            )}
            
            <GoogleAuthButton variant="large" />
            
            <p className="login-help">
              Solo usuarios autorizados pueden acceder al sistema.
              Contacta al administrador si necesitas acceso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderModule = (module, setActive) => {
    switch (module) {
      case 'dashboard':
        return <Home setActiveModule={setActive} />;
      case 'proyectos':
        return <Proyectos />;
      case 'mis-proyectos':
        return <MisProyectos />;
      case 'ensayos':
        return <Ensayo />;
      case 'reportes':
        return <Reports />;
      case 'equipos':
        return <Equipos />;
      case 'usuarios':
        return <Personal />;
      default:
        return <Home setActiveModule={setActive} />;
    }
  };

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMenuOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="/logos/LOGO_INGETEC_P_ROJAS.svg" className="logo-img" />

          </div>
        </div>

        <nav className="sidebar-nav"> 
          <ul className="nav-menu">
            {NAV_ITEMS.map((item) => {
              // Verificar permisos de rol
              if (user && item.roles && !item.roles.includes(user.rol)) {
                return null;
              }

              return (
                <li key={item.path}>
                  <button
                    className={`nav-link ${activeModule === item.path.slice(1) ? 'active' : ''}`}
                    onClick={() => {
                      setActiveModule(item.path.slice(1));
                      setIsMenuOpen(false);
                    }}
                  >
                    <span className="nav-icon">{getIcon(item.icon)}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.nombre} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.nombre || 'Usuario'}</p>
              <p className="user-role">{user?.rol || 'Rol'}</p>
            </div>
            <button className="btn-icon" onClick={handleLogout} title="Cerrar sesión">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Bar */}
        <header className="topbar">
          <button 
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>

          <div className="topbar-actions">
            <button className="btn-icon" title="Notificaciones">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span className="notification-badge">3</span>
            </button>

            <button className="btn-icon" title="Configuración">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
         </div>
        </header>

        {/* Main Content */}
        <main className="main-content-wrapper">
          {renderModule(activeModule, setActiveModule)}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}

// Helper function para iconos
function getIcon(iconName) {
  const icons = {
    dashboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    folder: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    test: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M4 10h16M10 4v16" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    clients: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    reports: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
        <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    equipment: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  };

  return icons[iconName] || icons.dashboard;
}

export default App;
