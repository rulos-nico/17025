/**
 * GanttProyectos - Componente de diagrama Gantt para proyectos
 *
 * Muestra proyectos y sus perforaciones en un diagrama de Gantt interactivo.
 * Utiliza DHTMLX React Gantt.
 */

import ReactGantt from '@dhtmlx/trial-react-gantt';
import '@dhtmlx/trial-react-gantt/dist/react-gantt.css';
import { GANTT_CONFIG } from './gantt_config';

/**
 * @param {Object} props
 * @param {Object} props.data - Datos del Gantt { tasks: [], links: [] }
 * @param {Function} props.onTaskClick - Callback al hacer clic en una tarea
 * @param {number} props.height - Altura del componente (default 500)
 * @param {boolean} props.loading - Estado de carga
 */
export default function GanttProyectos({
  data = { tasks: [], links: [] },
  onTaskClick,
  height = 500,
  loading = false,
}) {
  // Handler para clic en tarea
  const handleTaskClick = task => {
    if (onTaskClick && task) {
      onTaskClick(task);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p>Cargando cronograma...</p>
        </div>
      </div>
    );
  }

  // Sin datos
  if (!data.tasks || data.tasks.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            style={{ margin: '0 auto 12px' }}
          >
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
            <path d="M9 4v6" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p>No hay proyectos activos para mostrar</p>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            Los proyectos activos aparecerán aquí
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }}>
      <ReactGantt
        tasks={data.tasks}
        links={data.links}
        theme={GANTT_CONFIG.theme}
        onTaskClick={handleTaskClick}
      />
    </div>
  );
}
