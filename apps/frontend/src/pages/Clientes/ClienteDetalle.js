import { useParams, Link } from 'react-router-dom'

function ClienteDetalle() {
  const { id } = useParams()
  
  return (
    <div className="cliente-detalle">
      <div className="page-header">
        <div>
          <Link to="/clientes" className="breadcrumb">← Volver a Clientes</Link>
          <h1>Empresa ABC S.A.</h1>
          <p>Información del cliente y historial</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2">
        <div className="card">
          <h3>Información de Contacto</h3>
          <p>Detalles del cliente...</p>
        </div>
        
        <div className="card">
          <h3>Historial de Entregables</h3>
          <p>Lista de entregables del cliente...</p>
        </div>
      </div>
    </div>
  )
}

export default ClienteDetalle
