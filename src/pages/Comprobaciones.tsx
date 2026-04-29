/**
 * Comprobaciones - Página de gestión de comprobaciones de sensores
 */

import { useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { ConfirmDeleteModal } from '../components/modals';
import { ComprobacionFormModal } from '../components/comprobacion';
import type { ComprobacionForModal } from '../components/comprobacion';
import { useComprobacionesData } from '../hooks/useComprobacionesData';
import type { Comprobacion } from '../hooks/useComprobacionesData';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatNum } from '../utils';
import styles from './Comprobaciones.module.css';

export default function Comprobaciones() {
  const {
    comprobaciones,
    sensores,
    loading,
    saving,
    error,
    createComprobacion,
    updateComprobacion,
    deleteComprobacion,
    clearError,
  } = useComprobacionesData();
  const { user } = useAuth();

  // Modal state
  const [activeModal, setActiveModal] = useState<'form' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Comprobacion | null>(null);

  // Filters
  const [busqueda, setBusqueda] = useState('');
  const [filtroSensor, setFiltroSensor] = useState('todos');
  const [filtroResultado, setFiltroResultado] = useState('todos');

  const sensorById = useMemo(() => {
    const map = new Map<string, (typeof sensores)[number]>();
    sensores.forEach(s => map.set(String(s.id), s));
    return map;
  }, [sensores]);

  const filtered = useMemo(() => {
    return comprobaciones.filter(c => {
      if (filtroSensor !== 'todos' && String(c.sensorId) !== filtroSensor) return false;
      if (filtroResultado !== 'todos' && c.resultado !== filtroResultado) return false;
      if (busqueda) {
        const s = busqueda.toLowerCase();
        const sensor = sensorById.get(String(c.sensorId));
        return (
          sensor?.codigo?.toLowerCase().includes(s) ||
          sensor?.tipo?.toLowerCase().includes(s) ||
          c.responsable?.toLowerCase().includes(s) ||
          c.observaciones?.toLowerCase().includes(s) ||
          c.resultado?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [comprobaciones, filtroSensor, filtroResultado, busqueda, sensorById]);

  const stats = useMemo(
    () => ({
      total: comprobaciones.length,
      conformes: comprobaciones.filter(c => c.resultado === 'Conforme').length,
      noConformes: comprobaciones.filter(c => c.resultado === 'No Conforme').length,
      sensoresUnicos: new Set(comprobaciones.map(c => c.sensorId)).size,
    }),
    [comprobaciones]
  );

  const openNew = () => {
    setSelected(null);
    setActiveModal('form');
  };
  const openEdit = (c: Comprobacion) => {
    setSelected(c);
    setActiveModal('form');
  };
  const openDelete = (c: Comprobacion) => {
    setSelected(c);
    setActiveModal('delete');
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelected(null);
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    if (selected) await updateComprobacion(selected.id, formData);
    else await createComprobacion(formData);
    closeModal();
  };
  const handleConfirmDelete = async () => {
    if (selected) {
      await deleteComprobacion(selected.id);
      closeModal();
    }
  };

  if (loading) {
    return (
      <PageLayout title="Comprobaciones">
        <div className={styles.loading}>Cargando comprobaciones...</div>
      </PageLayout>
    );
  }

  const selectedForModal: ComprobacionForModal | null = selected
    ? {
        id: selected.id,
        sensorId: selected.sensorId,
        fecha: selected.fecha,
        resultado: selected.resultado,
        responsable: selected.responsable,
        observaciones: selected.observaciones,
        data: selected.data,
      }
    : null;

  return (
    <PageLayout title="Comprobaciones de Sensores">
      <div className={styles.statsGrid}>
        <Stat label="Total" value={stats.total} />
        <Stat label="Conformes" value={stats.conformes} color="#10B981" />
        <Stat label="No Conformes" value={stats.noConformes} color="#EF4444" />
        <Stat label="Sensores con datos" value={stats.sensoresUnicos} />
      </div>

      <div className={styles.filtersBar}>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por sensor, responsable, observaciones..."
          className={styles.searchInput}
        />
        <select
          value={filtroSensor}
          onChange={e => setFiltroSensor(e.target.value)}
          className={styles.select}
        >
          <option value="todos">Todos los sensores</option>
          {sensores.map(s => (
            <option key={s.id} value={String(s.id)}>
              {s.codigo || s.id}
            </option>
          ))}
        </select>
        <select
          value={filtroResultado}
          onChange={e => setFiltroResultado(e.target.value)}
          className={styles.select}
        >
          <option value="todos">Todos los resultados</option>
          <option value="Conforme">Conforme</option>
          <option value="No Conforme">No Conforme</option>
        </select>
        <button onClick={openNew} className={styles.btnPrimary}>
          + Nueva comprobación
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span>{error}</span>
          <button onClick={clearError} className={styles.errorClose}>
            ×
          </button>
        </div>
      )}

      <div className={styles.tableContainer}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.th}>Sensor</th>
                <th className={styles.th}>Fecha</th>
                <th className={styles.th}>Resultado</th>
                <th className={styles.th}>Patrón</th>
                <th className={styles.th}>Media</th>
                <th className={styles.th}>Error</th>
                <th className={styles.th}>u (A)</th>
                <th className={styles.th}>n</th>
                <th className={styles.th}>Responsable</th>
                <th className={styles.th}>Observaciones</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr className={styles.emptyRow}>
                  <td colSpan={11}>No hay comprobaciones que coincidan con los filtros.</td>
                </tr>
              ) : (
                filtered.map(c => {
                  const sensor = sensorById.get(String(c.sensorId));
                  return (
                    <tr key={c.id} className={styles.row}>
                      <td className={styles.td}>
                        <div className={styles.sensorCode}>{sensor?.codigo || c.sensorId}</div>
                        <div className={styles.sensorMeta}>
                          {sensor?.tipo} {sensor?.marca} {sensor?.modelo}
                        </div>
                      </td>
                      <td className={styles.td}>{formatDate(c.fecha)}</td>
                      <td className={styles.td}>
                        <span
                          className={
                            c.resultado === 'Conforme'
                              ? styles.resultConforme
                              : styles.resultNoConforme
                          }
                        >
                          {c.resultado}
                        </span>
                      </td>
                      <td className={styles.tdNum}>
                        {c.valorPatron !== undefined
                          ? `${formatNum(c.valorPatron, 4)}${c.unidad ? ' ' + c.unidad : ''}`
                          : '—'}
                      </td>
                      <td className={styles.tdNum}>{formatNum(c.media, 4)}</td>
                      <td className={styles.tdNum}>
                        {c.error !== undefined ? (
                          <span
                            style={{
                              color:
                                c.valorPatron && Math.abs(c.error) > Math.abs(c.valorPatron) * 0.01
                                  ? '#DC2626'
                                  : 'inherit',
                            }}
                          >
                            {formatNum(c.error, 4)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={styles.tdNum}>{formatNum(c.incertidumbre, 4)}</td>
                      <td className={styles.tdNum}>{c.nReplicas ?? '—'}</td>
                      <td className={styles.td}>{c.responsable}</td>
                      <td className={styles.td}>{c.observaciones || '—'}</td>
                      <td className={styles.td}>
                        <div className={styles.actions}>
                          <button onClick={() => openEdit(c)} className={styles.btnEdit}>
                            Editar
                          </button>
                          <button onClick={() => openDelete(c)} className={styles.btnDelete}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ComprobacionFormModal
        key={selected?.id || 'new'}
        isOpen={activeModal === 'form'}
        onClose={closeModal}
        onSave={handleSave}
        comprobacion={selectedForModal}
        sensores={sensores}
        defaultResponsableId={user?.id || ''}
        loading={saving}
      />

      <ConfirmDeleteModal
        isOpen={activeModal === 'delete'}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        itemType="comprobación"
        itemName={selected ? `${formatDate(selected.fecha)} — ${selected.resultado}` : ''}
        loading={saving}
      />
    </PageLayout>
  );
}

interface StatProps {
  label: string;
  value: number;
  color?: string;
}

function Stat({ label, value, color }: StatProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color: color || 'inherit' }}>
        {value}
      </div>
    </div>
  );
}
