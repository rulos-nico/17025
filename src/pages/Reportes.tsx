import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge } from '../components/ui';
import { ProyectosAPI, ClientesAPI, EnsayosAPI, MuestrasAPI } from '../services/apiService';
import { WORKFLOW_STATES_INFO, getWorkflowInfo } from '../config';
import { useTiposEnsayoData } from '../hooks/useTiposEnsayoData';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Treemap,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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
  muestraId?: string | number;
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

interface Muestra {
  id: string | number;
  codigo?: string;
  perforacionId?: string | number;
  profundidadInicio?: number;
  profundidadFin?: number;
  tipoMuestra?: string;
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

interface ReportesProps {
  moduleParams?: Record<string, unknown> | null;
}

// ============================================
// CONSTANTS
// ============================================

const COLORS_TIPO = [
  '#4f46e5',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
  '#06b6d4',
];

// ============================================
// HELPERS
// ============================================

const formatDate = (fecha: string | null | undefined): string => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-CL');
};

// ============================================
// COMPONENTE: RESUMEN DE ESTADISTICAS
// ============================================

interface EstadisticasResumenProps {
  ensayos: Ensayo[];
}

function EstadisticasResumen({ ensayos }: EstadisticasResumenProps) {
  const stats = useMemo(() => {
    const porEstado: Record<string, number> = {};

    ensayos.forEach(e => {
      const estado = e.workflow_state || '';
      porEstado[estado] = (porEstado[estado] || 0) + 1;
    });

    const pendientes = ['E1', 'E2'].reduce((sum, s) => sum + (porEstado[s] || 0), 0);
    const enProceso = ['E6', 'E7', 'E8'].reduce((sum, s) => sum + (porEstado[s] || 0), 0);
    const enRevision = ['E9', 'E10', 'E11'].reduce((sum, s) => sum + (porEstado[s] || 0), 0);
    const completados = ['E12', 'E13', 'E14', 'E15'].reduce(
      (sum, s) => sum + (porEstado[s] || 0),
      0
    );

    return { total: ensayos.length, pendientes, enProceso, enRevision, completados };
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
        <div className={styles.statLabel}>En Revision</div>
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
// COMPONENTE: DONUT POR TIPO DE ENSAYO
// ============================================

interface ChartProps {
  ensayos: Ensayo[];
}

function DonutPorTipo({ ensayos }: ChartProps) {
  const { getTipoEnsayoNombre } = useTiposEnsayoData();

  const data = useMemo(() => {
    const conteo: Record<string, number> = {};
    ensayos.forEach(e => {
      const tipo = e.tipo || '';
      conteo[tipo] = (conteo[tipo] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([tipo, count]) => ({ name: getTipoEnsayoNombre(tipo), value: count }))
      .sort((a, b) => b.value - a.value);
  }, [ensayos, getTipoEnsayoNombre]);

  if (data.length === 0) {
    return (
      <div className={styles.chartSection}>
        <h3>Distribucion por Tipo de Ensayo</h3>
        <div className={styles.chartEmpty}>No hay ensayos registrados</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <h3>Distribucion por Tipo de Ensayo</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={100}
            dataKey="value"
            paddingAngle={2}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`tipo-${index}`} fill={COLORS_TIPO[index % COLORS_TIPO.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => [`${value ?? 0} ensayos`, 'Cantidad']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// COMPONENTE: DONUT POR ESTADO
// ============================================

function DonutPorEstado({ ensayos }: ChartProps) {
  const data = useMemo(() => {
    const conteo: Record<string, number> = {};
    ensayos.forEach(e => {
      const estado = e.workflow_state || '';
      conteo[estado] = (conteo[estado] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([estado, count]) => ({
        name: (WORKFLOW_STATES_INFO[estado] as { nombre?: string })?.nombre || estado,
        value: count,
        fill: (WORKFLOW_STATES_INFO[estado] as { color?: string })?.color || '#6B7280',
      }))
      .sort((a, b) => {
        const numA = parseInt(a.name.slice(1)) || 0;
        const numB = parseInt(b.name.slice(1)) || 0;
        return numA - numB;
      });
  }, [ensayos]);

  if (data.length === 0) {
    return (
      <div className={styles.chartSection}>
        <h3>Distribucion por Estado</h3>
        <div className={styles.chartEmpty}>No hay ensayos registrados</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <h3>Distribucion por Estado</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={100}
            dataKey="value"
            paddingAngle={2}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`estado-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => [`${value ?? 0} ensayos`, 'Cantidad']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// COMPONENTE: BARCHART APILADO POR PROYECTO
// ============================================

interface BarChartProyectosProps {
  ensayos: Ensayo[];
  proyectos: Proyecto[];
}

function EnsayosPorProyectoChart({ ensayos, proyectos }: BarChartProyectosProps) {
  const data = useMemo(() => {
    return proyectos
      .map(p => {
        const ensayosDelProyecto = ensayos.filter(e => e.proyectoId === p.id);
        if (ensayosDelProyecto.length === 0) return null;

        const pendientes = ensayosDelProyecto.filter(e =>
          ['E1', 'E2'].includes(e.workflow_state || '')
        ).length;
        const enProceso = ensayosDelProyecto.filter(e =>
          ['E6', 'E7', 'E8', 'E9', 'E10', 'E11'].includes(e.workflow_state || '')
        ).length;
        const completados = ensayosDelProyecto.filter(e =>
          ['E12', 'E13', 'E14', 'E15'].includes(e.workflow_state || '')
        ).length;
        const otros = ensayosDelProyecto.filter(e =>
          ['E3', 'E4', 'E5'].includes(e.workflow_state || '')
        ).length;

        const nombre = (p.nombre || p.codigo || 'N/A') as string;
        return {
          name: nombre.length > 25 ? nombre.substring(0, 22) + '...' : nombre,
          Pendientes: pendientes,
          'En proceso': enProceso,
          Completados: completados,
          Otros: otros,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const totalA =
          (a!.Pendientes || 0) + (a!['En proceso'] || 0) + (a!.Completados || 0) + (a!.Otros || 0);
        const totalB =
          (b!.Pendientes || 0) + (b!['En proceso'] || 0) + (b!.Completados || 0) + (b!.Otros || 0);
        return totalB - totalA;
      })
      .slice(0, 15);
  }, [ensayos, proyectos]);

  if (data.length === 0) {
    return (
      <div className={styles.chartSection}>
        <h3>Ensayos por Proyecto</h3>
        <div className={styles.chartEmpty}>No hay datos para mostrar</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <h3>Ensayos por Proyecto (top {data.length})</h3>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Pendientes" stackId="a" fill="#F59E0B" />
          <Bar dataKey="En proceso" stackId="a" fill="#3B82F6" />
          <Bar dataKey="Completados" stackId="a" fill="#10B981" />
          <Bar dataKey="Otros" stackId="a" fill="#9CA3AF" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// COMPONENTE: TREEMAP PROYECTOS -> MUESTRAS
// ============================================

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  color?: string;
}

function TreemapCustomContent({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name = '',
  value = 0,
  color = '#8884d8',
}: TreemapContentProps) {
  if (width < 30 || height < 20) return null;
  const showValue = width > 50 && height > 35;
  const fontSize = Math.min(14, Math.max(9, width / 10));

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - (showValue ? 6 : 0)}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={fontSize}
        fontWeight="600"
        style={{ pointerEvents: 'none' }}
      >
        {name.length > Math.floor(width / (fontSize * 0.6))
          ? name.substring(0, Math.floor(width / (fontSize * 0.6)) - 1) + '...'
          : name}
      </text>
      {showValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.85)"
          fontSize={Math.max(9, fontSize - 2)}
          style={{ pointerEvents: 'none' }}
        >
          {value} ensayo{value !== 1 ? 's' : ''}
        </text>
      )}
    </g>
  );
}

interface TreemapProyectosMuestrasProps {
  ensayos: Ensayo[];
  proyectos: Proyecto[];
  muestras: Muestra[];
}

function TreemapProyectosMuestras({ ensayos, proyectos, muestras }: TreemapProyectosMuestrasProps) {
  const [drillProject, setDrillProject] = useState<string | number | null>(null);

  // Nivel 1: datos por proyecto
  const projectData = useMemo(() => {
    return proyectos
      .map((p, i) => {
        const count = ensayos.filter(e => e.proyectoId === p.id).length;
        if (count === 0) return null;
        const nombre = (p.nombre || p.codigo || 'N/A') as string;
        return {
          name: nombre.length > 30 ? nombre.substring(0, 27) + '...' : nombre,
          value: count,
          color: COLORS_TIPO[i % COLORS_TIPO.length],
          projectId: p.id,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0)) as {
      name: string;
      value: number;
      color: string;
      projectId: string | number;
    }[];
  }, [ensayos, proyectos]);

  // Nivel 2: datos por muestra dentro del proyecto seleccionado
  const muestraData = useMemo(() => {
    if (!drillProject) return [];
    const ensayosProyecto = ensayos.filter(e => String(e.proyectoId) === String(drillProject));
    const porMuestra: Record<string, number> = {};
    let sinMuestra = 0;

    ensayosProyecto.forEach(e => {
      if (e.muestraId) {
        const key = String(e.muestraId);
        porMuestra[key] = (porMuestra[key] || 0) + 1;
      } else {
        sinMuestra++;
      }
    });

    const items = Object.entries(porMuestra).map(([muestraId, count], i) => {
      const muestra = muestras.find(m => String(m.id) === muestraId);
      const label = muestra
        ? `${muestra.codigo || 'M-?'}${muestra.tipoMuestra ? ` (${muestra.tipoMuestra})` : ''}`
        : `Muestra ${muestraId}`;
      return {
        name: label,
        value: count,
        color: COLORS_TIPO[i % COLORS_TIPO.length],
      };
    });

    if (sinMuestra > 0) {
      items.push({ name: 'Sin muestra', value: sinMuestra, color: '#9CA3AF' });
    }

    return items.sort((a, b) => b.value - a.value);
  }, [drillProject, ensayos, muestras]);

  const drillProjectName = useMemo(() => {
    if (!drillProject) return '';
    const p = proyectos.find(p => String(p.id) === String(drillProject));
    return p ? `${p.codigo || ''} — ${p.nombre || ''}` : '';
  }, [drillProject, proyectos]);

  const currentData = drillProject ? muestraData : projectData;

  if (projectData.length === 0) {
    return (
      <div className={styles.chartSection}>
        <h3>Mapa de Ensayos: Proyectos y Muestras</h3>
        <div className={styles.chartEmpty}>No hay datos para mostrar</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <div className={styles.treemapHeader}>
        <h3>
          {drillProject ? `Muestras de: ${drillProjectName}` : 'Mapa de Ensayos por Proyecto'}
        </h3>
        {drillProject && (
          <button className={styles.treemapBack} onClick={() => setDrillProject(null)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" />
            </svg>
            Volver a proyectos
          </button>
        )}
      </div>
      {!drillProject && (
        <p className={styles.treemapHint}>Click en un proyecto para ver sus muestras</p>
      )}
      {currentData.length === 0 ? (
        <div className={styles.chartEmpty}>
          Este proyecto no tiene ensayos con muestras asignadas
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <Treemap
            data={currentData}
            dataKey="value"
            nameKey="name"
            content={<TreemapCustomContent />}
            onClick={(node: Record<string, unknown>) => {
              if (!drillProject && node && node.projectId) {
                setDrillProject(node.projectId as string | number);
              }
            }}
          >
            <Tooltip
              formatter={(value: number | undefined) => [`${value ?? 0} ensayos`, 'Cantidad']}
            />
          </Treemap>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: LINECHART TENDENCIA TEMPORAL
// ============================================

function TendenciaTemporalChart({ ensayos }: ChartProps) {
  const data = useMemo(() => {
    const porMes: Record<string, number> = {};
    ensayos.forEach(e => {
      if (e.fecha_solicitud) {
        const mes = (e.fecha_solicitud as string).substring(0, 7); // "2025-01"
        porMes[mes] = (porMes[mes] || 0) + 1;
      }
    });
    return Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, count]) => ({ mes, Ensayos: count }));
  }, [ensayos]);

  if (data.length === 0) {
    return (
      <div className={styles.chartSection}>
        <h3>Tendencia Temporal</h3>
        <div className={styles.chartEmpty}>No hay datos temporales disponibles</div>
      </div>
    );
  }

  return (
    <div className={styles.chartSection}>
      <h3>Tendencia Temporal (ensayos solicitados por mes)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="Ensayos"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
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
  const { getTipoEnsayoNombre } = useTiposEnsayoData();

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
                                          {getTipoEnsayoNombre(ensayo.tipo || '')}
                                        </div>
                                      </div>
                                      <Badge color={workflow.color}>{workflow.nombre}</Badge>
                                    </div>
                                    <div className={styles.ensayoFechas}>
                                      Solicitud: {formatDate(ensayo.fecha_solicitud)}
                                      {ensayo.fecha_ejecucion && (
                                        <span>
                                          {' '}
                                          | Ejecucion: {formatDate(ensayo.fecha_ejecucion)}
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

export default function Reportes({ moduleParams }: ReportesProps) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [ensayos, setEnsayos] = useState<Ensayo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [muestras, setMuestras] = useState<Muestra[]>([]);
  const [loading, setLoading] = useState(true);
  const { getTipoEnsayoNombre } = useTiposEnsayoData();

  // Filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroCliente, setFiltroCliente] = useState<string | number>('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroProyecto, setFiltroProyecto] = useState<string | number>('todos');

  // Aplicar filtro de proyecto desde moduleParams
  useEffect(() => {
    if (moduleParams?.proyectoId) {
      setFiltroProyecto(moduleParams.proyectoId as string);
    }
  }, [moduleParams]);

  // Cargar datos desde API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [proyectosRes, ensayosRes, clientesRes, muestrasRes] = await Promise.all([
          ProyectosAPI.list(),
          EnsayosAPI.list(),
          ClientesAPI.list(),
          MuestrasAPI.list(),
        ]);

        // Map snake_case API fields to camelCase used by this component
        const rawProyectos = (proyectosRes as Record<string, unknown>[]) || [];
        setProyectos(
          rawProyectos.map(
            p =>
              ({
                ...p,
                id: p.id ?? p.proyecto_id,
                clienteId: p.cliente_id ?? p.clienteId,
              }) as Proyecto
          )
        );

        const rawEnsayos = (ensayosRes as Record<string, unknown>[]) || [];
        setEnsayos(
          rawEnsayos.map(
            e =>
              ({
                ...e,
                proyectoId: e.proyecto_id ?? e.proyectoId,
                muestraId: e.muestra_id ?? e.muestraId,
              }) as Ensayo
          )
        );

        setClientes((clientesRes as Cliente[]) || []);

        const rawMuestras = (muestrasRes as Record<string, unknown>[]) || [];
        setMuestras(
          rawMuestras.map(
            m =>
              ({
                ...m,
                perforacionId: m.perforacion_id ?? m.perforacionId,
                profundidadInicio: m.profundidad_inicio ?? m.profundidadInicio,
                profundidadFin: m.profundidad_fin ?? m.profundidadFin,
                tipoMuestra: m.tipo_muestra ?? m.tipoMuestra,
              }) as Muestra
          )
        );
      } catch (err) {
        console.error('Error cargando datos para reportes:', err);
        setProyectos([]);
        setEnsayos([]);
        setClientes([]);
        setMuestras([]);
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

      // Filtro por proyecto (normalizar a string por discrepancia de tipos API vs UI)
      if (filtroProyecto !== 'todos' && String(e.proyectoId) !== String(filtroProyecto))
        return false;

      // Filtro por cliente (a traves del proyecto)
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
  }, [
    ensayos,
    proyectos,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroCliente,
    filtroEstado,
    filtroProyecto,
  ]);

  const proyectosFiltrados = useMemo(() => {
    let filtered = proyectos;
    if (filtroCliente !== 'todos') {
      filtered = filtered.filter(p => p.clienteId === filtroCliente);
    }
    if (filtroProyecto !== 'todos') {
      filtered = filtered.filter(p => String(p.id) === String(filtroProyecto));
    }
    return filtered;
  }, [proyectos, filtroCliente, filtroProyecto]);

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Codigo', 'Tipo', 'Proyecto', 'Estado', 'Fecha Solicitud', 'Fecha Ejecucion'];
    const rows = ensayosFiltrados.map(e => {
      const proyecto = proyectos.find(p => p.id === e.proyectoId);
      const workflow = getWorkflowInfo(e.workflow_state || '');
      return [
        e.codigo,
        getTipoEnsayoNombre(e.tipo || ''),
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
    <PageLayout title="Reportes y Estadisticas">
      {/* Estadisticas generales */}
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
          <label className={styles.filterLabel}>Proyecto</label>
          <select
            value={filtroProyecto}
            onChange={e => setFiltroProyecto(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="todos">Todos los proyectos</option>
            {proyectos.map(p => (
              <option key={p.id} value={p.id}>
                {p.codigo} - {p.nombre}
              </option>
            ))}
          </select>
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
            <option value="en_revision">En Revision</option>
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

      {/* Graficos de distribucion: donuts lado a lado */}
      <div className={styles.chartGrid}>
        <DonutPorTipo ensayos={ensayosFiltrados} />
        <DonutPorEstado ensayos={ensayosFiltrados} />
      </div>

      {/* Barchart apilado por proyecto */}
      <EnsayosPorProyectoChart ensayos={ensayosFiltrados} proyectos={proyectosFiltrados} />

      {/* Treemap interactivo: proyectos -> muestras */}
      <TreemapProyectosMuestras
        ensayos={ensayosFiltrados}
        proyectos={proyectosFiltrados}
        muestras={muestras}
      />

      {/* Linechart tendencia temporal */}
      <TendenciaTemporalChart ensayos={ensayosFiltrados} />

      {/* Tabla de proyectos */}
      <TablaProyectos
        proyectos={proyectosFiltrados}
        ensayos={ensayosFiltrados}
        clientes={clientes}
      />
    </PageLayout>
  );
}
