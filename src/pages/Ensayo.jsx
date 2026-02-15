/**
 * Ensayo - Página principal de gestión de ensayos
 *
 * Muestra los ensayos en vista Kanban o jerárquica por proyecto,
 * con funcionalidad para cambiar estado, marcar novedades y reasignar.
 */

import { useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../hooks/useAuth';
import { useEnsayosData } from '../hooks/useEnsayosData';
import { useEnsayoModals } from '../hooks/useEnsayoModals';
import { isClienteRole } from '../utils/permissions';
import { TIPOS_ENSAYO } from '../config';
import styles from './Ensayo.module.css';

// Componentes de visualización
import {
  ViewTabs,
  KanbanColumn,
  HierarchyView,
  CambiarEstadoModal,
  NovedadModal,
  ReasignarModal,
  DetalleEnsayoModal,
} from '../components/ensayo';

// ============================================
// CONFIGURACIÓN DE COLUMNAS KANBAN
// ============================================

const KANBAN_COLUMNS = [
  {
    id: 'pendientes',
    titulo: 'Pendientes',
    estados: ['E1', 'E2'],
    color: '#F59E0B',
    descripcion: 'Sin programar / Programados',
  },
  {
    id: 'ejecucion',
    titulo: 'En Ejecución',
    estados: ['E6', 'E7', 'E8'],
    color: '#3B82F6',
    descripcion: 'Ejecutando / Procesando',
  },
  {
    id: 'revision',
    titulo: 'En Revisión',
    estados: ['E9', 'E10', 'E11'],
    color: '#8B5CF6',
    descripcion: 'Rev. Técnica / Coord. / Dir.',
  },
  {
    id: 'entrega',
    titulo: 'Entrega',
    estados: ['E12', 'E13', 'E14'],
    color: '#10B981',
    descripcion: 'Por enviar / Enviado / Entregado',
  },
  {
    id: 'otros',
    titulo: 'Otros',
    estados: ['E3', 'E4', 'E5'],
    color: '#EF4444',
    descripcion: 'Anulado / Repetición / Novedad',
  },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Ensayo() {
  const { user } = useAuth();
  const userRole = user?.rol || 'tecnico';
  const userId = user?.id || null;

  // Hook de datos
  const {
    ensayos,
    tecnicos,
    clientes,
    proyectos,
    perforaciones,
    muestras,
    loading,
    updateEnsayoState,
    updateEnsayoNovedad,
    updateEnsayoTecnico,
  } = useEnsayosData();

  // Hook de modales
  const modals = useEnsayoModals();

  // Vista activa
  const [viewMode, setViewMode] = useState('kanban');

  // Filtros
  const [soloMisEnsayos, setSoloMisEnsayos] = useState(userRole === 'tecnico');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Filtrar ensayos
  const ensayosFiltrados = useMemo(() => {
    return ensayos.filter(e => {
      if (soloMisEnsayos && e.tecnicoId !== userId) return false;
      if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false;
      if (isClienteRole(userRole) && e.clienteId !== user?.clienteId) return false;
      return true;
    });
  }, [ensayos, soloMisEnsayos, filtroTipo, userId, userRole, user?.clienteId]);

  // Handlers de acciones
  const handleCambiarEstadoSubmit = async (ensayoId, nuevoEstado, comentario) => {
    try {
      await updateEnsayoState(ensayoId, nuevoEstado, comentario);
    } catch {
      alert('Error al cambiar el estado del ensayo');
    }
    modals.closeModal();
  };

  const handleNovedadSubmit = async (ensayoId, razon) => {
    try {
      await updateEnsayoNovedad(ensayoId, razon);
    } catch {
      alert('Error al registrar la novedad');
    }
    modals.closeModal();
  };

  const handleReasignarSubmit = async (ensayoId, tecnicoId) => {
    try {
      await updateEnsayoTecnico(ensayoId, tecnicoId);
    } catch {
      alert('Error al reasignar el ensayo');
    }
    modals.closeModal();
  };

  // Estadísticas
  const stats = useMemo(
    () => ({
      total: ensayosFiltrados.length,
      misPendientes: ensayosFiltrados.filter(
        e => e.tecnicoId === userId && ['E1', 'E2'].includes(e.workflowState || e.workflow_state)
      ).length,
      misEnEjecucion: ensayosFiltrados.filter(
        e =>
          e.tecnicoId === userId && ['E6', 'E7', 'E8'].includes(e.workflowState || e.workflow_state)
      ).length,
      enRevision: ensayosFiltrados.filter(e =>
        ['E9', 'E10', 'E11'].includes(e.workflowState || e.workflow_state)
      ).length,
      novedades: ensayosFiltrados.filter(e => (e.workflowState || e.workflow_state) === 'E5')
        .length,
    }),
    [ensayosFiltrados, userId]
  );

  if (loading) {
    return (
      <PageLayout title="Ensayos">
        <div className={styles.loading}>Cargando ensayos...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Ensayos">
      {/* Tabs de vista */}
      <ViewTabs activeView={viewMode} onChangeView={setViewMode} />

      {/* Barra de filtros y estadísticas */}
      <div className={styles.filterBar}>
        <div className={styles.filters}>
          {!isClienteRole(userRole) && (
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={soloMisEnsayos}
                onChange={e => setSoloMisEnsayos(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>Solo mis ensayos</span>
            </label>
          )}

          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="todos">Todos los tipos</option>
            {TIPOS_ENSAYO.map(tipo => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.stats}>
          <span>
            <strong>{stats.total}</strong> ensayos
          </span>
          {!isClienteRole(userRole) && (
            <>
              <span className={styles.statPending}>
                <strong>{stats.misPendientes}</strong> pendientes
              </span>
              <span className={styles.statExecution}>
                <strong>{stats.misEnEjecucion}</strong> en ejecucion
              </span>
            </>
          )}
          <span className={styles.statReview}>
            <strong>{stats.enRevision}</strong> en revision
          </span>
          {stats.novedades > 0 && (
            <span className={styles.statNovedad}>
              <strong>{stats.novedades}</strong> novedades
            </span>
          )}
        </div>
      </div>

      {/* Vista segun tab seleccionado */}
      {viewMode === 'kanban' ? (
        <div className={styles.kanbanContainer}>
          {KANBAN_COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              ensayos={ensayosFiltrados}
              tecnicos={tecnicos}
              userRole={userRole}
              userId={userId}
              onCardClick={modals.openDetalle}
              onCambiarEstado={modals.openCambiarEstado}
              onNovedad={modals.openNovedad}
              onReasignar={modals.openReasignar}
            />
          ))}
        </div>
      ) : (
        <HierarchyView
          proyectos={proyectos}
          perforaciones={perforaciones}
          muestras={muestras}
          ensayos={ensayosFiltrados}
          onEnsayoClick={modals.openDetalle}
        />
      )}

      {/* Modales */}
      <DetalleEnsayoModal
        isOpen={modals.isDetalleOpen}
        onClose={modals.closeModal}
        ensayo={modals.selectedEnsayo}
        tecnicos={tecnicos}
        clientes={clientes}
      />

      <CambiarEstadoModal
        isOpen={modals.isCambiarEstadoOpen}
        onClose={modals.closeModal}
        ensayo={modals.selectedEnsayo}
        onCambiar={handleCambiarEstadoSubmit}
        userRole={userRole}
      />

      <NovedadModal
        isOpen={modals.isNovedadOpen}
        onClose={modals.closeModal}
        ensayo={modals.selectedEnsayo}
        onMarcar={handleNovedadSubmit}
      />

      <ReasignarModal
        isOpen={modals.isReasignarOpen}
        onClose={modals.closeModal}
        ensayo={modals.selectedEnsayo}
        tecnicos={tecnicos}
        onReasignar={handleReasignarSubmit}
      />
    </PageLayout>
  );
}
