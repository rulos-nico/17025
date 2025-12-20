import { useParams, Link } from 'react-router-dom'

function MuestraDetalle() {
  const { id } = useParams()
  
  return (
    <div className="muestra-detalle">
      <div className="page-header">
        <div>
          <Link to="/muestras" className="breadcrumb">← Volver a Muestras</Link>
          <h1>Muestra {id}</h1>
          <p>Detalles y trazabilidad de la muestra</p>
        </div>
      </div>
      
      <div className="card">
        <h3>Información de la Muestra</h3>
        <p>Detalles completos de la muestra aquí...</p>
      </div>
    </div>
  )
}

export default MuestraDetalle
