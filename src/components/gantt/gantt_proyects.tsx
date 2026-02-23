/**
 * GanttProyectos - Componente de diagrama Gantt para proyectos
 *
 * Muestra proyectos y sus perforaciones en un diagrama de Gantt interactivo.
 * Utiliza DHTMLX React Gantt.
 */

import { ReactElement, CSSProperties } from 'react';
import ReactGantt from '@dhtmlx/trial-react-gantt';
import '@dhtmlx/trial-react-gantt/dist/react-gantt.css';
import { GANTT_CONFIG } from './gantt_config';
import type { GanttTask, GanttData } from '../../hooks/useGanttData';

// Re-export types for consumers
export type { GanttTask, GanttLink, GanttData } from '../../hooks/useGanttData';

export interface GanttProyectosProps {
  /** Datos del Gantt { tasks: [], links: [] } */
  data?: GanttData;
  /** Callback al hacer clic en una tarea */
  onTaskClick?: (task: GanttTask) => void;
  /** Altura del componente (default 500) */
  height?: number;
  /** Estado de carga */
  loading?: boolean;
}

// ============================================
// STYLES
// ============================================

const containerStyle = (height: number): CSSProperties => ({
  height: `${height}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
});

const loadingTextStyle: CSSProperties = {
  textAlign: 'center',
  color: '#6b7280',
};

const spinnerStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid #e5e7eb',
  borderTopColor: '#3b82f6',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 12px',
};

const emptyIconStyle: CSSProperties = {
  margin: '0 auto 12px',
};

const emptySubtextStyle: CSSProperties = {
  fontSize: '14px',
  marginTop: '4px',
};

// ============================================
// COMPONENT
// ============================================

export default function GanttProyectos({
  data = { tasks: [], links: [] },
  onTaskClick,
  height = 500,
  loading = false,
}: GanttProyectosProps): ReactElement {
  // Handler para clic en tarea
  const handleTaskClick = (task: GanttTask): void => {
    if (onTaskClick && task) {
      onTaskClick(task);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div style={containerStyle(height)}>
        <div style={loadingTextStyle}>
          <div style={spinnerStyle} />
          <p>Cargando cronograma...</p>
        </div>
      </div>
    );
  }

  // Sin datos
  if (!data.tasks || data.tasks.length === 0) {
    return (
      <div style={containerStyle(height)}>
        <div style={loadingTextStyle}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={emptyIconStyle}>
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
            <path d="M9 4v6" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p>No hay proyectos activos para mostrar</p>
          <p style={emptySubtextStyle}>Los proyectos activos aparecerán aquí</p>
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
