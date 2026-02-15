/**
 * PerforacionNode - Nodo expandible de perforacion para vista jerarquica
 */

import { MuestraNode } from './MuestraNode';
import { getWorkflowInfo } from '../../../config';
import styles from './PerforacionNode.module.css';

/**
 * Nodo expandible que muestra una perforacion y sus muestras
 *
 * @param {Object} props
 * @param {Object} props.perforacion - Datos de la perforacion
 * @param {Array} props.muestras - Lista de todas las muestras
 * @param {Array} props.ensayos - Lista de todos los ensayos
 * @param {boolean} props.isExpanded - Si el nodo esta expandido
 * @param {Function} props.onToggle - Callback al expandir/colapsar
 * @param {Array} props.expandedMuestras - IDs de muestras expandidas
 * @param {Function} props.onToggleMuestra - Callback al expandir/colapsar muestra
 * @param {Function} props.onEnsayoClick - Callback al hacer click en un ensayo
 */
export function PerforacionNode({
  perforacion,
  muestras,
  ensayos,
  isExpanded,
  onToggle,
  expandedMuestras,
  onToggleMuestra,
  onEnsayoClick,
}) {
  const perforacionId = perforacion.id;
  const muestrasPerforacion = muestras.filter(m => {
    const mPerforacionId = m.perforacionId || m.perforacion_id;
    return mPerforacionId === perforacionId;
  });

  const ensayosPerforacion = ensayos.filter(e => {
    const ePerforacionId = e.perforacionId || e.perforacion_id;
    return ePerforacionId === perforacionId;
  });

  const countByState = ensayosPerforacion.reduce((acc, e) => {
    const state = e.workflow_state || e.workflowState;
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <div
        onClick={onToggle}
        className={isExpanded ? styles.headerExpanded : styles.headerCollapsed}
      >
        <span className={isExpanded ? styles.arrowExpanded : styles.arrow}>&#9658;</span>
        <span className={styles.icon}>&#128193;</span>
        <span className={styles.nombre}>
          {perforacion.codigo} - {perforacion.nombre}
        </span>
        {perforacion.profundidad && (
          <span className={styles.profundidad}>({perforacion.profundidad}m)</span>
        )}
        <span className={styles.statBadge}>
          {muestrasPerforacion.length} muestras &bull; {ensayosPerforacion.length} ensayos
        </span>
        {/* Mini badges de estados */}
        <div className={styles.stateBadges}>
          {Object.entries(countByState)
            .slice(0, 4)
            .map(([state, count]) => (
              <span
                key={state}
                className={styles.stateBadge}
                style={{ backgroundColor: getWorkflowInfo(state).color }}
              >
                {state}:{count}
              </span>
            ))}
        </div>
      </div>

      {/* Muestras de la perforacion */}
      {isExpanded && (
        <div className={styles.children}>
          {muestrasPerforacion.length === 0 ? (
            <div className={styles.emptyChildren}>Sin muestras en esta perforacion</div>
          ) : (
            muestrasPerforacion.map(muestra => (
              <MuestraNode
                key={muestra.id}
                muestra={muestra}
                ensayos={ensayos}
                isExpanded={expandedMuestras.includes(muestra.id)}
                onToggle={() => onToggleMuestra(muestra.id)}
                onEnsayoClick={onEnsayoClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default PerforacionNode;
