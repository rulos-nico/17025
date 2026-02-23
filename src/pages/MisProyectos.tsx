import { useState, useMemo, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge, Card, Modal } from '../components/ui';
import { SolicitarEnsayoModal } from '../components/modals';
import { useAuth } from '../hooks/useAuth';
import { ESTADO_PROYECTO, ESTADO_MUESTRA, getWorkflowInfo, TIPOS_ENSAYO } from '../config';
import { ProyectosAPI, PerforacionesAPI, EnsayosAPI } from '../services/apiService';
import styles from './MisProyectos.module.css';

// ============================================
// TYPES
// ============================================

interface HistorialWorkflow {
  de?: string;
  a: string;
  fecha: string;
  [key: string]: unknown;
}

interface Ensayo {
  id: string | number;
  codigo?: string;
  tipo?: string;
  norma?: string;
  workflow_state?: string;
  fecha_solicitud?: string;
  fecha_programada?: string;
  muestra?: string;
  perforacionId?: string | number;
  perforacion_id?: string | number;
  proyectoId?: string | number;
  proyecto_id?: string | number;
  urgente?: boolean;
  observaciones?: string;
  historial_workflow?: HistorialWorkflow[];
  [key: string]: unknown;
}

interface Perforacion {
  id: string | number;
  codigo?: string;
  descripcion?: string;
  ubicacion?: string;
  estado?: string;
  proyectoId?: string | number;
  proyecto_id?: string | number;
  [key: string]: unknown;
}

interface Proyecto {
  id: string | number;
  codigo?: string;
  nombre?: string;
  estado?: string;
  clienteId?: string | number;
  cliente_id?: string | number;
  ensayos_cotizados?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SolicitarEnsayoData {
  tipo: string;
  perforacionId: string | number;
  proyectoId: string | number;
  muestra?: string;
  norma?: string;
  urgente?: boolean;
  observaciones?: string;
}

interface EnsayoDetalleClienteProps {
  ensayo: Ensayo;
  onClose: () => void;
}

// ============================================
// DETALLE DE ENSAYO (vista cliente)
// ============================================

function EnsayoDetalleCliente({ ensayo, onClose }: EnsayoDetalleClienteProps) {
  const workflow = getWorkflowInfo(ensayo.workflow_state || '');
  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);

  // Determinar progreso visual
  const getProgreso = () => {
    const estados = ['E1', 'E2', 'E6', 'E8', 'E9', 'E10', 'E11', 'E12', 'E13', 'E14', 'E15'];
    const idx = estados.indexOf(ensayo.workflow_state || '');
    if (idx === -1) return 10; // Estados especiales (E3, E4, E5)
    return Math.round((idx / (estados.length - 1)) * 100);
  };

  // Obtener etapa amigable para el cliente
  const getEtapaCliente = () => {
    const state = ensayo.workflow_state || '';
    if (['E1', 'E2'].includes(state)) return { texto: 'En espera de ejecucion', icono: 'clock' };
    if (['E6', 'E7', 'E8'].includes(state)) return { texto: 'Ensayo en ejecucion', icono: 'gear' };
    if (['E9', 'E10', 'E11'].includes(state))
      return { texto: 'En revision de calidad', icono: 'check' };
    if (['E12'].includes(state)) return { texto: 'Listo para envio', icono: 'send' };
    if (['E13'].includes(state)) return { texto: 'Enviado - Revise su correo', icono: 'mail' };
    if (['E14', 'E15'].includes(state)) return { texto: 'Entregado', icono: 'done' };
    if (['E3'].includes(state)) return { texto: 'Anulado', icono: 'cancel' };
    if (['E4'].includes(state)) return { texto: 'En repeticion', icono: 'refresh' };
    if (['E5'].includes(state)) return { texto: 'En revision por novedad', icono: 'alert' };
    return { texto: workflow.nombre, icono: 'info' };
  };

  const etapa = getEtapaCliente();

  return (
    <Modal isOpen={true} onClose={onClose} title={`Ensayo ${ensayo.codigo}`} width="600px">
      <div className={styles.modalContent}>
        {/* Estado actual - Vista simplificada para cliente */}
        <div className={styles.detalleEstado}>
          <div className={styles.detalleEtapa} style={{ color: workflow.color }}>
            {etapa.texto}
          </div>
          <Badge color={workflow.color}>{workflow.nombre}</Badge>

          {/* Barra de progreso */}
          <div className={styles.progressSection}>
            <div className={styles.progressLabels}>
              <span>Solicitado</span>
              <span>En proceso</span>
              <span>Completado</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${getProgreso()}%`, backgroundColor: workflow.color }}
              />
            </div>
            <div className={styles.progressPercent}>{getProgreso()}% completado</div>
          </div>
        </div>

        {/* Informacion del ensayo */}
        <div className={styles.infoGrid}>
          <div>
            <div className={styles.infoLabel}>Tipo de Ensayo</div>
            <div className={styles.infoValue}>{tipoEnsayo?.nombre || ensayo.tipo}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>Norma</div>
            <div className={styles.infoValue}>{ensayo.norma || 'No especificada'}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>Fecha Solicitud</div>
            <div className={styles.infoValue}>{ensayo.fecha_solicitud}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>Fecha Programada</div>
            <div className={styles.infoValue}>{ensayo.fecha_programada || 'Pendiente'}</div>
          </div>
          <div className={styles.infoGridFull}>
            <div className={styles.infoLabel}>Muestra</div>
            <div className={styles.infoValue}>{ensayo.muestra}</div>
          </div>
        </div>

        {/* Historial simplificado - Solo estados relevantes para cliente */}
        {ensayo.historial_workflow && ensayo.historial_workflow.length > 0 && (
          <div className={styles.historialSection}>
            <h4>Seguimiento</h4>
            <div className={styles.historialList}>
              {ensayo.historial_workflow
                .slice()
                .reverse()
                .map((h, index) => {
                  const infoEstado = getWorkflowInfo(h.a);
                  return (
                    <div
                      key={index}
                      className={`${styles.historialItem} ${index === 0 ? styles.historialItemFirst : styles.historialItemRest}`}
                      style={{ borderLeftColor: infoEstado.color || '#6B7280' }}
                    >
                      <div className={styles.historialEstado}>{infoEstado.nombre}</div>
                      <div className={styles.historialFecha}>
                        {new Date(h.fecha).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className={styles.detalleActions}>
          {/* Boton descargar reporte si esta disponible */}
          {['E13', 'E14', 'E15'].includes(ensayo.workflow_state || '') && (
            <button
              onClick={() => alert('Funcionalidad de descarga pendiente de implementar')}
              className={styles.btnDownload}
            >
              Descargar Reporte
            </button>
          )}
          <button onClick={onClose} className={styles.btnClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// COMPONENTE PRINCIPAL: PORTAL CLIENTE
// ============================================

export default function MisProyectos() {
  const { user } = useAuth();

  // Estado con datos desde API
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [perforaciones, setPerforaciones] = useState<Perforacion[]>([]);
  const [ensayos, setEnsayos] = useState<Ensayo[]>([]);
  const [_loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Seleccion actual
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [selectedMuestra, setSelectedMuestra] = useState<Perforacion | null>(null);
  const [selectedEnsayo, setSelectedEnsayo] = useState<Ensayo | null>(null);

  // Modal
  const [showSolicitar, setShowSolicitar] = useState(false);

  // Filtro de proyectos
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Función unificada para cargar/recargar datos desde API
  const fetchData = async (isInitialLoad = false) => {
    try {
      const [proyectosRes, perforacionesRes, ensayosRes] = await Promise.all([
        ProyectosAPI.list(),
        PerforacionesAPI.list(),
        EnsayosAPI.list(),
      ]);

      // Mapear campos snake_case a camelCase
      setProyectos(
        ((proyectosRes || []) as Proyecto[]).map((p: Proyecto) => ({
          ...p,
          clienteId: p.cliente_id || p.clienteId,
          ensayos_cotizados: p.ensayos_cotizados || {},
        }))
      );
      setPerforaciones(
        ((perforacionesRes || []) as Perforacion[]).map((p: Perforacion) => ({
          ...p,
          proyectoId: p.proyecto_id || p.proyectoId,
        }))
      );
      setEnsayos(
        ((ensayosRes || []) as Ensayo[]).map((e: Ensayo) => ({
          ...e,
          perforacionId: e.perforacion_id || e.perforacionId,
          proyectoId: e.proyecto_id || e.proyectoId,
        }))
      );
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchData(true);
  }, []);

  // Alias para recarga (mantiene compatibilidad con código existente)
  const reloadData = () => fetchData(false);

  // Proyectos filtrados
  const proyectosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return proyectos;
    return proyectos.filter(p => p.estado === filtroEstado);
  }, [proyectos, filtroEstado]);

  // Solicitar ensayo usando API
  const handleSolicitarEnsayo = async (data: SolicitarEnsayoData) => {
    setSaving(true);
    try {
      const nuevoEnsayo = {
        tipo: data.tipo,
        perforacion_id: data.perforacionId,
        proyecto_id: data.proyectoId,
        muestra: data.muestra,
        norma: data.norma,
        fecha_solicitud: new Date().toISOString().split('T')[0],
        urgente: data.urgente,
        observaciones: data.observaciones,
      };

      await EnsayosAPI.create(nuevoEnsayo);
      setShowSolicitar(false);

      // Actualizar estado de la muestra si es primera solicitud
      const muestraActual = perforaciones.find(p => p.id === data.perforacionId);
      if (muestraActual && muestraActual.estado === 'pendiente') {
        await PerforacionesAPI.update(data.perforacionId, { estado: 'en_proceso' });
      }

      await reloadData();
    } catch (err) {
      console.error('Error creando ensayo:', err);
    } finally {
      setSaving(false);
    }
  };

  // Datos relacionados
  const muestrasProyecto = selectedProyecto
    ? perforaciones.filter(p => p.proyectoId === selectedProyecto.id)
    : [];

  const ensayosMuestra = selectedMuestra
    ? ensayos.filter(e => e.perforacionId === selectedMuestra.id)
    : [];

  // Stats generales
  const stats = useMemo(() => {
    const pendientes = ensayos.filter(e => ['E1', 'E2'].includes(e.workflow_state || '')).length;
    const enProceso = ensayos.filter(e =>
      ['E6', 'E7', 'E8', 'E9', 'E10', 'E11'].includes(e.workflow_state || '')
    ).length;
    const listos = ensayos.filter(e => ['E12'].includes(e.workflow_state || '')).length;
    const completados = ensayos.filter(e =>
      ['E13', 'E14', 'E15'].includes(e.workflow_state || '')
    ).length;
    return { pendientes, enProceso, listos, completados, total: ensayos.length };
  }, [ensayos]);

  return (
    <PageLayout title="Mis Proyectos">
      {/* Mensaje de bienvenida */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeTitle}>Bienvenido, {user?.name || 'Cliente'}</div>
        <div className={styles.welcomeText}>
          Desde aqui puede ver el estado de sus proyectos, muestras y solicitar nuevos ensayos.
        </div>
      </div>

      {/* Resumen superior */}
      <div className={styles.statsGrid}>
        <Card>
          <div className={styles.statLabel}>Proyectos</div>
          <div className={styles.statValue}>
            {proyectos.filter(p => p.estado === 'activo').length}
          </div>
          <div className={`${styles.statSubtext} ${styles.statComplete}`}>activos</div>
        </Card>
        <Card>
          <div className={styles.statLabel}>Pendientes</div>
          <div className={`${styles.statValue} ${styles.statPending}`}>{stats.pendientes}</div>
          <div className={styles.statSubtext}>por ejecutar</div>
        </Card>
        <Card>
          <div className={styles.statLabel}>En Proceso</div>
          <div className={`${styles.statValue} ${styles.statProcess}`}>{stats.enProceso}</div>
          <div className={styles.statSubtext}>ejecutando</div>
        </Card>
        <Card>
          <div className={styles.statLabel}>Listos</div>
          <div className={`${styles.statValue} ${styles.statReady}`}>{stats.listos}</div>
          <div className={styles.statSubtext}>por enviar</div>
        </Card>
        <Card>
          <div className={styles.statLabel}>Entregados</div>
          <div className={`${styles.statValue} ${styles.statComplete}`}>{stats.completados}</div>
          <div className={styles.statSubtext}>finalizados</div>
        </Card>
      </div>

      {/* Filtro de proyectos */}
      <div className={styles.filterButtons}>
        {['todos', 'activo', 'completado'].map(estado => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`${styles.filterBtn} ${filtroEstado === estado ? styles.filterBtnActive : ''}`}
          >
            {estado === 'todos' ? 'Todos' : estado.charAt(0).toUpperCase() + estado.slice(1)}
          </button>
        ))}
      </div>

      {/* Vista principal en 3 columnas */}
      <div className={styles.columnsLayout}>
        {/* COLUMNA 1: PROYECTOS */}
        <div className={styles.column}>
          <h3 className={styles.columnHeader}>
            <span>Proyectos</span>
            <span className={styles.columnCount}>({proyectosFiltrados.length})</span>
          </h3>

          <div className={styles.cardList}>
            {proyectosFiltrados.length === 0 ? (
              <div className={styles.emptyCenter}>
                No tiene proyectos {filtroEstado !== 'todos' ? filtroEstado + 's' : ''}
              </div>
            ) : (
              proyectosFiltrados.map(proyecto => {
                const estado = ESTADO_PROYECTO[proyecto.estado || ''] || {
                  label: proyecto.estado,
                  color: '#6B7280',
                };
                const numMuestras = perforaciones.filter(p => p.proyectoId === proyecto.id).length;
                const numEnsayos = ensayos.filter(e => e.proyectoId === proyecto.id).length;

                return (
                  <Card
                    key={proyecto.id}
                    onClick={() => {
                      setSelectedProyecto(proyecto);
                      setSelectedMuestra(null);
                    }}
                    selected={selectedProyecto?.id === proyecto.id}
                  >
                    <div className={styles.projectCardHeader}>
                      <div style={{ flex: 1 }}>
                        <div className={styles.projectCode}>{proyecto.codigo}</div>
                        <div className={styles.projectName}>{proyecto.nombre}</div>
                      </div>
                      <Badge color={estado.color}>{estado.label}</Badge>
                    </div>
                    <div className={styles.projectStats}>
                      <span>{numMuestras} muestras</span>
                      <span>{numEnsayos} ensayos</span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA 2: MUESTRAS */}
        <div className={styles.column}>
          <h3 className={styles.columnHeader}>
            Muestras
            {selectedProyecto && (
              <span className={styles.columnCount}>({muestrasProyecto.length})</span>
            )}
          </h3>

          {!selectedProyecto ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyArrow}>&#8592;</div>
              <div>Seleccione un proyecto</div>
            </div>
          ) : (
            <div className={styles.cardList}>
              {muestrasProyecto.length === 0 ? (
                <div className={styles.emptyCenter}>No hay muestras registradas</div>
              ) : (
                muestrasProyecto.map(muestra => {
                  const estado = ESTADO_MUESTRA[muestra.estado || ''] || {
                    label: muestra.estado,
                    color: '#6B7280',
                  };
                  const numEnsayos = ensayos.filter(e => e.perforacionId === muestra.id).length;

                  return (
                    <Card
                      key={muestra.id}
                      onClick={() => setSelectedMuestra(muestra)}
                      selected={selectedMuestra?.id === muestra.id}
                    >
                      <div className={styles.projectCardHeader}>
                        <div style={{ flex: 1 }}>
                          <div className={styles.muestraCode}>{muestra.codigo}</div>
                          <div className={styles.muestraDesc}>{muestra.descripcion}</div>
                          {muestra.ubicacion && (
                            <div className={styles.muestraLocation}>{muestra.ubicacion}</div>
                          )}
                        </div>
                        <Badge color={estado.color}>{estado.label}</Badge>
                      </div>
                      <div className={styles.muestraEnsayos}>{numEnsayos} ensayos solicitados</div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* COLUMNA 3: ENSAYOS */}
        <div className={styles.column}>
          <div className={styles.columnHeaderWithAction}>
            <h3 className={styles.columnTitle}>
              Ensayos
              {selectedMuestra && (
                <span className={styles.columnCount} style={{ marginLeft: '8px' }}>
                  ({ensayosMuestra.length})
                </span>
              )}
            </h3>
            {selectedMuestra && selectedProyecto?.estado === 'activo' && (
              <button onClick={() => setShowSolicitar(true)} className={styles.btnPrimary}>
                + Solicitar Ensayo
              </button>
            )}
          </div>

          {!selectedMuestra ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyArrow}>&#8592;</div>
              <div>Seleccione una muestra</div>
            </div>
          ) : (
            <div className={styles.cardList}>
              {ensayosMuestra.length === 0 ? (
                <div className={styles.emptyCenter}>
                  <p className={styles.emptyText}>No hay ensayos solicitados</p>
                  {selectedProyecto?.estado === 'activo' && (
                    <button
                      onClick={() => setShowSolicitar(true)}
                      className={`${styles.btnPrimary} ${styles.btnLarge}`}
                    >
                      Solicitar primer ensayo
                    </button>
                  )}
                </div>
              ) : (
                ensayosMuestra.map(ensayo => {
                  const workflow = getWorkflowInfo(ensayo.workflow_state || '');
                  const tipoEnsayo = TIPOS_ENSAYO.find(t => t.id === ensayo.tipo);

                  return (
                    <Card key={ensayo.id} onClick={() => setSelectedEnsayo(ensayo)}>
                      <div className={styles.projectCardHeader}>
                        <div style={{ flex: 1 }}>
                          <div className={styles.ensayoCode}>{ensayo.codigo}</div>
                          <div className={styles.ensayoTipo}>
                            {tipoEnsayo?.nombre || ensayo.tipo}
                          </div>
                          {ensayo.norma && (
                            <div className={styles.ensayoNorma}>Norma: {ensayo.norma}</div>
                          )}
                        </div>
                        <div className={styles.ensayoBadges}>
                          <Badge color={workflow.color}>{workflow.nombre}</Badge>
                          {ensayo.urgente && <Badge color="#DC2626">Urgente</Badge>}
                        </div>
                      </div>
                      <div className={styles.ensayoFechas}>
                        <span className={styles.ensayoFecha}>
                          Solicitado: {ensayo.fecha_solicitud}
                        </span>
                        {ensayo.fecha_programada && (
                          <span className={styles.ensayoFecha}>
                            Prog: {ensayo.fecha_programada}
                          </span>
                        )}
                      </div>
                      {/* Indicador de descarga disponible */}
                      {['E13', 'E14', 'E15'].includes(ensayo.workflow_state || '') && (
                        <div className={styles.reporteDisponible}>
                          Reporte disponible para descarga
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Solicitar Ensayo */}
      {selectedMuestra && selectedProyecto && (
        <SolicitarEnsayoModal
          isOpen={showSolicitar}
          onClose={() => setShowSolicitar(false)}
          onCreate={handleSolicitarEnsayo}
          perforacion={selectedMuestra}
          proyecto={{
            ...selectedProyecto,
            ensayosCotizados: (selectedProyecto.ensayos_cotizados || {}) as Record<string, number>,
          }}
          loading={saving}
        />
      )}

      {/* Modal Detalle Ensayo */}
      {selectedEnsayo && (
        <EnsayoDetalleCliente ensayo={selectedEnsayo} onClose={() => setSelectedEnsayo(null)} />
      )}
    </PageLayout>
  );
}
