import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState({
    entregablesPendientes: 12,
    muestrasEnProceso: 28,
    informesGenerados: 45,
    clientesActivos: 18
  })
  
  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Panel de Control</h1>
        <p>Resumen general del laboratorio</p>
      </div>
      
      <div className="grid grid-cols-4">
        <div className="card stat-card">
          <div className="stat-icon pending">📋</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.entregablesPendientes}</h3>
            <p className="stat-label">Entregables Pendientes</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon process">🧪</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.muestrasEnProceso}</h3>
            <p className="stat-label">Muestras en Proceso</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon success">📄</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.informesGenerados}</h3>
            <p className="stat-label">Informes del Mes</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon info">👥</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.clientesActivos}</h3>
            <p className="stat-label">Clientes Activos</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2">
        <div className="card">
          <h3 className="card-title">Entregables Recientes</h3>
          <div className="recent-items">
            <div className="recent-item">
              <div>
                <p className="recent-item-title">Análisis Fisicoquímico - Agua</p>
                <p className="recent-item-subtitle">Cliente: Empresa ABC</p>
              </div>
              <span className="badge badge-warning">Pendiente</span>
            </div>
            <div className="recent-item">
              <div>
                <p className="recent-item-title">Ensayo Microbiológico - Alimentos</p>
                <p className="recent-item-subtitle">Cliente: Industrias XYZ</p>
              </div>
              <span className="badge badge-info">En Proceso</span>
            </div>
            <div className="recent-item">
              <div>
                <p className="recent-item-title">Análisis de Metales Pesados</p>
                <p className="recent-item-subtitle">Cliente: Laboratorios DEF</p>
              </div>
              <span className="badge badge-success">Completado</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="card-title">Actividad Reciente</h3>
          <div className="activity-timeline">
            <div className="activity-item">
              <div className="activity-dot"></div>
              <div className="activity-content">
                <p className="activity-text">Informe #INF-2025-045 generado</p>
                <p className="activity-time">Hace 2 horas</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot"></div>
              <div className="activity-content">
                <p className="activity-text">Muestra #M-2025-128 recibida</p>
                <p className="activity-time">Hace 4 horas</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot"></div>
              <div className="activity-content">
                <p className="activity-text">Cliente Nuevo registrado</p>
                <p className="activity-time">Hace 1 día</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">Ensayos por Tipo - Este Mes</h3>
        <div className="chart-placeholder">
          <p>📊 Gráfico de estadísticas</p>
          <p className="chart-subtitle">Análisis Fisicoquímico: 45% | Microbiológico: 30% | Metales Pesados: 25%</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
