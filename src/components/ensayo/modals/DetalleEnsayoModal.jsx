/**
 * DetalleEnsayoModal - Modal para ver el detalle de un ensayo
 */

import { Modal } from '../../ui';
import { Badge } from '../../ui';
import { TIPOS_ENSAYO, getWorkflowInfo } from '../../../config';
import styles from './DetalleEnsayoModal.module.css';

/**
 * Modal para mostrar el detalle completo de un ensayo
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal esta abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.ensayo - Ensayo a mostrar
 * @param {Array} props.tecnicos - Lista de tecnicos
 * @param {Array} props.clientes - Lista de clientes
 */
export function DetalleEnsayoModal({ isOpen, onClose, ensayo, tecnicos, clientes }) {
  if (!ensayo) return null;

  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);
  const tecnicoId = ensayo.tecnicoId || ensayo.tecnico_id;
  const clienteId = ensayo.clienteId || ensayo.cliente_id;
  const tecnico = tecnicos.find(t => t.id === tecnicoId);
  const cliente = clientes.find(c => c.id === clienteId);
  const workflowState = ensayo.workflow_state || ensayo.workflowState || 'E1';
  const estadoInfo = getWorkflowInfo(workflowState);
  const novedadRazon = ensayo.novedad_razon || ensayo.novedadRazon;
  const spreadsheetUrl = ensayo.spreadsheet_url || ensayo.spreadsheetUrl;
  const fechaSolicitud = ensayo.fecha_solicitud || ensayo.fechaSolicitud;
  const fechaProgramada = ensayo.fecha_programada || ensayo.fechaProgramada;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalle - ${ensayo.codigo}`}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{tipoEnsayo?.nombre || ensayo.tipo}</h3>
          <Badge color={estadoInfo.color}>
            {workflowState} - {estadoInfo.nombre}
          </Badge>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <strong>Muestra:</strong> {ensayo.muestra}
          </div>
          <div className={styles.infoItem}>
            <strong>Norma:</strong> {ensayo.norma}
          </div>
          <div className={styles.infoItem}>
            <strong>Cliente:</strong> {cliente?.nombre || 'N/A'}
          </div>
          <div className={styles.infoItem}>
            <strong>Tecnico:</strong>{' '}
            {tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : 'Sin asignar'}
          </div>
          <div className={styles.infoItem}>
            <strong>Fecha solicitud:</strong> {fechaSolicitud || 'N/A'}
          </div>
          <div className={styles.infoItem}>
            <strong>Fecha programada:</strong> {fechaProgramada || 'Sin programar'}
          </div>
        </div>

        {novedadRazon && (
          <div className={styles.novedadBox}>
            <strong>Novedad:</strong>
            <div className={styles.novedadText}>{novedadRazon}</div>
          </div>
        )}

        {spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sheetLink}
          >
            Abrir hoja de datos en Google Sheets
          </a>
        )}

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.btnClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DetalleEnsayoModal;
