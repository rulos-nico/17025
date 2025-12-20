import axios from 'axios'
import { GOOGLE_DRIVE_CONFIG, DRIVE_FOLDERS, MIME_TYPES } from '../config/googleDrive'

class GoogleDriveService {
  constructor() {
    this.isInitialized = false
    this.accessToken = null
  }

  // Inicializar Google Drive API
  async initialize() {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        resolve(true)
        return
      }

      // Cargar la librería de Google API
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_DRIVE_CONFIG.apiKey,
              clientId: GOOGLE_DRIVE_CONFIG.clientId,
              discoveryDocs: GOOGLE_DRIVE_CONFIG.discoveryDocs,
              scope: GOOGLE_DRIVE_CONFIG.scopes
            })
            this.isInitialized = true
            resolve(true)
          } catch (error) {
            reject(error)
          }
        })
      }
      script.onerror = reject
      document.body.appendChild(script)
    })
  }

  // Autenticar usuario
  async signIn() {
    try {
      await this.initialize()
      const auth = window.gapi.auth2.getAuthInstance()
      const user = await auth.signIn()
      this.accessToken = user.getAuthResponse().access_token
      return true
    } catch (error) {
      console.error('Error al autenticar con Google Drive:', error)
      throw error
    }
  }

  // Verificar si el usuario está autenticado
  isSignedIn() {
    if (!this.isInitialized) return false
    const auth = window.gapi.auth2.getAuthInstance()
    return auth?.isSignedIn?.get() || false
  }

  // Listar archivos de una carpeta
  async listFiles(folderId, options = {}) {
    try {
      await this.initialize()
      
      const query = `'${folderId}' in parents and trashed=false`
      const params = {
        q: query,
        pageSize: options.pageSize || 100,
        fields: 'files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, webContentLink, thumbnailLink)',
        orderBy: options.orderBy || 'modifiedTime desc'
      }

      const response = await window.gapi.client.drive.files.list(params)
      return response.result.files || []
    } catch (error) {
      console.error('Error al listar archivos:', error)
      throw error
    }
  }

  // Obtener plantillas de informes
  async getPlantillasInformes() {
    return this.listFiles(DRIVE_FOLDERS.PLANTILLAS_INFORMES)
  }

  // Obtener documentación del sistema
  async getDocumentacionSistema() {
    return this.listFiles(DRIVE_FOLDERS.DOCUMENTACION_SISTEMA)
  }

  // Obtener manuales de calidad
  async getManualesCalidad() {
    return this.listFiles(DRIVE_FOLDERS.MANUALES_CALIDAD)
  }

  // Obtener procedimientos
  async getProcedimientos() {
    return this.listFiles(DRIVE_FOLDERS.PROCEDIMIENTOS)
  }

  // Descargar archivo
  async downloadFile(fileId, fileName) {
    try {
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      })
      
      // Crear blob y descargar
      const blob = new Blob([response.body], { type: 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Error al descargar archivo:', error)
      throw error
    }
  }

  // Crear archivo desde plantilla
  async createFromTemplate(templateId, newFileName, destinationFolderId) {
    try {
      const response = await window.gapi.client.drive.files.copy({
        fileId: templateId,
        resource: {
          name: newFileName,
          parents: destinationFolderId ? [destinationFolderId] : []
        }
      })
      
      return response.result
    } catch (error) {
      console.error('Error al crear archivo desde plantilla:', error)
      throw error
    }
  }

  // Subir archivo
  async uploadFile(file, folderId, metadata = {}) {
    try {
      const boundary = '-------314159265358979323846'
      const delimiter = "\r\n--" + boundary + "\r\n"
      const close_delim = "\r\n--" + boundary + "--"

      const reader = new FileReader()
      
      return new Promise((resolve, reject) => {
        reader.readAsArrayBuffer(file)
        reader.onload = async () => {
          const contentType = file.type || 'application/octet-stream'
          const fileMetadata = {
            name: file.name,
            mimeType: contentType,
            parents: [folderId],
            ...metadata
          }

          const base64Data = btoa(
            new Uint8Array(reader.result)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          )

          const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(fileMetadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim

          const request = window.gapi.client.request({
            path: '/upload/drive/v3/files',
            method: 'POST',
            params: { uploadType: 'multipart' },
            headers: {
              'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            body: multipartRequestBody
          })

          request.execute((response) => {
            if (response.error) {
              reject(response.error)
            } else {
              resolve(response)
            }
          })
        }
        reader.onerror = reject
      })
    } catch (error) {
      console.error('Error al subir archivo:', error)
      throw error
    }
  }

  // Buscar archivos
  async searchFiles(query, folderId = null) {
    try {
      await this.initialize()
      
      let searchQuery = `name contains '${query}' and trashed=false`
      if (folderId) {
        searchQuery += ` and '${folderId}' in parents`
      }

      const response = await window.gapi.client.drive.files.list({
        q: searchQuery,
        pageSize: 50,
        fields: 'files(id, name, mimeType, createdTime, modifiedTime, webViewLink)'
      })

      return response.result.files || []
    } catch (error) {
      console.error('Error al buscar archivos:', error)
      throw error
    }
  }
}

export default new GoogleDriveService()
