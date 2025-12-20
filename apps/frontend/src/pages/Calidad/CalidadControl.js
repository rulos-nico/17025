function CalidadControl() {
  return (
    <div className="calidad">
      <div className="page-header">
        <div>
          <h1>Control de Calidad</h1>
          <p>Gestión de requisitos ISO/IEC 17025</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3">
        <div className="card">
          <h3>Documentos Normativos</h3>
          <ul style={{listStyle: 'none', padding: 0}}>
            <li style={{padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)'}}>
              📄 Manual de Calidad
            </li>
            <li style={{padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)'}}>
              📄 Procedimientos Operativos
            </li>
            <li style={{padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)'}}>
              📄 Registros de Calibración
            </li>
            <li style={{padding: '0.5rem 0'}}>
              📄 Control de Equipos
            </li>
          </ul>
        </div>
        
        <div className="card">
          <h3>Auditorías</h3>
          <div className="stat-card" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
            <p><strong>Próxima Auditoría Interna:</strong></p>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>15 de Enero, 2026</p>
            <p style={{marginTop: '1rem'}}><strong>Última Auditoría Externa:</strong></p>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>20 de Octubre, 2025</p>
            <span className="badge badge-success" style={{marginTop: '1rem'}}>✓ Sin No Conformidades</span>
          </div>
        </div>
        
        <div className="card">
          <h3>Competencia del Personal</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div>
              <p style={{marginBottom: '0.5rem'}}><strong>Certificaciones Vigentes:</strong></p>
              <span className="badge badge-success">8/8</span>
            </div>
            <div>
              <p style={{marginBottom: '0.5rem'}}><strong>Capacitaciones Pendientes:</strong></p>
              <span className="badge badge-warning">2</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2">
        <div className="card">
          <h3>Validación de Métodos</h3>
          <p>Estado de validación de métodos analíticos...</p>
        </div>
        
        <div className="card">
          <h3>No Conformidades</h3>
          <p>Registro y seguimiento de no conformidades...</p>
        </div>
      </div>
    </div>
  )
}

export default CalidadControl
