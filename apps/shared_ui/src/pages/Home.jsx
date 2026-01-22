import { useState, useEffect } from 'react';
import {
  DASHBOARD_STATS,
  ENSAYO_STATUS,
  API_CONFIG,
  APP_CONFIG,
} from '../config';

function Home({ setActiveModule }) {
  const [stats, setStats] = useState({
    pendientes: 0,
    en_proceso: 0,
    completados_mes: 0,
    clientes_activos: 0,
  });
  
  const [ensayosPendientes, setEnsayosPendientes] = useState([]);
  const [ensayosRecientes, setEnsayosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar estadísticas
      const statsResponse = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.dashboard.stats}`
      );
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      // Cargar ensayos pendientes
      const pendientesResponse = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.dashboard.pending}`
      );
      if (pendientesResponse.ok) {
        const data = await pendientesResponse.json();
        setEnsayosPendientes(data);
      }

      // Cargar ensayos recientes
      const recientesResponse = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.dashboard.recent}`
      );
      if (recientesResponse.ok) {
        const data = await recientesResponse.json();
        setEnsayosRecientes(data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return ENSAYO_STATUS[status.toUpperCase()]?.color || '#6b7280';
  };

  const getStatusLabel = (status) => {
    return ENSAYO_STATUS[status.toUpperCase()]?.label || status;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header del Dashboard */}
      <section className="dashboard-header">
        <div className="container">
          <div className="welcome-section">
              <h1>Sistema de gestion del laboratorio</h1>
              <p className="subtitle">{APP_CONFIG.labName} - {APP_CONFIG.accreditation}</p>          
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/>
              </svg>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {DASHBOARD_STATS.map((stat) => (
              <div key={stat.key} className="stat-card">
                <div className="stat-content">
                  <div className="stat-header">
                    <span className="stat-label">{stat.label}</span>
                  </div>
                  <div className="stat-value">{stats[stat.key] || 0}</div>
                </div>
                <div className={`stat-icon stat-icon-${stat.icon}`}>
                  {stat.icon === 'pending' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                  {stat.icon === 'process' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                  {stat.icon === 'completed' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
                      <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                  {stat.icon === 'clients' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contenido Principal */}
      <section className="main-content">
        <div className="container">
          <div className="content-grid">
            {/* Ensayos Pendientes */}
            <div className="content-card">
                <div className="card-header">
                <h2>Ensayos Pendientes</h2>
                <button className="btn-link" onClick={() => setActiveModule && setActiveModule('ensayos')}>Ver todos</button>
              </div>
              <div className="ensayos-list">
                {ensayosPendientes.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
                      <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <p>No hay ensayos pendientes</p>
                  </div>
                ) : (
                  ensayosPendientes.map((ensayo) => (
                    <div key={ensayo.id} className="ensayo-item">
                      <div className="ensayo-info">
                        <div className="ensayo-header">
                          <span className="ensayo-id">#{ensayo.id}</span>
                          <span 
                            className="ensayo-status"
                            style={{ backgroundColor: getStatusColor(ensayo.estado) }}
                          >
                            {getStatusLabel(ensayo.estado)}
                          </span>
                        </div>
                        <h3>{ensayo.tipo}</h3>
                        <p className="ensayo-cliente">Cliente: {ensayo.cliente}</p>
                        <p className="ensayo-fecha">Fecha: {ensayo.fecha}</p>
                      </div>
                      <button className="btn-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actividad Reciente */}
            <div className="content-card">
              <div className="card-header">
                <h2>Actividad Reciente</h2>
                <button className="btn-link" onClick={() => setActiveModule && setActiveModule('reportes')}>Ver historial</button>
              </div>
              <div className="activity-list">
                {ensayosRecientes.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <p>No hay actividad reciente</p>
                  </div>
                ) : (
                  ensayosRecientes.map((actividad) => (
                    <div key={actividad.id} className="activity-item">
                      <div className="activity-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="3" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="activity-content">
                        <p className="activity-title">{actividad.accion}</p>
                        <p className="activity-meta">
                          {actividad.usuario} • {actividad.fecha}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accesos Rápidos */}
      <section className="quick-actions">
        <div className="container">
          <h2>Accesos Rápidos</h2>
          <div className="actions-grid">
            <button className="action-card" onClick={() => setActiveModule && setActiveModule('ensayos')}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M4 10h16M10 4v16" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>Nuevo Ensayo</h3>
              <p></p>
            </button>

            <button className="action-card" onClick={() => setActiveModule && setActiveModule('clientes')}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>Gestionar Clientes</h3>
              <p>Ver y editar clientes</p>
            </button>

            <button className="action-card" onClick={() => setActiveModule && setActiveModule('reportes')}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
                <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>Generar Reporte</h3>
              <p>Crear informe de ensayo</p>
            </button>

            <button className="action-card" onClick={() => setActiveModule && setActiveModule('equipos')}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>Equipos</h3>
              <p>Ver estado de equipos</p>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
