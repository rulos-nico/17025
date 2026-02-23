import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge } from '../components/ui';
import { ProyectosAPI, ClientesAPI, EnsayosAPI } from '../services/apiService';
import { WORKFLOW_STATES_INFO, TIPOS_ENSAYO, getWorkflowInfo } from '../config';
import styles from './Reportes.module.css';

// ============================================
// TYPES
// ============================================

interface Ensayo {
  id: string | number;
  codigo?: string;
  tipo?: string;
  workflow_state?: string;
  proyectoId?: string | number;
  fecha_solicitud?: string;
  fecha_ejecucion?: string;
  [key: string]: unknown;
}

interface Proyecto {
  id: string | number;
  codigo?: string;
  nombre?: string;
  clienteId?: string | number;
  estado?: string;
  [key: string]: unknown;
}

interface Cliente {
  id: string | number;
  nombre?: string;
  [key: string]: unknown;
}

interface ProyectoConStats extends Proyecto {
  ensayos: Ensayo[];
  stats: {
    total: number;
    completados: number;
    pendientes: number;
    enProceso: number;
    progreso: number;
  };
}

// ============================================
// HELPERS
// ============================================

const formatDate = (fecha: string | null | undefined): string => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-CL');
};

const getTipoEnsayoNombre = (tipoId: string | undefined): string => {
  const tipo = TIPOS_ENSAYO.find(t => t.id === tipoId);
  return tipo?.nombre || tipoId || '';
};

// ============================================
// COMPONENTE: RESUMEN DE ESTADÍSTICAS
// ============================================

interface EstadisticasResumenProps {
  ensayos: Ensayo[];
}

function EstadisticasResumen({ ensayos }: EstadisticasResumenProps) {
  const stats = useMemo(() => {
    const porEstado: Record<string, number> = {};
    const porTipo: Record<string, number> = {};

    ensayos.forEach(e => {
      // Por estado de workflow
      const estado = e.workflow_state || '';
      porEstado[estado] = (porEstado[estado] || 0) + 1;

      // Por tipo de ensayo
      const tipo = e.tipo || '';
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    });

    // Agrupar por fase
    const pendientes = ['E1', 'E2'].reduce((sum, s) => sum + (porEstado[s] || 0), 0);
    const enProceso = ['E6', 'E7', 'E8'].reduce((sum, s) => sum + (porEstado[s] || 0), 0);
    const enRevision = ['E9', 'E10', 'E11'].reduce((sum, s) => sum + (porEstado[s] || 0), 0);
    const completados = ['E12', 'E13', 'E14', 'E15'].reduce(
      (sum, s) => sum + (porEstado[s] || 0),
      0
    );

    return {
      total: ensayos.length,
      pendientes,
      enProceso,
      enRevision,
      completados,
      porEstado,
      porTipo,
    };
  }, [ensayos]);

  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>Total Ensayos</div>
        <div className={styles.statValue}>{stats.total}</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>Pendientes</div>
        <div className={`${styles.statValue} ${styles.statPending}`}>{stats.pendientes}</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>En Proceso</div>
        <div className={`${styles.statValue} ${styles.statProcess}`}>{stats.enProceso}</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>En Revisión</div>
        <div className={`${styles.statValue} ${styles.statReview}`}>{stats.enRevision}</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>Completados</div>
        <div className={`${styles.statValue} ${styles.statComplete}`}>{stats.completados}</div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: DISTRIBUCIÓN POR TIPO
// ============================================

interface TipoCount {
  tipo: string;
  count: number;
  nombre: string;
}

function DistribucionPorTipo({ ensayos }: EstadisticasResumenProps) {
  const porTipo = useMemo((): TipoCount[] => {
    const conteo: Record<string, number> = {};
    ensayos.forEach(e => {
      const tipo = e.tipo || '';
      conteo[tipo] = (conteo[tipo] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([tipo, count]) => ({ tipo, count, nombre: getTipoEnsayoNombre(tipo) }))
      .sort((a, b) => b.count - a.count);
  }, [ensayos]);

  const maxCount = Math.max(...porTipo.map(t => t.count), 1);

  return (
    <div className={styles.distributionCard}>
      <h3 className={styles.distributionTitle}>Distribución por Tipo de Ensayo</h3>

      {porTipo.length === 0 ? (
        <div className={styles.distributionEmpty}>No hay ensayos registrados</div>
      ) : (
        <div className={styles.distributionList}>
          {porTipo.map(({ tipo, count, nombre }) => (
            <div key={tipo}>
              <div className={styles.distributionItem}>
                <span>{nombre}</span>
                <span className={styles.distributionCount}>{count}</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFill} style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: DISTRIBUCIÓN POR ESTADO
// ============================================

interface EstadoInfo {
  nombre: string;
  color: string;
}

interface EstadoCount {
  estado: string;
  count: number;
  info: EstadoInfo;
}

function DistribucionPorEstado({ ensayos }: EstadisticasResumenProps) {
  const porEstado = useMemo((): EstadoCount[] => {
    const conteo: Record<string, number> = {};
    ensayos.forEach(e => {
      const estado = e.workflow_state || '';
      conteo[estado] = (conteo[estado] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([estado, count]) => ({
        estado,
        count,
        info: (WORKFLOW_STATES_INFO as Record<string, EstadoInfo>)[estado] || {
          nombre: estado,
          color: '#6B7280',
        },
      }))
      .sort((a, b) => {
        // Ordenar por código de estado (E1, E2, ...)
        const numA = parseInt(a.estado.slice(1)) || 0;
        const numB = parseInt(b.estado.slice(1)) || 0;
        return numA - numB;
      });
  }, [ensayos]);

  const total = ensayos.length || 1;

  return (
    <div className={styles.distributionCard}>
      <h3 className={styles.distributionTitle}>Distribución por Estado</h3>

      {porEstado.length === 0 ? (
        <div className={styles.distributionEmpty}>No hay ensayos registrados</div>
      ) : (
        <>
          {/* Barra de progreso apilada */}
          <div className={styles.stackedBar}>
            {porEstado.map(({ estado, count, info }) => (
              <div
                key={estado}
                className={styles.stackedBarSegment}
                style={{
                  width: `${(count / total) * 100}%`,
                  backgroundColor: info.color,
                  minWidth: count > 0 ? '4px' : '0',
                }}
                title={`${info.nombre}: ${count}`}
              />
            ))}
          </div>

          {/* Leyenda */}
          <div className={styles.legendGrid}>
            {porEstado.map(({ estado, count, info }) => (
              <div key={estado} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: info.color }} />
                <span className={styles.legendText}>{estado}</span>
                <span className={styles.distributionCount}>{count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: TABLA DE PROYECTOS CON ENSAYOS
// ============================================

interface TablaProyectosProps {
  proyectos: Proyecto[];
  ensayos: Ensayo[];
  clientes: Cliente[];
}

function TablaProyectos({ proyectos, ensayos, clientes }: TablaProyectosProps) {
  const [expandedProyecto, setExpandedProyecto] = useState<string | number | null>(null);

  const proyectosConStats = useMemo((): ProyectoConStats[] => {
    return proyectos.map(proyecto => {
      const ensayosProyecto = ensayos.filter(e => e.proyectoId === proyecto.id);
      const completados = ensayosProyecto.filter(e =>
        ['E15', 'E14', 'E13', 'E12'].includes(e.workflow_state || '')
      ).length;
      const pendientes = ensayosProyecto.filter(e =>
        ['E1', 'E2'].includes(e.workflow_state || '')
      ).length;
      const enProceso = ensayosProyecto.filter(e =>
        ['E6', 'E7', 'E8', 'E9', 'E10', 'E11'].includes(e.workflow_state || '')
      ).length;

      return {
        ...proyecto,
        ensayos: ensayosProyecto,
        stats: {
          total: ensayosProyecto.length,
          completados,
          pendientes,
          enProceso,
          progreso:
            ensayosProyecto.length > 0
              ? Math.round((completados / ensayosProyecto.length) * 100)
              : 0,
        },
      };
    });
  }, [proyectos, ensayos]);

  const getClienteNombre = (clienteId: string | number | undefined): string => {
    return clientes.find(c => c.id === clienteId)?.nombre || 'N/A';
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h3 className={styles.tableTitle}>Seguimiento por Proyecto</h3>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th className="center">Ensayos</th>
              <th className="center">Progreso</th>
              <th className="right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectosConStats.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  No hay proyectos registrados
                </td>
              </tr>
            ) : (
              proyectosConStats.map(proyecto => (
                <>
                  <tr key={proyecto.id}>
                    <td>
                      <div className={styles.projectCode}>{proyecto.codigo}</div>
                      <div className={styles.projectName}>{proyecto.nombre}</div>
                    </td>
                    <td>{getClienteNombre(proyecto.clienteId)}</td>
                    <td>
                      <Badge
                        color={
                          proyecto.estado === 'activo'
                            ? '#10B981'
                            : proyecto.estado === 'completado'
                              ? '#6B7280'
                              : '#F59E0B'
                        }
                      >
                        {proyecto.estado}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.statsInline}>
                        <span className={styles.statP}>{proyecto.stats.pendientes}P</span>
                        <span className={styles.statE}>{proyecto.stats.enProceso}E</span>
                        <span className={styles.statC}>{proyecto.stats.completados}C</span>
                      </div>
                      <div className={styles.totalText}>{proyecto.stats.total} total</div>
                    </td>
                    <td>
                      <div className={styles.progressContainer}>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${proyecto.stats.progreso}%` }}
                          />
                        </div>
                        <span className={styles.progressText}>{proyecto.stats.progreso}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() =>
                          setExpandedProyecto(expandedProyecto === proyecto.id ? null : proyecto.id)
                        }
                        className={styles.btnSmall}
                      >
                        {expandedProyecto === proyecto.id ? 'Ocultar' : 'Ver ensayos'}
                      </button>
                    </td>
                  </tr>

                  {/* Fila expandida con ensayos */}
                  {expandedProyecto === proyecto.id && (
                    <tr>
                      <td colSpan={6} className={styles.expandedRow}>
                        <div className={styles.expandedContent}>
                          <h4 className={styles.expandedTitle}>
                            Ensayos del proyecto ({proyecto.ensayos.length})
                          </h4>
                          {proyecto.ensayos.length === 0 ? (
                            <div className={styles.expandedEmpty}>
                              No hay ensayos registrados para este proyecto
                            </div>
                          ) : (
                            <div className={styles.ensayosGrid}>
                              {proyecto.ensayos.map(ensayo => {
                                const workflow = getWorkflowInfo(ensayo.workflow_state || '');
                                return (
                                  <div key={ensayo.id} className={styles.ensayoCard}>
                                    <div className={styles.ensayoHeader}>
                                      <div>
                                        <div className={styles.ensayoCodigo}>{ensayo.codigo}</div>
                                        <div className={styles.ensayoTipo}>
                                          {getTipoEnsayoNombre(ensayo.tipo)}
                                        </div>
                                      </div>
                                      <Badge color={workflow.color}>{workflow.nombre}</Badge>
                                    </div>
                                    <div className={styles.ensayoFechas}>
                                      Solicitud: {formatDate(ensayo.fecha_solicitud)}
                                      {ensayo.fecha_ejecucion && (
                                        <span>
                                          {' '}
                                          | Ejecución: {formatDate(ensayo.fecha_ejecucion)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Reportes() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [ensayos, setEnsayos] = useState<Ensayo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroCliente, setFiltroCliente] = useState<string | number>('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Cargar datos desde API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [proyectosRes, ensayosRes, clientesRes] = await Promise.all([
          ProyectosAPI.list(),
          EnsayosAPI.list(),
          ClientesAPI.list(),
        ]);

        setProyectos((proyectosRes as Proyecto[]) || []);
        setEnsayos((ensayosRes as Ensayo[]) || []);
        setClientes((clientesRes as Cliente[]) || []);
      } catch (err) {
        console.error('Error cargando datos para reportes:', err);
        setProyectos([]);
        setEnsayos([]);
        setClientes([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Datos filtrados
  const ensayosFiltrados = useMemo(() => {
    return ensayos.filter(e => {
      // Filtro por fecha
      if (filtroFechaDesde && (e.fecha_solicitud || '') < filtroFechaDesde) return false;
      if (filtroFechaHasta && (e.fecha_solicitud || '') > filtroFechaHasta) return false;

      // Filtro por cliente (a través del proyecto)
      if (filtroCliente !== 'todos') {
        const proyecto = proyectos.find(p => p.id === e.proyectoId);
        if (!proyecto || proyecto.clienteId !== filtroCliente) return false;
      }

      // Filtro por estado
      if (filtroEstado !== 'todos') {
        const workflowState = e.workflow_state || '';
        if (filtroEstado === 'pendientes' && !['E1', 'E2'].includes(workflowState)) return false;
        if (filtroEstado === 'en_proceso' && !['E6', 'E7', 'E8'].includes(workflowState))
          return false;
        if (filtroEstado === 'en_revision' && !['E9', 'E10', 'E11'].includes(workflowState))
          return false;
        if (filtroEstado === 'completados' && !['E12', 'E13', 'E14', 'E15'].includes(workflowState))
          return false;
      }

      return true;
    });
  }, [ensayos, proyectos, filtroFechaDesde, filtroFechaHasta, filtroCliente, filtroEstado]);

  const proyectosFiltrados = useMemo(() => {
    if (filtroCliente === 'todos') return proyectos;
    return proyectos.filter(p => p.clienteId === filtroCliente);
  }, [proyectos, filtroCliente]);

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Código', 'Tipo', 'Proyecto', 'Estado', 'Fecha Solicitud', 'Fecha Ejecución'];
    const rows = ensayosFiltrados.map(e => {
      const proyecto = proyectos.find(p => p.id === e.proyectoId);
      const workflow = getWorkflowInfo(e.workflow_state || '');
      return [
        e.codigo,
        getTipoEnsayoNombre(e.tipo),
        proyecto?.codigo || 'N/A',
        workflow.nombre,
        e.fecha_solicitud || '',
        e.fecha_ejecucion || '',
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_ensayos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <PageLayout title="Reportes">
        <div className={styles.loading}>Cargando reportes...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Reportes y Estadísticas">
      {/* Estadísticas generales */}
      <EstadisticasResumen ensayos={ensayosFiltrados} />

      {/* Filtros */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Desde</label>
          <input
            type="date"
            value={filtroFechaDesde}
            onChange={e => setFiltroFechaDesde(e.target.value)}
            className={styles.filterInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Hasta</label>
          <input
            type="date"
            value={filtroFechaHasta}
            onChange={e => setFiltroFechaHasta(e.target.value)}
            className={styles.filterInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Cliente</label>
          <select
            value={filtroCliente}
            onChange={e => setFiltroCliente(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="todos">Todos los clientes</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Estado</label>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="todos">Todos</option>
            <option value="pendientes">Pendientes</option>
            <option value="en_proceso">En Proceso</option>
            <option value="en_revision">En Revisión</option>
            <option value="completados">Completados</option>
          </select>
        </div>
        <button onClick={exportarCSV} className={styles.exportBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Gráficos de distribución */}
      <div className={styles.distributionGrid}>
        <DistribucionPorTipo ensayos={ensayosFiltrados} />
        <DistribucionPorEstado ensayos={ensayosFiltrados} />
      </div>

      {/* Tabla de proyectos */}
      <TablaProyectos
        proyectos={proyectosFiltrados}
        ensayos={ensayosFiltrados}
        clientes={clientes}
      />
    </PageLayout>
  );
}
