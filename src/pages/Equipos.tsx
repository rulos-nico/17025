/**
 * Equipos - Pagina de gestion de equipos y sensores
 *
 * Refactorizada para usar hooks y componentes extraidos.
 * Original: 1846 lineas -> Actual: ~280 lineas
 */

import React, { useState, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { ConfirmDeleteModal } from '../components/modals';
import { EquipoFormModal, SensorFormModal, NuevoDropdown, EquipoRow } from '../components/equipo';
import { useEquiposData } from '../hooks/useEquiposData';
import { useEquiposModals } from '../hooks/useEquiposModals';
import { getDiasParaVencimiento } from '../utils';
import styles from './Equipos.module.css';

export default function Equipos() {
  // Hooks de datos y modales
  const {
    equipos,
    comprobaciones,
    calibraciones,
    loading,
    saving,
    error,
    createEquipo,
    updateEquipo,
    createSensor,
    updateSensor,
    deleteItem,
    clearError,
  } = useEquiposData();

  const {
    selectedItem,
    isEquipoFormOpen,
    isSensorFormOpen,
    isDeleteOpen,
    openEquipoForm,
    openSensorForm,
    openDeleteConfirm,
    openEditForm,
    closeModal,
  } = useEquiposModals();

  // Estados locales de UI
  const [expandedRows, setExpandedRows] = useState<Record<string | number, boolean>>({});
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroUbicacion, setFiltroUbicacion] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Handlers
  const handleSaveEquipo = async (formData: Record<string, unknown>) => {
    if (selectedItem) {
      await updateEquipo(selectedItem.id, formData);
    } else {
      await createEquipo(formData);
    }
    closeModal();
  };

  const handleSaveSensor = async (formData: Record<string, unknown>) => {
    if (selectedItem) {
      await updateSensor(selectedItem.id, formData);
    } else {
      await createSensor(formData);
    }
    closeModal();
  };

  const handleConfirmDelete = async () => {
    if (selectedItem) {
      await deleteItem(selectedItem as unknown as import('../hooks/useEquiposData').Equipo);
      closeModal();
    }
  };

  const toggleRow = (id: string | number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSensorClick = (sensorId: string | number) => {
    setExpandedRows(prev => ({ ...prev, [sensorId]: true }));
    setTimeout(() => {
      const element = document.getElementById(`equipo-${sensorId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Ubicaciones unicas
  const ubicaciones = useMemo(() => {
    const unique = [...new Set(equipos.map(e => e.ubicacion))];
    return unique.sort();
  }, [equipos]);

  // Filtrar equipos
  const equiposFiltrados = useMemo(() => {
    return equipos.filter(e => {
      if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false;
      if (filtroEstado !== 'todos' && e.estado !== filtroEstado) return false;
      if (filtroUbicacion !== 'todos' && e.ubicacion !== filtroUbicacion) return false;
      if (busqueda) {
        const search = busqueda.toLowerCase();
        return (
          e.codigo?.toLowerCase().includes(search) ||
          e.placa?.toLowerCase().includes(search) ||
          e.nombre?.toLowerCase().includes(search) ||
          e.marca?.toLowerCase().includes(search) ||
          e.modelo?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [equipos, filtroTipo, filtroEstado, filtroUbicacion, busqueda]);

  // Estadisticas
  const stats = useMemo(() => {
    const porVencerCal = equipos.filter(e => {
      const dias = getDiasParaVencimiento(e.proxima_calibracion);
      return dias !== null && dias <= 30 && dias >= 0;
    }).length;

    const vencidosCal = equipos.filter(e => {
      const dias = getDiasParaVencimiento(e.proxima_calibracion);
      return dias !== null && dias < 0;
    }).length;

    return {
      total: equipos.length,
      equipos: equipos.filter(e => e.tipo === 'equipo').length,
      sensores: equipos.filter(e => e.tipo === 'sensor').length,
      operativos: equipos.filter(e => e.estado === 'operativo').length,
      enCalibracion: equipos.filter(e => e.estado === 'en_calibracion').length,
      fueraServicio: equipos.filter(e => e.estado === 'fuera_servicio').length,
      porVencerCal,
      vencidosCal,
    };
  }, [equipos]);

  if (loading) {
    return (
      <PageLayout title="Equipos">
        <div className={styles.loading}>Cargando equipos...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Equipos y Sensores">
      {/* Tarjetas de estadisticas */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Total"
          value={stats.total}
          subtext={`${stats.equipos} equipos, ${stats.sensores} sensores`}
        />
        <StatCard label="Operativos" value={stats.operativos} color="#10B981" />
        <StatCard label="En Calibracion" value={stats.enCalibracion} color="#F59E0B" />
        <StatCard label="Fuera de Servicio" value={stats.fueraServicio} color="#EF4444" />
        <StatCard
          label="Cal. por Vencer"
          value={stats.porVencerCal}
          color="#F59E0B"
          subtext="prox. 30 dias"
          highlight={stats.porVencerCal > 0}
          highlightColor="#FEF3C7"
        />
        <StatCard
          label="Cal. Vencidas"
          value={stats.vencidosCal}
          color="#EF4444"
          highlight={stats.vencidosCal > 0}
          highlightColor="#FEE2E2"
        />
      </div>

      {/* Filtros */}
      <div className={styles.filtersBar}>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por codigo, placa, nombre, marca..."
          className={styles.searchInput}
        />
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className={styles.select}
        >
          <option value="todos">Todos los tipos</option>
          <option value="equipo">Equipos</option>
          <option value="sensor">Sensores</option>
        </select>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className={styles.select}
        >
          <option value="todos">Todos los estados</option>
          <option value="operativo">Operativo</option>
          <option value="en_calibracion">En Calibracion</option>
          <option value="fuera_servicio">Fuera de Servicio</option>
        </select>
        <select
          value={filtroUbicacion}
          onChange={e => setFiltroUbicacion(e.target.value)}
          className={styles.select}
        >
          <option value="todos">Todas las ubicaciones</option>
          {ubicaciones.map(ub => (
            <option key={ub} value={ub}>
              {ub}
            </option>
          ))}
        </select>
        <NuevoDropdown onNewEquipo={() => openEquipoForm()} onNewSensor={() => openSensorForm()} />
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className={styles.errorMessage}>
          <span>{error}</span>
          <button onClick={clearError} className={styles.errorClose}>
            &times;
          </button>
        </div>
      )}

      {/* Tabla de equipos */}
      <div className={styles.tableContainer}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.thIcon}></th>
                <th className={styles.th}>Codigo / Placa</th>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Tipo</th>
                <th className={styles.th}>Marca</th>
                <th className={styles.th}>Modelo</th>
                <th className={styles.th}>Rango</th>
                <th className={styles.th}>Ubicacion</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Prox. Calibracion</th>
                <th className={styles.th}>Prox. Comprob.</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equiposFiltrados.length === 0 ? (
                <tr className={styles.emptyRow}>
                  <td colSpan={12}>No se encontraron equipos con los filtros seleccionados</td>
                </tr>
              ) : (
                equiposFiltrados.map(equipo => (
                  <EquipoRow
                    key={equipo.id}
                    equipo={equipo}
                    todosEquipos={equipos}
                    comprobaciones={comprobaciones}
                    calibraciones={calibraciones}
                    isExpanded={expandedRows[equipo.id]}
                    onToggle={() => toggleRow(equipo.id)}
                    onSensorClick={handleSensorClick}
                    onEdit={openEditForm}
                    onDelete={openDeleteConfirm}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className={styles.legend}>
        <strong>Nota:</strong> Haga clic en una fila para ver el historico de comprobaciones,
        calibraciones y sensores asociados.
        <LegendBadge bg="#D1FAE5" color="#065F46">
          &gt;90d
        </LegendBadge>
        <LegendBadge bg="#DBEAFE" color="#1D4ED8">
          &le;90d
        </LegendBadge>
        <LegendBadge bg="#FEF3C7" color="#B45309">
          &le;30d
        </LegendBadge>
        <LegendBadge bg="#FEE2E2" color="#991B1B">
          Vencido
        </LegendBadge>
      </div>

      {/* Modales CRUD */}
      <EquipoFormModal
        key={selectedItem?.id || 'new-equipo'}
        isOpen={isEquipoFormOpen}
        onClose={closeModal}
        onSave={handleSaveEquipo}
        equipo={selectedItem}
        loading={saving}
      />

      <SensorFormModal
        key={selectedItem?.id || 'new-sensor'}
        isOpen={isSensorFormOpen}
        onClose={closeModal}
        onSave={handleSaveSensor}
        sensor={selectedItem}
        loading={saving}
        equiposDisponibles={equipos.filter(e => e.tipo === 'equipo')}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        itemType={selectedItem?.tipo === 'sensor' ? 'sensor' : 'equipo'}
        itemName={selectedItem?.nombre || selectedItem?.codigo}
        loading={saving}
      />
    </PageLayout>
  );
}

// Componentes auxiliares internos
interface StatCardProps {
  label: string;
  value: number;
  color?: string;
  subtext?: string;
  highlight?: boolean;
  highlightColor?: string;
}

function StatCard({ label, value, color, subtext, highlight, highlightColor }: StatCardProps) {
  return (
    <div
      className={highlight ? styles.statCardHighlight : styles.statCard}
      style={highlight ? { backgroundColor: highlightColor } : undefined}
    >
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color: color || 'inherit' }}>
        {value}
      </div>
      {subtext && <div className={styles.statSubtext}>{subtext}</div>}
    </div>
  );
}

interface LegendBadgeProps {
  bg: string;
  color: string;
  children: React.ReactNode;
}

function LegendBadge({ bg, color, children }: LegendBadgeProps) {
  return (
    <span className={styles.legendBadge} style={{ backgroundColor: bg, color }}>
      {children}
    </span>
  );
}
