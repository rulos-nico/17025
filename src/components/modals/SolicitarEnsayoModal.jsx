/**
 * SolicitarEnsayoModal - Modal para que clientes soliciten ensayos
 *
 * Permite seleccionar un tipo de ensayo de los cotizados disponibles
 * para una muestra o perforación específica.
 */

import { useState } from 'react';
import { Modal, Badge } from '../ui';
import { TIPOS_ENSAYO, getTipoMuestra } from '../../config';
import styles from './SolicitarEnsayoModal.module.css';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está visible
 * @param {Function} props.onClose - Callback para cerrar el modal
 * @param {Function} props.onCreate - Callback async para crear el ensayo
 * @param {Object} props.perforacion - Perforación asociada
 * @param {Object} [props.muestra] - Muestra específica (opcional)
 * @param {Object} props.proyecto - Proyecto con ensayosCotizados
 * @param {boolean} props.loading - Estado de carga externo
 */
export function SolicitarEnsayoModal({
  isOpen,
  onClose,
  onCreate,
  perforacion,
  muestra,
  proyecto,
  loading,
}) {
  const [form, setForm] = useState({
    tipo: '',
    norma: '',
    observaciones: '',
    cantidad: 1,
  });

  const [creando, setCreando] = useState(false);

  // Ensayos disponibles según lo cotizado en el proyecto
  const ensayosDisponibles = proyecto?.ensayosCotizados || {};
  const tiposDisponibles = TIPOS_ENSAYO.filter(t => ensayosDisponibles[t.id] > 0);

  const handleSubmit = async e => {
    e.preventDefault();
    setCreando(true);

    try {
      const datosEnsayo = {
        ...form,
        perforacionId: perforacion.id,
        muestraId: muestra?.id || null,
        proyectoId: proyecto.id,
        muestra: muestra
          ? `${muestra.codigo} (${muestra.profundidadInicio}m-${muestra.profundidadFin}m)`
          : perforacion.descripcion,
        workflow_state: 'E1',
        createdAt: new Date().toISOString(),
      };

      await onCreate(datosEnsayo);
      setForm({ tipo: '', norma: '', observaciones: '', cantidad: 1 });
    } catch (err) {
      console.error('Error creando ensayo:', err);
    } finally {
      setCreando(false);
    }
  };

  const tipoSeleccionado = TIPOS_ENSAYO.find(t => t.id === form.tipo);
  const cotizadosRestantes = tipoSeleccionado ? ensayosDisponibles[form.tipo] || 0 : 0;

  // Obtener información del tipo de muestra
  const tipoMuestraInfo = muestra ? getTipoMuestra(muestra.tipoMuestra) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Solicitar Ensayo${muestra ? ` - ${muestra.codigo}` : ''}`}
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.content}>
          {/* Información de la muestra */}
          <div className={styles.infoBox}>
            {muestra ? (
              <>
                <div className={styles.infoHeader}>
                  <div>
                    <strong>Muestra:</strong> {muestra.codigo}
                    <div className={styles.infoSubtext}>
                      Profundidad: {muestra.profundidadInicio}m - {muestra.profundidadFin}m
                    </div>
                  </div>
                  {tipoMuestraInfo && (
                    <Badge color={tipoMuestraInfo.color}>{tipoMuestraInfo.nombre}</Badge>
                  )}
                </div>
                {muestra.descripcion && (
                  <div className={styles.infoDescription}>{muestra.descripcion}</div>
                )}
                <div className={styles.infoMeta}>
                  Perforación: {perforacion?.codigo} • Muestra física: {perforacion?.muestraFisica}
                </div>
              </>
            ) : (
              <>
                <strong>Perforación:</strong> {perforacion?.descripcion}
                {perforacion?.muestraFisica && (
                  <div className={styles.infoPerforacion}>
                    <strong>Código físico:</strong> {perforacion.muestraFisica}
                  </div>
                )}
              </>
            )}
          </div>

          {tiposDisponibles.length === 0 ? (
            <div className={styles.errorBox}>
              No hay ensayos cotizados disponibles para este proyecto.
            </div>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Tipo de Ensayo *</label>
                <select
                  value={form.tipo}
                  onChange={e => {
                    const tipo = TIPOS_ENSAYO.find(t => t.id === e.target.value);
                    setForm({ ...form, tipo: e.target.value, norma: tipo?.norma || '' });
                  }}
                  required
                  className={styles.select}
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposDisponibles.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre} (Cotizados: {ensayosDisponibles[tipo.id]})
                    </option>
                  ))}
                </select>
                {tipoSeleccionado && (
                  <div className={styles.hint}>
                    Disponibles: {cotizadosRestantes} | Norma: {tipoSeleccionado.norma}
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Norma de Referencia</label>
                <input
                  type="text"
                  value={form.norma}
                  onChange={e => setForm({ ...form, norma: e.target.value })}
                  placeholder="Ej: ASTM E8"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  rows={2}
                  placeholder="Condiciones especiales, requerimientos..."
                  className={styles.textarea}
                />
              </div>
            </>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || creando || tiposDisponibles.length === 0}
              className={styles.btnSubmit}
            >
              {creando ? 'Creando...' : 'Solicitar Ensayo'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default SolicitarEnsayoModal;
