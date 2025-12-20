import { useState, useEffect } from 'react'
import googleDriveService from '../../services/googleDriveService'
import './Plantillas.css'

function Plantillas() {
  const [plantillas, setPlantillas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('informes')

  useEffect(() => {
    checkAuthentication()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadPlantillas()
    }
  }, [isAuthenticated, selectedCategory])

  const checkAuthentication = async () => {
    try {
      await googleDriveService.initialize()
      const authenticated = googleDriveService.isSignedIn()
      setIsAuthenticated(authenticated)
    } catch (err) {
      setError('Error al inicializar Google Drive')
    }
  }

  const handleSignIn = async () => {
    try {
      await googleDriveService.signIn()
      setIsAuthenticated(true)
    } catch (err) {
      setError('Error al autenticar con Google Drive')
    }
  }

  const loadPlantillas = async () => {
    setLoading(true)
    setError(null)
    try {
      let files = []
      switch (selectedCategory) {
        case 'informes':
          files = await googleDriveService.getPlantillasInformes()
          break
        case 'calidad':
          files = await googleDriveService.getManualesCalidad()
          break
        case 'procedimientos':
          files = await googleDriveService.getProcedimientos()
          break
        case 'documentacion':
          files = await googleDriveService.getDocumentacionSistema()
          break
        default:
          files = []
      }
      setPlantillas(files)
    } catch (err) {
      setError('Error al cargar plantillas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileId, fileName) => {
    try {
      await googleDriveService.downloadFile(fileId, fileName)
    } catch (err) {
      alert('Error al descargar archivo: ' + err.message)
    }
  }

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('presentation')) return '📽️'
    return '📁'
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
    return `${mb.toFixed(1)} MB`
  }

  if (!isAuthenticated) {
    return (
      <div className="plantillas">
        <div className="page-header">
          <h1>Plantillas y Documentación</h1>
          <p>Acceso a recursos almacenados en Google Drive</p>
        </div>
        
        <div className="card auth-card">
          <div className="auth-content">
            <h3>🔐 Autenticación Requerida</h3>
            <p>Para acceder a las plantillas y documentación, necesitas autenticarte con tu cuenta de Google Drive.</p>
            <button className="btn btn-primary" onClick={handleSignIn}>
              🔑 Conectar con Google Drive
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="plantillas">
      <div className="page-header">
        <div>
          <h1>Plantillas y Documentación</h1>
          <p>Recursos desde Google Drive</p>
        </div>
        <button className="btn btn-primary" onClick={loadPlantillas}>
          🔄 Actualizar
        </button>
      </div>

      <div className="card">
        <div className="category-tabs">
          <button
            className={`category-tab ${selectedCategory === 'informes' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('informes')}
          >
            📋 Plantillas de Informes
          </button>
          <button
            className={`category-tab ${selectedCategory === 'calidad' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('calidad')}
          >
            ✓ Manuales de Calidad
          </button>
          <button
            className={`category-tab ${selectedCategory === 'procedimientos' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('procedimientos')}
          >
            📚 Procedimientos
          </button>
          <button
            className={`category-tab ${selectedCategory === 'documentacion' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('documentacion')}
          >
            📖 Documentación del Sistema
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <p>Cargando archivos...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <div className="error-message">{error}</div>
        </div>
      )}

      {!loading && !error && plantillas.length === 0 && (
        <div className="card">
          <p className="empty-message">No se encontraron archivos en esta categoría.</p>
        </div>
      )}

      {!loading && !error && plantillas.length > 0 && (
        <div className="grid grid-cols-3">
          {plantillas.map((file) => (
            <div key={file.id} className="card file-card">
              <div className="file-icon">{getFileIcon(file.mimeType)}</div>
              <div className="file-info">
                <h4 className="file-name">{file.name}</h4>
                <p className="file-meta">
                  Tamaño: {formatFileSize(file.size)}
                </p>
                <p className="file-meta">
                  Modificado: {new Date(file.modifiedTime).toLocaleDateString('es-ES')}
                </p>
              </div>
              <div className="file-actions">
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  👁️ Ver
                </a>
                {file.webContentLink && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleDownload(file.id, file.name)}
                  >
                    📥 Descargar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Plantillas
