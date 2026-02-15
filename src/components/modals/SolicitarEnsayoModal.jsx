/**
 * SolicitarEnsayoModal - Modal para que clientes soliciten ensayos
 *
 * Permite seleccionar un tipo de ensayo de los cotizados disponibles
 * para una muestra o perforación específica.
 */

import { useState } from 'react';
import { Modal, Badge } from '../ui';
import { TIPOS_ENSAYO, getTipoMuestra } from '../../config';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Información de la muestra */}
          <div style={{ padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
            {muestra ? (
              <>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
                >
                  <div>
                    <strong>Muestra:</strong> {muestra.codigo}
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '2px' }}>
                      Profundidad: {muestra.profundidadInicio}m - {muestra.profundidadFin}m
                    </div>
                  </div>
                  {tipoMuestraInfo && (
                    <Badge color={tipoMuestraInfo.color}>{tipoMuestraInfo.nombre}</Badge>
                  )}
                </div>
                {muestra.descripcion && (
                  <div style={{ fontSize: '0.875rem', color: '#374151', marginTop: '8px' }}>
                    {muestra.descripcion}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '8px' }}>
                  Perforación: {perforacion?.codigo} • Muestra física: {perforacion?.muestraFisica}
                </div>
              </>
            ) : (
              <>
                <strong>Perforación:</strong> {perforacion?.descripcion}
                {perforacion?.muestraFisica && (
                  <div style={{ marginTop: '4px', fontSize: '0.875rem' }}>
                    <strong>Código físico:</strong> {perforacion.muestraFisica}
                  </div>
                )}
              </>
            )}
          </div>

          {tiposDisponibles.length === 0 ? (
            <div
              style={{
                padding: '16px',
                backgroundColor: '#FEE2E2',
                borderRadius: '8px',
                color: '#991B1B',
              }}
            >
              No hay ensayos cotizados disponibles para este proyecto.
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Tipo de Ensayo *
                </label>
                <select
                  value={form.tipo}
                  onChange={e => {
                    const tipo = TIPOS_ENSAYO.find(t => t.id === e.target.value);
                    setForm({ ...form, tipo: e.target.value, norma: tipo?.norma || '' });
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #D1D5DB',
                  }}
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposDisponibles.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre} (Cotizados: {ensayosDisponibles[tipo.id]})
                    </option>
                  ))}
                </select>
                {tipoSeleccionado && (
                  <div style={{ marginTop: '4px', fontSize: '0.875rem', color: '#6B7280' }}>
                    Disponibles: {cotizadosRestantes} | Norma: {tipoSeleccionado.norma}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Norma de Referencia
                </label>
                <input
                  type="text"
                  value={form.norma}
                  onChange={e => setForm({ ...form, norma: e.target.value })}
                  placeholder="Ej: ASTM E8"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #D1D5DB',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Observaciones
                </label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  rows={2}
                  placeholder="Condiciones especiales, requerimientos..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #D1D5DB',
                    resize: 'vertical',
                  }}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || creando || tiposDisponibles.length === 0}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: tiposDisponibles.length === 0 ? '#9CA3AF' : '#10B981',
                color: 'white',
                cursor:
                  loading || creando || tiposDisponibles.length === 0 ? 'not-allowed' : 'pointer',
              }}
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
