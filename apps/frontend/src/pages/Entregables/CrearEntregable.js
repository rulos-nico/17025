import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CrearEntregable.css'

function CrearEntregable() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tipoEnsayo: '',
    cliente: '',
    muestra: '',
    fechaEstimada: '',
    prioridad: 'Normal',
    metodologia: '',
    analista: '',
    observaciones: ''
  })
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    // Aquí iría la lógica para guardar el entregable
    console.log('Crear entregable:', formData)
    navigate('/entregables')
  }
  
  return (
    <div className="crear-entregable">
      <div className="page-header">
        <div>
          <h1>Crear Nuevo Entregable</h1>
          <p>Complete la información del nuevo entregable</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 className="section-title">Información General</h3>
          
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Tipo de Ensayo *</label>
              <select
                name="tipoEnsayo"
                className="form-select"
                value={formData.tipoEnsayo}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un tipo</option>
                <option value="fisicoquimico">Análisis Fisicoquímico</option>
                <option value="microbiologico">Microbiológico</option>
                <option value="metales">Metales Pesados</option>
                <option value="organico">Compuestos Orgánicos</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <select
                name="cliente"
                className="form-select"
                value={formData.cliente}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un cliente</option>
                <option value="1">Empresa ABC S.A.</option>
                <option value="2">Industrias XYZ</option>
                <option value="3">Laboratorios DEF</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Muestra *</label>
              <select
                name="muestra"
                className="form-select"
                value={formData.muestra}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una muestra</option>
                <option value="M-2025-045">M-2025-045 - Agua potable</option>
                <option value="M-2025-046">M-2025-046 - Alimentos</option>
                <option value="M-2025-047">M-2025-047 - Suelo</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Fecha Estimada de Entrega *</label>
              <input
                type="date"
                name="fechaEstimada"
                className="form-input"
                value={formData.fechaEstimada}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Prioridad *</label>
              <select
                name="prioridad"
                className="form-select"
                value={formData.prioridad}
                onChange={handleChange}
                required
              >
                <option value="Normal">Normal</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Metodología *</label>
              <input
                type="text"
                name="metodologia"
                className="form-input"
                placeholder="Ej: ISO 17025-2017"
                value={formData.metodologia}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="section-title">Asignación de Personal</h3>
          
          <div className="form-group">
            <label className="form-label">Analista Responsable *</label>
            <select
              name="analista"
              className="form-select"
              value={formData.analista}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un analista</option>
              <option value="1">Dr. Juan Pérez</option>
              <option value="2">Dra. María López</option>
              <option value="3">Ing. Carlos Rodríguez</option>
            </select>
          </div>
        </div>
        
        <div className="card">
          <h3 className="section-title">Observaciones</h3>
          
          <div className="form-group">
            <label className="form-label">Notas adicionales</label>
            <textarea
              name="observaciones"
              className="form-textarea"
              placeholder="Ingrese cualquier observación relevante..."
              value={formData.observaciones}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/entregables')}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Crear Entregable
          </button>
        </div>
      </form>
    </div>
  )
}

export default CrearEntregable
