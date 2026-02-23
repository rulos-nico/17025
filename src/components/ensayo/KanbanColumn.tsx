/**
 * KanbanColumn - Columna del tablero Kanban
 */

import { EnsayoCard } from './EnsayoCard';
import type { Ensayo, Tecnico } from '../../hooks/useEnsayosData';
import styles from './KanbanColumn.module.css';

export interface KanbanColumnConfig {
  id: string;
  titulo: string;
  estados: string[];
  color: string;
  descripcion: string;
}

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  ensayos: Ensayo[];
  tecnicos: Tecnico[];
  userRole: string;
  userId: string | number;
  onCardClick: (ensayo: Ensayo) => void;
  onCambiarEstado: (ensayo: Ensayo) => void;
  onNovedad: (ensayo: Ensayo) => void;
  onReasignar: (ensayo: Ensayo) => void;
}

/**
 * Columna del tablero Kanban que agrupa ensayos por estado
 */
export function KanbanColumn({
  column,
  ensayos,
  tecnicos,
  userRole,
  userId,
  onCardClick,
  onCambiarEstado,
  onNovedad,
  onReasignar,
}: KanbanColumnProps) {
  const ensayosColumna = ensayos.filter(e => {
    const workflowState = e.workflow_state || e.workflowState;
    return column.estados.includes(workflowState);
  });

  return (
    <div className={styles.column}>
      <div className={styles.header} style={{ borderBottom: `3px solid ${column.color}` }}>
        <span className={styles.count} style={{ backgroundColor: column.color }}>
          {ensayosColumna.length}
        </span>
        <div>
          <div className={styles.titulo}>{column.titulo}</div>
          <div className={styles.descripcion}>{column.descripcion}</div>
        </div>
      </div>

      <div className={styles.content}>
        {ensayosColumna.length === 0 ? (
          <div className={styles.empty}>Sin ensayos</div>
        ) : (
          ensayosColumna.map(ensayo => {
            const tecnicoId = ensayo.tecnicoId || ensayo.tecnico_id;
            return (
              <EnsayoCard
                key={ensayo.id as string}
                ensayo={ensayo}
                tecnicos={tecnicos}
                userRole={userRole}
                isOwnEnsayo={tecnicoId === userId}
                onClick={() => onCardClick(ensayo)}
                onCambiarEstado={onCambiarEstado}
                onNovedad={onNovedad}
                onReasignar={onReasignar}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default KanbanColumn;
