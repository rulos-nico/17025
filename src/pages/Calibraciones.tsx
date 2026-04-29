/**
 * Calibraciones - Página de gestión de calibraciones de sensores
 */

import { useMemo, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { ConfirmDeleteModal } from '../components/modals';
import { CalibracionFormModal } from '../components/calibracion';
import type { CalibracionForModal } from '../components/calibracion';
import { useCalibracionesData } from '../hooks/useCalibracionesData';
import type { Calibracion } from '../hooks/useCalibracionesData';
import { formatDate, getDiasParaVencimiento, getAlertaVencimiento } from '../utils';
import styles from './Calibraciones.module.css';

export default function Calibraciones() {
  const {
    calibraciones,
    sensores,
    loading,
    saving,
    error,
    createCalibracion,
    updateCalibracion,
    deleteCalibracion,
    clearError,
  } = useCalibracionesData();

  const [activeModal, setActiveModal] = useState<'form' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Calibracion | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroSensor, setFiltroSensor] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const sensorById = useMemo(() => {
    const map = new Map<string, (typeof sensores)[number]>();
    sensores.forEach(s => map.set(String(s.id), s));
    return map;
  }, [sensores]);

  const filtered = useMemo(() => {
    return calibraciones.filter(c => {
      if (filtroSensor !== 'todos' && String(c.sensorId) !== filtroSensor) return false;
      if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false;
      if (busqueda) {
        const s = busqueda.toLowerCase();
        const sensor = sensorById.get(String(c.sensorId));
        return (
          sensor?.codigo?.toLowerCase().includes(s) ||
          sensor?.tipo?.toLowerCase().includes(s) ||
          c.certificadoId?.toLowerCase().includes(s) ||
          c.estado?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [calibraciones, filtroSensor, filtroEstado, busqueda, sensorById]);

  const stats = useMemo(() => {
    const porVencer = calibraciones.filter(c => {
      const dias = getDiasParaVencimiento(c.proximaCalibracion);
      return dias !== null && dias <= 30 && dias >= 0;
    }).length;
    const vencidas = calibraciones.filter(c => {
      const dias = getDiasParaVencimiento(c.proximaCalibracion);
      return dias !== null && dias < 0;
    }).length;
    return {
      total: calibraciones.length,
      vigentes: calibraciones.filter(c => c.estado === 'vigente').length,
      porVencer,
      vencidas,
    };
  }, [calibraciones]);

  const openNew = () => {
    setSelected(null);
    setActiveModal('form');
  };
  const openEdit = (c: Calibracion) => {
    setSelected(c);
    setActiveModal('form');
  };
  const openDelete = (c: Calibracion) => {
    setSelected(c);
    setActiveModal('delete');
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelected(null);
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    // Coerce factor and dates if needed
    const payload = { ...formData, factor: parseFloat(String(formData.factor)) };
    if (selected) await updateCalibracion(selected.id, payload);
    else await createCalibracion(payload);
    closeModal();
  };
  const handleConfirmDelete = async () => {
    if (selected) {
      await deleteCalibracion(selected.id);
      closeModal();
    }
  };

  if (loading) {
    return (
      <PageLayout title="Calibraciones">
        <div className={styles.loading}>Cargando calibraciones...</div>
      </PageLayout>
    );
  }

  const selectedForModal: CalibracionForModal | null = selected
    ? {
        id: selected.id,
        sensorId: selected.sensorId,
        fechaCalibracion: selected.fechaCalibracion,
        proximaCalibracion: selected.proximaCalibracion,
        estado: selected.estado,
        factor: selected.factor,
        rangoMedicion: selected.rangoMedicion,
        precision: selected.precision,
        errorMaximo: selected.errorMaximo,
        certificadoId: selected.certificadoId,
      }
    : null;

  return (
    <PageLayout title="Calibraciones de Sensores">
      <div className={styles.statsGrid}>
        <Stat label="Total" value={stats.total} />
        <Stat label="Vigentes" value={stats.vigentes} color="#10B981" />
        <Stat label="Por vencer (30 d)" value={stats.porVencer} color="#F59E0B" />
        <Stat label="Vencidas" value={stats.vencidas} color="#EF4444" />
      </div>

      <div className={styles.filtersBar}>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por sensor, certificado, estado..."
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
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className={styles.select}
        >
          <option value="todos">Todos los estados</option>
          <option value="vigente">Vigente</option>
          <option value="vencida">Vencida</option>
          <option value="en_proceso">En proceso</option>
          <option value="rechazada">Rechazada</option>
        </select>
        <button onClick={openNew} className={styles.btnPrimary}>
          + Nueva calibración
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
                <th className={styles.th}>Próxima</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Factor</th>
                <th className={styles.th}>Certificado</th>
                <th className={styles.th}>Rango</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr className={styles.emptyRow}>
                  <td colSpan={8}>No hay calibraciones que coincidan con los filtros.</td>
                </tr>
              ) : (
                filtered.map(c => {
                  const sensor = sensorById.get(String(c.sensorId));
                  const dias = getDiasParaVencimiento(c.proximaCalibracion);
                  const alerta = getAlertaVencimiento(dias);
                  return (
                    <tr key={c.id} className={styles.row}>
                      <td className={styles.td}>
                        <div className={styles.sensorCode}>{sensor?.codigo || c.sensorId}</div>
                        <div className={styles.sensorMeta}>
                          {sensor?.tipo} {sensor?.marca} {sensor?.modelo}
                        </div>
                      </td>
                      <td className={styles.td}>{formatDate(c.fechaCalibracion)}</td>
                      <td className={styles.td}>
                        <div>{formatDate(c.proximaCalibracion)}</div>
                        {alerta && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              borderRadius: 4,
                              backgroundColor: alerta.bg,
                              color: alerta.color,
                            }}
                          >
                            {alerta.texto}
                          </span>
                        )}
                      </td>
                      <td className={styles.td}>{c.estado}</td>
                      <td className={styles.td}>{String(c.factor)}</td>
                      <td className={styles.td}>{c.certificadoId || '—'}</td>
                      <td className={styles.td}>{c.rangoMedicion || '—'}</td>
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

      <CalibracionFormModal
        key={selected?.id || 'new'}
        isOpen={activeModal === 'form'}
        onClose={closeModal}
        onSave={handleSave}
        calibracion={selectedForModal}
        sensores={sensores}
        loading={saving}
      />

      <ConfirmDeleteModal
        isOpen={activeModal === 'delete'}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        itemType="calibración"
        itemName={selected ? `${formatDate(selected.fechaCalibracion)} — ${selected.estado}` : ''}
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
