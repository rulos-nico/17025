/**
 * AnaliticaClientes.tsx — Analítica de clientes
 *
 * Muestra:
 * - Top clientes por volumen (bar chart horizontal)
 * - Estimacion de ingresos por cliente (usando precio_base de tipo_ensayo)
 * - Tasa de completitud por cliente (tabla)
 * - Mini stats: total clientes activos, volumen total, ingreso estimado
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Ensayo, Proyecto, Cliente, TipoEnsayo } from './shared';
import { CustomChartTooltip, SectionHeader } from './shared';
import ind from './ReportesIndicadores.module.css';

// ============================================
// TYPES
// ============================================

interface AnaliticaClientesProps {
  ensayos: Ensayo[];
  proyectos: Proyecto[];
  clientes: Cliente[];
  tiposEnsayo: TipoEnsayo[];
}

interface ClienteStats {
  id: string | number;
  nombre: string;
  total: number;
  completados: number;
  enProceso: number;
  pendientes: number;
  completionRate: number;
  ingresoEstimado: number;
}

// ============================================
// ICON
// ============================================

function IconBriefcase({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

// ============================================
// COMPONENT
// ============================================

export default function AnaliticaClientes({
  ensayos,
  proyectos,
  clientes,
  tiposEnsayo,
}: AnaliticaClientesProps) {
  // Build precio_base map by tipo ID
  const precioMap = useMemo(() => {
    const map: Record<string, number> = {};
    tiposEnsayo.forEach(t => {
      if (t.precio_base != null) {
        map[String(t.id)] = Number(t.precio_base);
        // Also map by nombre for fallback
        if (t.nombre) map[t.nombre] = Number(t.precio_base);
      }
    });
    return map;
  }, [tiposEnsayo]);

  // Build client stats
  const clientStats = useMemo((): ClienteStats[] => {
    // Map proyecto -> clienteId
    const proyClienteMap: Record<string, string | number> = {};
    proyectos.forEach(p => {
      if (p.clienteId) proyClienteMap[String(p.id)] = p.clienteId;
    });

    // Group ensayos by cliente
    const byCliente: Record<string, Ensayo[]> = {};
    ensayos.forEach(e => {
      const clienteId = proyClienteMap[String(e.proyectoId)];
      if (!clienteId) return;
      const key = String(clienteId);
      if (!byCliente[key]) byCliente[key] = [];
      byCliente[key].push(e);
    });

    return Object.entries(byCliente)
      .map(([clienteId, ens]) => {
        const cliente = clientes.find(c => String(c.id) === clienteId);
        const completados = ens.filter(e =>
          ['E12', 'E13', 'E14', 'E15'].includes(e.workflow_state || '')
        ).length;
        const enProceso = ens.filter(e =>
          ['E6', 'E7', 'E8', 'E9', 'E10', 'E11'].includes(e.workflow_state || '')
        ).length;
        const pendientes = ens.filter(e => ['E1', 'E2'].includes(e.workflow_state || '')).length;

        // Revenue estimation
        let ingreso = 0;
        ens.forEach(e => {
          const tipo = e.tipo || '';
          // Try matching by ID first, then by name
          const precio = precioMap[tipo] || 0;
          ingreso += precio;
        });

        return {
          id: clienteId,
          nombre: (cliente?.nombre || `Cliente ${clienteId}`) as string,
          total: ens.length,
          completados,
          enProceso,
          pendientes,
          completionRate: ens.length > 0 ? Math.round((completados / ens.length) * 100) : 0,
          ingresoEstimado: Math.round(ingreso),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [ensayos, proyectos, clientes, precioMap]);

  // Bar chart data (top 10)
  const barData = useMemo(() => {
    return clientStats.slice(0, 10).map(c => ({
      name: c.nombre.length > 22 ? c.nombre.substring(0, 19) + '...' : c.nombre,
      Completados: c.completados,
      'En proceso': c.enProceso,
      Pendientes: c.pendientes,
    }));
  }, [clientStats]);

  // Revenue bar data (top 10)
  const revenueData = useMemo(() => {
    const withRevenue = clientStats.filter(c => c.ingresoEstimado > 0);
    if (withRevenue.length === 0) return [];
    return withRevenue.slice(0, 10).map(c => ({
      name: c.nombre.length > 22 ? c.nombre.substring(0, 19) + '...' : c.nombre,
      'Ingreso estimado': c.ingresoEstimado,
    }));
  }, [clientStats]);

  // Mini stats
  const stats = useMemo(() => {
    const totalEnsayos = clientStats.reduce((s, c) => s + c.total, 0);
    const totalIngreso = clientStats.reduce((s, c) => s + c.ingresoEstimado, 0);
    return {
      totalClientes: clientStats.length,
      totalEnsayos,
      totalIngreso,
    };
  }, [clientStats]);

  const formatMoney = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString('es-CL')}`;
  };

  if (clientStats.length === 0) {
    return (
      <div className={ind.indicatorSection}>
        <SectionHeader
          icon={<IconBriefcase />}
          title="Analitica de Clientes"
          subtitle="Volumen, ingresos estimados y tasa de completitud por cliente"
        />
        <div className={ind.chartEmpty}>No hay datos de clientes disponibles</div>
      </div>
    );
  }

  return (
    <div className={ind.indicatorSection}>
      <SectionHeader
        icon={<IconBriefcase />}
        title="Analitica de Clientes"
        subtitle="Volumen, ingresos estimados y tasa de completitud por cliente"
      />

      {/* Mini stats */}
      <div className={ind.miniStatsGrid}>
        <div className={ind.miniStat}>
          <div className={ind.miniStatValue}>{stats.totalClientes}</div>
          <div className={ind.miniStatLabel}>Clientes activos</div>
        </div>
        <div className={`${ind.miniStat} ${ind.miniStatPrimary}`}>
          <div className={ind.miniStatValue}>{stats.totalEnsayos}</div>
          <div className={ind.miniStatLabel}>Total ensayos</div>
        </div>
        {stats.totalIngreso > 0 && (
          <div className={`${ind.miniStat} ${ind.miniStatSuccess}`}>
            <div className={ind.miniStatValue}>{formatMoney(stats.totalIngreso)}</div>
            <div className={ind.miniStatLabel}>Ingreso estimado</div>
          </div>
        )}
      </div>

      {/* Volume bar chart */}
      <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
        Top clientes por volumen
      </h4>
      <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 38)}>
        <BarChart
          data={barData}
          layout="vertical"
          margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomChartTooltip suffix="ensayos" />} />
          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
          <Bar dataKey="Completados" stackId="a" fill="#10B981" />
          <Bar dataKey="En proceso" stackId="a" fill="#3B82F6" />
          <Bar dataKey="Pendientes" stackId="a" fill="#F59E0B" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Revenue bar chart */}
      {revenueData.length > 0 && (
        <>
          <h4
            style={{ margin: '16px 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}
          >
            Ingreso estimado por cliente (basado en precio_base)
          </h4>
          <ResponsiveContainer width="100%" height={Math.max(180, revenueData.length * 36)}>
            <BarChart
              data={revenueData}
              layout="vertical"
              margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
              />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar dataKey="Ingreso estimado" fill="#14B8A6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Completion rate table */}
      <h4 style={{ margin: '16px 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
        Tasa de completitud por cliente
      </h4>
      <table className={ind.clientTable}>
        <thead>
          <tr>
            <th>Cliente</th>
            <th className={ind.right}>Ensayos</th>
            <th>Completitud</th>
          </tr>
        </thead>
        <tbody>
          {clientStats.slice(0, 12).map(c => (
            <tr key={String(c.id)}>
              <td style={{ fontWeight: 500 }}>{c.nombre}</td>
              <td className={ind.right}>{c.total}</td>
              <td>
                <div className={ind.clientCompletionBar}>
                  <div className={ind.clientCompletionTrack}>
                    <div
                      className={ind.clientCompletionFill}
                      style={{ width: `${c.completionRate}%` }}
                    />
                  </div>
                  <span className={ind.clientCompletionText}>{c.completionRate}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
