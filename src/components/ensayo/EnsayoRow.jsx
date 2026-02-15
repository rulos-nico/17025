/**
 * EnsayoRow - Fila de ensayo para vista jerarquica
 */

import { Badge } from '../ui';
import { TIPOS_ENSAYO, getWorkflowInfo } from '../../config';
import styles from './EnsayoRow.module.css';

/**
 * Fila de ensayo para la vista jerarquica
 *
 * @param {Object} props
 * @param {Object} props.ensayo - Datos del ensayo
 * @param {Function} props.onClick - Callback al hacer click
 * @param {number} props.indentLevel - Nivel de indentacion (2 o 3)
 */
export function EnsayoRow({ ensayo, onClick, indentLevel = 2 }) {
  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);
  const workflowState = ensayo.workflow_state || ensayo.workflowState || 'E1';
  const estadoInfo = getWorkflowInfo(workflowState);
  const sheetUrl = ensayo.sheet_url || ensayo.sheetUrl;
  const fechaProgramada = ensayo.fecha_programada || ensayo.fechaProgramada;
  const fechaSolicitud = ensayo.fecha_solicitud || ensayo.fechaSolicitud;

  const rowClass = indentLevel === 3 ? styles.rowIndent3 : styles.rowIndent2;

  return (
    <div onClick={() => onClick(ensayo)} className={rowClass}>
      {/* Estado Badge */}
      <Badge
        color={estadoInfo.color}
        style={{ minWidth: '40px', textAlign: 'center', fontSize: '0.7rem' }}
      >
        {workflowState}
      </Badge>

      {/* Codigo */}
      <span className={styles.codigo}>{ensayo.codigo}</span>

      {/* Tipo */}
      <span className={styles.tipo}>{tipoEnsayo?.nombre || ensayo.tipo}</span>

      {/* Muestra */}
      <span className={styles.muestra}>{ensayo.muestra}</span>

      {/* Norma */}
      <span className={styles.norma}>{ensayo.norma}</span>

      {/* Fecha */}
      <span className={styles.fecha}>{fechaProgramada || fechaSolicitud}</span>

      {/* Link al Sheet */}
      {sheetUrl ? (
        <a
          href={sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className={styles.sheetLink}
          title="Abrir en Google Sheets"
        >
          &#128196;
        </a>
      ) : (
        <span className={styles.sheetPlaceholder}>-</span>
      )}
    </div>
  );
}

export default EnsayoRow;
