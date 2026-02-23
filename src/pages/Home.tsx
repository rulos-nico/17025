import { useState, Suspense, lazy } from 'react';
import { APP_CONFIG, getWorkflowInfo } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useApiData } from '../hooks/useApiData';
import { useGanttData } from '../hooks/useGanttData';
import type { GanttTask } from '../components/gantt/gantt_proyects';
import { EnsayosAPI } from '../services/apiService';

// Lazy load del componente Gantt (pesado ~260KB gzip)
const GanttProyectos = lazy(() => import('../components/gantt/gantt_proyects'));

// Types
interface HomeProps {
  setActiveModule?: (module: string) => void;
}

interface EnsayoItem {
  id: string | number;
  codigo?: string;
  tipo?: string;
  workflow_state?: string;
  estado?: string;
  cliente_nombre?: string;
  cliente?: string;
  fecha_solicitud?: string;
  fecha?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface ActividadItem {
  id: string | number;
  accion: string;
  usuario: string;
  fecha: string;
  usuario_nombre?: string;
  timestamp?: string;
}

/**
 * Página principal del dashboard
 * Muestra estadísticas, ensayos pendientes y actividad reciente
 */
function Home({ setActiveModule }: HomeProps) {
  const { user } = useAuth();

  // Estado para filtro de cliente en Gantt
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');

  // Hook para datos del Gantt
  const {
    ganttData,
    clientes,
    loading: ganttLoading,
    totalProyectos,
    totalPerforaciones,
  } = useGanttData(clienteSeleccionado || null);

  // Usar hook centralizado para fetching de datos
  const {
    data: ensayos,
    loading: isLoading,
    error,
  } = useApiData(EnsayosAPI.list as () => Promise<EnsayoItem[]>, {
    initialData: [] as EnsayoItem[],
  });

  // Ensayos pendientes (E1, E2)
  const pendientes = ensayos.filter((e: EnsayoItem) =>
    ['E1', 'E2'].includes(e.workflow_state || '')
  );

  // Actividad reciente (últimos 5 ensayos modificados)
  const actividad: ActividadItem[] = ensayos
    .filter((e: EnsayoItem) => e.updated_at)
    .sort(
      (a: EnsayoItem, b: EnsayoItem) =>
        new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    )
    .slice(0, 5)
    .map((e: EnsayoItem) => ({
      id: e.id,
      accion: `Ensayo ${e.codigo} actualizado`,
      usuario: 'Sistema',
      fecha: new Date(e.updated_at || '').toLocaleDateString(),
    }));

  const getStatusColor = (status: string | undefined): string => {
    if (status && status.startsWith('E')) {
      return getWorkflowInfo(status).color;
    }
    const simpleColors: Record<string, string> = {
      pendiente: '#f59e0b',
      en_proceso: '#3b82f6',
      completado: '#10b981',
      revision: '#8b5cf6',
    };
    return simpleColors[status?.toLowerCase() || ''] || '#6b7280';
  };

  const getStatusLabel = (status: string | undefined): string => {
    if (status && status.startsWith('E')) {
      return getWorkflowInfo(status).nombre;
    }
    const simpleLabels: Record<string, string> = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado',
      revision: 'En Revisión',
    };
    return simpleLabels[status?.toLowerCase() || ''] || status || '';
  };

  // Handler para clic en tarea del Gantt
  const handleGanttTaskClick = (_task: GanttTask) => {
    // Navegar a la página de proyectos
    if (setActiveModule) {
      setActiveModule('proyectos');
    }
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

      {/* Cronograma de Proyectos - Gantt */}
      <section className="gantt-section">
        <div className="container">
          <div className="content-card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2>Cronograma de Proyectos</h2>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {totalProyectos} proyectos, {totalPerforaciones} perforaciones
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Selector de cliente (solo admin) */}
                {user?.rol === 'admin' && (
                  <select
                    value={clienteSeleccionado}
                    onChange={e => setClienteSeleccionado(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      backgroundColor: 'white',
                    }}
                  >
                    <option value="">Todos los clientes</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className="btn-link"
                  onClick={() => setActiveModule && setActiveModule('proyectos')}
                >
                  Ver proyectos
                </button>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <Suspense
                fallback={
                  <div
                    style={{
                      height: '500px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>
                      <p>Cargando componente Gantt...</p>
                    </div>
                  </div>
                }
              >
                <GanttProyectos
                  data={ganttData}
                  onTaskClick={handleGanttTaskClick}
                  height={500}
                  loading={ganttLoading}
                />
              </Suspense>
            </div>
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
                  pendientes.slice(0, 5).map((ensayo: EnsayoItem) => (
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
