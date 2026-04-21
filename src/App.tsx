import { useState, useCallback, MouseEvent } from 'react';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
// Pages - used dynamically in renderModule switch statement
import Home from './pages/Home';
import Equipos from './pages/Equipos';
import Reports from './pages/Reportes';
import Personal from './pages/Personal';
import Ensayo from './pages/Ensayo';
import Proyectos from './presentation/pages/proyectos/Proyectos';
import MisProyectos from './pages/MisProyectos';
import ReporteProyecto from './pages/ReporteProyecto';
import Calibraciones from './pages/Calibraciones';
import Comprobaciones from './pages/Comprobaciones';
import GraficosControl from './pages/GraficosControl';
import './App.css';

interface AppUser {
  nombre: string;
  rol: string;
  avatar?: string | null;
  email?: string;
}

type ModuleKey =
  | 'dashboard'
  | 'proyectos'
  | 'mis-proyectos'
  | 'ensayos'
  | 'reportes'
  | 'reporteProyecto'
  | 'equipos'
  | 'calibraciones'
  | 'comprobaciones'
  | 'graficos-control'
  | 'usuarios';

function App() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [moduleParams, setModuleParams] = useState<Record<string, unknown> | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigateToModule = useCallback((module: string, params?: Record<string, unknown>) => {
    setActiveModule(module);
    setModuleParams(params || null);
  }, []);

  // Use authentication
  const { isAuthenticated, isLoading, user: authUser, login, logout } = useAuth();

  // Map user to app user format
  const user: AppUser | null = authUser
    ? {
        nombre: authUser.name || authUser.email || '',
        rol: authUser.rol || 'admin',
        avatar: authUser.picture,
        email: authUser.email,
      }
    : null;

  const handleLogout = () => {
    logout();
  };

  const handleLogin = () => {
    login();
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
            <p className="login-subtitle">Sistema de Gesti&oacute;n ISO/IEC 17025:2017</p>
          </div>

          <div className="login-card">
            <h2>Iniciar Sesi&oacute;n</h2>
            <p>Accede al sistema para continuar.</p>

            <button
              className="btn-demo-login"
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#fff',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '16px',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e: MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.backgroundColor = '#1d4ed8')
              }
              onMouseOut={(e: MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.backgroundColor = '#2563eb')
              }
            >
              Entrar como Demo
            </button>

            <p className="login-help">Sistema en modo de desarrollo.</p>
          </div>
        </div>
      </div>
    );
  }

  const renderModule = (module: string, setActive: (m: string) => void) => {
    switch (module as ModuleKey) {
      case 'dashboard':
        return <Home setActiveModule={setActive} />;
      case 'proyectos':
        return <Proyectos navigateToModule={navigateToModule} />;
      case 'mis-proyectos':
        return <MisProyectos />;
      case 'ensayos':
        return <Ensayo />;
      case 'reportes':
        return <Reports moduleParams={moduleParams} />;
      case 'reporteProyecto':
        return <ReporteProyecto moduleParams={moduleParams} navigateToModule={navigateToModule} />;
      case 'equipos':
        return <Equipos />;
      case 'calibraciones':
        return <Calibraciones />;
      case 'comprobaciones':
        return <Comprobaciones />;
      case 'graficos-control':
        return <GraficosControl />;
      case 'usuarios':
        return <Personal />;
      default:
        return <Home setActiveModule={setActive} />;
    }
  };

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        activeModule={activeModule}
        isMenuOpen={isMenuOpen}
        onNavigate={navigateToModule}
        onCloseMenu={() => setIsMenuOpen(false)}
        onLogout={handleLogout}
      />

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
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          <div className="topbar-actions">
            <button className="btn-icon" title="Notificaciones">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span className="notification-badge">3</span>
            </button>

            <button className="btn-icon" title="Configuración">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content-wrapper">{renderModule(activeModule, setActiveModule)}</main>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)}></div>}
    </div>
  );
}


export default App;
