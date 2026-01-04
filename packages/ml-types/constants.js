/**
 * Constantes para clasificación de documentos ML/DL
 */

// Categorías de documentos ISO 17025
export const DOCUMENT_CATEGORIES = {
  INFORME_ENSAYO: 'informe_ensayo',
  CERTIFICADO_CALIBRACION: 'certificado_calibracion',
  PROCEDIMIENTO: 'procedimiento',
  REGISTRO: 'registro',
  PROTOCOLO: 'protocolo',
  OFERTA: 'oferta',
  CONTRATO: 'contrato',
  PLAN_CALIDAD: 'plan_calidad',
  OTRO: 'otro'
};

// Nombres amigables de categorías
export const CATEGORY_NAMES = {
  [DOCUMENT_CATEGORIES.INFORME_ENSAYO]: 'Informe de Ensayo',
  [DOCUMENT_CATEGORIES.CERTIFICADO_CALIBRACION]: 'Certificado de Calibración',
  [DOCUMENT_CATEGORIES.PROCEDIMIENTO]: 'Procedimiento',
  [DOCUMENT_CATEGORIES.REGISTRO]: 'Registro',
  [DOCUMENT_CATEGORIES.PROTOCOLO]: 'Protocolo',
  [DOCUMENT_CATEGORIES.OFERTA]: 'Oferta',
  [DOCUMENT_CATEGORIES.CONTRATO]: 'Contrato',
  [DOCUMENT_CATEGORIES.PLAN_CALIDAD]: 'Plan de Calidad',
  [DOCUMENT_CATEGORIES.OTRO]: 'Otro'
};

// Colores por categoría
export const CATEGORY_COLORS = {
  [DOCUMENT_CATEGORIES.INFORME_ENSAYO]: '#4CAF50',
  [DOCUMENT_CATEGORIES.CERTIFICADO_CALIBRACION]: '#2196F3',
  [DOCUMENT_CATEGORIES.PROCEDIMIENTO]: '#FF9800',
  [DOCUMENT_CATEGORIES.REGISTRO]: '#9C27B0',
  [DOCUMENT_CATEGORIES.PROTOCOLO]: '#00BCD4',
  [DOCUMENT_CATEGORIES.OFERTA]: '#FFEB3B',
  [DOCUMENT_CATEGORIES.CONTRATO]: '#F44336',
  [DOCUMENT_CATEGORIES.PLAN_CALIDAD]: '#3F51B5',
  [DOCUMENT_CATEGORIES.OTRO]: '#9E9E9E'
};

// Descripciones de categorías
export const CATEGORY_DESCRIPTIONS = {
  [DOCUMENT_CATEGORIES.INFORME_ENSAYO]: 'Documento que presenta los resultados de ensayos realizados',
  [DOCUMENT_CATEGORIES.CERTIFICADO_CALIBRACION]: 'Certificado de calibración de equipos e instrumentos',
  [DOCUMENT_CATEGORIES.PROCEDIMIENTO]: 'Procedimientos operativos y métodos de ensayo',
  [DOCUMENT_CATEGORIES.REGISTRO]: 'Formularios y registros de calidad',
  [DOCUMENT_CATEGORIES.PROTOCOLO]: 'Protocolos de validación y verificación',
  [DOCUMENT_CATEGORIES.OFERTA]: 'Ofertas y cotizaciones para clientes',
  [DOCUMENT_CATEGORIES.CONTRATO]: 'Contratos con clientes y proveedores',
  [DOCUMENT_CATEGORIES.PLAN_CALIDAD]: 'Planes de calidad y gestión',
  [DOCUMENT_CATEGORIES.OTRO]: 'Otros tipos de documentos'
};

// Tipos de archivo soportados
export const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TXT: 'text/plain',
  PNG: 'image/png',
  JPEG: 'image/jpeg'
};

// Extensiones permitidas
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg'];

// Configuración de archivos
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BATCH_SIZE: 10, // Máximo 10 archivos en lote
  ALLOWED_MIME_TYPES: Object.values(SUPPORTED_FILE_TYPES)
};

// Umbrales de confianza
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9, // Alta confianza
  MEDIUM: 0.7, // Confianza media (requiere revisión)
  LOW: 0.5 // Baja confianza (requiere revisión manual)
};

// Estados de clasificación
export const CLASSIFICATION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  NEEDS_REVIEW: 'needs_review'
};

// Mensajes de error
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'El archivo es demasiado grande (máximo 10MB)',
  INVALID_FILE_TYPE: 'Tipo de archivo no soportado',
  NO_FILE_PROVIDED: 'No se proporcionó ningún archivo',
  CLASSIFICATION_FAILED: 'Error al clasificar el documento',
  SERVICE_UNAVAILABLE: 'Servicio de clasificación no disponible',
  NETWORK_ERROR: 'Error de conexión con el servidor',
  BATCH_TOO_LARGE: 'Demasiados archivos (máximo 10)'
};

// Configuración de la API
export const API_ENDPOINTS = {
  CLASSIFY: '/api/documents/classify',
  CLASSIFY_BATCH: '/api/documents/classify-batch',
  CATEGORIES: '/api/documents/categories',
  SAVE: '/api/documents/save-classification'
};

// Patrones de extracción
export const EXTRACTION_PATTERNS = {
  // Código de documento: LAB-2025-001
  CODIGO_DOCUMENTO: /\b[A-Z]{2,4}-\d{4}-\d{3,4}\b/,
  
  // Fechas: DD/MM/YYYY o YYYY-MM-DD
  FECHA_DDMMYYYY: /\b\d{2}\/\d{2}\/\d{4}\b/g,
  FECHA_YYYYMMDD: /\b\d{4}-\d{2}-\d{2}\b/g,
  
  // Email
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Teléfono
  TELEFONO: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g
};
