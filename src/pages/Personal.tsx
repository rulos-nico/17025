/**
 * Personal - Vista de gestion de personal y clientes
 *
 * Refactorizado para usar hooks y componentes modulares
 */

import { useState, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Card } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { usePersonalData } from '../hooks/usePersonalData';
import { usePersonalModals } from '../hooks/usePersonalModals';
import { CARGOS, getCargo } from '../config/personal';
import { PersonalRow, DetallePersonaModal, AgregarPersonaModal } from '../components/personal';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';
import type { Persona } from '../hooks/usePersonalData';
import styles from './Personal.module.css';

export default function Personal() {
  const { user } = useAuth();

  // Hooks de datos y modales
  const {
    personal,
    proyectos,
    statsPorCargo,
    totalActivos,
    loading,
    createPersona,
    deletePersona,
  } = usePersonalData();
  const { selectedPersona, isDetalleOpen, isAgregarOpen, openDetalle, openAgregar, closeModal } =
    usePersonalModals();

  // Estados de filtros
  const [filtroCargo, setFiltroCargo] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroActivo, setFiltroActivo] = useState<string>('activos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [vistaExpandida, setVistaExpandida] = useState<string | number | null>(null);

  // Estado para modal de eliminación
  const [personaAEliminar, setPersonaAEliminar] = useState<Persona | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Permisos
  const canEdit = user?.rol === 'admin' || user?.rol === 'coordinador';

  // Filtrar personal
  const personalFiltrado = useMemo(() => {
    return personal.filter(p => {
      // Filtro por estado activo
      if (filtroActivo === 'activos' && !p.activo) return false;
      if (filtroActivo === 'inactivos' && p.activo) return false;

      // Filtro por tipo (interno/externo)
      if (filtroTipo !== 'todos') {
        const cargoInfo = getCargo(p.cargo);
        if (filtroTipo === 'interno' && cargoInfo?.tipo !== 'interno') return false;
        if (filtroTipo === 'externo' && cargoInfo?.tipo !== 'externo') return false;
      }

      // Filtro por cargo
      if (filtroCargo !== 'todos' && p.cargo !== filtroCargo) return false;

      // Filtro por busqueda
      if (busqueda) {
        const search = busqueda.toLowerCase();
        const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
        const codigo = (p.codigo || '').toLowerCase();
        const empresa = (p.empresa || '').toLowerCase();
        if (
          !nombreCompleto.includes(search) &&
          !codigo.includes(search) &&
          !empresa.includes(search)
        )
          return false;
      }

      return true;
    });
  }, [personal, filtroCargo, filtroTipo, filtroActivo, busqueda]);

  // Handler para agregar persona
  const handleAgregarPersona = async (nuevaPersona: Partial<Persona>) => {
    try {
      await createPersona(nuevaPersona);
    } catch (err) {
      alert('Error al crear persona: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Handler para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!personaAEliminar) return;
    setDeleteLoading(true);
    try {
      await deletePersona(personaAEliminar);
      setPersonaAEliminar(null);
    } catch (err) {
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Personal y Clientes">
        <div className={styles.loading}>Cargando...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Personal y Clientes">
      {/* Stats por cargo */}
      <div className={styles.statsGrid}>
        {Object.entries(CARGOS).map(([key, cargo]) => (
          <Card
            key={key}
            onClick={() => setFiltroCargo(filtroCargo === key ? 'todos' : key)}
            selected={filtroCargo === key}
            className={styles.statCard}
          >
            <div className={styles.statDot} style={{ backgroundColor: cargo.color }} />
            <div className={styles.statNumber} style={{ color: cargo.color }}>
              {statsPorCargo[key]}
            </div>
            <div className={styles.statLabel}>{cargo.nombre}</div>
          </Card>
        ))}
      </div>

      {/* Filtros y busqueda */}
      <div className={styles.filtersBar}>
        <div className={styles.filtersLeft}>
          {/* Filtro tipo interno/externo */}
          <select
            value={filtroTipo}
            onChange={e => {
              setFiltroTipo(e.target.value);
              setFiltroCargo('todos');
            }}
            className={styles.select}
          >
            <option value="todos">Todos los tipos</option>
            <option value="interno">Personal interno</option>
            <option value="externo">Clientes</option>
          </select>

          {/* Filtro activos/inactivos */}
          <select
            value={filtroActivo}
            onChange={e => setFiltroActivo(e.target.value)}
            className={styles.select}
          >
            <option value="todos">Todos</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>

          {/* Limpiar filtro cargo */}
          {filtroCargo !== 'todos' && (
            <button onClick={() => setFiltroCargo('todos')} className={styles.filterTag}>
              {getCargo(filtroCargo)?.nombre}
              <span className={styles.filterTagClose}>x</span>
            </button>
          )}

          <span className={styles.resultsCount}>
            {personalFiltrado.length} de {totalActivos} activos
          </span>
        </div>

        <div className={styles.filtersRight}>
          {/* Busqueda */}
          <input
            type="text"
            placeholder="Buscar por nombre, codigo o empresa..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className={styles.searchInput}
          />

          {/* Boton agregar (solo admin) */}
          {canEdit && (
            <button onClick={openAgregar} className={styles.addButton}>
              + Agregar Persona
            </button>
          )}
        </div>
      </div>

      {/* Tabla de personal */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.th}>Codigo</th>
              <th className={styles.th}>Nombre</th>
              <th className={styles.th}>Cargo / Empresa</th>
              <th className={styles.th}>Autorizaciones</th>
              <th className={styles.th}>Proyectos</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.thCenter}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {personalFiltrado.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={7}>No se encontraron resultados</td>
              </tr>
            ) : (
              personalFiltrado.map(persona => (
                <PersonalRow
                  key={persona.id}
                  persona={persona}
                  proyectos={proyectos}
                  isExpanded={vistaExpandida === persona.id}
                  onToggle={() =>
                    setVistaExpandida(vistaExpandida === persona.id ? null : persona.id)
                  }
                  onViewDetail={() => openDetalle(persona)}
                  onDelete={p => setPersonaAEliminar(p)}
                  canEdit={canEdit}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal detalle */}
      {isDetalleOpen && selectedPersona && (
        <DetallePersonaModal persona={selectedPersona} proyectos={proyectos} onClose={closeModal} />
      )}

      {/* Modal agregar persona */}
      <AgregarPersonaModal
        isOpen={isAgregarOpen}
        onClose={closeModal}
        onSave={handleAgregarPersona}
      />

      {/* Modal confirmar eliminación */}
      <ConfirmDeleteModal
        isOpen={!!personaAEliminar}
        onClose={() => setPersonaAEliminar(null)}
        onConfirm={handleConfirmDelete}
        itemType={personaAEliminar?.cargo === 'cliente' ? 'cliente' : 'personal'}
        itemName={
          personaAEliminar
            ? `${personaAEliminar.nombre} ${personaAEliminar.apellido || ''}`.trim()
            : ''
        }
        loading={deleteLoading}
        warning={
          personaAEliminar?.cargo === 'cliente'
            ? 'Si el cliente tiene proyectos asociados, estos quedarán sin cliente asignado.'
            : undefined
        }
      />
    </PageLayout>
  );
}
