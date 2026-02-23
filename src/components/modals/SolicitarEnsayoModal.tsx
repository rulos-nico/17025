/**
 * SolicitarEnsayoModal - Modal para que clientes soliciten ensayos
 *
 * Permite seleccionar un tipo de ensayo de los cotizados disponibles
 * para una muestra o perforación específica.
 */

import { useState, FormEvent, ChangeEvent, ReactElement } from 'react';
import { Modal, Badge } from '../ui';
import { TIPOS_ENSAYO, getTipoMuestra, TipoEnsayo } from '../../config';
import styles from './SolicitarEnsayoModal.module.css';

// ============================================
// TYPES
// ============================================

interface FormData {
  tipo: string;
  norma: string;
  observaciones: string;
  cantidad: number;
}

interface Muestra {
  id: string | number;
  codigo?: string;
  tipoMuestra?: string;
  profundidadInicio?: number;
  profundidadFin?: number;
  descripcion?: string;
  [key: string]: unknown;
}

interface Perforacion {
  id: string | number;
  codigo?: string;
  descripcion?: string;
  muestraFisica?: string;
  [key: string]: unknown;
}

interface Proyecto {
  id: string | number;
  ensayosCotizados?: Record<string, number>;
  [key: string]: unknown;
}

interface DatosEnsayo {
  tipo: string;
  norma: string;
  observaciones: string;
  cantidad: number;
  perforacionId: string | number;
  muestraId: string | number | null;
  proyectoId: string | number;
  muestra: string;
  workflow_state: string;
  createdAt: string;
}

export interface SolicitarEnsayoModalProps {
  /** Si el modal está visible */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Callback async para crear el ensayo */
  onCreate: (datos: DatosEnsayo) => Promise<void>;
  /** Perforación asociada */
  perforacion: Perforacion;
  /** Muestra específica (opcional) */
  muestra?: Muestra | null;
  /** Proyecto con ensayosCotizados */
  proyecto: Proyecto;
  /** Estado de carga externo */
  loading?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function SolicitarEnsayoModal({
  isOpen,
  onClose,
  onCreate,
  perforacion,
  muestra,
  proyecto,
  loading = false,
}: SolicitarEnsayoModalProps): ReactElement {
  const [form, setForm] = useState<FormData>({
    tipo: '',
    norma: '',
    observaciones: '',
    cantidad: 1,
  });

  const [creando, setCreando] = useState(false);

  // Ensayos disponibles según lo cotizado en el proyecto
  const ensayosDisponibles = proyecto?.ensayosCotizados || {};
  const tiposDisponibles = TIPOS_ENSAYO.filter(t => ensayosDisponibles[t.id] > 0);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setCreando(true);

    try {
      const datosEnsayo: DatosEnsayo = {
        ...form,
        perforacionId: perforacion.id,
        muestraId: muestra?.id || null,
        proyectoId: proyecto.id,
        muestra: muestra
          ? `${muestra.codigo} (${muestra.profundidadInicio}m-${muestra.profundidadFin}m)`
          : perforacion.descripcion || '',
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
  const tipoMuestraInfo = muestra?.tipoMuestra ? getTipoMuestra(muestra.tipoMuestra) : null;

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
                    <Badge color={tipoMuestraInfo.color || '#6B7280'}>
                      {tipoMuestraInfo.nombre}
                    </Badge>
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
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    const tipo = TIPOS_ENSAYO.find(t => t.id === e.target.value);
                    setForm({ ...form, tipo: e.target.value, norma: tipo?.norma || '' });
                  }}
                  required
                  className={styles.select}
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposDisponibles.map((tipo: TipoEnsayo) => (
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, norma: e.target.value })
                  }
                  placeholder="Ej: ASTM E8"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
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
