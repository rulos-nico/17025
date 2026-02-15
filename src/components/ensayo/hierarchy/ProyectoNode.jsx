/**
 * ProyectoNode - Nodo expandible de proyecto para vista jerarquica
 */

import { useState } from 'react';
import { PerforacionNode } from './PerforacionNode';
import { getWorkflowInfo } from '../../../config';
import styles from './ProyectoNode.module.css';

/**
 * Nodo expandible que muestra un proyecto y sus perforaciones
 *
 * @param {Object} props
 * @param {Object} props.proyecto - Datos del proyecto
 * @param {Array} props.perforaciones - Lista de todas las perforaciones
 * @param {Array} props.muestras - Lista de todas las muestras
 * @param {Array} props.ensayos - Lista de todos los ensayos
 * @param {Array} props.expandedPerforaciones - IDs de perforaciones expandidas
 * @param {Array} props.expandedMuestras - IDs de muestras expandidas
 * @param {Function} props.onTogglePerforacion - Callback al expandir/colapsar perforacion
 * @param {Function} props.onToggleMuestra - Callback al expandir/colapsar muestra
 * @param {Function} props.onEnsayoClick - Callback al hacer click en un ensayo
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
}) {
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

  const countByState = ensayosProyecto.reduce((acc, e) => {
    const state = e.workflow_state || e.workflowState;
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  const clienteNombre = proyecto.clienteNombre || proyecto.cliente_nombre || '';

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
                key={perf.id}
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
