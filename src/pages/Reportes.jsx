import { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { Badge } from '../components/ui';
import { ProyectosAPI, ClientesAPI, EnsayosAPI } from '../services/apiService';
import { WORKFLOW_STATES_INFO, TIPOS_ENSAYO, getWorkflowInfo } from '../config';

// ============================================
// HELPERS
// ============================================

const formatDate = fecha => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-CL');
};

const getTipoEnsayoNombre = tipoId => {
  const tipo = TIPOS_ENSAYO.find(t => t.id === tipoId);
  return tipo?.nombre || tipoId;
};

// ============================================
// COMPONENTE: RESUMEN DE ESTADÍSTICAS
// ============================================

function EstadisticasResumen({ ensayos }) {
  const stats = useMemo(() => {
    const porEstado = {};
    const porTipo = {};

    ensayos.forEach(e => {
      // Por estado de workflow
      porEstado[e.workflow_state] = (porEstado[e.workflow_state] || 0) + 1;

      // Por tipo de ensayo
      porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1;
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
          Total Ensayos
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.total}</div>
      </div>
      <div
        style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>Pendientes</div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#F59E0B' }}>
          {stats.pendientes}
        </div>
      </div>
      <div
        style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>En Proceso</div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#3B82F6' }}>
          {stats.enProceso}
        </div>
      </div>
      <div
        style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
          En Revisión
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#8B5CF6' }}>
          {stats.enRevision}
        </div>
      </div>
      <div
        style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>
          Completados
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10B981' }}>
          {stats.completados}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: DISTRIBUCIÓN POR TIPO
// ============================================

function DistribucionPorTipo({ ensayos }) {
  const porTipo = useMemo(() => {
    const conteo = {};
    ensayos.forEach(e => {
      conteo[e.tipo] = (conteo[e.tipo] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([tipo, count]) => ({ tipo, count, nombre: getTipoEnsayoNombre(tipo) }))
      .sort((a, b) => b.count - a.count);
  }, [ensayos]);

  const maxCount = Math.max(...porTipo.map(t => t.count), 1);

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600' }}>
        Distribución por Tipo de Ensayo
      </h3>

      {porTipo.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
          No hay ensayos registrados
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {porTipo.map(({ tipo, count, nombre }) => (
            <div key={tipo}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  fontSize: '0.875rem',
                }}
              >
                <span>{nombre}</span>
                <span style={{ fontWeight: '600' }}>{count}</span>
              </div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: '#3B82F6',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
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

function DistribucionPorEstado({ ensayos }) {
  const porEstado = useMemo(() => {
    const conteo = {};
    ensayos.forEach(e => {
      conteo[e.workflow_state] = (conteo[e.workflow_state] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([estado, count]) => ({
        estado,
        count,
        info: WORKFLOW_STATES_INFO[estado] || { nombre: estado, color: '#6B7280' },
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
    <div
      style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600' }}>
        Distribución por Estado
      </h3>

      {porEstado.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
          No hay ensayos registrados
        </div>
      ) : (
        <>
          {/* Barra de progreso apilada */}
          <div
            style={{
              display: 'flex',
              height: '24px',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '16px',
            }}
          >
            {porEstado.map(({ estado, count, info }) => (
              <div
                key={estado}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {porEstado.map(({ estado, count, info }) => (
              <div
                key={estado}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: info.color,
                  }}
                />
                <span style={{ color: '#374151' }}>{estado}</span>
                <span style={{ fontWeight: '600' }}>{count}</span>
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

function TablaProyectos({ proyectos, ensayos, clientes }) {
  const [expandedProyecto, setExpandedProyecto] = useState(null);

  const proyectosConStats = useMemo(() => {
    return proyectos.map(proyecto => {
      const ensayosProyecto = ensayos.filter(e => e.proyectoId === proyecto.id);
      const completados = ensayosProyecto.filter(e =>
        ['E15', 'E14', 'E13', 'E12'].includes(e.workflow_state)
      ).length;
      const pendientes = ensayosProyecto.filter(e =>
        ['E1', 'E2'].includes(e.workflow_state)
      ).length;
      const enProceso = ensayosProyecto.filter(e =>
        ['E6', 'E7', 'E8', 'E9', 'E10', 'E11'].includes(e.workflow_state)
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

  const getClienteNombre = clienteId => {
    return clientes.find(c => c.id === clienteId)?.nombre || proyecto.cliente_nombre || 'N/A';
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Seguimiento por Proyecto</h3>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB' }}>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                Proyecto
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                Cliente
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                Estado
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                Ensayos
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                Progreso
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {proyectosConStats.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
                  No hay proyectos registrados
                </td>
              </tr>
            ) : (
              proyectosConStats.map(proyecto => (
                <>
                  <tr key={proyecto.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '600' }}>{proyecto.codigo}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {proyecto.nombre}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                      {getClienteNombre(proyecto.clienteId)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
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
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                        }}
                      >
                        <span style={{ color: '#F59E0B' }}>{proyecto.stats.pendientes}P</span>
                        <span style={{ color: '#3B82F6' }}>{proyecto.stats.enProceso}E</span>
                        <span style={{ color: '#10B981' }}>{proyecto.stats.completados}C</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {proyecto.stats.total} total
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: '#E5E7EB',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${proyecto.stats.progreso}%`,
                              backgroundColor: '#10B981',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            minWidth: '40px',
                            textAlign: 'right',
                          }}
                        >
                          {proyecto.stats.progreso}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() =>
                          setExpandedProyecto(expandedProyecto === proyecto.id ? null : proyecto.id)
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        {expandedProyecto === proyecto.id ? 'Ocultar' : 'Ver ensayos'}
                      </button>
                    </td>
                  </tr>

                  {/* Fila expandida con ensayos */}
                  {expandedProyecto === proyecto.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0, backgroundColor: '#F9FAFB' }}>
                        <div style={{ padding: '16px 24px' }}>
                          <h4
                            style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#374151' }}
                          >
                            Ensayos del proyecto ({proyecto.ensayos.length})
                          </h4>
                          {proyecto.ensayos.length === 0 ? (
                            <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                              No hay ensayos registrados para este proyecto
                            </div>
                          ) : (
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                gap: '12px',
                              }}
                            >
                              {proyecto.ensayos.map(ensayo => {
                                const workflow = getWorkflowInfo(ensayo.workflow_state);
                                return (
                                  <div
                                    key={ensayo.id}
                                    style={{
                                      padding: '12px',
                                      backgroundColor: 'white',
                                      borderRadius: '6px',
                                      border: '1px solid #E5E7EB',
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'start',
                                        marginBottom: '8px',
                                      }}
                                    >
                                      <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                          {ensayo.codigo}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                          {getTipoEnsayoNombre(ensayo.tipo)}
                                        </div>
                                      </div>
                                      <Badge color={workflow.color}>{workflow.nombre}</Badge>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
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
  const [proyectos, setProyectos] = useState([]);
  const [ensayos, setEnsayos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('todos');
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

        setProyectos(proyectosRes || []);
        setEnsayos(ensayosRes || []);
        setClientes(clientesRes || []);
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
      if (filtroFechaDesde && e.fecha_solicitud < filtroFechaDesde) return false;
      if (filtroFechaHasta && e.fecha_solicitud > filtroFechaHasta) return false;

      // Filtro por cliente (a través del proyecto)
      if (filtroCliente !== 'todos') {
        const proyecto = proyectos.find(p => p.id === e.proyectoId);
        if (!proyecto || proyecto.clienteId !== filtroCliente) return false;
      }

      // Filtro por estado
      if (filtroEstado !== 'todos') {
        if (filtroEstado === 'pendientes' && !['E1', 'E2'].includes(e.workflow_state)) return false;
        if (filtroEstado === 'en_proceso' && !['E6', 'E7', 'E8'].includes(e.workflow_state))
          return false;
        if (filtroEstado === 'en_revision' && !['E9', 'E10', 'E11'].includes(e.workflow_state))
          return false;
        if (
          filtroEstado === 'completados' &&
          !['E12', 'E13', 'E14', 'E15'].includes(e.workflow_state)
        )
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
      const workflow = getWorkflowInfo(e.workflow_state);
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
        <div style={{ textAlign: 'center', padding: '48px' }}>Cargando reportes...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Reportes y Estadísticas">
      {/* Estadísticas generales */}
      <EstadisticasResumen ensayos={ensayosFiltrados} />

      {/* Filtros */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <label
            style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}
          >
            Desde
          </label>
          <input
            type="date"
            value={filtroFechaDesde}
            onChange={e => setFiltroFechaDesde(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <div>
          <label
            style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}
          >
            Hasta
          </label>
          <input
            type="date"
            value={filtroFechaHasta}
            onChange={e => setFiltroFechaHasta(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <div>
          <label
            style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}
          >
            Cliente
          </label>
          <select
            value={filtroCliente}
            onChange={e => setFiltroCliente(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
              minWidth: '150px',
            }}
          >
            <option value="todos">Todos los clientes</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}
          >
            Estado
          </label>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
              minWidth: '150px',
            }}
          >
            <option value="todos">Todos</option>
            <option value="pendientes">Pendientes</option>
            <option value="en_proceso">En Proceso</option>
            <option value="en_revision">En Revisión</option>
            <option value="completados">Completados</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={exportarCSV}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#3B82F6',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
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
      </div>

      {/* Gráficos de distribución */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
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
