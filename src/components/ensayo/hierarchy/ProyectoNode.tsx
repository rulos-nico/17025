/**
 * ProyectoNode - Nodo expandible de proyecto para vista jerarquica
 */

import { useState } from 'react';
import { PerforacionNode } from './PerforacionNode';
import { getWorkflowInfo } from '../../../config';
import type { Ensayo, Proyecto, Perforacion, Muestra } from '../../../hooks/useEnsayosData';
import styles from './ProyectoNode.module.css';

interface ProyectoNodeProps {
  proyecto: Proyecto;
  perforaciones: Perforacion[];
  muestras: Muestra[];
  ensayos: Ensayo[];
  expandedPerforaciones: (string | number)[];
  expandedMuestras: (string | number)[];
  onTogglePerforacion: (perforacionId: string | number) => void;
  onToggleMuestra: (muestraId: string | number) => void;
  onEnsayoClick: (ensayo: Ensayo) => void;
}

/**
 * Nodo expandible que muestra un proyecto y sus perforaciones
 */
export function ProyectoNode({
  proyecto,
  perforaciones,
  muestras,
  ensayos,
  expandedPerforaciones,
  expandedMuestras,
  onTogglePerforacion,
  onToggleMuestra,
  onEnsayoClick,
}: ProyectoNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const proyectoId = proyecto.id;
  const perforacionesProyecto = perforaciones.filter(p => {
    const pProyectoId = p.proyectoId || p.proyecto_id;
    return pProyectoId === proyectoId;
  });

  const ensayosProyecto = ensayos.filter(e => {
    const eProyectoId = e.proyectoId || e.proyecto_id;
    return eProyectoId === proyectoId;
  });

  const countByState = ensayosProyecto.reduce<Record<string, number>>((acc, e) => {
    const state = e.workflow_state || e.workflowState;
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  const clienteNombre = (proyecto.clienteNombre || proyecto.cliente_nombre || '') as string;

  return (
    <div className={styles.container}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={isExpanded ? styles.headerExpanded : styles.headerCollapsed}
      >
        <span className={isExpanded ? styles.arrowExpanded : styles.arrow}>&#9658;</span>
        <span className={styles.icon}>&#128194;</span>
        <div className={styles.info}>
          <div className={styles.nombre}>
            {proyecto.codigo} - {proyecto.nombre}
          </div>
          <div className={styles.cliente}>{clienteNombre}</div>
        </div>
        <div className={styles.stats}>
          <span className={styles.statBadge}>
            {perforacionesProyecto.length} perf. | {ensayosProyecto.length} ensayos
          </span>
          {/* Mini badges de estados */}
          <div className={styles.stateBadges}>
            {Object.entries(countByState)
              .slice(0, 5)
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
      </div>

      {/* Perforaciones del proyecto */}
      {isExpanded && (
        <div className={styles.children}>
          {perforacionesProyecto.length === 0 ? (
            <div className={styles.emptyChildren}>Sin perforaciones en este proyecto</div>
          ) : (
            perforacionesProyecto.map(perf => (
              <PerforacionNode
                key={perf.id as string}
                perforacion={perf}
                muestras={muestras}
                ensayos={ensayos}
                isExpanded={expandedPerforaciones.includes(perf.id)}
                onToggle={() => onTogglePerforacion(perf.id)}
                expandedMuestras={expandedMuestras}
                onToggleMuestra={onToggleMuestra}
                onEnsayoClick={onEnsayoClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ProyectoNode;
