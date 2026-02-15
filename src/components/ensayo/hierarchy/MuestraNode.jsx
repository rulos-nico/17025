/**
 * MuestraNode - Nodo expandible de muestra para vista jerarquica
 */

import { EnsayoRow } from '../EnsayoRow';
import { getTipoMuestra, getWorkflowInfo } from '../../../config';
import styles from './MuestraNode.module.css';

/**
 * Nodo expandible que muestra una muestra y sus ensayos
 *
 * @param {Object} props
 * @param {Object} props.muestra - Datos de la muestra
 * @param {Array} props.ensayos - Lista de todos los ensayos
 * @param {boolean} props.isExpanded - Si el nodo esta expandido
 * @param {Function} props.onToggle - Callback al expandir/colapsar
 * @param {Function} props.onEnsayoClick - Callback al hacer click en un ensayo
 */
export function MuestraNode({ muestra, ensayos, isExpanded, onToggle, onEnsayoClick }) {
  const muestraId = muestra.id;
  const ensayosMuestra = ensayos.filter(e => {
    const eMuestraId = e.muestraId || e.muestra_id;
    return eMuestraId === muestraId;
  });

  const tipoMuestra = getTipoMuestra(muestra.tipoMuestra || muestra.tipo_muestra);
  const profInicio = muestra.profundidadInicio ?? muestra.profundidad_inicio ?? 0;
  const profFin = muestra.profundidadFin ?? muestra.profundidad_fin ?? 0;
  const profundidadDisplay = `${profInicio.toFixed(1)}-${profFin.toFixed(1)}m`;

  const countByState = ensayosMuestra.reduce((acc, e) => {
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
        <span className={styles.icon}>&#128205;</span>
        <span className={styles.codigo}>{muestra.codigo}</span>
        <span className={styles.profundidad}>({profundidadDisplay})</span>
        <span className={styles.tipo}>{tipoMuestra.nombre}</span>
        {muestra.descripcion && <span className={styles.descripcion}>- {muestra.descripcion}</span>}
        <span className={styles.statBadge}>{ensayosMuestra.length} ensayos</span>
        {/* Mini badges de estados */}
        <div className={styles.stateBadges}>
          {Object.entries(countByState)
            .slice(0, 3)
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

      {/* Ensayos de la muestra */}
      {isExpanded && (
        <div className={styles.children}>
          {ensayosMuestra.length === 0 ? (
            <div className={styles.emptyChildren}>Sin ensayos en esta muestra</div>
          ) : (
            ensayosMuestra.map(ensayo => (
              <EnsayoRow key={ensayo.id} ensayo={ensayo} onClick={onEnsayoClick} indentLevel={3} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default MuestraNode;
