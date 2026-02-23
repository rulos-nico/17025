/**
 * PerforacionNode - Nodo expandible de perforacion para vista jerarquica
 */

import { MuestraNode } from './MuestraNode';
import { getWorkflowInfo } from '../../../config';
import type { Ensayo, Perforacion, Muestra } from '../../../hooks/useEnsayosData';
import styles from './PerforacionNode.module.css';

interface PerforacionNodeProps {
  perforacion: Perforacion;
  muestras: Muestra[];
  ensayos: Ensayo[];
  isExpanded: boolean;
  onToggle: () => void;
  expandedMuestras: (string | number)[];
  onToggleMuestra: (muestraId: string | number) => void;
  onEnsayoClick: (ensayo: Ensayo) => void;
}

/**
 * Nodo expandible que muestra una perforacion y sus muestras
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
}: PerforacionNodeProps) {
  const perforacionId = perforacion.id;
  const muestrasPerforacion = muestras.filter(m => {
    const mPerforacionId = m.perforacionId || m.perforacion_id;
    return mPerforacionId === perforacionId;
  });

  const ensayosPerforacion = ensayos.filter(e => {
    const ePerforacionId = e.perforacionId || e.perforacion_id;
    return ePerforacionId === perforacionId;
  });

  const countByState = ensayosPerforacion.reduce<Record<string, number>>((acc, e) => {
    const state = e.workflow_state || e.workflowState;
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  const profundidad = perforacion.profundidad as number | undefined;

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
        {profundidad && <span className={styles.profundidad}>({profundidad}m)</span>}
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
                key={muestra.id as string}
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
