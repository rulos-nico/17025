/**
 * EquipoRow - Fila expandible de equipo/sensor en tabla
 */

import { Badge } from '../ui';
import {
  getEstadoEquipo,
  getDiasParaVencimiento,
  getAlertaVencimiento,
  formatDate,
} from '../../utils';
import { SensoresAsociados } from './SensoresAsociados';
import type { Equipo, Comprobacion, Calibracion } from '../../hooks/useEquiposData';
import styles from './EquipoRow.module.css';

interface EquipoRowProps {
  equipo: Equipo;
  todosEquipos: Equipo[];
  comprobaciones: Comprobacion[];
  calibraciones: Calibracion[];
  isExpanded: boolean;
  onToggle: () => void;
  onSensorClick: (sensorId: string | number) => void;
  onEdit: (equipo: Equipo) => void;
  onDelete: (equipo: Equipo) => void;
}

export function EquipoRow({
  equipo,
  comprobaciones,
  calibraciones,
  isExpanded,
  onToggle,
  onSensorClick,
  onEdit,
  onDelete,
}: EquipoRowProps) {
  const estadoInfo = getEstadoEquipo(equipo.estado || 'operativo');
  const proximaCalibracion = equipo.proxima_calibracion || equipo.proximaCalibracion;
  const proximaComprobacion = equipo.proxima_comprobacion as string | undefined;
  const diasCalib = getDiasParaVencimiento(proximaCalibracion);
  const alertaCalib = getAlertaVencimiento(diasCalib);
  const diasComprob = getDiasParaVencimiento(proximaComprobacion);
  const alertaComprob = getAlertaVencimiento(diasComprob);

  const comprobacionesEquipo = comprobaciones.filter(c => c.equipoId === equipo.id);
  const calibracionesEquipo = calibraciones.filter(c => c.equipoId === equipo.id);

  const numSensores = equipo.sensoresAsociados?.length || 0;

  return (
    <>
      <tr onClick={onToggle} className={isExpanded ? styles.rowExpanded : styles.row}>
        <td className={styles.cellIcon}>
          <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </td>
        <td className={styles.cellCode}>
          <div className={styles.code}>{equipo.codigo}</div>
          <div className={styles.placa}>{equipo.placa}</div>
        </td>
        <td className={styles.cellText}>{equipo.nombre}</td>
        <td className={styles.cellTipo}>
          <Badge color={equipo.tipo === 'sensor' ? '#8B5CF6' : '#3B82F6'}>
            {equipo.tipo === 'sensor' ? 'Sensor' : 'Equipo'}
          </Badge>
          {numSensores > 0 && <span className={styles.sensorCount}>+{numSensores}</span>}
        </td>
        <td className={styles.cellText}>{equipo.marca}</td>
        <td className={styles.cellText}>{equipo.modelo}</td>
        <td className={styles.cellSmall}>{equipo.rango as string}</td>
        <td className={styles.cellText}>{equipo.ubicacion}</td>
        <td className={styles.cell}>
          <Badge color={estadoInfo.color}>{estadoInfo.label}</Badge>
        </td>
        <td className={styles.cellDate}>
          <div className={styles.dateText}>{formatDate(proximaCalibracion)}</div>
          {alertaCalib && (
            <span
              className={styles.alertTag}
              style={{ backgroundColor: alertaCalib.bg, color: alertaCalib.color }}
            >
              {alertaCalib.texto}
            </span>
          )}
        </td>
        <td className={styles.cellDate}>
          {proximaComprobacion ? (
            <>
              <div className={styles.dateText}>{formatDate(proximaComprobacion)}</div>
              {alertaComprob && (
                <span
                  className={styles.alertTag}
                  style={{ backgroundColor: alertaComprob.bg, color: alertaComprob.color }}
                >
                  {alertaComprob.texto}
                </span>
              )}
            </>
          ) : (
            <span className={styles.placeholder}>-</span>
          )}
        </td>
        <td className={styles.cellActions}>
          <div className={styles.actionsContainer}>
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit(equipo);
              }}
              className={styles.btnEdit}
              title="Editar"
            >
              Editar
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(equipo);
              }}
              className={styles.btnDelete}
              title="Eliminar"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className={styles.expandedRow}>
          <td colSpan={12} className={styles.expandedCell}>
            <div className={styles.expandedContent}>
              {/* Info general */}
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>N Serie</div>
                  <div className={styles.infoValue}>{equipo.serie}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Placa / Inventario</div>
                  <div className={styles.infoValue}>{equipo.placa}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Resolucion</div>
                  <div className={styles.infoValue}>{(equipo.resolucion as string) || '-'}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Responsable</div>
                  <div className={styles.infoValue}>{equipo.responsable as string}</div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Fecha Adquisicion</div>
                  <div className={styles.infoValue}>
                    {formatDate(equipo.fecha_adquisicion as string)}
                  </div>
                </div>
                {equipo.factor_calibracion != null && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Factor de Calibracion</div>
                    <div className={styles.infoValueHighlight}>
                      {String(equipo.factor_calibracion)}
                    </div>
                  </div>
                )}
                {equipo.observaciones != null && (
                  <div className={styles.infoItemWide}>
                    <div className={styles.infoLabel}>Observaciones</div>
                    <div className={styles.infoValueItalic}>{String(equipo.observaciones)}</div>
                  </div>
                )}
              </div>

              {/* Sensores asociados (solo para equipos) */}
              {equipo.tipo === 'equipo' &&
                equipo.sensoresAsociados &&
                equipo.sensoresAsociados.length > 0 && (
                  <SensoresAsociados
                    sensores={equipo.sensoresAsociados}
                    onSensorClick={onSensorClick}
                  />
                )}

              {/* Tabs de historico */}
              <div className={styles.historicoGrid}>
                {/* Historico de Comprobaciones */}
                <div>
                  <h4 className={styles.sectionHeader}>
                    <span className={styles.sectionDotSuccess} />
                    Historico de Comprobaciones ({comprobacionesEquipo.length})
                  </h4>

                  {comprobacionesEquipo.length === 0 ? (
                    <div className={styles.emptyState}>Sin comprobaciones registradas</div>
                  ) : (
                    <div className={styles.historyTableContainer}>
                      <table className={styles.historyTable}>
                        <thead className={styles.historyTableHead}>
                          <tr>
                            <th className={styles.historyTh}>Fecha</th>
                            <th className={styles.historyTh}>Tipo</th>
                            <th className={styles.historyTh}>Resultado</th>
                            <th className={styles.historyTh}>Responsable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comprobacionesEquipo.slice(0, 5).map(comp => (
                            <tr key={comp.id as string}>
                              <td className={styles.historyTd}>{formatDate(comp.fecha)}</td>
                              <td className={styles.historyTd}>{comp.tipo}</td>
                              <td className={styles.historyTd}>
                                <span
                                  className={
                                    comp.resultado === 'Conforme'
                                      ? styles.resultConforme
                                      : styles.resultNoConforme
                                  }
                                >
                                  {comp.resultado}
                                </span>
                              </td>
                              <td className={styles.historyTdMuted}>{comp.responsable}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {comprobacionesEquipo.length > 5 && (
                        <div className={styles.moreItems}>
                          + {comprobacionesEquipo.length - 5} comprobaciones mas
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Historico de Calibraciones */}
                <div>
                  <h4 className={styles.sectionHeader}>
                    <span className={styles.sectionDotPrimary} />
                    Historico de Calibraciones ({calibracionesEquipo.length})
                  </h4>

                  {calibracionesEquipo.length === 0 ? (
                    <div className={styles.emptyState}>Sin calibraciones registradas</div>
                  ) : (
                    <div className={styles.historyTableContainer}>
                      <table className={styles.historyTable}>
                        <thead className={styles.historyTableHead}>
                          <tr>
                            <th className={styles.historyTh}>Fecha</th>
                            <th className={styles.historyTh}>Laboratorio</th>
                            <th className={styles.historyTh}>Certificado</th>
                            <th className={styles.historyTh}>Factor</th>
                            <th className={styles.historyTh}>Incert.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calibracionesEquipo.map(cal => (
                            <tr key={cal.id as string}>
                              <td className={styles.historyTd}>{formatDate(cal.fecha)}</td>
                              <td className={styles.historyTd}>{cal.laboratorio}</td>
                              <td className={styles.historyTd}>
                                <span className={styles.certLink}>{cal.certificado}</span>
                              </td>
                              <td className={styles.historyTd}>
                                <span className={cal.factor ? styles.factorValue : styles.factorNA}>
                                  {cal.factor || 'N/A'}
                                </span>
                              </td>
                              <td className={styles.historyTdSmall}>{cal.incertidumbre}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default EquipoRow;
