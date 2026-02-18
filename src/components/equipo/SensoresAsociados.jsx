/**
 * SensoresAsociados - Lista de sensores asociados a un equipo
 * Recibe directamente los datos de sensores desde el backend (ya incluidos en el equipo)
 */

import { Badge } from '../ui';
import {
  getEstadoEquipo,
  getDiasParaVencimiento,
  getAlertaVencimiento,
  formatDate,
} from '../../utils';
import styles from './SensoresAsociados.module.css';

export function SensoresAsociados({ sensores = [], onSensorClick }) {
  if (sensores.length === 0) return null;

  return (
    <div className={styles.container}>
      <h4 className={styles.header}>
        <span className={styles.headerDot} />
        Sensores Asociados ({sensores.length})
      </h4>

      <div className={styles.grid}>
        {sensores.map(sensor => {
          const estadoInfo = getEstadoEquipo(sensor.estado);
          const diasCal = getDiasParaVencimiento(sensor.proxima_calibracion);
          const alertaCal = getAlertaVencimiento(diasCal);

          return (
            <div key={sensor.id} onClick={() => onSensorClick?.(sensor.id)} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardCode}>{sensor.codigo}</div>
                  <div className={styles.cardPlaca}>{sensor.tipo}</div>
                </div>
                <Badge color={estadoInfo.color}>{estadoInfo.label}</Badge>
              </div>

              <div className={styles.cardName}>
                {sensor.marca} {sensor.modelo}
              </div>

              <div className={styles.cardMeta}>
                <div className={styles.cardMetaText}>
                  <span>S/N: {sensor.numero_serie}</span>
                  {sensor.rango_medicion && <span>Rango: {sensor.rango_medicion}</span>}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.cardCalDate}>
                  Prox. Cal: {formatDate(sensor.proxima_calibracion)}
                </div>
                {alertaCal && (
                  <span
                    className={styles.alertTag}
                    style={{ backgroundColor: alertaCal.bg, color: alertaCal.color }}
                  >
                    {alertaCal.texto}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SensoresAsociados;
