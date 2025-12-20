import { useParams, Link } from 'react-router-dom'
import './EntregableDetalle.css'

function EntregableDetalle() {
  const { id } = useParams()
  
  // Datos simulados
  const entregable = {
    id: 'ENT-2025-001',
    tipo: 'Análisis Fisicoquímico de Agua',
    cliente: {
      nombre: 'Empresa ABC S.A.',
      contacto: 'María González',
      email: 'maria@empresaabc.com',
      telefono: '+34 912 345 678'
    },
    muestra: {
      id: 'M-2025-045',
      descripcion: 'Agua potable',
      cantidad: '2 Litros',
      condiciones: 'Refrigerada 4°C'
    },
    fechaIngreso: '2025-12-10',
    fechaEstimada: '2025-12-20',
    fechaFinalizacion: null,
    estado: 'En Proceso',
    prioridad: 'Alta',
    metodologia: 'ISO 17025-2017',
    analista: 'Dr. Juan Pérez',
    responsableTecnico: 'Dra. Ana Martínez',
    parametros: [
      { nombre: 'pH', resultado: '7.2', unidad: 'pH', limiteMin: '6.5', limiteMax: '8.5', cumple: true },
      { nombre: 'Conductividad', resultado: '450', unidad: 'µS/cm', limiteMin: null, limiteMax: '2500', cumple: true },
      { nombre: 'Turbidez', resultado: '0.8', unidad: 'NTU', limiteMin: null, limiteMax: '5', cumple: true },
      { nombre: 'Cloro Residual', resultado: '0.5', unidad: 'mg/L', limiteMin: '0.2', limiteMax: '2.0', cumple: true }
    ],
    observaciones: 'Muestra recibida en condiciones óptimas. Análisis en curso.'
  }
  
  return (
    <div className="entregable-detalle">
      <div className="page-header">
        <div>
          <Link to="/entregables" className="breadcrumb">← Volver a Entregables</Link>
          <h1>{entregable.id}</h1>
          <p>{entregable.tipo}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">📄 Generar Informe</button>
          <button className="btn btn-primary">✏️ Editar</button>
        </div>
      </div>
      
      <div className="grid grid-cols-3">
        <div className="card">
          <h3 className="section-title">Estado del Entregable</h3>
          <div className="info-group">
            <label>Estado Actual</label>
            <span className="badge badge-info large">{entregable.estado}</span>
          </div>
          <div className="info-group">
            <label>Prioridad</label>
            <span className="badge badge-danger large">{entregable.prioridad}</span>
          </div>
          <div className="info-group">
            <label>Progreso</label>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '65%'}}></div>
            </div>
            <p className="progress-text">65% completado</p>
          </div>
        </div>
        
        <div className="card">
          <h3 className="section-title">Fechas</h3>
          <div className="info-group">
            <label>Fecha de Ingreso</label>
            <p>{new Date(entregable.fechaIngreso).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
          </div>
          <div className="info-group">
            <label>Fecha Estimada de Entrega</label>
            <p>{new Date(entregable.fechaEstimada).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
          </div>
          <div className="info-group">
            <label>Días Restantes</label>
            <p className="highlight">3 días</p>
          </div>
        </div>
        
        <div className="card">
          <h3 className="section-title">Personal Asignado</h3>
          <div className="info-group">
            <label>Analista</label>
            <p>{entregable.analista}</p>
          </div>
          <div className="info-group">
            <label>Responsable Técnico</label>
            <p>{entregable.responsableTecnico}</p>
          </div>
          <div className="info-group">
            <label>Metodología</label>
            <p>{entregable.metodologia}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2">
        <div className="card">
          <h3 className="section-title">Información del Cliente</h3>
          <div className="info-list">
            <div className="info-item">
              <label>Cliente</label>
              <p>{entregable.cliente.nombre}</p>
            </div>
            <div className="info-item">
              <label>Persona de Contacto</label>
              <p>{entregable.cliente.contacto}</p>
            </div>
            <div className="info-item">
              <label>Email</label>
              <p>{entregable.cliente.email}</p>
            </div>
            <div className="info-item">
              <label>Teléfono</label>
              <p>{entregable.cliente.telefono}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="section-title">Información de la Muestra</h3>
          <div className="info-list">
            <div className="info-item">
              <label>ID Muestra</label>
              <p>
                <Link to={`/muestras/${entregable.muestra.id}`} className="table-link">
                  {entregable.muestra.id}
                </Link>
              </p>
            </div>
            <div className="info-item">
              <label>Descripción</label>
              <p>{entregable.muestra.descripcion}</p>
            </div>
            <div className="info-item">
              <label>Cantidad</label>
              <p>{entregable.muestra.cantidad}</p>
            </div>
            <div className="info-item">
              <label>Condiciones de Almacenamiento</label>
              <p>{entregable.muestra.condiciones}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="section-title">Resultados de Ensayos</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Parámetro</th>
                <th>Resultado</th>
                <th>Unidad</th>
                <th>Límite Mínimo</th>
                <th>Límite Máximo</th>
                <th>Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {entregable.parametros.map((param, index) => (
                <tr key={index}>
                  <td><strong>{param.nombre}</strong></td>
                  <td>{param.resultado}</td>
                  <td>{param.unidad}</td>
                  <td>{param.limiteMin || '-'}</td>
                  <td>{param.limiteMax || '-'}</td>
                  <td>
                    {param.cumple ? (
                      <span className="badge badge-success">✓ Cumple</span>
                    ) : (
                      <span className="badge badge-danger">✗ No Cumple</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="card">
        <h3 className="section-title">Observaciones</h3>
        <p>{entregable.observaciones}</p>
      </div>
    </div>
  )
}

export default EntregableDetalle
