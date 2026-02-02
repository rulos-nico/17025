/**
 * Componente de conexión con Google Sheets
 * Muestra estado de conexión, estadísticas del dashboard
 * y enlaces útiles
 */

import { useEffect } from 'react';
import { useGoogleAuth } from '../hooks/useGoogleAuth.jsx';
import { useDashboard } from '../hooks/useGoogleSheets.js';
import GoogleAuthButton, { ConnectionStatus } from './GoogleAuthButton.jsx';
import { DRIVE_CONFIG } from '../config.js';

const GoogleSheetsConnector = () => {
  const { isAuthenticated, isInitialized } = useGoogleAuth();
  const { stats, pendientes, isLoading, error, fetchAll } = useDashboard();

  // Cargar datos cuando se autentica
  useEffect(() => {
    if (isAuthenticated) {
      fetchAll();
    }
  }, [isAuthenticated, fetchAll]);

  // Estilos
  const styles = {
    container: {
      padding: '20px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      maxWidth: '600px',
      margin: '20px auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    error: {
      padding: '12px',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '4px',
      color: '#dc2626',
      marginBottom: '16px',
    },
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginTop: '16px',
    },
    statCard: {
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      textAlign: 'center',
    },
    statNumber: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1f2937',
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    section: {
      marginTop: '24px',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '12px',
    },
    links: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
    },
    link: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      textDecoration: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      transition: 'background-color 0.2s',
    },
    pendientesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    pendienteItem: {
      padding: '10px 12px',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '13px',
    },
    badge: {
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: '500',
      borderRadius: '9999px',
      marginLeft: '8px',
    },
    refreshButton: {
      padding: '8px 16px',
      backgroundColor: '#f3f4f6',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      color: '#374151',
    },
  };

  // Loading state
  if (!isInitialized) {
    return (
      <div style={styles.container}>
        <p>Inicializando Google Services...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header con estado y botón de auth */}
      <div style={styles.header}>
        <ConnectionStatus />
        <GoogleAuthButton variant="compact" />
      </div>

      {/* Error */}
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* Contenido autenticado */}
      {isAuthenticated && (
        <>
          {/* Estadísticas */}
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={styles.sectionTitle}>Resumen</h3>
              <button 
                style={styles.refreshButton}
                onClick={fetchAll}
                disabled={isLoading}
              >
                {isLoading ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>
            
            {isLoading ? (
              <p>Cargando datos...</p>
            ) : stats ? (
              <div style={styles.stats}>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{stats.proyectos_activos || 0}</div>
                  <div style={styles.statLabel}>Proyectos Activos</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{stats.ensayos_pendientes || 0}</div>
                  <div style={styles.statLabel}>Ensayos Pendientes</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{stats.ensayos_en_proceso || 0}</div>
                  <div style={styles.statLabel}>En Proceso</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNumber}>{stats.clientes_activos || 0}</div>
                  <div style={styles.statLabel}>Clientes Activos</div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Ensayos pendientes */}
          {pendientes && pendientes.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Ensayos Recientes</h3>
              <div style={styles.pendientesList}>
                {pendientes.slice(0, 5).map((ensayo, index) => (
                  <div key={ensayo.id || index} style={styles.pendienteItem}>
                    <strong>{ensayo.codigo}</strong> - {ensayo.tipo}
                    <span 
                      style={{
                        ...styles.badge,
                        backgroundColor: ensayo.urgente === 'true' ? '#fef2f2' : '#f0fdf4',
                        color: ensayo.urgente === 'true' ? '#dc2626' : '#16a34a',
                      }}
                    >
                      {ensayo.workflow_state || 'E1'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enlaces rápidos */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Enlaces Rápidos</h3>
            <div style={styles.links}>
              {DRIVE_CONFIG?.spreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${DRIVE_CONFIG.spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  <span>Abrir Base de Datos</span>
                </a>
              )}
              {DRIVE_CONFIG?.folders?.root?.id && (
                <a
                  href={`https://drive.google.com/drive/folders/${DRIVE_CONFIG.folders.root.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  <span>Abrir Drive</span>
                </a>
              )}
              {DRIVE_CONFIG?.spreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${DRIVE_CONFIG.spreadsheetId}/export?format=xlsx`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  <span>Descargar Excel</span>
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleSheetsConnector;
