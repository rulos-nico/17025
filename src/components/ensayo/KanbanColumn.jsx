/**
 * KanbanColumn - Columna del tablero Kanban
 */

import { EnsayoCard } from './EnsayoCard';
import styles from './KanbanColumn.module.css';

/**
 * Columna del tablero Kanban que agrupa ensayos por estado
 *
 * @param {Object} props
 * @param {Object} props.column - Configuracion de la columna { id, titulo, estados, color, descripcion }
 * @param {Array} props.ensayos - Lista de todos los ensayos
 * @param {Array} props.tecnicos - Lista de tecnicos
 * @param {string} props.userRole - Rol del usuario actual
 * @param {string} props.userId - ID del usuario actual
 * @param {Function} props.onCardClick - Callback al hacer click en una tarjeta
 * @param {Function} props.onCambiarEstado - Callback para cambiar estado
 * @param {Function} props.onNovedad - Callback para marcar como novedad
 * @param {Function} props.onReasignar - Callback para reasignar
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
}) {
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
                key={ensayo.id}
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
