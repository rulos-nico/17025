/**
 * Servicio para clasificación de documentos usando ML/DL
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Clasificar un documento
 * @param {File} file - Archivo a clasificar
 * @param {boolean} extractMetadata - Si se deben extraer metadatos
 * @returns {Promise<Object>} Resultado de la clasificación
 */
export async function classifyDocument(file, extractMetadata = true) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('extract_metadata', extractMetadata);

    const response = await fetch(`${API_URL}/api/documents/classify`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al clasificar documento');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en classifyDocument:', error);
    throw error;
  }
}

/**
 * Clasificar múltiples documentos
 * @param {File[]} files - Array de archivos
 * @returns {Promise<Object>} Resultados de las clasificaciones
 */
export async function classifyDocumentBatch(files) {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_URL}/api/documents/classify-batch`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al clasificar documentos');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en classifyDocumentBatch:', error);
    throw error;
  }
}

/**
 * Obtener categorías de documentos disponibles
 * @returns {Promise<Object>} Lista de categorías
 */
export async function getDocumentCategories() {
  try {
    const response = await fetch(`${API_URL}/api/documents/categories`);

    if (!response.ok) {
      throw new Error('Error al obtener categorías');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en getDocumentCategories:', error);
    throw error;
  }
}

/**
 * Guardar resultado de clasificación
 * @param {Object} classification - Datos de la clasificación
 * @returns {Promise<Object>} Confirmación
 */
export async function saveClassification(classification) {
  try {
    const response = await fetch(`${API_URL}/api/documents/save-classification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(classification),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar clasificación');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en saveClassification:', error);
    throw error;
  }
}

/**
 * Formatear el nombre de la categoría para mostrar
 * @param {string} category - Nombre de la categoría
 * @returns {string} Nombre formateado
 */
export function formatCategoryName(category) {
  const translations = {
    'informe_ensayo': 'Informe de Ensayo',
    'certificado_calibracion': 'Certificado de Calibración',
    'procedimiento': 'Procedimiento',
    'registro': 'Registro',
    'protocolo': 'Protocolo',
    'oferta': 'Oferta',
    'contrato': 'Contrato',
    'plan_calidad': 'Plan de Calidad',
    'otro': 'Otro'
  };

  return translations[category] || category;
}

/**
 * Obtener color según la categoría
 * @param {string} category - Nombre de la categoría
 * @returns {string} Color en formato CSS
 */
export function getCategoryColor(category) {
  const colors = {
    'informe_ensayo': '#4CAF50',
    'certificado_calibracion': '#2196F3',
    'procedimiento': '#FF9800',
    'registro': '#9C27B0',
    'protocolo': '#00BCD4',
    'oferta': '#FFEB3B',
    'contrato': '#F44336',
    'plan_calidad': '#3F51B5',
    'otro': '#9E9E9E'
  };

  return colors[category] || '#9E9E9E';
}

/**
 * Validar si el archivo es válido para clasificación
 * @param {File} file - Archivo a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg'
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'El archivo es demasiado grande (máximo 10MB)'
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Use: PDF, DOCX, TXT, PNG o JPG'
    };
  }

  return { valid: true };
}
