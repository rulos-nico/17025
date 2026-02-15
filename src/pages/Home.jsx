import { useState } from 'react';
import { DASHBOARD_STATS, APP_CONFIG, getWorkflowInfo, WORKFLOW_STATES_INFO } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useApiData } from '../hooks/useApiData';
import { EnsayosAPI } from '../services/apiService';

/**
 * Componente de tarjeta de estadística desplegable
 */
function StatCard({ stat, total, detail, icon }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`stat-card stat-card-expandable ${isExpanded ? 'expanded' : ''}`}>
      <div className="stat-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="stat-content">
          <span className="stat-label">{stat.label}</span>
          <div className="stat-value">{total}</div>
        </div>
        <div className={`stat-icon stat-icon-${stat.icon}`}>{icon}</div>
        <div className={`stat-expand-icon ${isExpanded ? 'rotated' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="stat-card-detail">
          <div className="stat-detail-list">
            {stat.estados.map(estado => {
              const info = WORKFLOW_STATES_INFO[estado];
              const count = detail[estado] || 0;
              return (
                <div key={estado} className="stat-detail-item">
                  <div className="stat-detail-info">
                    <span className="stat-detail-dot" style={{ backgroundColor: info.color }} />
                    <span className="stat-detail-code">{estado}</span>
                    <span className="stat-detail-name">{info.nombre}</span>
                  </div>
                  <span className="stat-detail-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Página principal del dashboard
 * Muestra estadísticas, ensayos pendientes y actividad reciente
 */
function Home({ setActiveModule }) {
  const { user } = useAuth();

  // Usar hook centralizado para fetching de datos
  const {
    data: ensayos,
    loading: isLoading,
    error,
  } = useApiData(EnsayosAPI.list, { initialData: [] });

  // Calcular estadísticas desde los ensayos reales
  const getStatsData = () => {
    const details = {
      pendientes: {},
      en_proceso: {},
      en_revision: {},
      completados: {},
      otros: {},
    };

    // Mapear estados a categorías según DASHBOARD_STATS
    const estadoToCategory = {};
    DASHBOARD_STATS.forEach(stat => {
      stat.estados.forEach(estado => {
        estadoToCategory[estado] = stat.key;
      });
    });

    // Contar ensayos por estado
    ensayos.forEach(ensayo => {
      const estado = ensayo.workflow_state;
      const category = estadoToCategory[estado];
      if (category && details[category]) {
        details[category][estado] = (details[category][estado] || 0) + 1;
      }
    });

    // Calcular totales
    const totals = {};
    Object.keys(details).forEach(key => {
      totals[key] = Object.values(details[key]).reduce((a, b) => a + b, 0);
    });

    return { totals, details };
  };

  const { totals, details } = getStatsData();

  // Ensayos pendientes (E1, E2)
  const pendientes = ensayos.filter(e => ['E1', 'E2'].includes(e.workflow_state));

  // Actividad reciente (últimos 5 ensayos modificados)
  const actividad = ensayos
    .filter(e => e.updated_at)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)
    .map(e => ({
      id: e.id,
      accion: `Ensayo ${e.codigo} actualizado`,
      usuario: 'Sistema',
      fecha: new Date(e.updated_at).toLocaleDateString(),
    }));

  const getStatusColor = status => {
    if (status && status.startsWith('E')) {
      return getWorkflowInfo(status).color;
    }
    const simpleColors = {
      pendiente: '#f59e0b',
      en_proceso: '#3b82f6',
      completado: '#10b981',
      revision: '#8b5cf6',
    };
    return simpleColors[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusLabel = status => {
    if (status && status.startsWith('E')) {
      return getWorkflowInfo(status).nombre;
    }
    const simpleLabels = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado',
      revision: 'En Revisión',
    };
    return simpleLabels[status?.toLowerCase()] || status;
  };

  // Iconos para cada tipo de stat
  const statIcons = {
    pending: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    process: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    review: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    completed: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" />
        <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    others: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="6" cy="12" r="1" fill="currentColor" />
        <circle cx="18" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  };

  if (isLoading) {
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
            <div>
              <h1>
                {user?.name
                  ? `Bienvenido, ${user.name.split(' ')[0]}`
                  : 'Sistema de gestión del laboratorio'}
              </h1>
              <p className="subtitle">
                {APP_CONFIG.labName} - {APP_CONFIG.accreditation}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <section className="container">
          <div className="error-banner">
            <p>Error cargando datos: {error}</p>
          </div>
        </section>
      )}

      {/* Estadísticas Desplegables */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {DASHBOARD_STATS.map(stat => (
              <StatCard
                key={stat.key}
                stat={stat}
                total={totals[stat.key] || 0}
                detail={details[stat.key] || {}}
                icon={statIcons[stat.icon]}
              />
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
                <button
                  className="btn-link"
                  onClick={() => setActiveModule && setActiveModule('ensayos')}
                >
                  Ver todos
                </button>
              </div>
              <div className="ensayos-list">
                {pendientes.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 11.08V12a10 10 0 11-5.93-9.14"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <p>No hay ensayos pendientes</p>
                    <p className="muted">Los ensayos pendientes aparecerán aquí</p>
                  </div>
                ) : (
                  pendientes.slice(0, 5).map(ensayo => (
                    <div key={ensayo.id} className="ensayo-item">
                      <div className="ensayo-info">
                        <div className="ensayo-header">
                          <span className="ensayo-id">#{ensayo.codigo || ensayo.id}</span>
                          <span
                            className="ensayo-status"
                            style={{
                              backgroundColor: getStatusColor(
                                ensayo.workflow_state || ensayo.estado
                              ),
                            }}
                          >
                            {getStatusLabel(ensayo.workflow_state || ensayo.estado)}
                          </span>
                        </div>
                        <h3>{ensayo.tipo}</h3>
                        <p className="ensayo-cliente">
                          Cliente: {ensayo.cliente_nombre || ensayo.cliente}
                        </p>
                        <p className="ensayo-fecha">
                          Fecha: {ensayo.fecha_solicitud || ensayo.fecha}
                        </p>
                      </div>
                      <button
                        className="btn-icon"
                        onClick={() => setActiveModule && setActiveModule('ensayos')}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" />
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
                <button
                  className="btn-link"
                  onClick={() => setActiveModule && setActiveModule('reportes')}
                >
                  Ver historial
                </button>
              </div>
              <div className="activity-list">
                {actividad.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    <p>No hay actividad reciente</p>
                    <p className="muted">La actividad aparecerá aquí</p>
                  </div>
                ) : (
                  actividad.slice(0, 5).map((item, index) => (
                    <div key={item.id || index} className="activity-item">
                      <div className="activity-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="3" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="activity-content">
                        <p className="activity-title">{item.accion}</p>
                        <p className="activity-meta">
                          {item.usuario_nombre || item.usuario} - {item.timestamp || item.fecha}
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
            <button
              className="action-card"
              onClick={() => setActiveModule && setActiveModule('ensayos')}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect
                  x="4"
                  y="4"
                  width="16"
                  height="16"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path d="M4 10h16M10 4v16" stroke="currentColor" strokeWidth="2" />
              </svg>
              <h3>Nuevo Ensayo</h3>
              <p>Crear ensayo de laboratorio</p>
            </button>

            <button
              className="action-card"
              onClick={() => setActiveModule && setActiveModule('proyectos')}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <h3>Proyectos</h3>
              <p>Gestionar proyectos</p>
            </button>

            <button
              className="action-card"
              onClick={() => setActiveModule && setActiveModule('clientes')}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
              </svg>
              <h3>Clientes</h3>
              <p>Ver y editar clientes</p>
            </button>

            <button
              className="action-card"
              onClick={() => setActiveModule && setActiveModule('equipos')}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
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
