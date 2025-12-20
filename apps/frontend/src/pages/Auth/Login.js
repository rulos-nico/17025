import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulación de login
    navigate('/')
  }
  
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🧪 Lab ISO 17025</h1>
          <p>Sistema de Gestión de Entregables</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="usuario@laboratorio.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
            Iniciar Sesión
          </button>
        </form>
        
        <div className="login-footer">
          <p>¿Olvidaste tu contraseña?</p>
        </div>
      </div>
    </div>
  )
}

export default Login
