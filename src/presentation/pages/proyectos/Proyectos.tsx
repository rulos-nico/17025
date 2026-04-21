/**
 * Proyectos - Página de gestión de proyectos
 *
 * Migrada a TypeScript con Clean Architecture
 * Usa el hook useProyectos para operaciones CRUD
 */

import { useState, useMemo } from 'react';
import PageLayout from '../../../components/PageLayout';
import { Badge, Card, Modal } from '../../../components/ui';
import { SolicitarEnsayoModal } from '../../../components/modals';
import { useAuth } from '../../../hooks/useAuth';
import { useMultipleApiData, useMutation } from '../../../hooks';
import {
  ClientesAPI,
  PerforacionesAPI,
  EnsayosAPI,
  MuestrasAPI,
  ProyectosAPI,
} from '../../../services/apiService';
import { getTipoMuestra, getWorkflowInfo } from '../../../config';
import { useTiposEnsayoData } from '../../../hooks/useTiposEnsayoData';

import {
  NuevoProyectoModal,
  EditarProyectoModal,
  EditarPerforacionModal,
  ConfirmDeleteModal,
  RelacionarMuestraModal,
  AgregarMuestraModal,
} from './components';

import { EstadoProyecto } from '@domain/value-objects';

import {
  type UserRole,
  type ProyectoUI,
  type PerforacionUI,
  type MuestraUI,
  type EnsayoUI,
  type ClienteUI,
  type ItemToDelete,
  type NuevoProyectoFormData,
  type EditarProyectoFormData,
  type EditarPerforacionFormData,
  type RelacionarMuestraFormData,
  type AgregarMuestraFormData,
  canCreateProject,
  canEditProject,
  canDeleteProject,
  canRelatePhysicalSample,
  canAddMuestras,
  canRequestTest,
  getEstadoProyecto,
  getEstadoPerforacion,
  ROLES_DISPONIBLES,
} from './types';

import styles from '../../../pages/Proyectos.module.css';

// Tipo para los datos crudos de la API
interface RawApiData extends Record<string, unknown> {
  proyectosRaw: Record<string, unknown>[];
  clientesRaw: ClienteUI[];
  perforacionesRaw: Record<string, unknown>[];
  muestrasRaw: Record<string, unknown>[];
  ensayosRaw: Record<string, unknown>[];
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface ProyectosProps {
  navigateToModule?: (module: string, params?: Record<string, unknown>) => void;
}

export default function Proyectos({ navigateToModule }: ProyectosProps) {
  const { user } = useAuth();
  const { findTipoEnsayo } = useTiposEnsayoData();

  // Rol real del usuario autenticado (dev switcher lo puede sobreescribir)
  const authRole = (user?.rol as UserRole) || 'tecnico';
  const [devRole, setDevRole] = useState<UserRole>(authRole);
  const userRole = import.meta.env.DEV ? devRole : authRole;

  // Usar hook centralizado para fetching de datos
  const {
    data,
    loading,
    reload: reloadAllData,
  } = useMultipleApiData<RawApiData>(
    {
      proyectosRaw: { api: ProyectosAPI.list },
      clientesRaw: { api: ClientesAPI.list },
      perforacionesRaw: { api: PerforacionesAPI.list },
      muestrasRaw: { api: MuestrasAPI.list },
      ensayosRaw: { api: EnsayosAPI.list },
    },
    { fetchOnMount: true }
  );

  // Extraer datos con defaults
  const { proyectosRaw, clientesRaw, perforacionesRaw, muestrasRaw, ensayosRaw } =
    data as RawApiData;

  // Transformar datos con useMemo
  const clientes: ClienteUI[] = clientesRaw || [];

  const proyectos: ProyectoUI[] = useMemo(() => {
    return (proyectosRaw || []).map((p: Record<string, unknown>) => ({
      ...p,
      id: String(p.id),
      codigo: String(p.codigo || ''),
      nombre: String(p.nombre || ''),
      clienteId: String(p.cliente_id || p.clienteId || ''),
      estado: (p.estado || 'activo') as EstadoProyecto,
      fechaInicio: String(p.fecha_inicio || ''),
      fechaFinEstimada: p.fecha_fin_estimada ? String(p.fecha_fin_estimada) : undefined,
      descripcion: p.descripcion ? String(p.descripcion) : undefined,
      contacto: p.contacto ? String(p.contacto) : undefined,
      ensayosCotizados: (p.ensayos_cotizados || p.ensayosCotizados || {}) as Record<string, number>,
    }));
  }, [proyectosRaw]);

  const perforaciones: PerforacionUI[] = useMemo(() => {
    return (perforacionesRaw || []).map((p: Record<string, unknown>) => ({
      ...p,
      id: String(p.id),
      proyectoId: String(p.proyecto_id || p.proyectoId || ''),
      codigo: String(p.codigo || p.nombre || ''),
      nombre: p.nombre ? String(p.nombre) : undefined,
      descripcion: p.descripcion ? String(p.descripcion) : undefined,
      ubicacion: p.ubicacion ? String(p.ubicacion) : undefined,
      estado: (p.estado || 'sin_relacionar') as 'sin_relacionar' | 'relacionado',
      muestraFisica: p.muestra_fisica ? String(p.muestra_fisica) : undefined,
      fecha_recepcion: p.fecha_recepcion ? String(p.fecha_recepcion) : undefined,
    }));
  }, [perforacionesRaw]);

  const muestras: MuestraUI[] = useMemo(() => {
    return (muestrasRaw || []).map((m: Record<string, unknown>) => ({
      ...m,
      id: String(m.id),
      perforacionId: String(m.perforacion_id || m.perforacionId || ''),
      codigo: String(m.codigo || ''),
      profundidadInicio: Number(m.profundidad_inicio ?? m.profundidadInicio ?? 0),
      profundidadFin: Number(m.profundidad_fin ?? m.profundidadFin ?? 0),
      tipoMuestra: String(m.tipo_muestra || m.tipoMuestra || ''),
      descripcion: m.descripcion ? String(m.descripcion) : undefined,
    }));
  }, [muestrasRaw]);

  const ensayos: EnsayoUI[] = useMemo(() => {
    return (ensayosRaw || []).map((e: Record<string, unknown>) => ({
      ...e,
      id: String(e.id),
      codigo: String(e.codigo || ''),
      tipo: String(e.tipo || ''),
      perforacionId: String(e.perforacion_id || e.perforacionId || ''),
      muestraId: e.muestra_id || e.muestraId ? String(e.muestra_id || e.muestraId) : undefined,
      proyectoId: String(e.proyecto_id || e.proyectoId || ''),
      workflow_state: String(e.workflow_state || 'E1'),
      spreadsheet_url:
        e.sheet_url || e.spreadsheet_url ? String(e.sheet_url || e.spreadsheet_url) : undefined,
    }));
  }, [ensayosRaw]);

  // Selección actual
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoUI | null>(null);
  const [selectedPerforacion, setSelectedPerforacion] = useState<PerforacionUI | null>(null);
  const [selectedMuestra, setSelectedMuestra] = useState<MuestraUI | null>(null);

  // Modales
  const [showNuevoProyecto, setShowNuevoProyecto] = useState(false);
  const [showRelacionarMuestra, setShowRelacionarMuestra] = useState(false);
  const [showAgregarMuestra, setShowAgregarMuestra] = useState(false);
  const [showSolicitarEnsayo, setShowSolicitarEnsayo] = useState(false);

  // Perforación seleccionada para agregar muestra
  const [perforacionParaMuestra, setPerforacionParaMuestra] = useState<PerforacionUI | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [showCotizadosModal, setShowCotizadosModal] = useState(false);

  // Estados para operaciones CRUD
  const [error, setError] = useState<string | null>(null);
  const [showEditarProyecto, setShowEditarProyecto] = useState(false);
  const [showEditarPerforacion, setShowEditarPerforacion] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [editingProyecto, setEditingProyecto] = useState<ProyectoUI | null>(null);
  const [editingPerforacion, setEditingPerforacion] = useState<PerforacionUI | null>(null);

  // Mutation genérica para operaciones
  const crudMutation = useMutation(
    async ({ api, method, id, data }: { api: any; method: string; id?: string; data?: any }) => {
      if (method === 'create') return api.create(data);
      if (method === 'update') return api.update(id, data);
      if (method === 'delete') return api.delete(id);
    },
    {
      onSuccess: () => reloadAllData(),
      onError: (err: Error) => setError(err.message || 'Error en la operación'),
    }
  );

  const saving = crudMutation.loading;

  // ============================================
  // HANDLERS
  // ============================================

  const handleCrearProyecto = async (data: NuevoProyectoFormData) => {
    setError(null);
    try {
      const clienteSeleccionado = clientes.find(c => c.id === data.clienteId);
      const clienteNombre = clienteSeleccionado?.nombre || 'Cliente Desconocido';

      const proyectoPayload = {
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin_estimada: data.fecha_fin_estimada || null,
        cliente_id: data.clienteId,
        cliente_nombre: clienteNombre,
        contacto: data.contacto || null,
        ensayos_cotizados: data.ensayosCotizados || {},
      };

      const nuevoProyecto = await crudMutation.mutateAsync({
        api: ProyectosAPI,
        method: 'create',
        data: proyectoPayload,
      });

      // Crear perforaciones
      for (const perf of data.perforaciones) {
        if (!perf.codigo?.trim()) continue;

        const perfPayload = {
          proyecto_id: nuevoProyecto.id,
          nombre: perf.codigo,
          descripcion: perf.descripcion || null,
          ubicacion: perf.ubicacion || null,
          profundidad: null,
          fecha_inicio: null,
        };

        await PerforacionesAPI.create(perfPayload);
      }

      await reloadAllData();
      setShowNuevoProyecto(false);
      setSelectedProyecto({
        ...nuevoProyecto,
        clienteId: nuevoProyecto.cliente_id || nuevoProyecto.clienteId,
      });
    } catch {
      // Error manejado por onError
    }
  };

  const handleEditarProyecto = async (data: EditarProyectoFormData) => {
    if (!editingProyecto) return;
    setError(null);
    try {
      const updatePayload = {
        nombre: data.nombre || null,
        descripcion: data.descripcion || null,
        fecha_fin_estimada: data.fecha_fin_estimada || null,
        contacto: data.contacto || null,
        estado: data.estado || null,
      };

      await crudMutation.mutateAsync({
        api: ProyectosAPI,
        method: 'update',
        id: editingProyecto.id,
        data: updatePayload,
      });

      setShowEditarProyecto(false);
      setEditingProyecto(null);

      if (selectedProyecto?.id === editingProyecto.id) {
        const updated = proyectos.find(p => p.id === editingProyecto.id);
        if (updated) setSelectedProyecto({ ...updated, ...data } as ProyectoUI);
      }
    } catch {
      // Error manejado
    }
  };

  const handleEditarPerforacion = async (data: EditarPerforacionFormData) => {
    if (!editingPerforacion) return;
    setError(null);
    try {
      const updatePayload = {
        nombre: data.nombre || null,
        descripcion: data.descripcion || null,
        ubicacion: data.ubicacion || null,
      };

      await crudMutation.mutateAsync({
        api: PerforacionesAPI,
        method: 'update',
        id: editingPerforacion.id,
        data: updatePayload,
      });

      setShowEditarPerforacion(false);
      setEditingPerforacion(null);

      if (selectedPerforacion?.id === editingPerforacion.id) {
        const updated = perforaciones.find(p => p.id === editingPerforacion.id);
        if (updated) setSelectedPerforacion({ ...updated, ...data } as PerforacionUI);
      }
    } catch {
      // Error manejado
    }
  };

  const handleRelacionarMuestra = async (data: RelacionarMuestraFormData) => {
    setError(null);
    try {
      await crudMutation.mutateAsync({
        api: PerforacionesAPI,
        method: 'update',
        id: data.perforacionId,
        data: { estado: 'relacionado' },
      });

      for (const muestra of data.muestras || []) {
        const muestraPayload = {
          perforacion_id: data.perforacionId,
          profundidad_inicio: parseFloat(muestra.profundidadInicio),
          profundidad_fin: parseFloat(muestra.profundidadFin),
          tipo_muestra: muestra.tipoMuestra,
          descripcion: muestra.descripcion || null,
        };
        await MuestrasAPI.create(muestraPayload);
      }

      await reloadAllData();
      setShowRelacionarMuestra(false);
      const updatedPerf = perforaciones.find(p => p.id === data.perforacionId);
      if (updatedPerf) setSelectedPerforacion(updatedPerf);
    } catch {
      // Error manejado
    }
  };

  const handleAgregarMuestra = async (data: AgregarMuestraFormData) => {
    setError(null);
    try {
      const muestraPayload = {
        perforacion_id: data.perforacionId,
        profundidad_inicio: data.profundidadInicio,
        profundidad_fin: data.profundidadFin,
        tipo_muestra: data.tipoMuestra,
        descripcion: data.descripcion || null,
      };

      await crudMutation.mutateAsync({
        api: MuestrasAPI,
        method: 'create',
        data: muestraPayload,
      });
      setShowAgregarMuestra(false);
    } catch {
      // Error manejado
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSolicitarEnsayo = async (items: any[]) => {
    setError(null);
    try {
      // El modal ahora envía un array de ensayos (carrito)
      for (const data of items) {
        const ensayoPayload = {
          tipo: data.tipo,
          perforacion_id: String(data.perforacionId),
          proyecto_id: String(data.proyectoId),
          muestra: data.muestra || data.muestraDescripcion || 'Sin especificar',
          norma: data.norma || 'Sin especificar',
          fecha_solicitud: new Date().toISOString().split('T')[0],
          muestra_id: data.muestraId ? String(data.muestraId) : null,
          urgente: data.urgente || false,
          observaciones: data.observaciones || '',
        };

        await crudMutation.mutateAsync({
          api: EnsayosAPI,
          method: 'create',
          data: ensayoPayload,
        });
      }
      setShowSolicitarEnsayo(false);
      setSelectedMuestra(null);
    } catch {
      // Error manejado
    }
  };

  const handleDeleteClick = (
    type: 'proyecto' | 'perforacion',
    item: ProyectoUI | PerforacionUI
  ) => {
    setItemToDelete({ type, item });
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const { type, item } = itemToDelete;
    setError(null);

    try {
      if (type === 'proyecto') {
        await crudMutation.mutateAsync({
          api: ProyectosAPI,
          method: 'delete',
          id: item.id,
        });
        if (selectedProyecto?.id === item.id) {
          setSelectedProyecto(null);
          setSelectedPerforacion(null);
        }
      } else if (type === 'perforacion') {
        await crudMutation.mutateAsync({
          api: PerforacionesAPI,
          method: 'delete',
          id: item.id,
        });
        if (selectedPerforacion?.id === item.id) {
          setSelectedPerforacion(null);
        }
      }

      setShowConfirmDelete(false);
      setItemToDelete(null);
    } catch {
      // Error manejado
    }
  };

  // ============================================
  // DATOS DERIVADOS
  // ============================================

  const proyectosFiltrados = proyectos.filter(p => {
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false;
    if (filtroCliente !== 'todos' && p.clienteId !== filtroCliente) return false;
    return true;
  });

  const perforacionesProyecto = selectedProyecto
    ? perforaciones.filter(p => p.proyectoId === selectedProyecto.id)
    : [];

  const ensayosPerforacion = selectedPerforacion
    ? ensayos.filter(e => e.perforacionId === selectedPerforacion.id)
    : [];

  const muestrasPerforacion = selectedPerforacion
    ? muestras.filter(m => m.perforacionId === selectedPerforacion.id)
    : [];

  const getEnsayosMuestra = (muestraId: string) => ensayos.filter(e => e.muestraId === muestraId);

  const getClienteNombre = (clienteId: string) =>
    clientes.find(c => c.id === clienteId)?.nombre || 'Desconocido';

  const perfsSinRelacionar = perforacionesProyecto.filter(
    p => p.estado === 'sin_relacionar'
  ).length;

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <PageLayout title="Proyectos">
        <div className={styles.loading}>Cargando proyectos...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Proyectos">
      {/* Selector de rol para desarrollo */}
      {import.meta.env.DEV && (
        <div className={styles.devRoleSwitcher}>
          <div className={styles.devRoleSwitcherLeft}>
            <span className={styles.devRoleLabel}>Rol actual:</span>
            <select
              value={devRole}
              onChange={e => setDevRole(e.target.value as UserRole)}
              className={styles.devRoleSelect}
            >
              {ROLES_DISPONIBLES.map(rol => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.devRolePermisos}>
            {canCreateProject(userRole) && <span>✓ Crear proyectos</span>}
            {canRelatePhysicalSample(userRole) && <span>✓ Relacionar muestras</span>}
            {canAddMuestras(userRole) && <span>✓ Agregar muestras</span>}
            {canRequestTest(userRole) && <span>✓ Solicitar ensayos</span>}
          </div>
        </div>
      )}

      {/* Banner de error */}
      {error && (
        <div className={styles.errorBanner}>
          <div className={styles.errorBannerContent}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className={styles.errorBannerClose}>
            Cerrar
          </button>
        </div>
      )}

      <div className={styles.columnsLayout}>
        {/* COLUMNA 1: PROYECTOS */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>Proyectos</h3>
            {canCreateProject(userRole) && (
              <button onClick={() => setShowNuevoProyecto(true)} className={styles.btnPrimary}>
                + Nuevo
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className={styles.filters}>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="completado">Completados</option>
            </select>
            <select
              value={filtroCliente}
              onChange={e => setFiltroCliente(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos clientes</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de proyectos */}
          <div className={styles.cardList}>
            {proyectosFiltrados.length === 0 ? (
              <div className={styles.emptyState}>No hay proyectos</div>
            ) : (
              proyectosFiltrados.map(proyecto => {
                const estado = getEstadoProyecto(proyecto.estado);
                const numPerfs = perforaciones.filter(p => p.proyectoId === proyecto.id).length;
                const numEnsayos = ensayos.filter(e => e.proyectoId === proyecto.id).length;
                const totalCotizados = Object.values(proyecto.ensayosCotizados || {}).reduce(
                  (a, b) => a + b,
                  0
                );

                return (
                  <Card
                    key={proyecto.id}
                    onClick={() => {
                      setSelectedProyecto(proyecto);
                      setSelectedPerforacion(null);
                    }}
                    selected={selectedProyecto?.id === proyecto.id}
                  >
                    <div className={styles.projectCard}>
                      <div>
                        <div className={styles.projectCode}>{proyecto.codigo}</div>
                        <div className={styles.projectName}>{proyecto.nombre}</div>
                        <div className={styles.projectClient}>
                          {getClienteNombre(proyecto.clienteId)}
                        </div>
                      </div>
                      <div className={styles.projectBadgeActions}>
                        <Badge color={estado.color}>{estado.label}</Badge>
                        <div className={styles.projectActions}>
                          {navigateToModule && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                navigateToModule('reporteProyecto', { proyectoId: proyecto.id });
                              }}
                              className={`${styles.btnSmall} ${styles.btnReport}`}
                              title="Ver reporte de este proyecto"
                            >
                              Ver reporte
                            </button>
                          )}
                          {canEditProject(userRole) && (
                            <>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingProyecto(proyecto);
                                  setShowEditarProyecto(true);
                                }}
                                className={`${styles.btnSmall} ${styles.btnEdit}`}
                              >
                                Editar
                              </button>
                              {canDeleteProject(userRole) && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteClick('proyecto', proyecto);
                                  }}
                                  className={`${styles.btnSmall} ${styles.btnDanger}`}
                                >
                                  Eliminar
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.projectStats}>
                      <span>{numPerfs} perforaciones</span>
                      <span>
                        {numEnsayos}/{totalCotizados} ensayos
                      </span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA 2: PERFORACIONES */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>
              Perforaciones
              {selectedProyecto && perfsSinRelacionar > 0 && (
                <span className={styles.warningCount}>({perfsSinRelacionar} sin relacionar)</span>
              )}
            </h3>
          </div>

          {!selectedProyecto ? (
            <div className={styles.emptyState}>Selecciona un proyecto</div>
          ) : (
            <>
              {/* Botón para ver ensayos cotizados en modal */}
              {selectedProyecto.ensayosCotizados &&
                Object.keys(selectedProyecto.ensayosCotizados).length > 0 &&
                (() => {
                  const cotizadosEntries = Object.entries(selectedProyecto.ensayosCotizados);
                  const ensayosDelProyecto = ensayos.filter(
                    e => e.proyectoId === selectedProyecto.id
                  );
                  const solicitadosPorTipo: Record<string, number> = {};
                  ensayosDelProyecto.forEach(e => {
                    solicitadosPorTipo[e.tipo] = (solicitadosPorTipo[e.tipo] || 0) + 1;
                  });
                  const totalCotizadosSum = cotizadosEntries.reduce((s, [, c]) => s + c, 0);
                  const totalSolicitadosSum = cotizadosEntries.reduce(
                    (s, [t]) => s + (solicitadosPorTipo[t] || 0),
                    0
                  );

                  return (
                    <div className={styles.cotizadosTriggerWrapper}>
                      <button
                        type="button"
                        className={styles.cotizadosTrigger}
                        onClick={() => setShowCotizadosModal(true)}
                      >
                        Ensayos cotizados{' '}
                        <span className={styles.cotizadosTriggerCount}>
                          {totalSolicitadosSum}/{totalCotizadosSum}
                        </span>
                      </button>
                    </div>
                  );
                })()}

              <div className={styles.cardList}>
                {perforacionesProyecto.length === 0 ? (
                  <div className={styles.emptyState}>No hay perforaciones definidas</div>
                ) : (
                  perforacionesProyecto.map(perf => {
                    const estado = getEstadoPerforacion(perf.estado);
                    const numEnsayos = ensayos.filter(e => e.perforacionId === perf.id).length;
                    const numMuestras = muestras.filter(m => m.perforacionId === perf.id).length;
                    const puedeRelacionar =
                      perf.estado === 'sin_relacionar' && canRelatePhysicalSample(userRole);
                    const puedeAgregarMuestra =
                      perf.estado === 'relacionado' && canAddMuestras(userRole);

                    return (
                      <Card
                        key={perf.id}
                        onClick={() => setSelectedPerforacion(perf)}
                        selected={selectedPerforacion?.id === perf.id}
                      >
                        <div className={styles.perforacionCard}>
                          <div className={styles.perforacionInfo}>
                            <div className={styles.perforacionCode}>{perf.codigo}</div>
                            <div className={styles.perforacionDesc}>{perf.descripcion}</div>
                            {perf.ubicacion && (
                              <div className={styles.perforacionLocation}>{perf.ubicacion}</div>
                            )}
                            {perf.muestraFisica && (
                              <div className={styles.perforacionMuestraFisica}>
                                Muestra: {perf.muestraFisica}
                              </div>
                            )}
                          </div>
                          <div className={styles.perforacionBadgeActions}>
                            <Badge color={estado.color}>{estado.label}</Badge>
                            {puedeRelacionar && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedPerforacion(perf);
                                  setShowRelacionarMuestra(true);
                                }}
                                className={styles.btnRelacionar}
                              >
                                Relacionar
                              </button>
                            )}
                            {puedeAgregarMuestra && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setPerforacionParaMuestra(perf);
                                  setShowAgregarMuestra(true);
                                }}
                                className={styles.btnAddMuestra}
                              >
                                + Muestra
                              </button>
                            )}
                            {canEditProject(userRole) && (
                              <div className={styles.perforacionActions}>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditingPerforacion(perf);
                                    setShowEditarPerforacion(true);
                                  }}
                                  className={`${styles.btnSmall} ${styles.btnEdit}`}
                                >
                                  Editar
                                </button>
                                {canDeleteProject(userRole) && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteClick('perforacion', perf);
                                    }}
                                    className={`${styles.btnSmall} ${styles.btnDanger}`}
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.perforacionStats}>
                          {numMuestras} muestra{numMuestras !== 1 ? 's' : ''} • {numEnsayos} ensayo
                          {numEnsayos !== 1 ? 's' : ''}
                          {perf.fecha_recepcion && ` • Recibido: ${perf.fecha_recepcion}`}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* COLUMNA 3: MUESTRAS Y ENSAYOS */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>
              Muestras y Ensayos
              {selectedPerforacion && muestrasPerforacion.length > 0 && (
                <span className={styles.columnCount}>({muestrasPerforacion.length})</span>
              )}
            </h3>
          </div>

          {!selectedPerforacion ? (
            <div className={styles.emptyState}>Selecciona una perforación</div>
          ) : selectedPerforacion.estado === 'sin_relacionar' ? (
            <div className={styles.emptyStateWarning}>
              <div>
                <div className={styles.emptyIcon}>⏳</div>
                <div>Esta perforación aún no tiene muestra física relacionada.</div>
                {canRelatePhysicalSample(userRole) && (
                  <button
                    onClick={() => setShowRelacionarMuestra(true)}
                    className={styles.btnWarningLarge}
                  >
                    Relacionar muestra
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.cardList}>
              {muestrasPerforacion.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <div>No hay muestras registradas</div>
                  <div className={styles.emptySubtext}>
                    El personal del laboratorio debe agregar muestras desde la columna de
                    perforaciones
                  </div>
                </div>
              ) : (
                muestrasPerforacion
                  .sort((a, b) => a.profundidadInicio - b.profundidadInicio)
                  .map(muestra => {
                    const tipoMuestra = getTipoMuestra(muestra.tipoMuestra);
                    const ensayosMuestra = getEnsayosMuestra(muestra.id);
                    const isSelected = selectedMuestra?.id === muestra.id;

                    return (
                      <div key={muestra.id}>
                        <Card
                          onClick={() => setSelectedMuestra(isSelected ? null : muestra)}
                          selected={isSelected}
                        >
                          <div className={styles.muestraCard}>
                            <div className={styles.muestraInfo}>
                              <div className={styles.muestraHeader}>
                                <span className={styles.muestraIcon}>📍</span>
                                <div>
                                  <div className={styles.muestraCodigo}>{muestra.codigo}</div>
                                  <div className={styles.muestraProf}>
                                    {muestra.profundidadInicio}m - {muestra.profundidadFin}m
                                  </div>
                                </div>
                              </div>
                              {muestra.descripcion && (
                                <div className={styles.muestraDesc}>{muestra.descripcion}</div>
                              )}
                            </div>
                            <div className={styles.muestraBadgeActions}>
                              <Badge color={tipoMuestra?.color || '#6B7280'}>
                                {tipoMuestra?.nombre || muestra.tipoMuestra}
                              </Badge>
                              <span className={styles.muestraEnsayosCount}>
                                {ensayosMuestra.length} ensayo
                                {ensayosMuestra.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {canRequestTest(userRole) && (
                            <div className={styles.muestraActions}>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedMuestra(muestra);
                                  setShowSolicitarEnsayo(true);
                                }}
                                className={styles.btnSolicitarEnsayo}
                              >
                                + Solicitar Ensayo
                              </button>
                            </div>
                          )}
                        </Card>

                        {isSelected && ensayosMuestra.length > 0 && (
                          <div className={styles.ensayosExpandible}>
                            {ensayosMuestra.map(ensayo => {
                              const workflow = getWorkflowInfo(ensayo.workflow_state);
                              const tipoEnsayo = findTipoEnsayo(ensayo.tipo);

                              return (
                                <div key={ensayo.id} className={styles.ensayoItemExpanded}>
                                  <div className={styles.ensayoItemHeader}>
                                    <div>
                                      <span className={styles.ensayoItemCodigo}>
                                        {ensayo.codigo}
                                      </span>
                                      <span className={styles.ensayoItemTipo}>
                                        {tipoEnsayo.nombre}
                                      </span>
                                    </div>
                                    <Badge color={workflow.color} small>
                                      {workflow.nombre}
                                    </Badge>
                                  </div>
                                  <div className={styles.ensayoItemLinks}>
                                    {ensayo.spreadsheet_url ? (
                                      <a
                                        href={ensayo.spreadsheet_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.btnVerLink}
                                        onClick={e => e.stopPropagation()}
                                      >
                                        Ver
                                      </a>
                                    ) : (
                                      <a
                                        href={`/ensayos?id=${ensayo.id}`}
                                        className={styles.btnVerLink}
                                      >
                                        Ver
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}

              {ensayosPerforacion.filter(e => !e.muestraId).length > 0 && (
                <div className={styles.ensayosSinMuestra}>
                  <div className={styles.ensayosSinMuestraTitle}>Ensayos sin muestra asignada</div>
                  {ensayosPerforacion
                    .filter(e => !e.muestraId)
                    .map(ensayo => {
                      const workflow = getWorkflowInfo(ensayo.workflow_state);
                      const tipoEnsayo = findTipoEnsayo(ensayo.tipo);

                      return (
                        <Card key={ensayo.id}>
                          <div className={styles.ensayoLegacyCard}>
                            <div>
                              <div className={styles.ensayoLegacyCodigo}>{ensayo.codigo}</div>
                              <div className={styles.ensayoLegacyTipo}>{tipoEnsayo.nombre}</div>
                            </div>
                            <Badge color={workflow.color}>{workflow.nombre}</Badge>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resumen inferior */}
      <div className={styles.resumenBar}>
        <div>
          <strong>Total Proyectos:</strong> {proyectos.length}
        </div>
        <div>
          <strong>Activos:</strong> {proyectos.filter(p => p.estado === 'activo').length}
        </div>
        <div>
          <strong>Perforaciones:</strong> {perforaciones.length} (
          {perforaciones.filter(p => p.estado === 'sin_relacionar').length} sin relacionar)
        </div>
        <div>
          <strong>Total Ensayos:</strong> {ensayos.length}
        </div>
        <div>
          <strong>Pendientes:</strong> {ensayos.filter(e => e.workflow_state === 'E1').length}
        </div>
        <div>
          <strong>En proceso:</strong>{' '}
          {ensayos.filter(e => ['E2', 'E6', 'E7', 'E8'].includes(e.workflow_state)).length}
        </div>
      </div>

      {/* Modales */}
      <NuevoProyectoModal
        isOpen={showNuevoProyecto}
        onClose={() => setShowNuevoProyecto(false)}
        onCreate={handleCrearProyecto}
        clientes={clientes}
        loading={saving}
      />

      <RelacionarMuestraModal
        isOpen={showRelacionarMuestra}
        onClose={() => setShowRelacionarMuestra(false)}
        onRelate={handleRelacionarMuestra}
        perforacion={selectedPerforacion}
        loading={saving}
      />

      {perforacionParaMuestra && (
        <AgregarMuestraModal
          isOpen={showAgregarMuestra}
          onClose={() => {
            setShowAgregarMuestra(false);
            setPerforacionParaMuestra(null);
          }}
          onAdd={handleAgregarMuestra}
          perforacion={perforacionParaMuestra}
          muestrasExistentes={muestras.filter(m => m.perforacionId === perforacionParaMuestra.id)}
          loading={saving}
        />
      )}

      {selectedPerforacion && selectedProyecto && (
        <SolicitarEnsayoModal
          isOpen={showSolicitarEnsayo}
          onClose={() => {
            setShowSolicitarEnsayo(false);
            setSelectedMuestra(null);
          }}
          onCreate={handleSolicitarEnsayo}
          perforacion={selectedPerforacion}
          muestra={selectedMuestra}
          proyecto={selectedProyecto}
          loading={saving}
        />
      )}

      <EditarProyectoModal
        isOpen={showEditarProyecto}
        onClose={() => {
          setShowEditarProyecto(false);
          setEditingProyecto(null);
        }}
        onEdit={handleEditarProyecto}
        proyecto={editingProyecto}
        loading={saving}
      />

      <EditarPerforacionModal
        isOpen={showEditarPerforacion}
        onClose={() => {
          setShowEditarPerforacion(false);
          setEditingPerforacion(null);
        }}
        onEdit={handleEditarPerforacion}
        perforacion={editingPerforacion}
        loading={saving}
      />

      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        itemToDelete={itemToDelete}
        loading={saving}
      />

      {/* Modal de ensayos cotizados */}
      {selectedProyecto?.ensayosCotizados &&
        Object.keys(selectedProyecto.ensayosCotizados).length > 0 && (
          <Modal
            isOpen={showCotizadosModal}
            onClose={() => setShowCotizadosModal(false)}
            title="Ensayos cotizados"
            width="700px"
          >
            <div className={styles.cotizadosModalBody}>
              {(() => {
                const cotizadosEntries = Object.entries(selectedProyecto.ensayosCotizados);
                const ensayosDelProyecto = ensayos.filter(
                  e => e.proyectoId === selectedProyecto.id
                );
                const solicitadosPorTipo: Record<string, number> = {};
                ensayosDelProyecto.forEach(e => {
                  solicitadosPorTipo[e.tipo] = (solicitadosPorTipo[e.tipo] || 0) + 1;
                });
                const totalCotizadosSum = cotizadosEntries.reduce((s, [, c]) => s + c, 0);
                const totalSolicitadosSum = cotizadosEntries.reduce(
                  (s, [t]) => s + (solicitadosPorTipo[t] || 0),
                  0
                );

                return (
                  <>
                    <div className={styles.cotizadosModalSummary}>
                      Total solicitados: <strong>{totalSolicitadosSum}</strong> de{' '}
                      <strong>{totalCotizadosSum}</strong> cotizados
                    </div>
                    <table className={styles.cotizadosTable}>
                      <thead>
                        <tr>
                          <th>Tipo de ensayo</th>
                          <th>Solicitados / Cotizados</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cotizadosEntries.map(([tipo, cotizados]) => {
                          const tipoInfo = findTipoEnsayo(tipo);
                          const solicitados = solicitadosPorTipo[tipo] || 0;
                          let rowClass = styles.cotizadosRowEmpty;
                          if (solicitados > cotizados) rowClass = styles.cotizadosRowOver;
                          else if (solicitados >= cotizados) rowClass = styles.cotizadosRowFull;
                          else if (solicitados > 0) rowClass = styles.cotizadosRowPartial;

                          return (
                            <tr key={tipo} className={rowClass}>
                              <td>{tipoInfo.nombre}</td>
                              <td>
                                {solicitados} / {cotizados}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                );
              })()}
            </div>
          </Modal>
        )}
    </PageLayout>
  );
}
