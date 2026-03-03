/**
 * SolicitarEnsayoModal - Modal para que clientes soliciten ensayos
 *
 * Permite seleccionar múltiples tipos de ensayo (estilo carrito) de los cotizados
 * disponibles para una muestra o perforación específica.
 * Cada ensayo puede tener sus propias observaciones.
 *
 * Soporta "Otro" para solicitar ensayos de tipos no cotizados,
 * creando automáticamente el nuevo tipo en la BD antes de crear el ensayo.
 *
 * NOTA: Usa useTiposEnsayoData para cargar tipos desde la API,
 * asegurando consistencia con los IDs usados al crear proyectos.
 */

import { useState, useMemo, FormEvent, ChangeEvent, ReactElement } from 'react';
import { Modal, Badge, Combobox, ComboboxOption } from '../ui';
import { getTipoMuestra, TipoEnsayo } from '../../config';
import { useTiposEnsayoData } from '../../hooks/useTiposEnsayoData';
import { TiposEnsayoAPI, CreateTipoEnsayoPayload } from '../../services/apiService';
import styles from './SolicitarEnsayoModal.module.css';

// ============================================
// CONSTANTS
// ============================================

/** Sentinel ID for the "Otro" (Other) option in the Combobox */
const OTRO_TIPO_ID = '__otro__';

// ============================================
// TYPES
// ============================================

interface CartItem {
  id: string; // unique key for React (generated UUID)
  tipoId: string; // UUID del tipo de ensayo (o OTRO_TIPO_ID)
  tipoNombre: string; // nombre para mostrar
  norma: string;
  observaciones: string;
  isOtro: boolean; // true si fue agregado con "Otro"
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
  /** Callback async para crear los ensayos (recibe array) */
  onCreate: (datos: DatosEnsayo[]) => Promise<void>;
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
// HELPERS
// ============================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
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
  // Cargar tipos de ensayo desde la API (mismos IDs usados al crear proyecto)
  const { tiposEnsayo, loading: loadingTipos, refetch } = useTiposEnsayoData();

  // Estado del carrito
  const [cart, setCart] = useState<CartItem[]>([]);

  // Estado del formulario para agregar al carrito
  const [selectedTipo, setSelectedTipo] = useState('');
  const [normaEdit, setNormaEdit] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [customNombre, setCustomNombre] = useState('');

  const [creando, setCreando] = useState(false);

  // ¿El tipo seleccionado es "Otro"?
  const isOtro = selectedTipo === OTRO_TIPO_ID;

  // Ensayos disponibles según lo cotizado en el proyecto
  const ensayosCotizados = proyecto?.ensayosCotizados || {};

  // Contar cuántos de cada tipo hay en el carrito
  const cartCountByTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of cart) {
      if (!item.isOtro) {
        counts[item.tipoId] = (counts[item.tipoId] || 0) + 1;
      }
    }
    return counts;
  }, [cart]);

  // Calcular disponibles para un tipo (cotizados - en carrito)
  const getDisponibles = (tipoId: string): number => {
    const cotizados = ensayosCotizados[tipoId] || 0;
    const enCarrito = cartCountByTipo[tipoId] || 0;
    return cotizados - enCarrito;
  };

  // Filtrar tipos de ensayo que tienen cantidad cotizada > 0
  const tiposDisponibles = useMemo(() => {
    return tiposEnsayo.filter(t => ensayosCotizados[t.id] > 0);
  }, [tiposEnsayo, ensayosCotizados]);

  // Opciones para el Combobox (cotizados + "Otro")
  const tipoOptions: ComboboxOption[] = useMemo(() => {
    const cotizadoOptions = tiposDisponibles.map((tipo: TipoEnsayo) => {
      const disponibles = getDisponibles(tipo.id);
      const cotizados = ensayosCotizados[tipo.id] || 0;
      const agotado = disponibles <= 0;

      return {
        value: tipo.id,
        label: tipo.nombre,
        sublabel: `${disponibles} de ${cotizados} disponibles`,
        disabled: agotado,
      };
    });

    // Siempre agregar la opción "Otro" al final
    cotizadoOptions.push({
      value: OTRO_TIPO_ID,
      label: 'Otro (no cotizado)',
      sublabel: 'Ensayo fuera de cotización',
      disabled: false,
    });

    return cotizadoOptions;
  }, [tiposDisponibles, ensayosCotizados, cartCountByTipo]);

  // Handler para cuando cambia la selección en el Combobox
  const handleTipoChange = (value: string, _option: ComboboxOption | null): void => {
    setSelectedTipo(value);

    if (value === OTRO_TIPO_ID) {
      // "Otro" seleccionado: limpiar campos para que el usuario escriba todo
      setNormaEdit('');
      setCustomNombre('');
    } else {
      // Tipo cotizado: cargar norma por defecto
      const tipo = tiposEnsayo.find(t => t.id === value);
      setNormaEdit(tipo?.norma || '');
      setCustomNombre('');
    }
  };

  // Agregar ensayo al carrito
  const handleAddToCart = (): void => {
    if (!selectedTipo) return;

    // Validar que la norma no esté vacía
    const normaTrimmed = normaEdit.trim();
    if (!normaTrimmed) {
      alert('La norma de referencia es requerida');
      return;
    }

    if (isOtro) {
      // Validar nombre personalizado
      const nombreTrimmed = customNombre.trim();
      if (!nombreTrimmed) {
        alert('El nombre del ensayo es requerido');
        return;
      }

      const newItem: CartItem = {
        id: generateId(),
        tipoId: OTRO_TIPO_ID,
        tipoNombre: nombreTrimmed,
        norma: normaTrimmed,
        observaciones: observaciones.trim(),
        isOtro: true,
      };

      setCart([...cart, newItem]);
      setObservaciones('');
      setCustomNombre('');
      setNormaEdit('');
    } else {
      // Tipo cotizado: verificar disponibilidad
      const disponibles = getDisponibles(selectedTipo);
      if (disponibles <= 0) return;

      const tipo = tiposEnsayo.find(t => t.id === selectedTipo);
      if (!tipo) return;

      const newItem: CartItem = {
        id: generateId(),
        tipoId: selectedTipo,
        tipoNombre: tipo.nombre,
        norma: normaTrimmed,
        observaciones: observaciones.trim(),
        isOtro: false,
      };

      setCart([...cart, newItem]);
      setObservaciones('');
      // No limpiamos selectedTipo ni normaEdit para facilitar agregar múltiples del mismo tipo
    }
  };

  // Remover ensayo del carrito
  const handleRemoveFromCart = (itemId: string): void => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Crear tipos "Otro" en la BD y devolver un mapa nombre -> tipoId real
  const createOtroTipos = async (otroItems: CartItem[]): Promise<Map<string, string>> => {
    const nombreToId = new Map<string, string>();

    // Deduplicar por nombre (case-insensitive)
    const uniqueNombres = new Map<string, CartItem>();
    for (const item of otroItems) {
      const key = item.tipoNombre.toLowerCase();
      if (!uniqueNombres.has(key)) {
        uniqueNombres.set(key, item);
      }
    }

    // Crear cada tipo único en la BD
    for (const [key, item] of uniqueNombres) {
      const payload: CreateTipoEnsayoPayload = {
        nombre: item.tipoNombre,
        norma: item.norma,
        acre: 'Otra',
        categoria: 'otro',
      };

      const created = await TiposEnsayoAPI.create(payload);
      nombreToId.set(key, created.id);
    }

    return nombreToId;
  };

  // Enviar todos los ensayos del carrito
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (cart.length === 0) return;

    setCreando(true);

    try {
      // Separar items "Otro" para crear sus tipos primero
      const otroItems = cart.filter(item => item.isOtro);

      // Crear tipos "Otro" en la BD si hay alguno
      let otroNombreToId = new Map<string, string>();
      if (otroItems.length > 0) {
        otroNombreToId = await createOtroTipos(otroItems);
        // Refrescar el cache del provider para que los nuevos tipos sean visibles
        await refetch();
      }

      const muestraLabel = muestra
        ? `${muestra.codigo} (${muestra.profundidadInicio}m-${muestra.profundidadFin}m)`
        : perforacion.descripcion || '';

      const datosEnsayos: DatosEnsayo[] = cart.map(item => {
        let tipoId = item.tipoId;

        // Para items "Otro", resolver el ID real creado en la BD
        if (item.isOtro) {
          const key = item.tipoNombre.toLowerCase();
          tipoId = otroNombreToId.get(key) || item.tipoId;
        }

        return {
          tipo: tipoId,
          norma: item.norma,
          observaciones: item.observaciones,
          cantidad: 1,
          perforacionId: perforacion.id,
          muestraId: muestra?.id || null,
          proyectoId: proyecto.id,
          muestra: muestraLabel,
          workflow_state: 'E1',
          createdAt: new Date().toISOString(),
        };
      });

      await onCreate(datosEnsayos);
      setCart([]);
      setSelectedTipo('');
      setNormaEdit('');
      setObservaciones('');
      setCustomNombre('');
    } catch (err) {
      console.error('Error creando ensayos:', err);
    } finally {
      setCreando(false);
    }
  };

  // Obtener información del tipo de muestra
  const tipoMuestraInfo = muestra?.tipoMuestra ? getTipoMuestra(muestra.tipoMuestra) : null;

  // Info del tipo seleccionado actualmente (undefined si es "Otro")
  const tipoSeleccionadoInfo = tiposEnsayo.find(t => t.id === selectedTipo);
  const disponiblesActual = selectedTipo && !isOtro ? getDisponibles(selectedTipo) : 0;

  // Lógica del botón "Agregar": deshabilitado si...
  const addDisabled =
    !selectedTipo ||
    !normaEdit.trim() ||
    (isOtro && !customNombre.trim()) ||
    (!isOtro && disponiblesActual <= 0);

  // Reset cart when modal closes
  const handleClose = (): void => {
    setCart([]);
    setSelectedTipo('');
    setNormaEdit('');
    setObservaciones('');
    setCustomNombre('');
    onClose();
  };

  // ¿Hay tipos cotizados? (para decidir qué mensaje mostrar)
  const hayCotizados = tiposDisponibles.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Solicitar Ensayos${muestra ? ` - ${muestra.codigo}` : ''}`}
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

          {loadingTipos ? (
            <div className={styles.loadingBox}>Cargando tipos de ensayo...</div>
          ) : (
            <>
              {/* Mensaje informativo cuando no hay cotizados */}
              {!hayCotizados && (
                <div className={styles.infoNote}>
                  No hay ensayos cotizados para este proyecto. Puede solicitar ensayos usando la
                  opción &quot;Otro (no cotizado)&quot;.
                </div>
              )}

              {/* Sección para agregar ensayos al carrito */}
              <div className={styles.addSection}>
                <div className={styles.addSectionTitle}>Agregar ensayo</div>

                <div className={styles.field}>
                  <label className={styles.label}>Tipo de Ensayo</label>
                  <Combobox
                    options={tipoOptions}
                    value={selectedTipo}
                    onChange={handleTipoChange}
                    placeholder="Buscar tipo de ensayo..."
                  />
                  {/* Hint de disponibilidad (solo para tipos cotizados) */}
                  {tipoSeleccionadoInfo && !isOtro && (
                    <div className={styles.hint}>
                      <span className={disponiblesActual <= 2 ? styles.warningText : ''}>
                        Disponibles: {disponiblesActual}
                      </span>
                    </div>
                  )}
                </div>

                {/* Campo nombre personalizado (solo para "Otro") */}
                {isOtro && (
                  <div className={styles.field}>
                    <label className={styles.label}>Nombre del Ensayo *</label>
                    <input
                      type="text"
                      value={customNombre}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setCustomNombre(e.target.value)
                      }
                      placeholder="Ej: Ensayo de permeabilidad, Corte directo..."
                      className={styles.input}
                    />
                  </div>
                )}

                <div className={styles.field}>
                  <label className={styles.label}>Norma de Referencia *</label>
                  <input
                    type="text"
                    value={normaEdit}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNormaEdit(e.target.value)}
                    placeholder="Ej: ASTM E8, NTC 673"
                    className={styles.input}
                    disabled={!selectedTipo}
                  />
                  {tipoSeleccionadoInfo?.norma && !isOtro && (
                    <div className={styles.hint}>
                      Norma por defecto: {tipoSeleccionadoInfo.norma}
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Observaciones (opcional)</label>
                  <textarea
                    value={observaciones}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setObservaciones(e.target.value)
                    }
                    rows={2}
                    placeholder="Condiciones especiales, requerimientos..."
                    className={styles.textarea}
                    disabled={!selectedTipo}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addDisabled}
                  className={styles.addBtn}
                >
                  + Agregar al listado
                </button>
              </div>

              {/* Carrito de ensayos */}
              {cart.length > 0 && (
                <div className={styles.cartSection}>
                  <div className={styles.cartTitle}>Ensayos a solicitar ({cart.length})</div>
                  <div className={styles.cartList}>
                    {cart.map((item, index) => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.cartItemHeader}>
                          <span className={styles.cartItemNumber}>{index + 1}.</span>
                          <span className={styles.cartItemName}>
                            {item.tipoNombre}
                            {item.isOtro && <span className={styles.otroBadge}> Otro</span>}
                          </span>
                          <span className={styles.cartItemNorma}>({item.norma})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className={styles.removeBtn}
                            title="Quitar del listado"
                          >
                            ×
                          </button>
                        </div>
                        {item.observaciones && (
                          <div className={styles.cartItemObs}>Obs: {item.observaciones}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={handleClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || creando || cart.length === 0}
              className={styles.btnSubmit}
            >
              {creando ? 'Creando...' : `Solicitar${cart.length > 0 ? ` (${cart.length})` : ''}`}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default SolicitarEnsayoModal;
