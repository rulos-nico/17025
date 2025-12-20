import { useParams, Link } from 'react-router-dom'

function InformeDetalle() {
  const { id } = useParams()
  
  return (
    <div className="informe-detalle">
      <div className="page-header">
        <div>
          <Link to="/informes" className="breadcrumb">← Volver a Informes</Link>
          <h1>Informe {id}</h1>
          <p>Informe técnico de ensayo</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">📥 Descargar PDF</button>
          <button className="btn btn-primary">📧 Enviar por Email</button>
        </div>
      </div>
      
      <div className="card">
        <h3>Contenido del Informe</h3>
        <p>Vista previa y detalles del informe técnico...</p>
      </div>
    </div>
  )
}

export default InformeDetalle
