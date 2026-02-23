/**
 * DetalleEnsayoModal - Modal para ver el detalle de un ensayo
 */

import { Modal, Badge } from '../../ui';
import { TIPOS_ENSAYO, getWorkflowInfo } from '../../../config';
import type { Tecnico, Cliente } from '../../../hooks/useEnsayosData';
import type { SelectedEnsayo } from '../../../hooks/useEnsayoModals';
import styles from './DetalleEnsayoModal.module.css';

interface DetalleEnsayoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ensayo: SelectedEnsayo | null;
  tecnicos: Tecnico[];
  clientes: Cliente[];
}

/**
 * Modal para mostrar el detalle completo de un ensayo
 */
export function DetalleEnsayoModal({
  isOpen,
  onClose,
  ensayo,
  tecnicos,
  clientes,
}: DetalleEnsayoModalProps) {
  if (!ensayo) return null;

  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);
  const tecnicoId = ensayo.tecnicoId || ensayo.tecnico_id;
  const clienteId = ensayo.clienteId || ensayo.cliente_id;
  const tecnico = tecnicos.find(t => t.id === tecnicoId);
  const cliente = clientes.find(c => c.id === clienteId);
  const workflowState = ensayo.workflow_state || ensayo.workflowState || 'E1';
  const estadoInfo = getWorkflowInfo(workflowState);
  const novedadRazon = ensayo.novedad_razon || ensayo.novedadRazon;
  const spreadsheetUrl = (ensayo.spreadsheet_url || ensayo.spreadsheetUrl) as string | undefined;
  const fechaSolicitud = (ensayo.fecha_solicitud || ensayo.fechaSolicitud) as string | undefined;
  const fechaProgramada = (ensayo.fecha_programada || ensayo.fechaProgramada) as string | undefined;
  const muestra = (ensayo.muestra || ensayo.codigo || '') as string;

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
            <strong>Muestra:</strong> {muestra}
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
            <div className={styles.novedadText}>{String(novedadRazon)}</div>
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
