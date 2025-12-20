// Configuración para Google Drive API
export const GOOGLE_DRIVE_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  scopes: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file'
}

// IDs de carpetas en Google Drive
export const DRIVE_FOLDERS = {
  PLANTILLAS_INFORMES: import.meta.env.VITE_DRIVE_FOLDER_PLANTILLAS || '',
  DOCUMENTACION_SISTEMA: import.meta.env.VITE_DRIVE_FOLDER_DOCS || '',
  MANUALES_CALIDAD: import.meta.env.VITE_DRIVE_FOLDER_CALIDAD || '',
  PROCEDIMIENTOS: import.meta.env.VITE_DRIVE_FOLDER_PROCEDIMIENTOS || ''
}

// Tipos MIME soportados
export const MIME_TYPES = {
  WORD: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PDF: 'application/pdf',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  GOOGLE_DOCS: 'application/vnd.google-apps.document',
  GOOGLE_SHEETS: 'application/vnd.google-apps.spreadsheet'
}
